import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { keyFromBase64, open, openJson, seal, sealJson } from './crypto';

const KEY = randomBytes(32);
const KEY_B64 = KEY.toString('base64');

describe('AES-256-GCM seal/open', () => {
  it('평문 봉인 후 동일 키로 복원', () => {
    const token = seal('hello 한글', KEY);
    expect(open(token, KEY)).toBe('hello 한글');
  });

  it('동일 평문도 매 호출 다른 토큰(랜덤 IV)', () => {
    expect(seal('x', KEY)).not.toBe(seal('x', KEY));
  });

  it('위변조된 토큰은 throw (authTag 검증)', () => {
    const token = seal('payload', KEY);
    const raw = Buffer.from(token, 'base64url');
    raw[20] ^= 0x01; // ciphertext/tag 일부 변조
    const tampered = raw.toString('base64url');
    expect(() => open(tampered, KEY)).toThrow();
  });

  it('다른 키로는 복원 불가 (throw)', () => {
    const token = seal('secret', KEY);
    expect(() => open(token, randomBytes(32))).toThrow();
  });

  it('너무 짧은 토큰은 throw', () => {
    expect(() => open('AAAA', KEY)).toThrow();
  });
});

describe('keyFromBase64', () => {
  it('32바이트 base64 키 파싱', () => {
    expect(keyFromBase64(KEY_B64).length).toBe(32);
  });
  it('길이 불일치 키는 throw (fail-closed)', () => {
    expect(() => keyFromBase64(randomBytes(16).toString('base64'))).toThrow();
  });
});

describe('sealJson/openJson', () => {
  it('객체 봉인/복원 왕복', () => {
    const obj = { userId: 'u1', exp: 123, nested: { a: [1, 2] } };
    const token = sealJson(obj, KEY);
    expect(openJson(token, KEY)).toEqual(obj);
  });
  it('위변조 시 openJson throw', () => {
    const token = sealJson({ a: 1 }, KEY);
    const raw = Buffer.from(token, 'base64url');
    raw[raw.length - 1] ^= 0x01;
    expect(() => openJson(raw.toString('base64url'), KEY)).toThrow();
  });
});
