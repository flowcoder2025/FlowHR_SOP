'use server';

import { roleToRedirectPath } from '@flowhr/api-client';
import { activateSchema } from '@flowhr/schemas';
import { writeAuthAudit, type AuthAuditInput } from '@/lib/auth/audit';
import { activateAccount } from '@/lib/auth/invitations';
import { recordConsent } from '@/lib/legal/actions';
import { getRequiredConsents } from '@/lib/legal/queries';
import { createIsolatedSupabaseClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export type ActivateState = { status: 'idle' } | { status: 'error'; messageKey: string };

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

function isOperatorRole(role: string): boolean {
  return role === 'operator_super' || role === 'operator_staff';
}

/**
 * 계정 활성화 (CM-03 / ST-003 — POST /auth/activate).
 * 토큰은 URL 쿼리에서 추출해 서버 액션 인자로 바인딩한다(폼에 싣지 않음).
 * 비밀번호 설정 → auth 계정 생성 + 초대 원자 수락(activateAccount) → 세션 수립 →
 * 필수 약관 동의 기록(source='activate') → 운영사 강제 2FA / 역할 대시보드 리다이렉트.
 * 폼은 useTranslations('auth.activate') 네임스페이스로 해석 → messageKey 는 상대 키.
 */
export async function activateAction(
  locale: string,
  token: string,
  _prev: ActivateState,
  formData: FormData,
): Promise<ActivateState> {
  const parsed = activateSchema.safeParse({
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
    agree: formData.get('agree') === 'on',
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const isMismatch = issue?.path.includes('confirmPassword');
    const isAgree = issue?.path.includes('agree');
    return {
      status: 'error',
      messageKey: isMismatch ? 'error.mismatch' : isAgree ? 'error.agree_required' : 'error.weak_password',
    };
  }

  // 1) 계정 생성 + 초대 원자 수락(실패 시 보상 삭제는 activateAccount 내부).
  const result = await activateAccount(token, parsed.data.newPassword);
  if (!result.ok) {
    return {
      status: 'error',
      messageKey: result.error === 'email_taken' ? 'error.email_taken' : 'error.invalid',
    };
  }
  const { userId, email, targetRole, operatorFlag } = result.account;

  // 2) 세션 수립 — 격리 클라이언트로 토큰 획득 후 쿠키 클라이언트 setSession(로그인 흐름과 동일).
  const isolated = createIsolatedSupabaseClient();
  const signIn = await isolated.auth.signInWithPassword({ email, password: parsed.data.newPassword });
  const headerList = await headers();
  if (signIn.error || !signIn.data.session) {
    // 계정은 생성됐으나 세션 수립 실패(드묾) — 로그인 화면으로 안내.
    await safeAudit({
      action: 'user.activated',
      result: 'success',
      actorId: userId,
      actorRole: targetRole,
      ip: clientIp(headerList),
      userAgent: headerList.get('user-agent'),
    });
    redirect(`/${locale}/login`);
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.setSession({
    access_token: signIn.data.session.access_token,
    refresh_token: signIn.data.session.refresh_token,
  });

  // 3) 필수 약관 동의 기록(setSession 이후 — recordConsent 는 세션 의존). source='activate'.
  const required = await getRequiredConsents(locale);
  for (const doc of required) {
    await recordConsent(doc.documentId, 'activate');
  }

  await safeAudit({
    action: 'user.activated',
    result: 'success',
    actorId: userId,
    actorRole: targetRole,
    ip: clientIp(headerList),
    userAgent: headerList.get('user-agent'),
  });

  // 4) 운영사는 강제 2FA(/me/security), 그 외는 역할 대시보드. 2FA enable 은 ST-004 흐름 재사용.
  if (operatorFlag || isOperatorRole(targetRole)) {
    const operatorReturn = `/${locale}${roleToRedirectPath(targetRole)}`;
    redirect(`/${locale}/me/security?forced=2fa&return_url=${encodeURIComponent(operatorReturn)}`);
  }
  redirect(`/${locale}${roleToRedirectPath(targetRole)}`);
}
