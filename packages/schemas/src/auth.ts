import { z } from 'zod';

/**
 * 로그인 폼 입력 (CM-01 / api/auth.md POST /api/v1/auth/login).
 * 로그인은 자격 존재 검증만 하므로 password는 비어있지 않은지만 본다.
 * (비밀번호 정책 ≥10자는 가입/활성화/재설정 시 강제 — ST-003/ST-002.)
 */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'auth.login.error.email_required').email('auth.login.error.email_invalid'),
  password: z.string().min(1, 'auth.login.error.password_required'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * 비밀번호 정책 (api/auth.md §reset-password: ≥10자 + 영문 대/소문자 + 숫자 + 특수).
 * 규칙을 데이터로 정의해 zod refine(서버 검증)과 폼 실시간 체크리스트(클라이언트)가 같은 SSOT를 쓴다.
 * 비밀번호 설정이 필요한 모든 흐름(ST-002 재설정 / ST-003 활성화)에서 공유한다.
 */
export const PASSWORD_MIN_LENGTH = 10;

export const passwordRules = [
  { key: 'length', test: (v: string) => v.length >= PASSWORD_MIN_LENGTH },
  { key: 'lower', test: (v: string) => /[a-z]/.test(v) },
  { key: 'upper', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'digit', test: (v: string) => /[0-9]/.test(v) },
  { key: 'special', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

export type PasswordRuleKey = (typeof passwordRules)[number]['key'];

/** 충족하지 못한 정책 규칙 키 목록(정의 순서 유지). 빈 배열이면 정책 통과. */
export function failingPasswordRules(value: string): PasswordRuleKey[] {
  return passwordRules.filter((r) => !r.test(value)).map((r) => r.key);
}

/** 모든 정책 규칙 충족 여부. */
export function isPasswordValid(value: string): boolean {
  return failingPasswordRules(value).length === 0;
}

export const passwordSchema = z.string().superRefine((value, ctx) => {
  for (const key of failingPasswordRules(value)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `auth.password.error.${key}` });
  }
});

/** 비밀번호 찾기 — 이메일 입력 (CM-02 / POST /api/v1/auth/forgot-password). */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'auth.forgot.error.email_required')
    .email('auth.forgot.error.email_invalid'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * 비밀번호 재설정 — 새 비밀번호 입력 (CM-02 / POST /api/v1/auth/reset-password).
 * SSR 흐름에서 토큰은 /auth/confirm 가 recovery 세션으로 소비하므로 폼은 토큰을 싣지 않는다.
 */
export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'auth.reset.error.mismatch',
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * 2FA TOTP 코드 — 인증 앱 6자리 숫자 (CM-04 / ST-004).
 * 실제 검증은 서버의 speakeasy(verifyTotp)가 수행하고, 본 스키마는 입력 형식만 거른다.
 */
export const TOTP_CODE_LENGTH = 6;
export const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'auth.two_fa.error.code_format');

/**
 * 2FA 검증 입력 (CM-04 / POST /api/v1/auth/2fa/verify).
 * mode=totp 면 6자리 숫자, mode=recovery 면 복구 코드(서버에서 정규화/대조).
 * 복구 코드는 형식이 다양할 수 있어(대소문자/구분자) 비어있지 않은지만 보고, 정규화·대조는 서버가 수행.
 */
export const twoFactorVerifySchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('totp'), code: totpCodeSchema }),
  z.object({
    mode: z.literal('recovery'),
    code: z.string().trim().min(1, 'auth.two_fa.error.recovery_required'),
  }),
]);

export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;

/** 2FA 활성화 — 설정 중 인증 앱 6자리 검증 (CM-04 enable / OP-12·EM-09 보안 탭). */
export const totpEnableSchema = z.object({ code: totpCodeSchema });

export type TotpEnableInput = z.infer<typeof totpEnableSchema>;

/**
 * 2FA 비활성화 — 현재 비밀번호 재확인 + TOTP/복구 코드 (CM-04 disable).
 * 세션 탈취자가 2FA 를 임의 해제하지 못하도록 비밀번호와 2FA 인증을 모두 요구한다.
 */
export const totpDisableSchema = z.object({
  password: z.string().min(1, 'auth.two_fa.error.password_required'),
  code: z.string().trim().min(1, 'auth.two_fa.error.code_required'),
});

export type TotpDisableInput = z.infer<typeof totpDisableSchema>;
