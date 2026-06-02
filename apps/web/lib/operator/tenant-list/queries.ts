import 'server-only';
import { normalizeBusinessNumber } from '@flowhr/schemas';
import { getSessionProfile } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canViewTenantList } from './permissions';
import {
  type DisplayStatus,
  type InvoiceStatus,
  type ListParams,
  type TenantStatus,
  EXPORT_LIMIT,
  calcMonthlyFeeKrw,
  deriveDisplayStatus,
  kstDateString,
  sanitizeSearchTerm,
} from './list';

/**
 * OP-02 테넌트 목록 조회 (WI-037, server-only).
 *
 * SSOT: .flowset/api/operator.md OP-02 + codex 3R 협의(thread 019e86f6).
 * 운영자 세션(tenants_read RLS: is_operator)으로 조회. 표시상태/요금/결제/관리자는 페이지 단위
 * tenant_id IN 별도 조회 후 메모리 병합(N+1 회피). 파생 표시상태는 deriveDisplayStatus(KI-123).
 */

const FORBIDDEN = { ok: false as const, error: 'forbidden' as const };
const UNAUTH = { ok: false as const, error: 'unauthenticated' as const };

/** 대표 관리자 표시 — 활성(연결됨)/초대대기(email)/없음. */
export type AdminLabel =
  | { kind: 'active' }
  | { kind: 'pending'; email: string }
  | { kind: 'none' };

export interface TenantListRow {
  id: string;
  name: string;
  slug: string;
  businessNumber: string | null;
  /** DB 원본 status(정렬/필터 기준). */
  dbStatus: TenantStatus;
  /** 파생 표시상태(배지). */
  displayStatus: DisplayStatus;
  planId: string | null;
  planName: string | null;
  activeUserCount: number;
  userLimit: number | null;
  monthlyFeeKrw: number | null;
  paymentStatus: InvoiceStatus | null;
  admin: AdminLabel;
  contractStartDate: string | null;
  contractEndDate: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface TenantListData {
  rows: TenantListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export type ListTenantsResult =
  | { ok: true; data: TenantListData }
  | { ok: false; error: 'unauthenticated' | 'forbidden' };

interface SelectedTenant {
  id: string;
  name: string;
  slug: string;
  business_number: string | null;
  status: TenantStatus;
  plan_id: string | null;
  active_user_count: number;
  user_limit: number | null;
  admin_user_id: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  updated_at: string;
  created_at: string;
}

const TENANT_COLUMNS =
  'id, name, slug, business_number, status, plan_id, active_user_count, user_limit, admin_user_id, contract_start_date, contract_end_date, updated_at, created_at';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** 페이지 tenant 들의 부가 데이터(초대/구독/인보이스/플랜)를 IN 조회 후 행으로 합성. */
async function assembleRows(
  supabase: SupabaseServerClient,
  tenants: SelectedTenant[],
): Promise<TenantListRow[]> {
  const ids = tenants.map((t) => t.id);
  if (ids.length === 0) return [];

  // 대표 관리자 pending 초대(operator_flag=false, tenant_super, pending, 미만료).
  // 만료 초대는 accept_invitation 이 거부하므로 pending_invite 표시 대상이 아니다(codex P2).
  const pendingAdminEmail = new Map<string, string>();
  const { data: invites } = await supabase
    .from('invitations')
    .select('tenant_id, email')
    .in('tenant_id', ids)
    .eq('operator_flag', false)
    .eq('target_role', 'tenant_super')
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());
  for (const inv of invites ?? []) {
    if (inv.tenant_id && !pendingAdminEmail.has(inv.tenant_id)) {
      pendingAdminEmail.set(inv.tenant_id, inv.email);
    }
  }

  // 최신 구독 1건 / tenant (period_end desc).
  const latestSub = new Map<string, { base: number | null; perUser: number | null }>();
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('tenant_id, latched_base_price, latched_price_per_user, period_end, period_start')
    .in('tenant_id', ids)
    .order('period_end', { ascending: false, nullsFirst: false })
    .order('period_start', { ascending: false, nullsFirst: false });
  for (const s of subs ?? []) {
    if (!latestSub.has(s.tenant_id)) {
      latestSub.set(s.tenant_id, { base: s.latched_base_price, perUser: s.latched_price_per_user });
    }
  }

  // 최신 인보이스 1건 / tenant (period_month desc) → 결제상태.
  const latestInvoiceStatus = new Map<string, InvoiceStatus>();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('tenant_id, status, period_month, created_at')
    .in('tenant_id', ids)
    .order('period_month', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false });
  for (const inv of invoices ?? []) {
    if (!latestInvoiceStatus.has(inv.tenant_id)) {
      latestInvoiceStatus.set(inv.tenant_id, inv.status as InvoiceStatus);
    }
  }

  // 플랜 이름 매핑(소량 seed — 전체 조회).
  const planName = new Map<string, string>();
  const { data: plans } = await supabase.from('plans').select('id, name');
  for (const p of plans ?? []) planName.set(p.id, p.name);

  const today = kstDateString(new Date());

  return tenants.map((t) => {
    const hasPendingAdminInvite = pendingAdminEmail.has(t.id);
    const displayStatus = deriveDisplayStatus({
      status: t.status,
      adminUserId: t.admin_user_id,
      hasPendingAdminInvite,
      contractStartDate: t.contract_start_date,
      today,
    });

    let admin: AdminLabel;
    if (t.admin_user_id != null) admin = { kind: 'active' };
    else if (hasPendingAdminInvite) {
      admin = { kind: 'pending', email: pendingAdminEmail.get(t.id)! };
    } else admin = { kind: 'none' };

    const sub = latestSub.get(t.id);
    const monthlyFeeKrw = sub
      ? calcMonthlyFeeKrw({
          latchedBasePrice: sub.base,
          latchedPerUser: sub.perUser,
          activeUserCount: t.active_user_count,
        })
      : null;

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      businessNumber: t.business_number,
      dbStatus: t.status,
      displayStatus,
      planId: t.plan_id,
      planName: t.plan_id ? planName.get(t.plan_id) ?? null : null,
      activeUserCount: t.active_user_count,
      userLimit: t.user_limit,
      monthlyFeeKrw,
      paymentStatus: latestInvoiceStatus.get(t.id) ?? null,
      admin,
      contractStartDate: t.contract_start_date,
      contractEndDate: t.contract_end_date,
      updatedAt: t.updated_at,
      createdAt: t.created_at,
    };
  });
}

/**
 * tenants 검색/필터/정렬을 적용해 [from, to] 범위를 조회(목록·내보내기 공유).
 * 빌더 자체 반환 타입으로 reassign — 제네릭 불요. nulls last + id tiebreaker(결정적 페이지네이션).
 */
function queryTenantRows(
  supabase: SupabaseServerClient,
  params: ListParams,
  from: number,
  to: number,
) {
  let query = supabase.from('tenants').select(TENANT_COLUMNS, { count: 'exact' });
  const term = sanitizeSearchTerm(params.q);
  if (term) {
    const orParts = [
      `name.ilike.%${term}%`,
      `slug.ilike.%${term}%`,
      `business_number.ilike.%${term}%`,
    ];
    // 숫자만 입력(예: 1234567890)도 저장형(###-##-#####)과 매칭되도록 정규화값 eq 추가(codex P2).
    const bizNorm = normalizeBusinessNumber(term);
    if (bizNorm && bizNorm !== term) orParts.push(`business_number.eq.${bizNorm}`);
    query = query.or(orParts.join(','));
  }
  if (params.status.length > 0) query = query.in('status', params.status);
  if (params.planId.length > 0) query = query.in('plan_id', params.planId);
  return query
    .order(params.sortField, { ascending: params.sortDirection === 'asc', nullsFirst: false })
    .order('id', { ascending: true })
    .range(from, to);
}

/** OP-02 목록 — 검색/필터/정렬/페이지네이션 + 부가 데이터 병합. */
export async function listTenants(params: ListParams): Promise<ListTenantsResult> {
  const profile = await getSessionProfile();
  if (!profile) return UNAUTH;
  if (!canViewTenantList(profile.role)) return FORBIDDEN;

  const supabase = await createSupabaseServerClient();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  const first = await queryTenantRows(supabase, params, from, to);
  if (first.error) {
    // 조회 실패는 빈 목록으로 fail-soft(화면이 재시도 안내). total 0.
    return { ok: true, data: { rows: [], total: 0, page: params.page, pageSize: params.pageSize } };
  }

  const total = first.count ?? 0;
  let pageRows = (first.data ?? []) as SelectedTenant[];
  let page = params.page;

  // out-of-range page(예: ?page=999) 보정 — 마지막 유효 페이지로 재조회(codex P2).
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  if (total > 0 && params.page > totalPages) {
    page = totalPages;
    const lastFrom = (page - 1) * params.pageSize;
    const retry = await queryTenantRows(supabase, params, lastFrom, lastFrom + params.pageSize - 1);
    if (!retry.error) pageRows = (retry.data ?? []) as SelectedTenant[];
  }

  const rows = await assembleRows(supabase, pageRows);
  return { ok: true, data: { rows, total, page, pageSize: params.pageSize } };
}

export interface PlanFilterOption {
  id: string;
  name: string;
}

/** 필터 칩용 플랜 목록(전체 — 테넌트가 가질 수 있는 모든 plan). */
export async function getPlanFilterOptions(): Promise<PlanFilterOption[]> {
  const profile = await getSessionProfile();
  if (!profile || !canViewTenantList(profile.role)) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('plans')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true });
  if (error || !data) return [];
  return data.map((p) => ({ id: p.id, name: p.name }));
}

/** OP-02 내보내기 — 필터 적용 전체(상한 EXPORT_LIMIT) 조회. 정렬은 목록과 동일. */
export async function listTenantsForExport(
  params: ListParams,
): Promise<ListTenantsResult> {
  const profile = await getSessionProfile();
  if (!profile) return UNAUTH;
  if (!canViewTenantList(profile.role)) return FORBIDDEN;

  const supabase = await createSupabaseServerClient();
  const { data, count, error } = await queryTenantRows(supabase, params, 0, EXPORT_LIMIT - 1);
  if (error) {
    return { ok: true, data: { rows: [], total: 0, page: 1, pageSize: EXPORT_LIMIT } };
  }

  const rows = await assembleRows(supabase, (data ?? []) as SelectedTenant[]);
  return { ok: true, data: { rows, total: count ?? rows.length, page: 1, pageSize: EXPORT_LIMIT } };
}
