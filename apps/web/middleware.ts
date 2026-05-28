import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // api / 정적 파일 / Next 내부 경로를 제외한 모든 경로에 locale 라우팅 적용.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
