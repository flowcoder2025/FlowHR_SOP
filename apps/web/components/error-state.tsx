import type { ReactNode } from 'react';

/**
 * CM-06 오류/점검 공용 표현 컴포넌트 (디자인 시스템 .auth-hero 패턴).
 * 디렉티브 없는 순수 표현 컴포넌트라 서버(not-found/maintenance)·클라이언트(error.tsx) 양쪽에서 사용한다.
 * 아이콘은 인라인 SVG(외부 sprite/패키지 비의존 — file:// 호환 + 서버·클라이언트 동일 렌더).
 */
export type ErrorIcon = 'not-found' | 'server' | 'maintenance' | 'offline';
export type ErrorTone = 'default' | 'danger' | 'warning';

const TONE_RING: Record<ErrorTone, string> = {
  default: 'border-border bg-surface-2 text-text-muted',
  danger: 'border-danger bg-danger-bg text-danger',
  warning: 'border-warning bg-warning-bg text-warning',
};

function Glyph({ icon }: { icon: ErrorIcon }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (icon) {
    case 'not-found':
      // 돋보기 + 물음표 느낌의 검색 실패
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="11" />
          <line x1="11" y1="14" x2="11" y2="14" />
        </svg>
      );
    case 'server':
      // 경고 삼각형 (500)
      return (
        <svg {...common} aria-hidden="true">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12" y2="17" />
        </svg>
      );
    case 'maintenance':
      // 렌치 (점검)
      return (
        <svg {...common} aria-hidden="true">
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5Z" />
        </svg>
      );
    case 'offline':
      // 와이파이 슬래시 (네트워크)
      return (
        <svg {...common} aria-hidden="true">
          <line x1="2" y1="2" x2="22" y2="22" />
          <path d="M8.5 16.5a5 5 0 0 1 7 0" />
          <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
          <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
          <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
          <line x1="12" y1="20" x2="12" y2="20" />
        </svg>
      );
  }
}

/**
 * 전체 화면 오류/점검 카드. 760px 와이드 카드(CM-06 분석 §3 .auth-card-wide 정합).
 */
export function ErrorState({
  icon,
  tone = 'default',
  title,
  description,
  children,
}: {
  icon: ErrorIcon;
  tone?: ErrorTone;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-xl rounded-lg border border-border bg-bg p-8 text-center shadow-sm">
        <div
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border ${TONE_RING[tone]}`}
        >
          <Glyph icon={icon} />
        </div>
        <h1 className="text-xl font-semibold text-text">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p> : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </main>
  );
}
