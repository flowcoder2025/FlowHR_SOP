'use server';

import { createServiceRoleClient } from '@flowhr/api-client/server';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canChangeTenantStatus, canExportTenantList } from './permissions';
import { listTenantsForExport } from './queries';
import {
  type DisplayStatus,
  type InvoiceStatus,
  type ManualStatusTarget,
  type TenantStatus,
  MANUAL_STATUS_TARGETS,
  buildCsv,
  isValidStatusTransition,
  parseListParams,
} from './list';

/**
 * OP-02 테넌트 상태변경 + 내보내기 Server Action (WI-037).
 *
 * 상태변경(ST-009): operator_super 전용. DB 변경 없이 — operator 세션 UPDATE(트리거 자동 audit) +
 * service_role audit_logs semantic row(tenant_id=NULL → reason 은 operator 만 조회). codex 3R 확정.
 */

// ── 상태변경 ──────────────────────────────────────────────────────────────────
export type ChangeStatusError =
  | 'unauthenticated'
  | 'forbidden'
  | 'invalid'
  | 'not_found'
  | 'invalid_transition'
  | 'conflict'
  | 'update_failed';

export type ChangeStatusResult =
  | { ok: true; newStatus: ManualStatusTarget }
  | { ok: false; error: ChangeStatusError };

const changeStatusSchema = z.object({
  tenantId: z.string().uuid(),
  targetStatus: z.enum(MANUAL_STATUS_TARGETS),
  reason: z.string().trim().min(1).max(500),
});

export async function changeTenantStatus(input: unknown): Promise<ChangeStatusResult> {
  const profile = await getSessionProfile();
  if (!profile) return { ok: false, error: 'unauthenticated' };
  if (!canChangeTenantStatus(profile.role)) return { ok: false, error: 'forbidden' };

  const parsed = changeStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const { tenantId, targetStatus, reason } = parsed.data;

  const supabase = await createSupabaseServerClient();

  // 현재 status 조회(전이 검증 + optimistic old 값). soft-delete tombstone 은 변경 불가(codex P2).
  const { data: current, error: readErr } = await supabase
    .from('tenants')
    .select('status')
    .eq('id', tenantId)
    .is('deleted_at', null)
    .maybeSingle();
  if (readErr) return { ok: false, error: 'update_failed' };
  if (!current) return { ok: false, error: 'not_found' };

  const fromStatus = current.status as TenantStatus;
  if (!isValidStatusTransition(fromStatus, targetStatus)) {
    return { ok: false, error: 'invalid_transition' };
  }

  // optimistic guard(.eq status=old) — 동시 변경 시 affected 0 → conflict.
  const { data: updated, error: updErr } = await supabase
    .from('tenants')
    .update({ status: targetStatus, updated_at: new Date().toISOString() })
    .eq('id', tenantId)
    .eq('status', fromStatus)
    .is('deleted_at', null)
    .select('id');
  if (updErr) return { ok: false, error: 'update_failed' };
  if (!updated || updated.length === 0) return { ok: false, error: 'conflict' };

  // semantic audit(reason 보존, tenant 비노출) — best-effort. 트리거가 tenants.update 를 이미 남김.
  try {
    const service = createServiceRoleClient();
    const { error: auditErr } = await service.from('audit_logs').insert({
      tenant_id: null,
      actor_id: profile.user.id,
      actor_role: profile.role,
      action: 'tenants.status_change',
      target_type: 'tenants',
      target_id: tenantId,
      before: { status: fromStatus },
      after: { status: targetStatus, reason },
      result: 'success',
    });
    if (auditErr) {
      console.error('[WI-037] status_change semantic audit insert failed', auditErr);
    }
  } catch (e) {
    console.error('[WI-037] status_change semantic audit insert threw', e);
  }

  return { ok: true, newStatus: targetStatus };
}

// ── 내보내기(CSV) ─────────────────────────────────────────────────────────────
export type ExportError = 'unauthenticated' | 'forbidden';

export type ExportResult =
  | { ok: true; filename: string; csv: string; count: number; truncated: boolean }
  | { ok: false; error: ExportError };

/**
 * 현재 필터(검색/상태/요금제/정렬)를 적용한 목록을 CSV 로 직렬화. 의존성 없이 UTF-8 BOM CSV(Excel 호환).
 * 라벨/헤더는 locale 로 번역. EXPORT_LIMIT 초과분은 잘림(truncated=true).
 */
export async function exportTenants(
  locale: string,
  rawParams: Record<string, string | string[] | undefined>,
): Promise<ExportResult> {
  const profile = await getSessionProfile();
  if (!profile) return { ok: false, error: 'unauthenticated' };
  if (!canExportTenantList(profile.role)) return { ok: false, error: 'forbidden' };

  const params = parseListParams(rawParams);
  const result = await listTenantsForExport(params);
  if (!result.ok) return { ok: false, error: result.error };

  const t = await getTranslations({ locale, namespace: 'screens.op-02' });
  const statusLabel = (s: DisplayStatus): string => t(`status.${s}`);
  const paymentLabel = (s: InvoiceStatus | null): string => (s ? t(`payment.${s}`) : '—');

  const headers = [
    t('col.company'),
    t('col.domain'),
    t('export.businessNumber'),
    t('col.status'),
    t('col.plan'),
    t('export.activeUsers'),
    t('export.userLimit'),
    t('col.monthlyFee'),
    t('col.payment'),
    t('col.admin'),
    t('export.contractStart'),
    t('export.contractEnd'),
    t('col.lastActive'),
  ];

  const rows = result.data.rows.map((r) => [
    r.name,
    r.slug,
    r.businessNumber ?? '',
    statusLabel(r.displayStatus),
    r.planName ?? '',
    r.activeUserCount,
    r.userLimit ?? '',
    r.monthlyFeeKrw ?? '',
    paymentLabel(r.paymentStatus),
    r.admin.kind === 'pending' ? r.admin.email : t(`admin.${r.admin.kind}`),
    r.contractStartDate ?? '',
    r.contractEndDate ?? '',
    r.updatedAt.slice(0, 10),
  ]);

  const csv = buildCsv(headers, rows);
  const truncated = result.data.total > result.data.rows.length;
  return {
    ok: true,
    filename: `tenants-${new Date().toISOString().slice(0, 10)}.csv`,
    csv,
    count: result.data.rows.length,
    truncated,
  };
}
