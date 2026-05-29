'use server';

import { totpDisableSchema, totpEnableSchema } from '@flowhr/schemas';
import { writeAuthAudit, type AuthAuditInput } from '@/lib/auth/audit';
import {
  generateRecoveryCodes,
  hashRecoveryCodes,
  verifyAndConsumeRecoveryCode,
} from '@/lib/auth/recovery-codes';
import { getSessionProfile } from '@/lib/auth/session';
import { buildOtpAuthUrl, generateTotpSecret, toQrDataUrl, verifyTotp } from '@/lib/auth/totp';
import {
  SETUP_COOKIE,
  decryptTotpSecret,
  encryptTotpSecret,
  openSetup,
  sealSetup,
  setupCookieOptions,
} from '@/lib/auth/two-factor';
import { disableTotp, enableTotp, getTotpRecord } from '@/lib/auth/two-factor-store';
import { createIsolatedSupabaseClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';

export type EnrollState =
  | { status: 'idle' }
  | { status: 'error'; messageKey: string }
  | { status: 'enrolling'; qrDataUrl: string; secret: string };

export type ConfirmState =
  | { status: 'idle' }
  | { status: 'error'; messageKey: string }
  | { status: 'done'; recoveryCodes: string[] };

export type DisableState =
  | { status: 'idle' }
  | { status: 'error'; messageKey: string }
  | { status: 'done' };

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

function isOperatorRole(role: string | null): boolean {
  return role === 'operator_super' || role === 'operator_staff';
}

/** 1단계 — TOTP 비밀 생성 + QR. pending 비밀은 setup 쿠키에 봉인(DB 컬럼 추가 없이). */
export async function startEnrollAction(
  _prev: EnrollState,
  _formData: FormData,
): Promise<EnrollState> {
  const session = await getSessionProfile();
  if (!session) return { status: 'error', messageKey: 'error.session' };

  const record = await getTotpRecord(session.user.id);
  if (record?.totpEnabled) return { status: 'error', messageKey: 'error.already_enabled' };

  const secret = generateTotpSecret();
  const otpauthUrl = buildOtpAuthUrl(secret, session.user.email ?? session.user.id);
  let qrDataUrl: string;
  try {
    qrDataUrl = await toQrDataUrl(otpauthUrl);
  } catch {
    return { status: 'error', messageKey: 'error.generic' };
  }

  const cookieStore = await cookies();
  cookieStore.set(SETUP_COOKIE, sealSetup(session.user.id, secret), setupCookieOptions());
  return { status: 'enrolling', qrDataUrl, secret };
}

/** 2단계 — 인증 앱 6자리 검증 → 활성화 + 복구 코드 8개 1회 표시. */
export async function confirmEnrollAction(
  _prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const session = await getSessionProfile();
  if (!session) return { status: 'error', messageKey: 'error.session' };

  const parsed = totpEnableSchema.safeParse({ code: formData.get('code') });
  if (!parsed.success) return { status: 'error', messageKey: 'error.code_format' };

  const cookieStore = await cookies();
  const setup = openSetup(cookieStore.get(SETUP_COOKIE)?.value);
  if (!setup || setup.userId !== session.user.id) {
    return { status: 'error', messageKey: 'error.setup_expired' };
  }

  if (!verifyTotp(setup.secret, parsed.data.code)) {
    return { status: 'error', messageKey: 'error.code_invalid' };
  }

  const recoveryCodes = generateRecoveryCodes();
  await enableTotp(session.user.id, encryptTotpSecret(setup.secret), hashRecoveryCodes(recoveryCodes));
  cookieStore.delete(SETUP_COOKIE);

  const headerList = await headers();
  await safeAudit({
    action: 'auth.2fa_enabled',
    result: 'success',
    actorId: session.user.id,
    actorRole: session.role,
    tenantId: session.tenantId,
    ip: clientIp(headerList),
    userAgent: headerList.get('user-agent'),
  });

  return { status: 'done', recoveryCodes };
}

/** 비활성화 — 현재 비밀번호 재확인 + TOTP/복구 코드. 운영사 계정은 차단(강제 2FA 유지). */
export async function disableAction(_prev: DisableState, formData: FormData): Promise<DisableState> {
  const session = await getSessionProfile();
  if (!session) return { status: 'error', messageKey: 'error.session' };
  // role 을 확인할 수 없으면(self-read 실패 → null) operator 일 가능성을 배제할 수 없으므로 차단(fail-closed, codex P2).
  if (session.role === null) return { status: 'error', messageKey: 'error.session' };
  if (isOperatorRole(session.role)) return { status: 'error', messageKey: 'error.operator_blocked' };

  const parsed = totpDisableSchema.safeParse({
    password: formData.get('password'),
    code: formData.get('code'),
  });
  if (!parsed.success) return { status: 'error', messageKey: 'error.disable_input' };

  const record = await getTotpRecord(session.user.id);
  if (!record?.totpEnabled || !record.secretEncrypted) {
    return { status: 'error', messageKey: 'error.not_enabled' };
  }

  // 현재 비밀번호 재확인 — 격리 클라이언트(쿠키 미발급)로 검증만.
  const isolated = createIsolatedSupabaseClient();
  const { error: pwError } = await isolated.auth.signInWithPassword({
    email: session.user.email ?? '',
    password: parsed.data.password,
  });
  if (pwError) return { status: 'error', messageKey: 'error.password_wrong' };

  // TOTP 또는 복구 코드 검증.
  let ok = false;
  if (/^\d{6}$/.test(parsed.data.code.trim())) {
    try {
      ok = verifyTotp(decryptTotpSecret(record.secretEncrypted), parsed.data.code.trim());
    } catch {
      ok = false;
    }
  }
  if (!ok) {
    ok = verifyAndConsumeRecoveryCode(record.recoveryHashes, parsed.data.code).matched;
  }
  if (!ok) return { status: 'error', messageKey: 'error.code_invalid' };

  await disableTotp(session.user.id);

  const headerList = await headers();
  await safeAudit({
    action: 'auth.2fa_disabled',
    result: 'success',
    actorId: session.user.id,
    actorRole: session.role,
    tenantId: session.tenantId,
    ip: clientIp(headerList),
    userAgent: headerList.get('user-agent'),
  });

  return { status: 'done' };
}
