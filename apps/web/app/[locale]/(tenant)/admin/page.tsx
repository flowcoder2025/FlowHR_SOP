import { canAccessPath, roleToRedirectPath } from '@flowhr/api-client';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { PlaceholderDashboard } from '@/components/placeholder-dashboard';
import { getSessionProfile } from '@/lib/auth/session';

// 인증 세션 기반 — 요청 시점 렌더 강제.
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSessionProfile();
  if (!session) redirect(`/${locale}/login`);
  if (!canAccessPath(session.role, '/admin')) {
    redirect(`/${locale}${roleToRedirectPath(session.role)}`);
  }

  return <PlaceholderDashboard titleKey="dashboard.admin" role={session.role} />;
}
