import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ForgotForm } from './forgot-form';

// 세션/요청에 따라 분기하므로 정적 캐시 금지.
export const dynamic = 'force-dynamic';

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth.forgot');

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold text-text">{t('title')}</h1>
        <p className="mt-1 text-[13px] text-text-muted">{t('subtitle')}</p>
      </header>
      <ForgotForm />
    </div>
  );
}
