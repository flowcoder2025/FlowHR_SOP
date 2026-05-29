import { Alert } from '@flowhr/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '../../../../i18n/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ResetForm } from './reset-form';

// recovery 세션 쿠키에 따라 분기하므로 정적 캐시 금지.
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('auth.reset');

  // /auth/confirm 이 verifyOtp 로 recovery 세션을 수립했는지 확인.
  // 세션이 없거나 토큰 검증이 실패(error=invalid_token)면 만료/무효 안내를 보여준다.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || error === 'invalid_token') {
    return (
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="text-lg font-semibold text-text">{t('invalid_title')}</h1>
        </header>
        <Alert variant="danger">{t('invalid_desc')}</Alert>
        <Link
          href="/forgot-password"
          className="text-center text-sm font-medium text-accent hover:underline"
        >
          {t('request_new')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold text-text">{t('title')}</h1>
        <p className="mt-1 text-[13px] text-text-muted">{t('subtitle')}</p>
      </header>
      <ResetForm />
    </div>
  );
}
