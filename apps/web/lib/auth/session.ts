import 'server-only';
import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface SessionProfile {
  user: User;
  role: string | null;
  tenantId: string | null;
}

/** 현재 인증 사용자 + users 프로필(role/tenant). 미인증이면 null. */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  return { user, role: profile?.role ?? null, tenantId: profile?.tenant_id ?? null };
}
