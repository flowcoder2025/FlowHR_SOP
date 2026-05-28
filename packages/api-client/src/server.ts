import type { Database } from '@flowhr/types';
import { type CookieMethodsServer, createServerClient } from '@supabase/ssr';
import type { FlowHRSupabaseClient } from './client';

/**
 * 서버(Server Component / Route Handler / Middleware)용 쿠키 기반 Supabase 클라이언트.
 * 쿠키 어댑터(getAll/setAll)는 프레임워크(next/headers, NextRequest 등)에서 주입한다.
 * 인증/세션은 anon 키 + 쿠키로 처리한다.
 */
export function createServerSupabaseClient(cookies: CookieMethodsServer): FlowHRSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.',
    );
  }
  // @supabase/ssr와 @supabase/supabase-js의 SupabaseClient 제네릭 구조 차이로 직접 할당이 안 되어
  // 정식 클라이언트 타입(FlowHRSupabaseClient = SupabaseClient<Database>)으로 정규화한다.
  return createServerClient<Database, 'public'>(url, anonKey, {
    cookies,
  }) as unknown as FlowHRSupabaseClient;
}
