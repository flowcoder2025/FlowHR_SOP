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
