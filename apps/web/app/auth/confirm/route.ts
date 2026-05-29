import { createServerSupabaseClient } from '@flowhr/api-client/server';
import { defaultLocale } from '@flowhr/i18n';
import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

// 이메일 OTP(token_hash) 검증 콜백. 비밀번호 재설정/계정 확인 링크가 이 라우트로 들어온다.
// PKCE(code_verifier) 대신 stateless 한 token_hash 검증을 사용해 "다른 기기에서 링크 클릭"을 지원한다.
// 이 라우트는 locale prefix 가 없으므로 middleware matcher 에서 제외(/auth)되어 i18n 리다이렉트를 받지 않는다.
// 동적 라우트(쿼리/쿠키 의존) — 정적 최적화 금지.
export const dynamic = 'force-dynamic';

const VALID_TYPES: readonly EmailOtpType[] = [
  'recovery',
  'email',
  'invite',
  'signup',
  'magiclink',
  'email_change',
];

/**
 * redirect 대상 정규화 — 동일 origin 내부 경로만 허용(오픈 리다이렉트 방지).
 * 절대 URL(이메일 템플릿의 {{ .RedirectTo }})·상대 경로 모두 수용하되 외부 origin 은 폐기한다.
 */
function sanitizeNext(raw: string | null, origin: string): string {
  const fallback = `/${defaultLocale}/reset-password`;
  if (!raw) return fallback;
  try {
    const url = new URL(raw, origin);
    if (url.origin !== origin) return fallback;
    const path = url.pathname + url.search;
    if (!path.startsWith('/') || path.startsWith('//')) return fallback;
    return path;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = sanitizeNext(searchParams.get('redirect_to') ?? searchParams.get('next'), origin);

  // 성공 시 세션 쿠키를 실어 보낼 응답을 먼저 만들고, Supabase 클라이언트가 이 응답에 쿠키를 쓰게 한다.
  // (NextResponse 를 직접 반환할 때 next/headers 쿠키 스토어 변경이 누락되는 케이스를 피하는 검증된 패턴.)
  const successRes = NextResponse.redirect(new URL(next, origin));

  if (tokenHash && type && VALID_TYPES.includes(type)) {
    const supabase = createServerSupabaseClient({
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value, options } of toSet) successRes.cookies.set(name, value, options);
      },
    });
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return successRes;
  }

  // 토큰 누락/만료/무효 — 재설정 화면이 만료 상태를 안내하도록 error 플래그를 붙여 보낸다.
  const failed = new URL(next, origin);
  failed.searchParams.set('error', 'invalid_token');
  return NextResponse.redirect(failed);
}
