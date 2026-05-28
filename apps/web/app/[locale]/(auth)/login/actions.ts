'use server';

import { canAccessPath, roleToRedirectPath } from '@flowhr/api-client';
import { loginSchema } from '@flowhr/schemas';
import { writeAuthAudit, type AuthAuditInput } from '@/lib/auth/audit';
import { checkLoginLock, clearLoginAttempts, recordLoginFailure } from '@/lib/auth/login-lock';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export type LoginState =
  | { status: 'idle' }
  | { status: 'error'; messageKey: string; remaining?: number }
  | { status: 'locked'; retryAfterSeconds: number };

/** 감사 기록은 best-effort — 실패해도 로그인 흐름을 막지 않는다 (api/auth.md §Audit). */
async function safeAudit(input: AuthAuditInput): Promise<void> {
  try {
    await writeAuthAudit(input);
  } catch (e) {
    console.error('auth audit write failed', e);
  }
}

function clientIp(headerList: Headers): string {
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return headerList.get('x-real-ip')?.trim() ?? 'unknown';
}

/**
 * 세션 만료 복귀용 return_url 검증 (09-routing.md §5).
 * 오픈 리다이렉트 방지: 내부 절대경로 + 동일 locale + 역할 접근 가능한 경로만 허용.
 */
function safeReturnUrl(
  raw: FormDataEntryValue | null,
  locale: string,
  role: string | null,
): string | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null;
  const prefix = `/${locale}`;
  if (raw !== prefix && !raw.startsWith(`${prefix}/`)) return null;
  const rest = raw.slice(prefix.length) || '/';
  if (!canAccessPath(role, rest)) return null;
  return raw;
}

export async function loginAction(
  locale: string,
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    rememberMe: formData.get('rememberMe') === 'on',
  });
  if (!parsed.success) {
    return { status: 'error', messageKey: 'error.invalid_input' };
  }
  const { email, password } = parsed.data;

  const headerList = await headers();
  const ip = clientIp(headerList);
  const userAgent = headerList.get('user-agent');

  // 1. 잠금 확인 (signIn 시도 전)
  const lock = await checkLoginLock(email, ip);
  if (lock.locked) {
    await safeAudit({ action: 'auth.locked', result: 'denied', ip, userAgent });
    return { status: 'locked', retryAfterSeconds: lock.retryAfterSeconds ?? 300 };
  }

  // 2. Supabase Auth 로그인
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    const failure = await recordLoginFailure(email, ip);
    await safeAudit({ action: 'auth.login_failed', result: 'failed', ip, userAgent });
    if (failure.locked) {
      await safeAudit({ action: 'auth.locked', result: 'denied', ip, userAgent });
      return { status: 'locked', retryAfterSeconds: failure.retryAfterSeconds ?? 300 };
    }
    return {
      status: 'error',
      messageKey: 'error.invalid_credentials',
      remaining: failure.remaining,
    };
  }

  // 3. 성공 — 시도 초기화 + 역할 조회 + 감사 + 역할별 리다이렉트
  await clearLoginAttempts(email, ip);
  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', data.user.id)
    .maybeSingle();
  await safeAudit({
    action: 'auth.login',
    result: 'success',
    actorId: data.user.id,
    actorRole: profile?.role ?? null,
    tenantId: profile?.tenant_id ?? null,
    ip,
    userAgent,
  });

  const returnTo = safeReturnUrl(formData.get('returnUrl'), locale, profile?.role ?? null);
  redirect(returnTo ?? `/${locale}${roleToRedirectPath(profile?.role)}`);
}
