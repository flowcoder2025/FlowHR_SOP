import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { getTotpRecord } from '@/lib/auth/two-factor-store';
import { TwoFactorPanel } from './two-factor-panel';

// 세션 + 2FA 상태 의존 — 정적 캐시 금지.
export const dynamic = 'force-dynamic';

function safeReturn(raw: unknown, locale: string): string {
  if (typeof raw === 'string' && raw.startsWith(`/${locale}/`) && !raw.startsWith('//')) return raw;
  return `/${locale}/me`;
}

export default async function SecurityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ forced?: string; return_url?: string }>;
}) {
  const { locale } = await params;
  const { forced, return_url } = await searchParams;
  setRequestLocale(locale);

  const session = await getSessionProfile();
  if (!session) redirect(`/${locale}/login`);

  const record = await getTotpRecord(session.user.id);
  const enabled = record?.totpEnabled ?? false;
  const isOperator = session.role === 'operator_super' || session.role === 'operator_staff';
  const continueHref = safeReturn(return_url, locale);
  const showForcedBanner = forced === '2fa' && !enabled;

  const t = await getTranslations('me.security');

  return (
    <main className="mx-auto flex max-w-[560px] flex-col gap-6 p-4 py-8">
      <header>
        <h1 className="text-xl font-bold text-text">{t('title')}</h1>
        <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>
      </header>

      {showForcedBanner && (
        <div className="rounded-md border border-warning bg-warning-bg p-3 text-[13px] text-warning">
          {t('forced_banner')}
        </div>
      )}

      <section className="rounded-lg border border-border bg-bg p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">{t('two_fa_heading')}</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              enabled ? 'bg-success-bg text-success' : 'bg-surface text-text-muted'
            }`}
          >
            {enabled ? t('status_on') : t('status_off')}
          </span>
        </div>

        <TwoFactorPanel
          initialEnabled={enabled}
          isOperator={isOperator}
          continueHref={continueHref}
        />
      </section>
    </main>
  );
}
