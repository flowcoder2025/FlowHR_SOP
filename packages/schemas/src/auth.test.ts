import { describe, expect, it } from 'vitest';
import {
  failingPasswordRules,
  forgotPasswordSchema,
  isPasswordValid,
  loginSchema,
  passwordSchema,
  resetPasswordSchema,
} from './auth';

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

describe('비밀번호 정책 (passwordRules / passwordSchema)', () => {
  it('정책을 모두 충족하면 통과 + failing 빈 배열', () => {
    expect(isPasswordValid('Abcdef123!')).toBe(true);
    expect(failingPasswordRules('Abcdef123!')).toEqual([]);
    expect(passwordSchema.safeParse('Abcdef123!').success).toBe(true);
  });

  it('10자 미만은 length 규칙 실패', () => {
    expect(failingPasswordRules('Abc1!')).toContain('length');
    expect(passwordSchema.safeParse('Abc1!').success).toBe(false);
  });

  it('대문자/소문자/숫자/특수 누락을 각각 검출', () => {
    expect(failingPasswordRules('abcdef123!')).toEqual(['upper']); // 대문자 없음
    expect(failingPasswordRules('ABCDEF123!')).toEqual(['lower']); // 소문자 없음
    expect(failingPasswordRules('Abcdefghij!')).toEqual(['digit']); // 숫자 없음
    expect(failingPasswordRules('Abcdefghij1')).toEqual(['special']); // 특수문자 없음
  });

  it('실패 규칙은 정의 순서를 유지', () => {
    // 길이/소문자/숫자/특수 모두 실패 (대문자만 충족) → 정의 순서대로
    expect(failingPasswordRules('ABC')).toEqual(['length', 'lower', 'digit', 'special']);
  });

  it('passwordSchema 실패 메시지는 i18n 키 형식', () => {
    const r = passwordSchema.safeParse('ABC');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i) => i.message)).toContain('auth.password.error.length');
    }
  });
});

describe('forgotPasswordSchema', () => {
  it('유효한 이메일 통과 + trim', () => {
    const r = forgotPasswordSchema.safeParse({ email: '  user@flowhr.test ' });
    expect(r.success && r.data.email).toBe('user@flowhr.test');
  });
  it('빈/잘못된 이메일 거부', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('정책 통과 + 두 값 일치 시 통과', () => {
    const r = resetPasswordSchema.safeParse({
      newPassword: 'Abcdef123!',
      confirmPassword: 'Abcdef123!',
    });
    expect(r.success).toBe(true);
  });
  it('확인 불일치 거부 (confirmPassword 경로)', () => {
    const r = resetPasswordSchema.safeParse({
      newPassword: 'Abcdef123!',
      confirmPassword: 'Abcdef123?',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('confirmPassword'))).toBe(true);
    }
  });
  it('정책 미달 비밀번호 거부', () => {
    expect(
      resetPasswordSchema.safeParse({ newPassword: 'weak', confirmPassword: 'weak' }).success,
    ).toBe(false);
  });
});
