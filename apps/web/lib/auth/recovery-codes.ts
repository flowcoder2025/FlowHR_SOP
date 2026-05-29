import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';

// 2FA 복구 코드 생성 / 해싱 / 검증+소비 (순수 로직 — 단위 테스트 대상).
// 저장 포맷: `scrypt$v=1$N=16384$r=8$p=1$<saltB64url>$<hashB64url>` (users.recovery_codes_hash text[]).
// 코드별 랜덤 salt + scrypt — bcrypt 의존 없이 Node 표준 crypto 로 저엔트로피 입력에 대한 무차별 비용을 높인다.
// (sha256 은 저엔트로피 코드에 너무 빨라 부적합 — codex 설계 §-0h 3번.)

const CODE_COUNT = 8; // 발급 코드 수 (CM-04 "복구 코드 8개")
const GROUP_LEN = 4; // XXXX-XXXX 그룹 길이
// 혼동 문자(0/O, 1/I/L) 제외한 대문자+숫자 알파벳 — 사용자가 수기 입력해도 오인 적도록.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 32;
const SALT_LEN = 16;

function randomGroup(): string {
  let s = '';
  for (let i = 0; i < GROUP_LEN; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

/** 표시용 복구 코드 1개 생성 (XXXX-XXXX). */
export function generateRecoveryCode(): string {
  return `${randomGroup()}-${randomGroup()}`;
}

/** 표시용 복구 코드 8개 생성. 사용자에게 1회만 노출, 평문은 저장하지 않는다. */
export function generateRecoveryCodes(count: number = CODE_COUNT): string[] {
  return Array.from({ length: count }, generateRecoveryCode);
}

/**
 * 입력 코드를 검증용 표준형(대문자 영숫자 8자 → XXXX-XXXX)으로 정규화.
 * 공백/대소문자/구분자 차이를 흡수한다. 8자가 아니면 null(형식 불일치).
 */
export function normalizeRecoveryCode(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length !== GROUP_LEN * 2) return null;
  return `${cleaned.slice(0, GROUP_LEN)}-${cleaned.slice(GROUP_LEN)}`;
}

function scrypt(code: string, salt: Buffer): Buffer {
  return scryptSync(code, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
}

/** 표준형 코드를 salt+scrypt 로 해싱하여 저장 포맷 문자열 반환. */
export function hashRecoveryCode(code: string): string {
  const salt = randomBytes(SALT_LEN);
  const hash = scrypt(code, salt);
  return `scrypt$v=1$N=${SCRYPT_N}$r=${SCRYPT_R}$p=${SCRYPT_P}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

/** 8개 복구 코드를 일괄 해싱. */
export function hashRecoveryCodes(codes: string[]): string[] {
  return codes.map((c) => hashRecoveryCode(c));
}

/** 저장 포맷 문자열과 입력 코드(표준형)를 timingSafe 비교. 형식 오류는 false. */
function matchesStored(stored: string, code: string): boolean {
  const parts = stored.split('$');
  // scrypt $ v=1 $ N=.. $ r=.. $ p=.. $ salt $ hash → 7 토큰
  if (parts.length !== 7 || parts[0] !== 'scrypt') return false;
  const saltB64 = parts[5]!;
  const hashB64 = parts[6]!;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, 'base64url');
    expected = Buffer.from(hashB64, 'base64url');
  } catch {
    return false;
  }
  if (expected.length !== KEY_LEN) return false;
  const actual = scrypt(code, salt);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export interface RecoveryConsumeResult {
  matched: boolean;
  /** 매칭된 코드를 제거한 나머지 해시 배열 (matched=false 면 입력과 동일). */
  remaining: string[];
}

/**
 * 입력 복구 코드를 저장된 해시 배열과 대조하여 1개 매칭 시 소비(제거).
 * 모든 후보를 끝까지 검사해 타이밍 사이드채널을 줄인다(첫 매칭 후 early-return 하지 않음).
 */
export function verifyAndConsumeRecoveryCode(
  storedHashes: string[],
  input: string,
): RecoveryConsumeResult {
  const code = normalizeRecoveryCode(input);
  if (!code) return { matched: false, remaining: storedHashes };

  let matchedIndex = -1;
  storedHashes.forEach((stored, i) => {
    if (matchesStored(stored, code) && matchedIndex === -1) matchedIndex = i;
  });

  if (matchedIndex === -1) return { matched: false, remaining: storedHashes };
  return {
    matched: true,
    remaining: storedHashes.filter((_, i) => i !== matchedIndex),
  };
}
