'use server';

import { forgotPasswordSchema } from '@flowhr/schemas';
import { writeAuthAudit, type AuthAuditInput } from '@/lib/auth/audit';
import { obscureTiming } from '@/lib/auth/timing';
import { resolveOrigin } from '@/lib/http/origin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export type ForgotState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'error'; messageKey: string };

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
 * 비밀번호 재설정 메일 발송 (CM-02 / ST-002 AC-1).
 * 계정 존재 여부를 노출하지 않기 위해 결과와 무관하게 항상 동일한 'sent' 를 반환한다.
 * 처리 시간 차이(미등록 즉시 / 등록 메일 발송)도 obscureTiming 으로 균일화한다.
 */
export async function forgotPasswordAction(
  locale: string,
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const startedAt = Date.now();

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { status: 'error', messageKey: 'auth.forgot.error.invalid' };
  }
  const { email } = parsed.data;

  const headerList = await headers();
  const ip = clientIp(headerList);
  const userAgent = headerList.get('user-agent');
  const origin = resolveOrigin(headerList);

  // redirectTo = 검증 완료 후 최종 도착 페이지. 이메일 템플릿이 /auth/confirm 으로 token_hash 를 싣고
  // redirect_to 로 이 값을 전달한다(staging 대시보드 템플릿 설정 필요 — 셋업 노트/KI).
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/${locale}/reset-password`,
    });
  } catch (e) {
    // 계정 미존재/일시 오류 모두 동일 응답으로 흡수 (계정 열거 방지).
    console.error('resetPasswordForEmail failed', e);
  }

  await safeAudit({ action: 'auth.password_reset_requested', result: 'success', ip, userAgent });
  await obscureTiming(startedAt);
  return { status: 'sent' };
}
