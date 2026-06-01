import { canAccessPath, roleToRedirectPath } from '@flowhr/api-client';
import { Alert } from '@flowhr/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { getTenantSettings } from '@/lib/tenant-settings/queries';
import { resolveInitialTab } from '@/lib/tenant-settings/tabs';
import { SettingsClient } from './settings-client';

// 세션 + 테넌트 설정(RLS) 의존 — 요청 시점 렌더 강제.
export const dynamic = 'force-dynamic';

/**
 * TA-13 회사 설정 (ST-053, WI-033). 라우트 `/{locale}/admin/settings`.
 * 인증 + tenant 역할 가드 후 getTenantSettings(9탭 envelope)를 셸에 전달.
 * (tenant) 레이아웃이 강제 동의 가드를 이미 적용한다.
 */
export default async function CompanySettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { locale } = await params;
  const { tab } = await searchParams;
  setRequestLocale(locale);

  const session = await getSessionProfile();
  if (!session) redirect(`/${locale}/login`);
  if (!canAccessPath(session.role, '/admin')) {
    redirect(`/${locale}${roleToRedirectPath(session.role)}`);
  }

  const t = await getTranslations('screens.ta-13');
  const settings = await getTenantSettings();

  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-6 p-4 py-6">
      <header>
        <h1 className="text-xl font-bold text-text">{t('title')}</h1>
        <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>
      </header>

      {settings.ok ? (
        <SettingsClient
          result={settings.result}
          initialTab={resolveInitialTab(Array.isArray(tab) ? tab[0] : tab)}
        />
      ) : (
        <Alert variant="danger">{t('fetch_failed')}</Alert>
      )}
    </main>
  );
}
