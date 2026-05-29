'use server';

import { roleToRedirectPath } from '@flowhr/api-client';
import { loginSchema } from '@flowhr/schemas';
import { writeAuthAudit, type AuthAuditInput } from '@/lib/auth/audit';
import { checkLoginLock, clearLoginAttempts, recordLoginFailure } from '@/lib/auth/login-lock';
import {
  CHALLENGE_COOKIE,
  challengeCookieOptions,
  sealChallenge,
} from '@/lib/auth/two-factor';
import { getRequiredConsents } from '@/lib/legal/queries';
import { safeInternalPath } from '@/lib/navigation/safe-return-url';
import { createIsolatedSupabaseClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';
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

function isOperatorRole(role: string | null): boolean {
  return role === 'operator_super' || role === 'operator_staff';
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

  // 2. 비밀번호 검증 — 격리 클라이언트로 세션 쿠키를 발급하지 않고 토큰만 얻는다.
  //    2FA 활성 사용자는 OTP 통과 전까지 세션이 수립되면 안 되므로(쿠키 미발급), 분기 후 토큰을 봉인/복원한다.
  const isolated = createIsolatedSupabaseClient();
  const { data, error } = await isolated.auth.signInWithPassword({ email, password });

  if (error || !data.user || !data.session) {
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

  // 3. 비밀번호 성공 — 잠금 카운트 초기화(이후 OTP 실패부터 재누적) + 프로필 조회(RLS self-read)
  await clearLoginAttempts(email, ip);
  const userId = data.user.id;
  const { data: profile } = await isolated
    .from('users')
    .select('role, tenant_id, totp_enabled')
    .eq('id', userId)
    .maybeSingle();
  const role = profile?.role ?? null;
  const tenantId = profile?.tenant_id ?? null;

  const rawReturn = formData.get('returnUrl');
  const returnTo =
    safeInternalPath(typeof rawReturn === 'string' ? rawReturn : null, locale, role) ??
    `/${locale}${roleToRedirectPath(role)}`;

  // 4. 2FA 활성 — 세션 토큰을 봉인해 challenge 쿠키로 전달하고 OTP 화면으로 보낸다(세션 미수립).
  if (profile?.totp_enabled) {
    const cookieStore = await cookies();
    cookieStore.set(
      CHALLENGE_COOKIE,
      sealChallenge({
        userId,
        email: data.user.email ?? email,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        returnTo,
      }),
      challengeCookieOptions(),
    );
    redirect(`/${locale}/two-factor`);
  }

  // 5. 2FA 비활성 — 쿠키 세션 수립 + 감사 + 약관/운영사 강제 2FA 가드 적용 후 리다이렉트
  const supabase = await createSupabaseServerClient();
  const { error: setError } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
  if (setError) {
    return { status: 'error', messageKey: 'error.invalid_credentials' };
  }
  await safeAudit({
    action: 'auth.login',
    result: 'success',
    actorId: userId,
    actorRole: role,
    tenantId,
    ip,
    userAgent,
  });

  // 강제 동의 필요 약관 우선 (ST-078 AC-2) — 미동의 시 동의 화면을 먼저 경유.
  const required = await getRequiredConsents(locale);
  if (required.length > 0) {
    redirect(
      `/${locale}/legal/${required[0]!.type}?must_accept=true&return_url=${encodeURIComponent(returnTo)}`,
    );
  }

  // 운영사 강제 2FA (ST-004 AC-3) — 미설정 operator 는 보안 설정으로 강제 이동.
  if (isOperatorRole(role)) {
    const { data: settings } = await isolated
      .from('system_settings')
      .select('require_operator_2fa')
      .limit(1)
      .maybeSingle();
    if (settings?.require_operator_2fa !== false) {
      const operatorReturn = `/${locale}${roleToRedirectPath(role)}`;
      redirect(
        `/${locale}/me/security?forced=2fa&return_url=${encodeURIComponent(operatorReturn)}`,
      );
    }
  }

  redirect(returnTo);
}
