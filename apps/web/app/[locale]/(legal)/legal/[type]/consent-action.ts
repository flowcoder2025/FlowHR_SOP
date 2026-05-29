'use server';

import { roleToRedirectPath } from '@flowhr/api-client';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { recordConsent } from '@/lib/legal/actions';
import { getRequiredConsents } from '@/lib/legal/queries';
import { safeInternalPath } from '@/lib/navigation/safe-return-url';

export type ConsentFormState = { status: 'idle' } | { status: 'error' };

/**
 * 강제 동의 제출 — 본인 동의 기록 후 복귀. 남은 강제 동의 문서가 있으면 이어서 경유시킨다.
 * 미인증이면 로그인으로, 기록 실패면 폼에 오류를 노출(redirect 없이 상태 반환).
 */
export async function submitConsentAction(
  documentId: string,
  returnUrl: string | null,
  locale: string,
  _prev: ConsentFormState,
  formData: FormData,
): Promise<ConsentFormState> {
  // 명시 동의 체크박스를 서버에서 재확인 (폼 우회 제출로 동의 없이 기록되는 것 차단).
  if (formData.get('agree') !== 'on') return { status: 'error' };

  const result = await recordConsent(documentId, 'forced');
  if (!result.ok) {
    if (result.error === 'unauthenticated') redirect(`/${locale}/login`);
    return { status: 'error' };
  }

  const profile = await getSessionProfile();
  const role = profile?.role ?? null;
  const dest = safeInternalPath(returnUrl, locale, role) ?? `/${locale}${roleToRedirectPath(role)}`;

  const remaining = await getRequiredConsents(locale);
  if (remaining.length > 0) {
    redirect(
      `/${locale}/legal/${remaining[0]!.type}?must_accept=true&return_url=${encodeURIComponent(dest)}`,
    );
  }
  redirect(dest);
}
