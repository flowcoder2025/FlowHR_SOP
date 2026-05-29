import { Alert } from '@flowhr/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { Link } from '../../../../i18n/navigation';
import { RECOVERY_MARKER_COOKIE, verifyRecoveryMarker } from '@/lib/auth/recovery';
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

  // /auth/confirm 이 verifyOtp 로 recovery 세션 + 재설정 마커를 수립했는지 확인(P1-1).
  // 세션·마커가 없거나(일반 로그인 세션 직접 접근 차단) 토큰 검증 실패(error=invalid_token)면 만료/무효 안내.
  const cookieStore = await cookies();
  const marker = cookieStore.get(RECOVERY_MARKER_COOKIE)?.value;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const recovered = Boolean(user && verifyRecoveryMarker(marker, user.id));

  if (!recovered || error === 'invalid_token') {
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
