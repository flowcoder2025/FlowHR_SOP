import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * 운영사 강제 2FA 가드 (ST-004 AC-3).
 * operator_* 인데 2FA 미설정이고 system_settings.require_operator_2fa(기본 true)면
 * /operator/* 진입을 막고 보안 설정으로 강제 이동시킨다. 로그인 직후 리다이렉트와 이중 안전망.
 * 약관 미동의 시에는 legal guard 가 먼저 처리하므로 본 가드는 그 이후에 호출한다.
 */
export async function enforceOperator2faGuard(locale: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return; // 미인증은 페이지 가드/미들웨어가 처리

  const { data: profile } = await supabase
    .from('users')
    .select('role, totp_enabled')
    .eq('id', user.id)
    .maybeSingle();
  const role = profile?.role ?? null;
  if (role !== 'operator_super' && role !== 'operator_staff') return;
  if (profile?.totp_enabled) return;

  const { data: settings } = await supabase
    .from('system_settings')
    .select('require_operator_2fa')
    .limit(1)
    .maybeSingle();
  if (settings?.require_operator_2fa === false) return;

  const returnUrl = encodeURIComponent(`/${locale}/operator`);
  redirect(`/${locale}/me/security?forced=2fa&return_url=${returnUrl}`);
}
