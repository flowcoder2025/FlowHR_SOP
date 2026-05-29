import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ErrorState } from '@/components/error-state';
import { Link } from '@/i18n/navigation';
import { getActiveMaintenance } from '@/lib/maintenance/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MaintenanceCountdown } from './countdown';

// 점검 상태를 요청 시점에 조회하므로 동적 렌더 강제.
export const dynamic = 'force-dynamic';

const PRIMARY_BTN =
  'inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-text-on-primary hover:bg-primary-hover';

export default async function MaintenancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('system.error.maintenance');

  const supabase = await createSupabaseServerClient();
  const maintenance = await getActiveMaintenance(supabase);

  // 점검 비활성 — operator_super 가 직접 접근했거나 점검 종료 후. 정상 운영 안내(200).
  if (!maintenance) {
    return (
      <ErrorState
        icon="maintenance"
        tone="default"
        title={t('not_active_title')}
        description={t('not_active_desc')}
      >
        <Link href="/" prefetch={false} className={PRIMARY_BTN}>
          {t('back_home')}
        </Link>
      </ErrorState>
    );
  }

  const fmt = (iso: string | null): string | null =>
    iso
      ? new Date(iso).toLocaleString(locale, {
          timeZone: 'Asia/Seoul',
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : null;
  const start = fmt(maintenance.scheduledStart);
  const end = fmt(maintenance.scheduledEnd);

  return (
    <ErrorState icon="maintenance" tone="warning" title={t('title')} description={t('default_message')}>
      <div className="flex flex-col gap-3 text-left">
        {(start || end || maintenance.scheduledEnd) && (
          <div className="rounded-md border border-warning bg-warning-bg/40 px-4 py-3">
            {start ? (
              <p className="text-sm">
                <span className="text-text-muted">{t('windowStart')}</span>{' '}
                <span className="font-medium text-text">{start}</span>
              </p>
            ) : null}
            {end ? (
              <p className="mt-1 text-sm">
                <span className="text-text-muted">{t('windowEnd')}</span>{' '}
                <span className="font-medium text-text">{end}</span>
              </p>
            ) : null}
            {maintenance.scheduledEnd ? (
              <div className="mt-1">
                <MaintenanceCountdown endIso={maintenance.scheduledEnd} label={t('remaining')} />
              </div>
            ) : null}
          </div>
        )}

        {maintenance.message ? (
          <div className="rounded-md border border-border bg-surface px-4 py-3">
            <p className="text-xs font-semibold text-text-muted">{t('operator_notice')}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-text">{maintenance.message}</p>
          </div>
        ) : null}
      </div>
    </ErrorState>
  );
}
