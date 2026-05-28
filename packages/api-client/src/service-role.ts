import 'server-only';
import type { Database } from '@flowhr/types';
import { createClient } from '@supabase/supabase-js';
import type { FlowHRSupabaseClient } from './client';

/**
 * 서버 전용 service_role 클라이언트 — RLS를 우회한다.
 * 절대 클라이언트 번들에 포함하지 말 것 (SUPABASE_SERVICE_ROLE_KEY는 NEXT_PUBLIC_ 접두사 없음).
 * 잠금(login_attempts) / 감사 로그 등 서버 권한 작업에만 사용. 세션 비저장.
 */
export function createServiceRoleClient(): FlowHRSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.',
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
