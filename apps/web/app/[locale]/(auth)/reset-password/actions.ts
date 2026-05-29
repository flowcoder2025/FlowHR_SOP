'use server';

import { resetPasswordSchema } from '@flowhr/schemas';
import { writeAuthAudit, type AuthAuditInput } from '@/lib/auth/audit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
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
 * /auth/confirm 이 recovery 세션을 수립한 상태에서 진입한다.
 * updateUser 로 비밀번호 변경 → signOut({scope:'global'}) 로 현재 recovery 세션 포함 전 세션 무효화 → 재로그인 유도.
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
    const first = parsed.error.issues[0];
    return { status: 'error', messageKey: first?.message ?? 'auth.reset.error.invalid' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: 'error', messageKey: 'auth.reset.error.session_invalid' };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    return { status: 'error', messageKey: 'auth.reset.error.update_failed' };
  }

  const headerList = await headers();
  await safeAudit({
    action: 'auth.password_reset',
    result: 'success',
    actorId: user.id,
    ip: clientIp(headerList),
    userAgent: headerList.get('user-agent'),
  });

  // 모든 활성 세션 무효화(현재 recovery 세션 포함) — 재로그인 강제.
  await supabase.auth.signOut({ scope: 'global' });

  redirect(`/${locale}/login?reset=success`);
}
