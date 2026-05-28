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
