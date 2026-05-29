import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { enforceConsentGuard } from '@/lib/legal/guard';

/** 직원 보호 영역 — 진입 시 강제 동의 미완 약관 가드 (ST-078 AC-2). */
export default async function EmployeeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await enforceConsentGuard(locale);
  return children;
}
