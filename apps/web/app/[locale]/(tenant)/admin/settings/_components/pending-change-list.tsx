'use client';

import { useTranslations } from 'next-intl';
import type { PendingChangeSummary } from '@/lib/tenant-settings/queries';
import { formatKstDateTime } from './format';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-surface text-text-muted',
  applying: 'bg-info-bg text-primary',
  failed: 'bg-danger-bg text-danger',
};

/** 해당 탭의 예약/대기/실패 변경 목록 (queries envelope 의 pending[]). */
export function PendingChangeList({ items }: { items: PendingChangeSummary[] }) {
  const t = useTranslations('screens.ta-13.pending');
  if (items.length === 0) return null;

  return (
    <div className="mt-5 rounded-md border border-border bg-surface p-3.5">
      <h4 className="mb-2.5 text-[13px] font-semibold text-text">{t('title')}</h4>
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.id} className="flex flex-col gap-1 text-[12px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-text-muted">
                {t('apply_at')}: {formatKstDateTime(it.applyAt)}
              </span>
              <span className="flex items-center gap-2">
                {it.attemptCount > 0 && (
                  <span className="text-text-muted">{t('attempt', { count: it.attemptCount })}</span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    STATUS_STYLE[it.status] ?? STATUS_STYLE.pending
                  }`}
                >
                  {t(`status.${it.status}` as 'status.pending')}
                </span>
              </span>
            </div>
            {it.errorMessage && (
              <p className="break-all rounded bg-danger-bg px-2 py-1 text-[11px] text-danger">
                {it.errorMessage}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
