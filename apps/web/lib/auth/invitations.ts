import 'server-only';
import { createServiceRoleClient } from '@flowhr/api-client/server';
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
  tenantId: string | null;
  operatorFlag: boolean;
}

export type ActivateError = 'invalid' | 'email_taken' | 'failed';

/**
 * 계정 활성화 핵심 — auth.users 생성 → accept_invitation(SECURITY DEFINER 원자 함수) 호출.
 * public 측 전환(users insert + invitations claim + operator/employee 분기)은 SQL 함수가
 * 단일 트랜잭션으로 수행하므로, 실패 시 public 측은 자동 롤백되고 호출부는 auth.users 만 보상 삭제한다.
 * 동시성: accept_invitation 의 SELECT ... FOR UPDATE 가 pending 행을 단 한 호출만 차지(claim) +
 * auth.users email UNIQUE 가 동시 createUser 를 직렬화(이중 방어). 토큰은 호출 전 getInvitationInfo 로 1차 검증.
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

  // 2) public 측 원자 전환(SECURITY DEFINER 트랜잭션 함수). 실패 시 public 측은 자동 롤백되므로
  //    호출부는 방금 생성한 auth.users 만 보상 삭제하면 된다(부분 상태 없음 — codex 듀얼검증 P1).
  const { error: acceptError } = await supabase.rpc('accept_invitation', {
    p_token_hash: hashInvitationToken(token),
    p_user_id: userId,
  });
  if (acceptError) {
    await supabase.auth.admin.deleteUser(userId).catch((e) => {
      // 보상 삭제 실패 = orphan auth.users (이중 실패, 매우 드묾) — 운영 정리 대상(KI-104).
      console.error('compensating deleteUser failed (orphan auth user)', userId, e);
    });
    return { ok: false, error: 'invalid' };
  }

  return {
    ok: true,
    account: {
      userId,
      email: info!.email,
      targetRole: info!.targetRole,
      tenantId: info!.tenantId,
      operatorFlag: info!.operatorFlag,
    },
  };
}

/**
 * 활성화 시 필수 약관(terms/privacy) 동의를 기록한다 (CM-03 AC — source='activate').
 * 세션 기반 recordConsent 는 활성화 서버 액션의 setSession 직후 같은 요청에서 쿠키를 못 읽어
 * getUser()=null → 무음 실패한다(codex 듀얼검증 P1). 따라서 service_role + 명시 userId 로
 * 세션 비의존 기록한다. locale 우선 문서 1건씩, 멱등(onConflict user_id,document_id ignore).
 * 동의 기록 실패가 활성화 자체를 막지 않도록 best-effort(boolean 반환).
 */
export async function recordActivationConsents(
  userId: string,
  tenantId: string | null,
  locale: string,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data: docs, error } = await supabase
    .from('legal_documents')
    .select('id, type, version, language')
    .eq('is_active', true)
    .in('type', ['terms', 'privacy']);
  if (error || !docs || docs.length === 0) return false;

  // type별 locale 우선(없으면 ko fallback) 문서 1건씩 선택.
  const rows: {
    user_id: string;
    tenant_id: string | null;
    document_id: string;
    document_type: 'terms' | 'privacy';
    version: string;
    source: 'activate';
    ip_address: string | null;
    user_agent: string | null;
  }[] = [];
  for (const type of ['terms', 'privacy'] as const) {
    const forType = docs.filter((d) => d.type === type);
    const doc =
      forType.find((d) => d.language === locale) ??
      forType.find((d) => d.language === 'ko') ??
      forType[0];
    if (doc) {
      rows.push({
        user_id: userId,
        tenant_id: tenantId,
        document_id: doc.id,
        document_type: type,
        version: doc.version,
        source: 'activate',
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    }
  }
  if (rows.length === 0) return false;

  const { error: insErr } = await supabase
    .from('user_consents')
    .upsert(rows, { onConflict: 'user_id,document_id', ignoreDuplicates: true });
  if (insErr) {
    console.error('recordActivationConsents failed', insErr);
    return false;
  }
  return true;
}
