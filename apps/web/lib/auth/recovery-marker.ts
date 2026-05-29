import { createHmac, timingSafeEqual } from 'node:crypto';

// 비밀번호 재설정(복구) 마커의 순수 서명/검증 로직 (server-only 의존 없음 — 단위 테스트 대상).
// 마커 = `${userId}.${expMs}.${HMAC-SHA256(userId.expMs)}` (base64url).
// 서버 비밀로 HMAC 서명하므로 클라이언트가 위조할 수 없다(codex 듀얼검증 P1-1: raw 마커 위조 차단).
// userId(UUID)·expMs(정수)·base64url 서명 모두 '.' 를 포함하지 않으므로 split('.') 3분할이 안전.

const TTL_MS = 900_000; // 15분

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** 마커 발급 — /auth/confirm 의 recovery verifyOtp 성공 시에만 호출한다. */
export function issueRecoveryMarker(userId: string, secret: string, nowMs: number): string {
  const exp = nowMs + TTL_MS;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** 마커 검증 — 서명 일치 + 미만료 + userId 일치일 때만 true. 위조/만료/형식오류는 false. */
export function verifyRecoveryMarker(
  marker: string | undefined | null,
  userId: string,
  secret: string,
  nowMs: number,
): boolean {
  if (!marker) return false;
  const parts = marker.split('.');
  if (parts.length !== 3) return false;
  const [markUser, expStr, providedSig] = parts as [string, string, string];
  if (markUser !== userId) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < nowMs) return false;

  const expectedSig = sign(`${markUser}.${expStr}`, secret);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
