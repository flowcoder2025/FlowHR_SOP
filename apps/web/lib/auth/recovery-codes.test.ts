import { describe, expect, it } from 'vitest';
import {
  generateRecoveryCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  hashRecoveryCodes,
  normalizeRecoveryCode,
  verifyAndConsumeRecoveryCode,
} from './recovery-codes';

describe('복구 코드 생성', () => {
  it('XXXX-XXXX 형식 (혼동 문자 제외)', () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(code).not.toMatch(/[01OIL]/);
  });

  it('기본 8개 생성', () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8); // 충돌 사실상 없음
  });
});

describe('normalizeRecoveryCode', () => {
  it('대소문자/구분자/공백 흡수하여 표준형으로', () => {
    expect(normalizeRecoveryCode('abcd-efgh')).toBe('ABCD-EFGH');
    expect(normalizeRecoveryCode('ABCDEFGH')).toBe('ABCD-EFGH');
    expect(normalizeRecoveryCode(' ab cd ef gh ')).toBe('ABCD-EFGH');
  });
  it('8자가 아니면 null', () => {
    expect(normalizeRecoveryCode('ABC')).toBeNull();
    expect(normalizeRecoveryCode('ABCDEFGHI')).toBeNull();
  });
});

describe('해싱 + 검증 + 소비', () => {
  it('해시 포맷 scrypt$v=1$...', () => {
    const h = hashRecoveryCode('ABCD-EFGH');
    expect(h.startsWith('scrypt$v=1$N=16384$r=8$p=1$')).toBe(true);
    expect(h.split('$')).toHaveLength(7);
  });

  it('동일 코드라도 salt 가 달라 해시가 다름', () => {
    expect(hashRecoveryCode('ABCD-EFGH')).not.toBe(hashRecoveryCode('ABCD-EFGH'));
  });

  it('맞는 코드 1개 매칭 + 소비(remaining 에서 제거 + matchedHash 반환)', () => {
    const codes = generateRecoveryCodes();
    const hashes = hashRecoveryCodes(codes);
    const target = codes[3]!;
    const result = verifyAndConsumeRecoveryCode(hashes, target.toLowerCase());
    expect(result.matched).toBe(true);
    expect(result.remaining).toHaveLength(7);
    // matchedHash 는 원자적 CAS 가드 키 — 실제 저장 해시 중 하나이고 remaining 에는 없다.
    expect(hashes).toContain(result.matchedHash);
    expect(result.remaining).not.toContain(result.matchedHash);
    // 같은 코드 재사용은 더 이상 매칭되지 않음(1회용).
    const again = verifyAndConsumeRecoveryCode(result.remaining, target);
    expect(again.matched).toBe(false);
    expect(again.matchedHash).toBeNull();
    expect(again.remaining).toHaveLength(7);
  });

  it('틀린 코드는 매칭 실패 + remaining 불변 + matchedHash null', () => {
    const hashes = hashRecoveryCodes(['ABCD-EFGH', 'JKMN-PQRS']);
    const result = verifyAndConsumeRecoveryCode(hashes, 'ZZZZ-ZZZZ');
    expect(result.matched).toBe(false);
    expect(result.matchedHash).toBeNull();
    expect(result.remaining).toBe(hashes);
  });

  it('형식 불일치 입력은 매칭 실패', () => {
    const hashes = hashRecoveryCodes(['ABCD-EFGH']);
    expect(verifyAndConsumeRecoveryCode(hashes, '123').matched).toBe(false);
  });

  it('손상된 저장 해시는 안전하게 false', () => {
    expect(verifyAndConsumeRecoveryCode(['not-a-valid-hash'], 'ABCD-EFGH').matched).toBe(false);
  });
});
