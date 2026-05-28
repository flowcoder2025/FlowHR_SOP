import { locales } from '@flowhr/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Link } from '../../../i18n/navigation';

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-[440px]">
          <div className="mb-6 text-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              FlowHR
            </Link>
            <p className="mt-1 text-sm text-text-muted">{t('brand_subtitle')}</p>
          </div>

          <div className="rounded-lg border border-border bg-bg p-6 shadow-sm">{children}</div>

          <nav className="mt-4 flex justify-center gap-3 text-sm" aria-label="language">
            {locales.map((l) => (
              <Link
                key={l}
                href="/login"
                locale={l}
                className={
                  l === locale ? 'font-semibold text-text' : 'text-text-muted hover:text-text'
                }
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-text-subtle">
        © 2026 FlowHR ·{' '}
        <Link href="/legal/terms" prefetch={false} className="hover:underline">
          {t('footer.terms')}
        </Link>{' '}
        ·{' '}
        <Link href="/legal/privacy" prefetch={false} className="hover:underline">
          {t('footer.privacy')}
        </Link>
      </footer>
    </div>
  );
}
