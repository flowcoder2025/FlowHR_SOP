import { describe, expect, it } from 'vitest';
import {
  buildOtpAuthUrl,
  currentTotp,
  generateTotpSecret,
  toQrDataUrl,
  verifyTotp,
} from './totp';

describe('TOTP', () => {
  it('비밀 생성 — base32', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBeGreaterThanOrEqual(16);
  });

  it('현재 코드 검증 통과 (왕복)', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, currentTotp(secret))).toBe(true);
  });

  it('틀린 코드 거부', () => {
    const secret = generateTotpSecret();
    const wrong = currentTotp(secret) === '000000' ? '111111' : '000000';
    expect(verifyTotp(secret, wrong)).toBe(false);
  });

  it('형식이 6자리 숫자가 아니면 즉시 false', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, '12345')).toBe(false);
    expect(verifyTotp(secret, 'abcdef')).toBe(false);
    expect(verifyTotp(secret, '1234567')).toBe(false);
  });

  it('otpauth URL + QR data URL 생성', async () => {
    const secret = generateTotpSecret();
    const url = buildOtpAuthUrl(secret, 'user@flowhr.test');
    expect(url.startsWith('otpauth://totp/')).toBe(true);
    expect(url).toContain('issuer=FlowHR');
    const qr = await toQrDataUrl(url);
    expect(qr.startsWith('data:image/png;base64,')).toBe(true);
  });
});
