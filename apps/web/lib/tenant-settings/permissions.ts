/**
 * TA-13 회사 설정 권한 매트릭스 (WI-032) — 순수 로직(서버 의존 없음 → 단위 테스트 가능).
 * SSOT: .flowset/wireframes/analysis/TA-13.md §1/§6 + .flowset/api/tenant.md TA-13 + RLS(mig 27).
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
export const IMPLEMENTED_TABS: ReadonlySet<SettingTab> = new Set<SettingTab>([
  'company',
  'work_policy',
  'leave_policy',
  'approval_lines',
]);

export type SettingPermission = 'edit' | 'read' | 'none';

/** 편집 권한: PATCH 구현된 탭 + 관리자(super/hr_admin). scheduled_setting_changes INSERT RLS 경계와 정합. */
export function canEdit(role: string, tab: SettingTab): boolean {
  if (!IMPLEMENTED_TABS.has(tab)) return false;
  return role === 'tenant_super' || role === 'tenant_hr_admin';
}

/**
 * 조회 권한 (와이어프레임 TA-13 §1/§6 역할 설계 + RLS 정합, 최소권한):
 * - super: 전탭
 * - hr_admin: 보안/역할권한은 super 전용 → 제외. 그 외(감사 포함 — RLS audit_logs_read=is_tenant_admin +
 *   api/tenant.md /audit-logs "hr_admin 일부" + 와이어프레임 pane 9 정합) 조회.
 *   ※ 와이어프레임 §2 state4 의 hr_admin 보안 read-only 진입은 민감 정책 raw 노출 회피로 본 WI 미적용(KI-113).
 * - manager: 조회만 — 민감 탭(security/roles/audit_logs) 제외.
 */
export function canRead(role: string, tab: SettingTab): boolean {
  if (role === 'tenant_super') return true;
  if (role === 'tenant_hr_admin') return tab !== 'security' && tab !== 'roles';
  if (role === 'tenant_manager')
    return tab !== 'security' && tab !== 'roles' && tab !== 'audit_logs';
  return false;
}

export function permissionFor(role: string, tab: SettingTab): SettingPermission {
  if (canEdit(role, tab)) return 'edit';
  if (canRead(role, tab)) return 'read';
  return 'none';
}
