import 'server-only';
import { createServiceRoleClient } from '@flowhr/api-client/server';
import type { Database } from '@flowhr/types';
import { generateInvitationToken, hashInvitationToken } from './invitation-token';

// 계정 활성화 초대 (ST-003 / CM-03) — server-only, service_role.
// create-at-activate: auth.users 는 활성화 시점에 생성한다(초대 시점엔 invitations 행만).
// 초대 생성 헬퍼는 향후 OP-04(운영사)/TA-02(직원) UI 와 seed/E2E 가 공통으로 호출한다.

const INVITE_TTL_DAYS = 7;

export interface CreateInvitationInput {
  email: string;
  targetRole: string; // users.role 정합 (employee/tenant_*/operator_*)
  tenantId?: string | null;
  employeeId?: string | null;
  operatorFlag?: boolean;
  invitedBy?: string | null;
  ttlDays?: number;
}

export interface CreatedInvitation {
  id: string;
  token: string; // 평문(이메일/URL 전달용) — DB 에는 해시만 저장
  expiresAt: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * 초대 생성 — 평문 토큰 발급 + 해시 저장. 이메일당 pending 1건(부분 unique)이라
 * 기존 pending 이 있으면 재발송으로 간주해 토큰/만료를 갱신한다(중복 방지).
 * 실제 메일 발송은 추상화(미설정 Resend) — 호출부가 token 으로 activation URL 을 구성한다(KI-103).
 */
export async function createInvitation(input: CreateInvitationInput): Promise<CreatedInvitation> {
  const supabase = createServiceRoleClient();
  const email = normalizeEmail(input.email);
  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const ttl = input.ttlDays ?? INVITE_TTL_DAYS;
  const expiresAt = new Date(Date.now() + ttl * 86_400_000).toISOString();

  // 기존 pending 갱신(재발송) 우선 — 부분 unique(lower(email) where pending) 충돌 회피.
  const { data: existing } = await supabase
    .from('invitations')
    .select('id')
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('invitations')
      .update({
        token_hash: tokenHash,
        expires_at: expiresAt,
        target_role: input.targetRole,
        tenant_id: input.tenantId ?? null,
        employee_id: input.employeeId ?? null,
        operator_flag: input.operatorFlag ?? false,
        invited_by: input.invitedBy ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, expires_at')
      .single();
    if (error) throw error;
    return { id: data.id, token, expiresAt: data.expires_at };
  }

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      token_hash: tokenHash,
      email,
      target_role: input.targetRole,
      tenant_id: input.tenantId ?? null,
      employee_id: input.employeeId ?? null,
      operator_flag: input.operatorFlag ?? false,
      invited_by: input.invitedBy ?? null,
      expires_at: expiresAt,
    })
    .select('id, expires_at')
    .single();
  if (error) throw error;
  return { id: data.id, token, expiresAt: data.expires_at };
}

export interface InvitationInfo {
  email: string;
  targetRole: string;
  tenantId: string | null;
  operatorFlag: boolean;
  expiresAt: string;
  status: string;
  isExpired: boolean;
  companyName: string | null;
}

/** 평문 토큰으로 초대 정보 조회(SECURITY DEFINER 함수, 최소 projection). 없으면 null. */
export async function getInvitationInfo(token: string): Promise<InvitationInfo | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .rpc('get_invitation_by_token_hash', { p_token_hash: hashInvitationToken(token) })
    .maybeSingle();
  if (error || !data) return null;
  return {
    email: data.email,
    targetRole: data.target_role,
    tenantId: data.tenant_id,
    operatorFlag: data.operator_flag,
    expiresAt: data.expires_at,
    status: data.status,
    isExpired: data.is_expired,
    companyName: data.company_name,
  };
}

/** 활성화 가능 여부 — pending + 미만료. */
export function isActivatable(info: InvitationInfo | null): boolean {
  return !!info && info.status === 'pending' && !info.isExpired;
}

export interface ActivatedAccount {
  userId: string;
  email: string;
  targetRole: string;
  operatorFlag: boolean;
}

export type ActivateError = 'invalid' | 'email_taken' | 'failed';
type ServiceClient = ReturnType<typeof createServiceRoleClient>;
type OperatorRole = Database['public']['Enums']['operator_role'];

async function deleteAuthUser(supabase: ServiceClient, userId: string): Promise<void> {
  await supabase.auth.admin.deleteUser(userId).catch((e) => {
    // 보상 삭제 실패 = orphan auth.users (이중 실패, 매우 드묾) — 운영 정리 대상(KI-104).
    console.error('compensating deleteUser failed (orphan auth user)', userId, e);
  });
}

async function rollbackClaim(supabase: ServiceClient, invitationId: string, userId: string): Promise<void> {
  await supabase
    .from('invitations')
    .update({
      status: 'pending',
      accepted_at: null,
      accepted_user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invitationId)
    .eq('accepted_user_id', userId);
}

/**
 * 계정 활성화 핵심 — auth.users 생성 → accept_invitation 원자 전환 → 실패 시 보상 삭제.
 * 동시성: auth.users email UNIQUE 가 동시 createUser 를 직렬화 + accept_invitation 조건부 UPDATE 가
 * pending 행을 단 한 호출만 차지(이중 방어). 토큰은 호출 전 getInvitationInfo 로 1차 검증 권장.
 */
export async function activateAccount(
  token: string,
  password: string,
): Promise<{ ok: true; account: ActivatedAccount } | { ok: false; error: ActivateError }> {
  const info = await getInvitationInfo(token);
  if (!isActivatable(info)) return { ok: false, error: 'invalid' };
  const supabase = createServiceRoleClient();

  // 1) auth.users 생성(비밀번호 포함, 이메일 확인 처리). 중복 이메일이면 이미 계정 존재.
  const created = await supabase.auth.admin.createUser({
    email: info!.email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    const msg = created.error?.message ?? '';
    return { ok: false, error: /already|registered|exists/i.test(msg) ? 'email_taken' : 'failed' };
  }
  const userId = created.data.user.id;
  const tokenHash = hashInvitationToken(token);

  // 2) public.users를 먼저 생성한 뒤 초대를 claim 한다.
  // invitations.accepted_user_id는 public.users FK라서 claim UPDATE가 먼저 실행되면 실패한다.
  const { error: profileError } = await supabase.from('users').insert({
    id: userId,
    role: info!.targetRole,
    tenant_id: info!.tenantId,
    employee_id: null,
    locale: 'ko',
  });
  if (profileError) {
    await deleteAuthUser(supabase, userId);
    return { ok: false, error: 'invalid' };
  }

  // 2) public 측 원자 전환(SECURITY DEFINER). 실패 시 생성한 auth.users 보상 삭제.
  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: claimedAt,
      accepted_user_id: userId,
      updated_at: claimedAt,
    })
    .eq('token_hash', tokenHash)
    .eq('status', 'pending')
    .is('accepted_at', null)
    .gt('expires_at', claimedAt)
    .select('id, target_role, tenant_id, employee_id, operator_flag, created_at')
    .maybeSingle();
  const accepted = { error: claimError || !claimed ? new Error('invitation not claimable') : null };
  if (accepted.error) {
    await supabase.auth.admin.deleteUser(userId).catch((e) => {
      // 보상 삭제 실패 = orphan auth.users (삼중 실패, 매우 드묾) — 운영 정리 대상(KI-104).
      console.error('compensating deleteUser failed (orphan auth user)', userId, e);
    });
    return { ok: false, error: 'invalid' };
  }

  if (claimed!.operator_flag) {
    const { error: operatorError } = await supabase.from('operator_users').insert({
      user_id: userId,
      role: claimed!.target_role as OperatorRole,
      invited_at: claimed!.created_at,
      activated_at: claimedAt,
      is_active: true,
    });
    if (operatorError) {
      await rollbackClaim(supabase, claimed!.id, userId);
      await supabase.from('users').delete().eq('id', userId);
      await deleteAuthUser(supabase, userId);
      return { ok: false, error: 'invalid' };
    }
  } else if (claimed!.employee_id) {
    const { error: employeeError } = await supabase
      .from('employees')
      .update({ status: 'active', user_id: userId, updated_at: claimedAt })
      .eq('id', claimed!.employee_id);
    if (employeeError) {
      await rollbackClaim(supabase, claimed!.id, userId);
      await supabase.from('users').delete().eq('id', userId);
      await deleteAuthUser(supabase, userId);
      return { ok: false, error: 'invalid' };
    }
  }

  return {
    ok: true,
    account: {
      userId,
      email: info!.email,
      targetRole: info!.targetRole,
      operatorFlag: info!.operatorFlag,
    },
  };
}
