import { roleToRedirectPath } from '@flowhr/api-client';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';

// 세션 쿠키에 따라 분기하므로 요청 시점 렌더 강제 (정적 캐시 금지).
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ return_url?: string }>;
}) {
  const { locale } = await params;
  const { return_url: returnUrl } = await searchParams;
  setRequestLocale(locale);

  // 이미 인증된 사용자는 역할별 대시보드로 이동 (09-routing.md §3).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    redirect(`/${locale}${roleToRedirectPath(profile?.role)}`);
  }

  const t = await getTranslations('auth.login');
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold text-text">{t('title')}</h1>
        <p className="mt-1 text-[13px] text-text-muted">{t('subtitle')}</p>
      </header>
      <LoginForm returnUrl={returnUrl} />
    </div>
  );
}
