import { createServerSupabaseClient } from '@flowhr/api-client/server';
import type { FlowHRSupabaseClient } from '@flowhr/api-client';
import type { User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

/**
 * 미들웨어용 Supabase 세션 갱신.
 * request.cookies를 갱신하고, 응답에 실어야 할 쿠키 목록 + 재사용 가능한 client 를 함께 반환한다.
 * getUser()는 Supabase Auth 서버에 토큰을 검증/갱신한다(보안 권장 — getSession 대신).
 * 반환한 supabase 는 동일 요청에서 점검 상태/역할 조회 등 추가 read 에 재사용한다(client 중복 생성 방지).
 */
export async function refreshSession(
  request: NextRequest,
): Promise<{ user: User | null; cookiesToSet: CookieToSet[]; supabase: FlowHRSupabaseClient }> {
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
  return { user, cookiesToSet, supabase };
}
