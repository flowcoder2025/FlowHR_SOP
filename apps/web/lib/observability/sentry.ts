import 'server-only';

/**
 * 서버 오류 보고 추상화 (ST-072 AC-4 / CM-06 §5).
 *
 * Sentry SDK(@sentry/nextjs)는 인프라 정책 §10-2 에 따라 S6(베타 직전)에 설치·연동한다.
 * 그 전까지 본 모듈은 SDK 에 의존하지 않고(미설치) 다음과 같이 동작한다:
 *
 * - DSN 미설정: 구조화 console.error 1줄(Vercel/로그 수집기 검색용) — Sentry 보고는 no-op.
 * - DSN 설정: 동일 구조화 로그 + `sentryPending: true`. SDK 설치 후 본 함수 본문의 sink 만
 *   `Sentry.captureException` 으로 교체하면 되며, 호출부(instrumentation onRequestError)는 바뀌지 않는다.
 *
 * 즉 "오류 → 보고 sink" 의 seam 을 지금 확정하고, 구체 provider 만 S6 에 꽂는다.
 */
export interface ServerErrorContext {
  /** 요청 경로 (instrumentation onRequestError 의 request.path). */
  path?: string;
  /** HTTP 메서드. */
  method?: string;
  /** Next 라우터 컨텍스트 (routerKind/routePath/routeType). */
  router?: Record<string, unknown>;
  /** error.tsx 가 표시하는 상관 id (Next 서버 digest) — 보고 로그와 화면을 잇는다. */
  digest?: string;
}

/** 환경에 Sentry DSN 이 설정되어 있는지. 서버 전용 판정(비공개 DSN 포함). */
export function isErrorReportingEnabled(): boolean {
  return (process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? null) !== null;
}

function describe(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  if (typeof error === 'string') return { name: 'NonError', message: error };
  try {
    return { name: 'NonError', message: JSON.stringify(error) };
  } catch {
    return { name: 'NonError', message: String(error) };
  }
}

/**
 * 서버 오류를 보고 sink 로 전달한다(현 sink: 구조화 console 로그).
 * 호출부는 DSN 설정 여부와 무관하게 항상 본 함수를 호출한다(보고 결정은 본 함수가 캡슐화).
 */
export function captureServerError(error: unknown, context: ServerErrorContext = {}): void {
  const { name, message, stack } = describe(error);
  console.error(
    JSON.stringify({
      level: 'error',
      kind: 'server_error',
      name,
      message,
      digest: context.digest ?? null,
      path: context.path ?? null,
      method: context.method ?? null,
      router: context.router ?? null,
      // DSN 설정 시 SDK 연동 대기(S6 에서 captureException 으로 대체)임을 표시.
      sentryPending: isErrorReportingEnabled(),
      stack,
    }),
  );
}
