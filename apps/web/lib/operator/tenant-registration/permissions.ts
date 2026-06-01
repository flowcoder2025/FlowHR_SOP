/**
 * OP-04 신규 테넌트 등록 권한 (WI-035) — 순수 로직(서버 의존 없음 → 단위 테스트).
 * SSOT: .flowset/prd/domains/operator/OP-04-onboarding.md §2 — operator_super/operator_staff 모두
 * 전 단계 + 초대 발송(C/R/U/N). tenant_* 역할은 접근 불가(403).
 *
 * 비활성화/상태변경 등 일부 운영 액션은 operator_super 전용(OP-02/03, ST-009)이지만
 * **등록(OP-04)은 두 운영자 역할 공통**(와이어프레임/PRD §2 권한표).
 */
export const OPERATOR_ROLES: ReadonlySet<string> = new Set(['operator_super', 'operator_staff']);

export function isOperator(role: string | null | undefined): boolean {
  return role != null && OPERATOR_ROLES.has(role);
}

/** OP-04 신규 테넌트 등록 가능 역할(operator_super/operator_staff). */
export function canRegisterTenant(role: string | null | undefined): boolean {
  return isOperator(role);
}
