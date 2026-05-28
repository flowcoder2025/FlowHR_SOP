import { locales } from '@flowhr/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '../../i18n/navigation';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-5xl font-bold text-primary">{t('title')}</h1>
      <p className="text-xl text-text">{t('subtitle')}</p>
      <p className="max-w-md text-text-muted">{t('description')}</p>

      <Link
        href="/login"
        className="rounded-md bg-primary px-6 py-3 font-medium text-text-on-primary transition-colors hover:bg-primary-hover"
      >
        {t('getStarted')}
      </Link>

      <nav className="mt-4 flex gap-3" aria-label="language">
        {locales.map((l) => (
          <Link
            key={l}
            href="/"
            locale={l}
            className={`rounded-md border border-border px-3 py-1 text-sm ${
              l === locale ? 'bg-surface-2 font-semibold' : 'text-text-muted hover:bg-surface'
            }`}
          >
            {l.toUpperCase()}
          </Link>
        ))}
      </nav>
    </main>
  );
}
