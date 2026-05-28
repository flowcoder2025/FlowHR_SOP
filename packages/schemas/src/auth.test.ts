import { describe, expect, it } from 'vitest';
import { loginSchema } from './auth';

describe('loginSchema', () => {
  it('유효한 입력 통과 + rememberMe 기본 false', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: 'secret1234' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.rememberMe).toBe(false);
  });
  it('rememberMe true 유지', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: 'x', rememberMe: true });
    expect(r.success && r.data.rememberMe).toBe(true);
  });
  it('잘못된 이메일 형식 거부', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false);
  });
  it('빈 비밀번호 거부', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
  it('이메일 앞뒤 공백 trim', () => {
    const r = loginSchema.safeParse({ email: '  a@b.com  ', password: 'x' });
    expect(r.success && r.data.email).toBe('a@b.com');
  });
});
