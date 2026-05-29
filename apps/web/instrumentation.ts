import { captureServerError } from '@/lib/observability/sentry';

/** instrumentation onRequestError 의 요청 정보(Next 15). */
interface RequestInfo {
  path: string;
  method: string;
  headers: Record<string, string>;
}

/** instrumentation onRequestError 의 라우터 컨텍스트(Next 15). */
interface ErrorContext {
  routerKind: string;
  routePath: string;
  routeType: string;
}

/**
 * Next.js 서버 오류 보고 훅 (Next 15 안정 API).
 * 모든 서버 측 미처리 오류(App Router 렌더/route handler/server action)를 관측 sink 로 전달한다(ST-072 AC-4).
 * Sentry SDK 는 S6 에서 본 경로(captureServerError)에 연결한다.
 */
export function onRequestError(error: unknown, request: RequestInfo, context: ErrorContext): void {
  captureServerError(error, {
    path: request.path,
    method: request.method,
    router: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
  });
}
