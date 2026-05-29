import 'server-only';

/**
 * 비밀번호 재설정(복구) 흐름 마커 (codex 듀얼검증 P1-1).
 * `/auth/confirm` 가 recovery 토큰 verifyOtp 에 성공했을 때만 설정한다.
 * 일반 로그인 세션만으로 `/reset-password` 에 직접 접근해 재인증 없이 비밀번호를 바꾸는 것을 차단한다
 * (Supabase secure_password_change=false 환경에서 세션 탈취 → 비번 변경 takeover 완화).
 * 값은 복구 대상 user id 로 바인딩 — 공유 기기의 잔존 마커가 다른 사용자에게 적용되지 않도록.
 */
export const RECOVERY_MARKER_COOKIE = 'fh-pw-recovery';
const RECOVERY_MARKER_MAX_AGE = 900; // 15분 (토큰 60분보다 짧게 — 확인 직후 재설정 1회용)

export function recoveryMarkerOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: RECOVERY_MARKER_MAX_AGE,
  };
}
