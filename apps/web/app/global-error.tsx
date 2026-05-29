'use client';

import { useEffect } from 'react';

/**
 * 루트 error boundary (ST-072 AC-1). [locale] 레이아웃(루트 레이아웃) 자체의 렌더 오류를 잡는다.
 * 이 시점엔 NextIntlClientProvider/globals.css 가 없으므로 자체 <html>/<body> + 인라인 스타일 +
 * 이중 언어(ko 우선 / en 병기) 정적 텍스트로 자급자족한다(i18n 의존 없음).
 * 서버 오류 보고는 instrumentation onRequestError 가 담당하고 digest 로 상관된다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error.digest ?? null, error.message);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          fontFamily:
            "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif",
          color: '#111827',
        }}
      >
        <main
          style={{
            maxWidth: 480,
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
          }}
        >
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
            일시적인 서버 오류가 발생했습니다
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem' }}>
            Internal server error. Please try again in a moment.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 1rem' }}>
              ref: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              cursor: 'pointer',
              border: 'none',
              borderRadius: 8,
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#ffffff',
              backgroundColor: '#1e40af',
            }}
          >
            다시 시도 / Retry
          </button>
        </main>
      </body>
    </html>
  );
}
