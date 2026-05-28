import { createServerSupabaseClient } from '@flowhr/api-client/server';
import type { User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

/**
 * 미들웨어용 Supabase 세션 갱신.
 * request.cookies를 갱신하고, 응답에 실어야 할 쿠키 목록을 함께 반환한다.
 * getUser()는 Supabase Auth 서버에 토큰을 검증/갱신한다(보안 권장 — getSession 대신).
 */
export async function refreshSession(
  request: NextRequest,
): Promise<{ user: User | null; cookiesToSet: CookieToSet[] }> {
  const cookiesToSet: CookieToSet[] = [];
  const supabase = createServerSupabaseClient({
    getAll: () => request.cookies.getAll(),
    setAll: (toSet) => {
      for (const c of toSet) {
        request.cookies.set(c.name, c.value);
        cookiesToSet.push({ name: c.name, value: c.value, options: c.options });
      }
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, cookiesToSet };
}
