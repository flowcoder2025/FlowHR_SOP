import 'server-only';
import { createServiceRoleClient } from '@flowhr/api-client/server';
import {
  type SlugCheckReason,
  normalizeBusinessNumber,
  validateSlugFormat,
} from '@flowhr/schemas';
import { getSessionProfile } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isOperator } from './permissions';

/**
 * OP-04 신규 테넌트 등록 — 조회/실시간 검증 (WI-035, server-only).
 *
 * SSOT: .flowset/api/operator.md OP-04 (check-domain/check-business-number/plans/drafts).
 * 슬러그/사업자번호 중복은 운영자 세션(tenants_read RLS: is_operator)으로 조회 — 별도 권한 누수 없음.
 * 관리자 이메일 사전체크는 invitations(pending/accepted)만(서비스롤) — auth.users 최종 차단은
 * register_tenant RPC 가 수행(사전체크는 UX 신호, 권위 검증 아님).
 */

const FORBIDDEN = { ok: false as const, error: 'forbidden' as const };
const UNAUTH = { ok: false as const, error: 'unauthenticated' as const };

export type CheckResult =
  | { ok: true; available: boolean; reason: SlugCheckReason | null; value: string }
  | { ok: false; error: 'unauthenticated' | 'forbidden' };

async function requireOperator(): Promise<
  { ok: true; userId: string; role: string } | { ok: false; error: 'unauthenticated' | 'forbidden' }
> {
  const profile = await getSessionProfile();
  if (!profile) return UNAUTH;
  if (!isOperator(profile.role)) return FORBIDDEN;
  return { ok: true, userId: profile.user.id, role: profile.role! };
}

/** 도메인 슬러그 중복/형식/예약어 검증. available=false 일 때 reason 으로 사유 구분. */
export async function checkDomain(rawSlug: string): Promise<CheckResult> {
  const guard = await requireOperator();
  if (!guard.ok) return guard;

  const format = validateSlugFormat(rawSlug);
  if (!format.ok) {
    return { ok: true, available: false, reason: format.reason, value: rawSlug.trim().toLowerCase() };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .ilike('slug', format.slug)
    .limit(1)
    .maybeSingle();
  // 조회 오류는 fail-closed(사용 가능으로 오인 금지) — UI 가 다시 시도하도록 available=false.
  if (error) return { ok: true, available: false, reason: 'taken', value: format.slug };
  return { ok: true, available: !data, reason: data ? 'taken' : null, value: format.slug };
}

/** 사업자등록번호 형식/중복 검증. */
export async function checkBusinessNumber(rawValue: string): Promise<CheckResult> {
  const guard = await requireOperator();
  if (!guard.ok) return guard;

  const normalized = normalizeBusinessNumber(rawValue);
  if (normalized === null) {
    return { ok: true, available: false, reason: 'invalid_format', value: rawValue.trim() };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('business_number', normalized)
    .limit(1)
    .maybeSingle();
  if (error) return { ok: true, available: false, reason: 'taken', value: normalized };
  return { ok: true, available: !data, reason: data ? 'taken' : null, value: normalized };
}

/**
 * 관리자 이메일 사전 가용성 — 전역 invitation(pending/accepted) 중복만 검사(UX 신호).
 * 한 이메일=하나의 계정/초대(현 데이터 모델: users 단일 tenant_id). auth.users 최종 차단은 RPC.
 */
export async function checkAdminEmail(email: string): Promise<CheckResult> {
  const guard = await requireOperator();
  if (!guard.ok) return guard;

  const normalized = email.trim().toLowerCase();
  const service = createServiceRoleClient();
  const { data, error } = await service
    .from('invitations')
    .select('id')
    .ilike('email', normalized)
    .in('status', ['pending', 'accepted'])
    .limit(1)
    .maybeSingle();
  if (error) return { ok: true, available: false, reason: 'taken', value: normalized };
  return { ok: true, available: !data, reason: data ? 'taken' : null, value: normalized };
}

export interface PlanOption {
  id: string;
  slug: string;
  name: string;
  basePriceKrw: number | null;
  perUserPriceKrw: number | null;
  includedUsers: number | null;
  modules: string[];
  status: string;
}

export type PlansResult =
  | { ok: true; plans: PlanOption[] }
  | { ok: false; error: 'unauthenticated' | 'forbidden' };

/** OP-04 3단계 — 선택 가능한 공개 플랜(plans_read=using(true)). 비활성 제외 + sort_order 정렬. */
export async function getRegistrationPlans(): Promise<PlansResult> {
  const guard = await requireOperator();
  if (!guard.ok) return guard;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('plans')
    .select('id, slug, name, base_price_krw, per_user_price_krw, included_users, modules, status, is_public, sort_order')
    .eq('is_public', true)
    .neq('status', 'inactive')
    .order('sort_order', { ascending: true });
  if (error || !data) return { ok: true, plans: [] };

  return {
    ok: true,
    plans: data.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      basePriceKrw: p.base_price_krw,
      perUserPriceKrw: p.per_user_price_krw,
      includedUsers: p.included_users,
      modules: p.modules ?? [],
      status: p.status,
    })),
  };
}

export interface OpenDraft {
  id: string;
  currentStep: number;
  formData: Record<string, unknown>;
  status: string;
  updatedAt: string;
}

export type DraftResult =
  | { ok: true; draft: OpenDraft | null }
  | { ok: false; error: 'unauthenticated' | 'forbidden' };

/** 운영자의 열린(draft/submitting) 임시저장 1건 — 재진입 복원용(ux_tenant_drafts_one_open_per_operator). */
export async function getOpenDraft(): Promise<DraftResult> {
  const guard = await requireOperator();
  if (!guard.ok) return guard;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('tenant_drafts')
    .select('id, current_step, form_data, status, updated_at')
    .eq('created_by', guard.userId)
    .in('status', ['draft', 'submitting'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: true, draft: null };
  if (!data) return { ok: true, draft: null };

  return {
    ok: true,
    draft: {
      id: data.id,
      currentStep: data.current_step,
      formData: (data.form_data as Record<string, unknown>) ?? {},
      status: data.status,
      updatedAt: data.updated_at,
    },
  };
}
