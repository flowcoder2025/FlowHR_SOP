'use server';

import { twoFactorVerifySchema } from '@flowhr/schemas';
import { writeAuthAudit, type AuthAuditInput } from '@/lib/auth/audit';
import { checkLoginLock, clearLoginAttempts, recordLoginFailure } from '@/lib/auth/login-lock';
import { verifyAndConsumeRecoveryCode } from '@/lib/auth/recovery-codes';
import { verifyTotp } from '@/lib/auth/totp';
import { CHALLENGE_COOKIE, decryptTotpSecret, openChallenge } from '@/lib/auth/two-factor';
import { consumeRecoveryHash, getTotpRecord } from '@/lib/auth/two-factor-store';
import { getRequiredConsents } from '@/lib/legal/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

export type TwoFactorState =
  | { status: 'idle' }
  | { status: 'error'; messageKey: string; remaining?: number };

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
 * 2FA 검증 (CM-04 / POST /api/v1/auth/2fa/verify).
 * challenge 쿠키(봉인된 세션 토큰)를 읽어 OTP/복구 코드를 검증하고, 통과 시에만 실제 세션을 수립한다.
 * 잠금은 로그인과 동일한 (email, ip) 카운터를 재사용한다(비번 성공 시 초기화 → OTP 실패부터 5회 재누적).
 * 폼은 useTranslations('auth.two_fa') 네임스페이스로 해석하므로 messageKey 는 상대 키를 반환한다.
 */
export async function verifyTwoFactorAction(
  locale: string,
  _prev: TwoFactorState,
  formData: FormData,
): Promise<TwoFactorState> {
  const cookieStore = await cookies();
  const challenge = openChallenge(cookieStore.get(CHALLENGE_COOKIE)?.value);
  // 챌린지 없음/만료 — 로그인부터 다시 시작.
  if (!challenge) {
    cookieStore.delete(CHALLENGE_COOKIE);
    redirect(`/${locale}/login?error=2fa_expired`);
  }

  const headerList = await headers();
  const ip = clientIp(headerList);
  const userAgent = headerList.get('user-agent');

  // OTP 잠금 확인(비번 성공 후 누적된 OTP 실패 기준).
  const lock = await checkLoginLock(challenge.email, ip);
  if (lock.locked) {
    cookieStore.delete(CHALLENGE_COOKIE);
    await safeAudit({ action: 'auth.locked', result: 'denied', actorId: challenge.userId, ip, userAgent });
    redirect(`/${locale}/login?error=locked`);
  }

  const parsed = twoFactorVerifySchema.safeParse({
    mode: formData.get('mode') === 'recovery' ? 'recovery' : 'totp',
    code: formData.get('code'),
  });
  if (!parsed.success) {
    return { status: 'error', messageKey: 'error.code_format' };
  }

  const record = await getTotpRecord(challenge.userId);
  if (!record || !record.totpEnabled || !record.secretEncrypted) {
    // 2FA 가 꺼졌거나 비밀이 없으면 챌린지는 무효 — 로그인부터.
    cookieStore.delete(CHALLENGE_COOKIE);
    redirect(`/${locale}/login?error=2fa_expired`);
  }

  let verified = false;
  let viaRecovery = false;
  if (parsed.data.mode === 'recovery') {
    const result = verifyAndConsumeRecoveryCode(record.recoveryHashes, parsed.data.code);
    if (result.matched && result.matchedHash) {
      // 원자적 소비 — 동일 코드 동시 제출은 단 한 번만 성공한다(CAS).
      const consumed = await consumeRecoveryHash(
        challenge.userId,
        result.matchedHash,
        result.remaining,
      );
      if (consumed) {
        verified = true;
        viaRecovery = true;
      }
    }
  } else {
    let secret: string;
    try {
      secret = decryptTotpSecret(record.secretEncrypted);
    } catch {
      // 복호화 실패(키 회전/손상) — fail-closed.
      return { status: 'error', messageKey: 'error.invalid' };
    }
    verified = verifyTotp(secret, parsed.data.code);
  }

  if (!verified) {
    const failure = await recordLoginFailure(challenge.email, ip);
    await safeAudit({ action: 'auth.2fa_failed', result: 'failed', actorId: challenge.userId, ip, userAgent });
    if (failure.locked) {
      cookieStore.delete(CHALLENGE_COOKIE);
      await safeAudit({ action: 'auth.locked', result: 'denied', actorId: challenge.userId, ip, userAgent });
      redirect(`/${locale}/login?error=locked`);
    }
    return { status: 'error', messageKey: 'error.invalid', remaining: failure.remaining };
  }

  // 검증 통과 — 봉인된 토큰으로 실제 세션 수립 + 챌린지 소비(단일사용) + 잠금 초기화.
  const supabase = await createSupabaseServerClient();
  const { error: setError } = await supabase.auth.setSession({
    access_token: challenge.accessToken,
    refresh_token: challenge.refreshToken,
  });
  cookieStore.delete(CHALLENGE_COOKIE);
  if (setError) {
    // 봉인 토큰이 그새 만료/무효(드묾) — 재로그인.
    redirect(`/${locale}/login?error=2fa_expired`);
  }
  await clearLoginAttempts(challenge.email, ip);
  await safeAudit({ action: 'auth.2fa_verified', result: 'success', actorId: challenge.userId, ip, userAgent });
  if (viaRecovery) {
    await safeAudit({
      action: 'auth.recovery_code_used',
      result: 'success',
      actorId: challenge.userId,
      ip,
      userAgent,
    });
  }

  // 약관 강제 동의 가드 재적용 (로그인 직후와 동일, ST-078 AC-2).
  const required = await getRequiredConsents(locale);
  if (required.length > 0) {
    redirect(
      `/${locale}/legal/${required[0]!.type}?must_accept=true&return_url=${encodeURIComponent(challenge.returnTo)}`,
    );
  }
  redirect(challenge.returnTo);
}
