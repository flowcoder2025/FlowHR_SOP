import { isLocale } from '@flowhr/i18n';
import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { refreshSession, type CookieToSet } from './lib/supabase/middleware';

const handleI18n = createMiddleware(routing);

/** 인증 필수 영역 (locale prefix 제거 기준). 역할 가드는 각 영역 페이지에서 수행. */
const PROTECTED_PREFIXES = ['/operator', '/admin', '/me'];

function splitLocale(pathname: string): { locale: string; rest: string } {
  const segments = pathname.split('/');
  if (segments[1] && isLocale(segments[1])) {
    const rest = '/' + segments.slice(2).join('/');
    return { locale: segments[1], rest: rest === '/' ? '/' : rest.replace(/\/$/, '') };
  }
  return { locale: routing.defaultLocale, rest: pathname };
}

function applyCookies(response: NextResponse, cookies: CookieToSet[]): NextResponse {
  for (const c of cookies) response.cookies.set(c.name, c.value, c.options);
  return response;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { user, cookiesToSet } = await refreshSession(request);

  const { locale, rest } = splitLocale(request.nextUrl.pathname);
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => rest === p || rest.startsWith(`${p}/`),
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.search = '';
    url.searchParams.set('return_url', request.nextUrl.pathname);
    return applyCookies(NextResponse.redirect(url), cookiesToSet);
  }

  return applyCookies(handleI18n(request), cookiesToSet);
}

export const config = {
  // api / 정적 파일 / Next 내부 경로를 제외한 모든 경로에 적용.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
