/** users.role 값 (DB는 text — 마이그레이션 06). */
export type UserRole =
  | 'operator_super'
  | 'operator_staff'
  | 'tenant_super'
  | 'tenant_hr_admin'
  | 'tenant_manager'
  | 'employee';

/**
 * 로그인 성공 후 역할별 진입 경로 (SSOT: prd/09-routing.md §3 + api/auth.md 라우팅 매트릭스).
 * operator_* → /operator, tenant_* → /admin, employee → /me.
 * 알 수 없거나 미설정 역할은 최소 권한 진입점 /me로 폴백한다.
 */
export function roleToRedirectPath(role: string | null | undefined): string {
  switch (role) {
    case 'operator_super':
    case 'operator_staff':
      return '/operator';
    case 'tenant_super':
    case 'tenant_hr_admin':
    case 'tenant_manager':
      return '/admin';
    case 'employee':
    default:
      return '/me';
  }
}

/** 보호 라우트 prefix → 허용 역할 매핑 (미들웨어 역할 가드 / 09-routing.md §8). */
export function canAccessPath(role: string | null | undefined, pathnameWithoutLocale: string): boolean {
  if (pathnameWithoutLocale.startsWith('/operator')) {
    return role === 'operator_super' || role === 'operator_staff';
  }
  if (pathnameWithoutLocale.startsWith('/admin')) {
    return role === 'tenant_super' || role === 'tenant_hr_admin' || role === 'tenant_manager';
  }
  // /me 는 모든 인증 사용자(본인 화면) 접근 가능.
  return true;
}
