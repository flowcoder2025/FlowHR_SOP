'use client';

import { Alert, Button } from '@flowhr/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { changeTenantStatus } from '@/lib/operator/tenant-list/actions';
import {
  type ManualStatusTarget,
  type TenantStatus,
  allowedStatusTargets,
} from '@/lib/operator/tenant-list/list';

/**
 * 테넌트 상태 변경 모달 (ST-009, operator_super 전용). WI-037.
 * 현재 status 에서 허용된 전이 target 만 노출. reason 필수. 성공 시 router.refresh().
 */
export function StatusChangeDialog({
  tenant,
  onClose,
}: {
  tenant: { id: string; name: string; dbStatus: TenantStatus };
  onClose: () => void;
}) {
  const t = useTranslations('screens.op-02');
  const router = useRouter();
  const titleId = useId();
  const targets = allowedStatusTargets(tenant.dbStatus);
  const [target, setTarget] = useState<ManualStatusTarget | ''>(targets[0] ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = target !== '' && reason.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (target === '' || reason.trim().length === 0) return;
    setSubmitting(true);
    setError(null);
    const res = await changeTenantStatus({ tenantId: tenant.id, targetStatus: target, reason: reason.trim() });
    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      setSubmitting(false);
      setError(t(`status_change.error.${res.error}`));
    }
  }

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-bg p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-base font-bold text-text">
          {t('status_change.title')}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {t('status_change.subtitle', { name: tenant.name })}
        </p>

        {targets.length === 0 ? (
          <Alert variant="warning" className="mt-4">
            {t('status_change.no_targets')}
          </Alert>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">
                {t('status_change.target_label')}
              </label>
              <div className="flex flex-wrap gap-2">
                {targets.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={target === opt}
                    onClick={() => setTarget(opt)}
                    className={`inline-flex h-8 cursor-pointer items-center rounded-md border px-3 text-sm ${
                      target === opt
                        ? 'border-accent bg-accent-light font-semibold text-primary'
                        : 'border-border bg-bg text-text hover:bg-surface-2'
                    }`}
                  >
                    {t(`status.${opt}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor={`${titleId}-reason`} className="mb-1 block text-sm font-medium text-text">
                {t('status_change.reason_label')}
              </label>
              <textarea
                id={`${titleId}-reason`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text"
                placeholder={t('status_change.reason_placeholder')}
              />
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            {t('status_change.cancel')}
          </Button>
          {targets.length > 0 && (
            <Button type="button" variant="primary" disabled={!canSubmit} onClick={() => void handleSubmit()}>
              {submitting ? t('status_change.submitting') : t('status_change.submit')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
