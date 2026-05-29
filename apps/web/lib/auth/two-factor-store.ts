import 'server-only';
import { createServiceRoleClient } from '@flowhr/api-client/server';

// 2FA TOTP 저장소 접근 (server-only, service_role).
// /two-factor 검증은 세션 수립 전이라 RLS self-read 가 불가능하므로 service_role 로 users 의
// totp_secret_encrypted / recovery_codes_hash 를 읽고 갱신한다(잠금/감사와 동일 권한 경로).

export interface TotpRecord {
  totpEnabled: boolean;
  secretEncrypted: string | null;
  recoveryHashes: string[];
}

/** userId 의 2FA 상태/암호화 비밀/복구 해시 조회. 없으면 null. */
export async function getTotpRecord(userId: string): Promise<TotpRecord | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('users')
    .select('totp_enabled, totp_secret_encrypted, recovery_codes_hash')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    totpEnabled: data.totp_enabled,
    secretEncrypted: data.totp_secret_encrypted,
    recoveryHashes: data.recovery_codes_hash ?? [],
  };
}

/** 2FA 활성화 — 암호화 비밀 + 복구 코드 해시 저장 + totp_enabled=true. */
export async function enableTotp(
  userId: string,
  secretEncrypted: string,
  recoveryHashes: string[],
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('users')
    .update({
      totp_enabled: true,
      totp_secret_encrypted: secretEncrypted,
      recovery_codes_hash: recoveryHashes,
    })
    .eq('id', userId);
  if (error) throw error;
}

/** 2FA 비활성화 — 비밀/복구 코드 폐기 + totp_enabled=false. */
export async function disableTotp(userId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('users')
    .update({ totp_enabled: false, totp_secret_encrypted: null, recovery_codes_hash: null })
    .eq('id', userId);
  if (error) throw error;
}

/**
 * 복구 코드 1개를 원자적으로 소비한다(동시 재사용 방지).
 * `.contains(matchedHash)` 가드로 "해당 해시가 아직 배열에 있을 때만" remaining 으로 교체한다.
 * Postgres 가 행 잠금 하에 `@>` 가드를 재평가하므로, 동일 코드 병렬 제출 시 단 한 번만 0→1행 갱신된다.
 * 반환 true = 이번 호출이 소비에 성공 / false = 이미 소비됨(동시 요청) → 호출부는 검증 실패로 처리.
 */
export async function consumeRecoveryHash(
  userId: string,
  matchedHash: string,
  remainingHashes: string[],
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('users')
    .update({ recovery_codes_hash: remainingHashes })
    .eq('id', userId)
    .contains('recovery_codes_hash', [matchedHash])
    .select('id');
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
