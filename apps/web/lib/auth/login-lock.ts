import 'server-only';
import { createServiceRoleClient } from '@flowhr/api-client';

/** 5회 실패 시 잠금 (api/auth.md). record_login_failure RPC의 c_threshold와 일치. */
export const LOCK_THRESHOLD = 5;

export interface LockStatus {
  locked: boolean;
  lockedUntil: Date | null;
  retryAfterSeconds: number | null;
}

export interface FailureResult extends LockStatus {
  attemptCount: number;
  remaining: number;
}

function toLockStatus(lockedUntilIso: string | null): LockStatus {
  if (!lockedUntilIso) return { locked: false, lockedUntil: null, retryAfterSeconds: null };
  const lockedUntil = new Date(lockedUntilIso);
  const ms = lockedUntil.getTime() - Date.now();
  if (ms <= 0) return { locked: false, lockedUntil: null, retryAfterSeconds: null };
  return { locked: true, lockedUntil, retryAfterSeconds: Math.ceil(ms / 1000) };
}

/** signIn 시도 전 (email, ip) 현재 잠금 여부 확인. */
export async function checkLoginLock(email: string, ip: string): Promise<LockStatus> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('login_attempts')
    .select('locked_until')
    .eq('email', email)
    .eq('ip', ip)
    .maybeSingle();
  if (error) throw error;
  return toLockStatus(data?.locked_until ?? null);
}

/** 실패 1건 원자적 기록 + 임계(5회) 도달 시 5분 잠금 (record_login_failure RPC). */
export async function recordLoginFailure(email: string, ip: string): Promise<FailureResult> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc('record_login_failure', {
    p_email: email,
    p_ip: ip,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  const attemptCount = row?.out_attempt_count ?? 0;
  return {
    ...toLockStatus(row?.out_locked_until ?? null),
    attemptCount,
    remaining: Math.max(0, LOCK_THRESHOLD - attemptCount),
  };
}

/** 로그인 성공 시 시도 기록 초기화. */
export async function clearLoginAttempts(email: string, ip: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('login_attempts')
    .delete()
    .eq('email', email)
    .eq('ip', ip);
  if (error) throw error;
}
