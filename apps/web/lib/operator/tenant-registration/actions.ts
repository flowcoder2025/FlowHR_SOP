'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@flowhr/api-client/server';
import { tenantDraftInputSchema, tenantRegistrationInputSchema } from '@flowhr/schemas';
import type { Json } from '@flowhr/types';
import { getSessionProfile } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveOrigin } from '@/lib/http/origin';
import { generateInvitationToken, hashInvitationToken } from '@/lib/auth/invitation-token';
import { createInvitation } from '@/lib/auth/invitations';
import { canRegisterTenant } from './permissions';

/**
 * OP-04 신규 테넌트 등록 — 서버 액션 (WI-035, ST-006).
 *
 * SSOT: .flowset/api/operator.md OP-04 + .flowset/prd/domains/operator/OP-04-onboarding.md.
 * 최종 등록(registerTenant)은 service_role `register_tenant` RPC(mig 42)가 tenants/subscriptions/
 * tenant_settings + 초기데이터 + 관리자 invitation 을 단일 트랜잭션으로 원자 INSERT 한다.
 * create-at-activate: 등록 시점엔 invitation 행만, 관리자 user 는 활성화(/activate) 시점 생성.
 * 메일 발송은 추상화(Resend 미설정 KI-103) — 응답에 activation URL 을 반환해 운영자가 전달한다.
 */

const INVITE_TTL_DAYS = 7;

export type DraftSaveResult =
  | { ok: true; draftId: string }
  | { ok: false; error: 'unauthenticated' | 'forbidden' | 'invalid' | 'failed' };

/** 임시저장 upsert — 운영자당 열린 draft 1개(ux_tenant_drafts_one_open_per_operator) 갱신/생성. */
export async function saveDraft(input: unknown): Promise<DraftSaveResult> {
  const parsed = tenantDraftInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const profile = await getSessionProfile();
  if (!profile) return { ok: false, error: 'unauthenticated' };
  if (!canRegisterTenant(profile.role)) return { ok: false, error: 'forbidden' };

  const supabase = await createSupabaseServerClient();
  const userId = profile.user.id;

  const { data: open } = await supabase
    .from('tenant_drafts')
    .select('id')
    .eq('created_by', userId)
    .in('status', ['draft', 'submitting'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (open) {
    // completed/abandoned draft 은 불변 — status 가드로 race(등록 완료 직후 stale autosave)가
    // form_data._submission(멱등 근거)를 덮어쓰지 못하게 한다(codex P1).
    const { data: updated, error } = await supabase
      .from('tenant_drafts')
      .update({
        current_step: parsed.data.current_step,
        form_data: parsed.data.form_data as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', open.id)
      .eq('created_by', userId)
      .in('status', ['draft', 'submitting'])
      .select('id')
      .maybeSingle();
    if (error) return { ok: false, error: 'failed' };
    // 0 row = 그 사이 draft 가 completed/abandoned 로 전이 → stale autosave 무시(no-op).
    return { ok: true, draftId: updated?.id ?? open.id };
  }

  const { data: created, error } = await supabase
    .from('tenant_drafts')
    .insert({
      created_by: userId,
      current_step: parsed.data.current_step,
      form_data: parsed.data.form_data as Json,
      status: 'draft',
    })
    .select('id')
    .single();
  if (error || !created) return { ok: false, error: 'failed' };
  return { ok: true, draftId: created.id };
}

export type DraftDeleteResult =
  | { ok: true }
  | { ok: false; error: 'unauthenticated' | 'forbidden' | 'failed' };

/** 임시저장 폐기 — 본인 draft 삭제(RLS created_by=auth.uid()). */
export async function deleteDraft(draftId: string): Promise<DraftDeleteResult> {
  const profile = await getSessionProfile();
  if (!profile) return { ok: false, error: 'unauthenticated' };
  if (!canRegisterTenant(profile.role)) return { ok: false, error: 'forbidden' };

  const supabase = await createSupabaseServerClient();
  // completed draft 은 등록 결과(submitted_tenant_id/멱등 근거) 보존을 위해 삭제 금지 — 열린 draft 만 폐기(codex P1).
  const { error } = await supabase
    .from('tenant_drafts')
    .delete()
    .eq('id', draftId)
    .eq('created_by', profile.user.id)
    .in('status', ['draft', 'submitting']);
  if (error) return { ok: false, error: 'failed' };
  return { ok: true };
}

export type RegisterTenantError =
  | 'unauthenticated'
  | 'forbidden'
  | 'invalid'
  | 'draft_not_found'
  | 'idempotency_conflict'
  | 'slug_taken'
  | 'business_number_taken'
  | 'plan_not_found'
  | 'admin_email_taken'
  | 'failed';

export interface InvitationDelivery {
  email: string;
  role: string;
  /** Resend 미설정(KI-103) — 운영자가 직접 전달할 활성화 URL. */
  activationUrl: string;
}

export type RegisterTenantResult =
  | {
      ok: true;
      tenantId: string;
      draftId: string;
      alreadyCompleted: boolean;
      invitations: InvitationDelivery[];
    }
  | { ok: false; error: RegisterTenantError };

/** Postgres SQLSTATE(register_tenant raise)를 도메인 에러로 매핑. */
function mapRpcError(code: string | undefined): RegisterTenantError {
  switch (code) {
    case 'P0101':
      return 'forbidden';
    case 'P0102':
      return 'draft_not_found';
    case 'P0103':
      return 'idempotency_conflict';
    case 'P0106':
      return 'slug_taken';
    case 'P0107':
      return 'business_number_taken';
    case 'P0108':
      return 'plan_not_found';
    case 'P0110':
      return 'admin_email_taken';
    case 'P0104':
    case 'P0105':
    case 'P0109':
    case 'P0111':
      return 'invalid';
    default:
      return 'failed';
  }
}

function activationUrl(origin: string, token: string): string {
  // 초대 시점엔 수신자 locale 미상 → ko 기본(활성화 화면에서 언어 전환 가능).
  return `${origin}/ko/activate?token=${encodeURIComponent(token)}`;
}

/**
 * 7단계 최종 등록 — 원자 트랜잭션 RPC 호출.
 * draftId 미지정 시 운영자의 열린 draft 를 재사용/생성(RPC 내부는 draft 필수).
 * 관리자 토큰은 앱이 평문 생성 → hash 만 RPC 에 전달(create-at-activate), 평문은 응답 URL 로만 노출.
 */
export async function registerTenant(input: unknown): Promise<RegisterTenantResult> {
  const parsed = tenantRegistrationInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const profile = await getSessionProfile();
  if (!profile) return { ok: false, error: 'unauthenticated' };
  if (!canRegisterTenant(profile.role)) return { ok: false, error: 'forbidden' };

  const { draft_id, idempotency_key, payload } = parsed.data;
  const userId = profile.user.id;
  const supabase = await createSupabaseServerClient();

  // draft 확보: 지정분 우선, 없으면 열린 draft 재사용, 그래도 없으면 생성.
  let draftId = draft_id ?? null;
  if (!draftId) {
    const { data: open } = await supabase
      .from('tenant_drafts')
      .select('id')
      .eq('created_by', userId)
      .in('status', ['draft', 'submitting'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (open) {
      draftId = open.id;
    } else {
      const { data: created, error } = await supabase
        .from('tenant_drafts')
        .insert({ created_by: userId, current_step: 7, form_data: {} as Json, status: 'draft' })
        .select('id')
        .single();
      if (error || !created) return { ok: false, error: 'failed' };
      draftId = created.id;
    }
  }

  // 관리자 초대 토큰 발급(대표 tenant_super + 추가 tenant_hr_admin). 평문은 응답 URL 로만.
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000).toISOString();
  const adminInvites: { email: string; role: 'tenant_super' | 'tenant_hr_admin' }[] = [
    { email: payload.admin.email, role: 'tenant_super' },
    ...payload.additional_admins.map((a) => ({ email: a.email, role: 'tenant_hr_admin' as const })),
  ];
  const withTokens = adminInvites.map((inv) => {
    const token = generateInvitationToken();
    return { ...inv, token, tokenHash: hashInvitationToken(token) };
  });

  const service = createServiceRoleClient();
  const { data, error } = await service.rpc('register_tenant', {
    p_operator_id: userId,
    p_draft_id: draftId,
    p_idempotency_key: idempotency_key,
    p_payload: payload as unknown as Json,
    p_admin_invitations: withTokens.map((w) => ({
      email: w.email,
      target_role: w.role,
      token_hash: w.tokenHash,
      expires_at: expiresAt,
    })) as unknown as Json,
  });

  if (error || !data || data.length === 0) {
    if (error) console.error('register_tenant rpc failed', error.code, error.message);
    return { ok: false, error: error ? mapRpcError(error.code) : 'failed' };
  }

  const row = data[0];
  // 운영사 영역 재검증(OP-02 목록은 WI-037 — 현재는 운영사 대시보드 세그먼트 무효화).
  revalidatePath('/[locale]/operator', 'page');

  // 멱등 replay(이미 등록 완료) — 신규 토큰 미발급(invitation 재생성 없음).
  if (row.already_completed) {
    return {
      ok: true,
      tenantId: row.tenant_id,
      draftId: row.draft_id,
      alreadyCompleted: true,
      invitations: [],
    };
  }

  const origin = resolveOrigin(await headers());
  return {
    ok: true,
    tenantId: row.tenant_id,
    draftId: row.draft_id,
    alreadyCompleted: false,
    invitations: withTokens.map((w) => ({
      email: w.email,
      role: w.role,
      activationUrl: activationUrl(origin, w.token),
    })),
  };
}

export type SendInviteResult =
  | { ok: true; email: string; activationUrl: string }
  | { ok: false; error: 'unauthenticated' | 'forbidden' | 'not_found' | 'failed' };

/**
 * 관리자 초대 재발송 — 본 테넌트의 pending 관리자 invitation 토큰을 재발급(createInvitation 재사용).
 * email 미지정 시 대표 관리자(tenant_super) invitation 대상.
 */
export async function sendInvite(tenantId: string, email?: string): Promise<SendInviteResult> {
  const profile = await getSessionProfile();
  if (!profile) return { ok: false, error: 'unauthenticated' };
  if (!canRegisterTenant(profile.role)) return { ok: false, error: 'forbidden' };

  const service = createServiceRoleClient();
  // 관리자 초대(tenant_super/tenant_hr_admin)만 대상 — 같은 테넌트의 pending 직원 초대(target_role=employee,
  // employee_id 보유)를 잘못 잡아 createInvitation 이 employee_id 를 지우는 것을 차단(codex P1).
  let query = service
    .from('invitations')
    .select('email, target_role')
    .eq('tenant_id', tenantId)
    .eq('operator_flag', false)
    .eq('status', 'pending')
    .in('target_role', ['tenant_super', 'tenant_hr_admin'])
    .is('employee_id', null);
  query = email
    ? query.ilike('email', email.trim().toLowerCase())
    : query.eq('target_role', 'tenant_super');

  const { data: inv, error } = await query.limit(1).maybeSingle();
  if (error) return { ok: false, error: 'failed' };
  if (!inv) return { ok: false, error: 'not_found' };

  // 기존 pending 갱신(토큰/만료 재발급) — createInvitation 이 lower(email) pending 1건을 update.
  try {
    const created = await createInvitation({
      email: inv.email,
      targetRole: inv.target_role,
      tenantId,
      operatorFlag: false,
      invitedBy: profile.user.id,
    });
    const origin = resolveOrigin(await headers());
    return { ok: true, email: inv.email, activationUrl: activationUrl(origin, created.token) };
  } catch (e) {
    console.error('sendInvite failed', e);
    return { ok: false, error: 'failed' };
  }
}
