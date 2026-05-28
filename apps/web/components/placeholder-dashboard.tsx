import { getTranslations } from 'next-intl/server';
import { LogoutButton } from '@/components/logout-button';

/**
 * 후속 스프린트(OP-01/TA-01/EM-01)에서 실제 대시보드로 대체될 최소 인증 랜딩.
 * 로그인 핵심(WI-020)의 역할별 리다이렉트 착지점 + 세션 확인 용도.
 */
export async function PlaceholderDashboard({
  titleKey,
  role,
}: {
  titleKey: string;
  role: string | null;
}) {
  const t = await getTranslations('app');
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">{t(titleKey)}</h1>
        <LogoutButton />
      </div>
      <p className="text-text">{t('signed_in_as', { role: role ?? 'unknown' })}</p>
      <p className="rounded-md border border-border bg-surface p-4 text-sm text-text-muted">
        {t('placeholder_notice')}
      </p>
    </main>
  );
}
