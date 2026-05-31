import { describe, expect, it } from 'vitest';
import {
  generateInvitationToken,
  hashInvitationToken,
  tokenHashEquals,
} from './invitation-token';

describe('초대 토큰', () => {
  it('평문 토큰은 base64url 고엔트로피(32바이트=43자)', () => {
    const t = generateInvitationToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(t.length).toBeGreaterThanOrEqual(43);
    expect(generateInvitationToken()).not.toBe(t); // 매번 다름
  });

  it('sha256 해시는 64자 hex + 결정적', () => {
    const t = generateInvitationToken();
    const h = hashInvitationToken(t);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInvitationToken(t)).toBe(h);
  });

  it('다른 토큰은 다른 해시', () => {
    expect(hashInvitationToken(generateInvitationToken())).not.toBe(
      hashInvitationToken(generateInvitationToken()),
    );
  });

  it('tokenHashEquals — 동일 해시 true / 다른 해시·형식오류 false', () => {
    const h = hashInvitationToken('abc');
    expect(tokenHashEquals(h, hashInvitationToken('abc'))).toBe(true);
    expect(tokenHashEquals(h, hashInvitationToken('xyz'))).toBe(false);
    expect(tokenHashEquals(h, '')).toBe(false);
    expect(tokenHashEquals(h, 'zzzz')).toBe(false);
  });
});
