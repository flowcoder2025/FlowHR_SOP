'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { ErrorState } from '@/components/error-state';

/**
 * CM-06 500 error boundary (ST-072 AC-1/AC-4). [locale] 서브트리 렌더 오류를 잡는다.
 * 서버 오류는 instrumentation onRequestError 가 보고하고 `error.digest`(server digest)로 상관된다.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('system.error.internal');
  // NEXT_PUBLIC_SENTRY_DSN 은 클라이언트에서 안전하게 읽힌다(미설정 시 보고 안내 숨김).
  const reportingEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

  useEffect(() => {
    // 클라이언트 측 렌더 오류도 동일 콘솔 sink 로 남겨 digest 와 상관 가능하게 한다.
    console.error('[client-error]', error.digest ?? null, error.message);
  }, [error]);

  return (
    <ErrorState icon="server" tone="danger" title={t('title')} description={t('description')}>
      <div className="flex flex-col items-center gap-4">
        {reportingEnabled ? <p className="text-xs text-text-subtle">{t('sentry')}</p> : null}
        {error.digest ? (
          <p className="font-mono text-xs text-text-subtle">
            {t('request_id')}: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-text-on-primary hover:bg-primary-hover"
        >
          {t('retry')}
        </button>
      </div>
    </ErrorState>
  );
}
