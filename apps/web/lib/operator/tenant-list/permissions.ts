/**
 * OP-02 테넌트 목록/상태변경 권한 (WI-037) — 순수 로직(서버 의존 없음 → 단위 테스트).
 * SSOT: .flowset/api/operator.md OP-02 + .flowset/wireframes/analysis/OP-02.md §6 권한 매트릭스.
 *
 * 매트릭스(matrix.json Tenant.permissions 정합):
 *  - operator_super: 조회/내보내기/기본정보수정 + 상태변경/보관/삭제 (전체)
 *  - operator_staff:  조회/내보내기/기본정보수정 (상태변경·보관·삭제 불가)
 *  - tenant_* 역할: 접근 불가(403, 라우트 가드)
 *
 * RLS `tenants_write`(mig 27)는 is_operator()(super+staff 공통)라 DB 레벨에서 staff UPDATE 를
 * 막지 못한다. 상태변경 server action 이 canChangeTenantStatus 로 operator_super 를 강제(권위)하고,
 * UI 는 버튼을 숨긴다. RLS 비대칭은 KI-109 보안 하드닝 sweep 동류로 등재.
 */
export const OPERATOR_ROLES: ReadonlySet<string> = new Set(['operator_super', 'operator_staff']);

/** 운영사 역할(super/staff) 여부. */
export function isOperatorRole(role: string | null | undefined): boolean {
  return role != null && OPERATOR_ROLES.has(role);
}

/** operator_super 여부(상태변경/보관/삭제 등 민감 운영 액션 전용). */
export function isOperatorSuperRole(role: string | null | undefined): boolean {
  return role === 'operator_super';
}

/** 테넌트 목록 조회(super/staff 공통). */
export function canViewTenantList(role: string | null | undefined): boolean {
  return isOperatorRole(role);
}

/** 목록 Excel(CSV) 내보내기(super/staff 공통). */
export function canExportTenantList(role: string | null | undefined): boolean {
  return isOperatorRole(role);
}

/** 테넌트 기본 정보 수정(super/staff 공통, OP-03 소유 — 권한 함수만 선제 정의). */
export function canEditTenantBasic(role: string | null | undefined): boolean {
  return isOperatorRole(role);
}

/** 테넌트 상태 변경(활성/비활성/만료) — operator_super 전용(ST-009). */
export function canChangeTenantStatus(role: string | null | undefined): boolean {
  return isOperatorSuperRole(role);
}

/** 테넌트 보관(archived) — operator_super 전용(WI-037 범위 외, 권한 함수만 선제 정의). */
export function canArchiveTenant(role: string | null | undefined): boolean {
  return isOperatorSuperRole(role);
}

/** 테넌트 삭제(soft delete) — operator_super 전용(WI-037 범위 외, 권한 함수만 선제 정의). */
export function canDeleteTenant(role: string | null | undefined): boolean {
  return isOperatorSuperRole(role);
}
