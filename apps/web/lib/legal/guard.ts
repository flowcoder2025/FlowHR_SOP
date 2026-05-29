import 'server-only';
import { redirect } from 'next/navigation';
import { getRequiredConsents } from './queries';

/**
 * 보호 영역 진입 가드 (ST-078 AC-2, R4 — 직접 URL 진입 보정).
 * 미동의 강제 약관이 있으면 동의 화면으로 보낸다. 로그인 직후 리다이렉트와 이중 안전망.
 */
export async function enforceConsentGuard(locale: string): Promise<void> {
  const required = await getRequiredConsents(locale);
  if (required.length > 0) {
    redirect(`/${locale}/legal/${required[0]!.type}?must_accept=true`);
  }
}
