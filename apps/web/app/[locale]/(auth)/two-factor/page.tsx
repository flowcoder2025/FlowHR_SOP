import { getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CHALLENGE_COOKIE, openChallenge } from '@/lib/auth/two-factor';
import { TwoFactorForm } from './two-factor-form';

// challenge 쿠키 의존 — 정적 캐시 금지.
export const dynamic = 'force-dynamic';

export default async function TwoFactorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 1단계(비밀번호) 통과로 발급된 challenge 가 없거나 만료면 로그인부터 다시.
  const cookieStore = await cookies();
  const challenge = openChallenge(cookieStore.get(CHALLENGE_COOKIE)?.value);
  if (!challenge) redirect(`/${locale}/login`);

  const t = await getTranslations('auth.two_fa');

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold text-text">{t('title')}</h1>
        <p className="mt-1 text-[13px] text-text-muted">{t('subtitle')}</p>
      </header>
      <TwoFactorForm />
    </div>
  );
}
