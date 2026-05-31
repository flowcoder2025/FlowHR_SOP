import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

// 계정 활성화 초대 토큰 (ST-003 / CM-03) — 순수 로직, 단위 테스트 대상.
// URL 로 전달되는 평문 토큰은 32바이트 CSPRNG(base64url, 256비트 엔트로피)이고,
// DB(invitations.token_hash)에는 sha256(token) 해시만 저장한다.
// 고엔트로피 랜덤 토큰이므로 sha256 preimage 저항으로 DB 유출 시 원본 복원이 불가능하다
// (HMAC 전용 키는 저엔트로피 입력 방어용 — recovery-marker 와 달리 여기선 불필요).
// 검증은 입력 토큰을 동일 해시하여 timingSafeEqual 로 대조한다.

const TOKEN_BYTES = 32;

/** 평문 초대 토큰 발급 (이메일/활성화 링크용). 평문은 저장하지 않는다. */
export function generateInvitationToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/** 평문 토큰 → sha256 해시(hex). invitations.token_hash 저장/조회 키. */
export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 두 해시(hex)를 timingSafe 비교. 길이 불일치/형식 오류는 false. */
export function tokenHashEquals(a: string, b: string): boolean {
  let ba: Buffer;
  let bb: Buffer;
  try {
    ba = Buffer.from(a, 'hex');
    bb = Buffer.from(b, 'hex');
  } catch {
    return false;
  }
  if (ba.length === 0 || ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
