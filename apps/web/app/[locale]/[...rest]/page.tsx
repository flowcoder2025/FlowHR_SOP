import { notFound } from 'next/navigation';

/**
 * locale 하위 미매칭 경로 catch-all (next-intl 권장 패턴).
 * 실제 라우트(login/legal/me/maintenance 등)가 우선 매칭되고, 어디에도 없는 경로만 여기로 떨어져
 * notFound() → `[locale]/not-found.tsx`(커스텀 CM-06 404, 응답 404)로 렌더된다.
 */
export default function CatchAllNotFound(): never {
  notFound();
}
