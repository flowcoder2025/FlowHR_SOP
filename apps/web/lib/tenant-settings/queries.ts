import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';

/**
 * TA-13 회사 설정 조회 (GET /api/v1/tenant/settings, WI-032).
 *
 * SSOT: .flowset/api/tenant.md TA-13 + .flowset/wireframes/analysis/TA-13.md.
 * 9탭 envelope 를 반환한다 — 각 탭마다 권한(permission)/구현여부(implemented)/현재값(data)/예약대기(pending).
 * 데이터 조회는 사용자 세션 client(RLS 적용) — tenant_settings/work_policies/leave_types/approval_lines/
 * document_templates 의 read 정책(mig 27: tenant_id 일치)이 테넌트 격리를 강제한다.
 *
 * WI-032 는 P0 4탭(company/work_policy/leave_policy/approval_lines)만 PATCH 구현.
 * roles/notifications/document_templates/security 는 조회만(implemented=false), audit_logs 는 read-only.
 */

export const SETTING_TABS = [
  'company',
  'work_policy',
  'leave_policy',
  'approval_lines',
  'roles',
  'notifications',
  'document_templates',
  'security',
  'audit_logs',
] as const;
export type SettingTab = (typeof SETTING_TABS)[number];

/** PATCH 가 구현된 탭(WI-032 P0). */
const IMPLEMENTED_TABS: ReadonlySet<SettingTab> = new Set<SettingTab>([
  'company',
  'work_policy',
  'leave_policy',
  'approval_lines',
]);

export type SettingPermission = 'edit' | 'read' | 'none';

export interface PendingChangeSummary {
  id: string;
  applyAt: string;
  status: string;
  attemptCount: number;
  errorMessage: string | null;
}

export interface SettingTabState {
  permission: SettingPermission;
  implemented: boolean;
  data: unknown;
  pending: PendingChangeSummary[];
}

export interface TenantSettingsResult {
  tenantId: string;
  role: string;
  tabs: Record<SettingTab, SettingTabState>;
}

export type TenantSettingsQueryResult =
  | { ok: true; result: TenantSettingsResult }
  | { ok: false; error: 'unauthenticated' | 'forbidden' };

const TENANT_ROLES = new Set(['tenant_super', 'tenant_hr_admin', 'tenant_manager']);

/** 편집 권한: PATCH 구현된 탭 + 관리자(super/hr_admin). scheduled_setting_changes INSERT RLS 경계와 정합. */
function canEdit(role: string, tab: SettingTab): boolean {
  if (!IMPLEMENTED_TABS.has(tab)) return false;
  return role === 'tenant_super' || role === 'tenant_hr_admin';
}

/** 조회 권한: super/hr_admin 전탭, manager 는 security/audit 제외, employee 는 공개 3탭(본 lib 진입은 tenant 역할만). */
function canRead(role: string, tab: SettingTab): boolean {
  if (role === 'tenant_super' || role === 'tenant_hr_admin') return true;
  if (role === 'tenant_manager') return tab !== 'security' && tab !== 'audit_logs';
  return false;
}

function permissionFor(role: string, tab: SettingTab): SettingPermission {
  if (canEdit(role, tab)) return 'edit';
  if (canRead(role, tab)) return 'read';
  return 'none';
}

export async function getTenantSettings(): Promise<TenantSettingsQueryResult> {
  const profile = await getSessionProfile();
  if (!profile) return { ok: false, error: 'unauthenticated' };
  const { role, tenantId } = profile;
  if (!role || !tenantId || !TENANT_ROLES.has(role)) return { ok: false, error: 'forbidden' };

  const supabase = await createSupabaseServerClient();

  // tenant_settings 단일 행(company/notification/security 3탭 분할 원천). 없으면 모두 null.
  const { data: settingsRow } = await supabase
    .from('tenant_settings')
    .select('company_info, notification_config, security_policy')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const [workPolicy, leaveTypes, approvalLines, documentTemplates, auditLogs, pendingRows] =
    await Promise.all([
      canRead(role, 'work_policy')
        ? supabase
            .from('work_policies')
            .select(
              'id, name, is_default, standard_clock_in, standard_clock_out, late_threshold, break_minutes_default, weekly_max_hours, applicable_departments, applied_from',
            )
            .eq('tenant_id', tenantId)
            .eq('is_default', true)
            .maybeSingle()
            .then((r) => r.data ?? null)
        : Promise.resolve(null),
      canRead(role, 'leave_policy')
        ? supabase
            .from('leave_types')
            .select(
              'id, key, label_ko, default_days, is_paid, carryover_allowed, evidence_required, sort_order',
            )
            .eq('tenant_id', tenantId)
            .order('sort_order', { ascending: true })
            .then((r) => r.data ?? [])
        : Promise.resolve([]),
      canRead(role, 'approval_lines')
        ? supabase
            .from('approval_lines')
            .select('id, name, request_type, conditions, default_line, is_active')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: true })
            .then((r) => r.data ?? [])
        : Promise.resolve([]),
      canRead(role, 'document_templates')
        ? supabase
            .from('document_templates')
            .select('id, key, label_ko, template_format, variables')
            .eq('tenant_id', tenantId)
            .order('key', { ascending: true })
            .then((r) => r.data ?? [])
        : Promise.resolve([]),
      canRead(role, 'audit_logs')
        ? supabase
            .from('audit_logs')
            .select('id, action, actor_id, actor_role, target_type, target_id, result, created_at')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(20)
            .then((r) => r.data ?? [])
        : Promise.resolve([]),
      supabase
        .from('scheduled_setting_changes')
        .select('id, target, apply_at, status, attempt_count, error_message')
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'applying', 'failed'])
        .order('apply_at', { ascending: true })
        .then((r) => r.data ?? []),
    ]);

  // 예약 대기/실패 변경을 탭별로 그룹화.
  const pendingByTab = new Map<string, PendingChangeSummary[]>();
  for (const row of pendingRows) {
    const list = pendingByTab.get(row.target) ?? [];
    list.push({
      id: row.id,
      applyAt: row.apply_at,
      status: row.status,
      attemptCount: row.attempt_count,
      errorMessage: row.error_message,
    });
    pendingByTab.set(row.target, list);
  }

  const dataByTab: Record<SettingTab, unknown> = {
    company: settingsRow?.company_info ?? null,
    work_policy: workPolicy,
    // grant_basis 저장 위치 부재(KI 등재) — WI-032 는 leave_types 만 반환.
    leave_policy: { leave_types: leaveTypes, grant_basis: null },
    approval_lines: approvalLines,
    roles: null,
    notifications: settingsRow?.notification_config ?? null,
    document_templates: documentTemplates,
    security: settingsRow?.security_policy ?? null,
    audit_logs: auditLogs,
  };

  const tabs = {} as Record<SettingTab, SettingTabState>;
  for (const tab of SETTING_TABS) {
    const permission = permissionFor(role, tab);
    tabs[tab] = {
      permission,
      implemented: IMPLEMENTED_TABS.has(tab),
      data: permission === 'none' ? null : dataByTab[tab],
      pending: pendingByTab.get(tab) ?? [],
    };
  }

  return { ok: true, result: { tenantId, role, tabs } };
}
