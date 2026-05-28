import type { Database } from '@flowhr/types';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';

export type FlowHRSupabaseClient = SupabaseClient<Database>;

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 * 서버/SSR 쿠키 기반 클라이언트(@supabase/ssr)는 WI-020 인증 작업에서 추가.
 */
export function createBrowserSupabaseClient(): FlowHRSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.',
    );
  }
  return createClient<Database>(url, anonKey);
}
