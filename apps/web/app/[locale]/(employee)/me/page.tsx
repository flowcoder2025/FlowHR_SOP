import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { PlaceholderDashboard } from '@/components/placeholder-dashboard';
import { getSessionProfile } from '@/lib/auth/session';

// 인증 세션 기반 — 요청 시점 렌더 강제.
export const dynamic = 'force-dynamic';

export default async function MyDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // /me 는 모든 인증 사용자(본인 화면) 접근 가능 — 역할 가드 없음 (09-routing.md §8).
  const session = await getSessionProfile();
  if (!session) redirect(`/${locale}/login`);

  return <PlaceholderDashboard titleKey="dashboard.employee" role={session.role} />;
}
