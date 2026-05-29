import { describe, expect, it } from 'vitest';
import { issueRecoveryMarker, verifyRecoveryMarker } from './recovery-marker';

const SECRET = 'test-server-secret-0123456789';
const USER = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const NOW = 1_700_000_000_000;

describe('recovery marker (HMAC 서명, P1-1 위조 차단)', () => {
  it('발급 직후 동일 user/secret/시간대에서 검증 통과', () => {
    const m = issueRecoveryMarker(USER, SECRET, NOW);
    expect(verifyRecoveryMarker(m, USER, SECRET, NOW)).toBe(true);
  });

  it('다른 user 로는 검증 실패(마커 바인딩)', () => {
    const m = issueRecoveryMarker(USER, SECRET, NOW);
    expect(verifyRecoveryMarker(m, OTHER, SECRET, NOW)).toBe(false);
  });

  it('위조 마커(서명 비밀 모름) 거부 — `${user}.${exp}.forged`', () => {
    const exp = NOW + 900_000;
    const forged = `${USER}.${exp}.forged-signature`;
    expect(verifyRecoveryMarker(forged, USER, SECRET, NOW)).toBe(false);
  });

  it('공격자가 user.id 만 알고 직접 조립한 마커 거부(HMAC 부재)', () => {
    // raw 마커(서명 없음) 또는 임의 값 — 세션 보유자가 user.id 를 알아도 위조 불가
    expect(verifyRecoveryMarker(USER, USER, SECRET, NOW)).toBe(false);
    expect(verifyRecoveryMarker(`${USER}.${NOW + 900_000}.`, USER, SECRET, NOW)).toBe(false);
  });

  it('다른 secret 으로 서명된 마커 거부', () => {
    const m = issueRecoveryMarker(USER, 'attacker-secret', NOW);
    expect(verifyRecoveryMarker(m, USER, SECRET, NOW)).toBe(false);
  });

  it('만료(TTL 15분 경과) 마커 거부', () => {
    const m = issueRecoveryMarker(USER, SECRET, NOW);
    expect(verifyRecoveryMarker(m, USER, SECRET, NOW + 900_001)).toBe(false);
    // 만료 직전(15분 - 1ms)은 통과
    expect(verifyRecoveryMarker(m, USER, SECRET, NOW + 899_999)).toBe(true);
  });

  it('payload 변조(exp 연장 시도) 거부 — 서명 불일치', () => {
    const m = issueRecoveryMarker(USER, SECRET, NOW);
    const [u, , sig] = m.split('.');
    const tampered = `${u}.${NOW + 9_000_000}.${sig}`; // exp 만 늘리고 기존 서명 재사용
    expect(verifyRecoveryMarker(tampered, USER, SECRET, NOW)).toBe(false);
  });

  it('형식 오류(분절 수 불일치)·빈 값 거부', () => {
    expect(verifyRecoveryMarker(undefined, USER, SECRET, NOW)).toBe(false);
    expect(verifyRecoveryMarker('', USER, SECRET, NOW)).toBe(false);
    expect(verifyRecoveryMarker('a.b', USER, SECRET, NOW)).toBe(false);
    expect(verifyRecoveryMarker('a.b.c.d', USER, SECRET, NOW)).toBe(false);
  });
});
