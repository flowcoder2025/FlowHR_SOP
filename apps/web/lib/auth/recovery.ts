import 'server-only';
import {
  issueRecoveryMarker as issue,
  verifyRecoveryMarker as verify,
} from './recovery-marker';

/**
 * 비밀번호 재설정(복구) 흐름 마커 (codex 듀얼검증 P1-1).
 * `/auth/confirm` 가 recovery 토큰 verifyOtp 에 성공했을 때만 HMAC 서명 마커를 설정한다.
 * `/reset-password` 페이지·액션이 recovery 세션 + 유효 서명 마커(=본인 user)를 모두 요구 →
 * 일반/탈취 로그인 세션이 마커를 위조해 재인증 없이 비밀번호를 바꾸는 경로를 차단한다.
 * HMAC 키는 서버 전용 SUPABASE_SERVICE_ROLE_KEY 를 사용(클라이언트 미노출). 부재 시 fail-closed.
 * (WI-020-5 env-key 인프라 도입 시 전용 서명 비밀로 분리 가능.)
 */
export const RECOVERY_MARKER_COOKIE = 'fh-pw-recovery';

function markerSecret(): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정 — 재설정 마커 서명 불가');
  return secret;
}

/** recovery 성공 시 마커 발급. 서명 비밀 부재 시 throw(설정 오류 — 호출부에서 처리). */
export function issueRecoveryMarker(userId: string, nowMs: number = Date.now()): string {
  return issue(userId, markerSecret(), nowMs);
}

/** 마커 검증. 서명 비밀 부재/위조/만료/불일치는 모두 false(fail-closed). */
export function verifyRecoveryMarker(
  marker: string | undefined | null,
  userId: string,
  nowMs: number = Date.now(),
): boolean {
  try {
    return verify(marker, userId, markerSecret(), nowMs);
  } catch {
    return false;
  }
}

export function recoveryMarkerOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 900, // 15분
  };
}
