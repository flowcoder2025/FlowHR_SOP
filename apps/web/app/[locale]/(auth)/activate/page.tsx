import { Alert } from '@flowhr/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '../../../../i18n/navigation';
import { getInvitationInfo, isActivatable } from '@/lib/auth/invitations';
import { ActivateForm } from './activate-form';

// 초대 토큰(쿼리)에 따라 분기 — 정적 캐시 금지.
export const dynamic = 'force-dynamic';

export default async function ActivatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('auth.activate');

  const info = token ? await getInvitationInfo(token) : null;

  // 토큰 없음/만료/이미 사용 → 만료 안내 + 재발송 동선(관리자 문의).
  if (!token || !isActivatable(info)) {
    return (
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="text-lg font-semibold text-text">{t('expired_title')}</h1>
        </header>
        <Alert variant="danger">{t('expired')}</Alert>
        <p className="text-[13px] text-text-muted">{t('expired_hint')}</p>
        <Link
          href="/login"
          className="text-center text-sm font-medium text-accent hover:underline"
        >
          {t('back_to_login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-semibold text-text">{t('title')}</h1>
        <p className="mt-1 text-[13px] text-text-muted">{t('setup_title')}</p>
      </header>

      <dl className="rounded-md border border-border bg-surface p-4 text-[13px]">
        <div className="flex justify-between gap-3 py-1">
          <dt className="text-text-muted">{t('field_email')}</dt>
          <dd className="font-medium text-text">{info!.email}</dd>
        </div>
        {info!.companyName && (
          <div className="flex justify-between gap-3 py-1">
            <dt className="text-text-muted">{t('field_company')}</dt>
            <dd className="font-medium text-text">{info!.companyName}</dd>
          </div>
        )}
      </dl>

      <ActivateForm token={token} />
    </div>
  );
}
