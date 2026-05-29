'use server';

import { resetPasswordSchema } from '@flowhr/schemas';
import { writeAuthAudit, type AuthAuditInput } from '@/lib/auth/audit';
import { RECOVERY_MARKER_COOKIE, verifyRecoveryMarker } from '@/lib/auth/recovery';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

export type ResetState = { status: 'idle' } | { status: 'error'; messageKey: string };

/** 감사 기록은 best-effort — 실패해도 흐름을 막지 않는다 (api/auth.md §Audit). */
async function safeAudit(input: AuthAuditInput): Promise<void> {
  try {
    await writeAuthAudit(input);
  } catch (e) {
    console.error('auth audit write failed', e);
  }
}

function clientIp(headerList: Headers): string {
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return headerList.get('x-real-ip')?.trim() ?? 'unknown';
}

/**
 * 새 비밀번호 설정 (CM-02 / ST-002 AC-2·AC-3).
 * /auth/confirm 이 recovery 세션 + 재설정 마커를 수립한 상태에서만 진입한다(P1-1).
 * updateUser 로 비밀번호 변경 → signOut({scope:'global'}) 로 현재 recovery 세션 포함 전 세션 무효화 → 재로그인 유도.
 * 폼은 useTranslations('auth.reset') 네임스페이스로 해석하므로 messageKey 는 상대 키를 반환한다.
 */
export async function resetPasswordAction(
  locale: string,
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = resetPasswordSchema.safeParse({
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    // 정책 위반은 폼의 실시간 체크리스트가 이미 안내하므로 일반 메시지로, 확인 불일치만 별도 안내.
    const isMismatch = parsed.error.issues.some((i) => i.path.includes('confirmPassword'));
    return { status: 'error', messageKey: isMismatch ? 'error.mismatch' : 'error.weak_password' };
  }

  const cookieStore = await cookies();
  const marker = cookieStore.get(RECOVERY_MARKER_COOKIE)?.value;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 복구 흐름 전용 — recovery 세션 + 유효 HMAC 서명 마커(=해당 user)가 모두 있어야 한다(P1-1).
  if (!user || !verifyRecoveryMarker(marker, user.id)) {
    return { status: 'error', messageKey: 'error.session_invalid' };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (updateError) {
    return { status: 'error', messageKey: 'error.update_failed' };
  }

  // 모든 활성 세션 무효화(현재 recovery 세션 포함) — 재로그인 강제 (AC-3).
  // 실패 시 기존 세션이 잔존할 수 있으므로 감사에 반영하고 운영 로깅한다(P1-2).
  const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
  if (signOutError) {
    console.error('global signOut failed after password reset', signOutError);
  }
  // 마커 소비(1회용).
  cookieStore.delete(RECOVERY_MARKER_COOKIE);

  const headerList = await headers();
  await safeAudit({
    action: 'auth.password_reset',
    result: signOutError ? 'failed' : 'success',
    actorId: user.id,
    ip: clientIp(headerList),
    userAgent: headerList.get('user-agent'),
  });

  redirect(`/${locale}/login?reset=success`);
}
