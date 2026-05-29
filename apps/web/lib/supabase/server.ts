import { createServerSupabaseClient } from '@flowhr/api-client/server';
import { cookies } from 'next/headers';

/** Server Component / Server Action 용 Supabase 클라이언트 (next/headers 쿠키 연결). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll: (toSet) => {
      try {
        for (const { name, value, options } of toSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Server Component에서는 쿠키 set이 차단됨 — 미들웨어 updateSession이 세션 갱신을 담당.
      }
    },
  });
}

/**
 * 쿠키를 읽지도 쓰지도 않는 격리(isolated) 서버 클라이언트 (no-op 쿠키 어댑터).
 * 2FA 활성 사용자의 1단계(비밀번호) 검증 시 세션 쿠키를 발급하지 않고 세션 토큰만 얻기 위해 사용한다.
 * signInWithPassword 성공 후 in-memory 세션으로 본인 row(RLS self-read) 조회까지 가능하다(persistSession=false).
 */
export function createIsolatedSupabaseClient() {
  return createServerSupabaseClient({
    getAll: () => [],
    setAll: () => {},
  });
}
