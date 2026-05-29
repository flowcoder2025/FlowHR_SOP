import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { enforceOperator2faGuard } from '@/lib/auth/operator-2fa-guard';
import { enforceConsentGuard } from '@/lib/legal/guard';

/**
 * 운영사 보호 영역 — 진입 시 가드:
 *  1) 강제 동의 미완 약관 (ST-078 AC-2) — legal 우선
 *  2) 강제 2FA 미설정 (ST-004 AC-3) — 보안 설정으로 이동
 */
export default async function OperatorLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await enforceConsentGuard(locale);
  await enforceOperator2faGuard(locale);
  return children;
}
