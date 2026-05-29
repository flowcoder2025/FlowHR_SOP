import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM 기반 authenticated 봉인/해제 (순수 로직 — server-only 의존 없음, 단위 테스트 대상).
// 2FA challenge 쿠키 봉인 + TOTP secret 암호화-at-rest 양쪽에서 재사용한다.
// 봉인 포맷: base64url( iv[12] || authTag[16] || ciphertext ). 키는 32바이트(AES-256).
// GCM authTag 로 위변조를 탐지하므로(복호화 시 throw) 클라이언트가 페이로드를 조작/위조할 수 없다.

const IV_LEN = 12; // GCM 권장 nonce 길이
const TAG_LEN = 16; // GCM auth tag 길이
const KEY_LEN = 32; // AES-256

/** base64 문자열을 32바이트 키 버퍼로 파싱. 길이 불일치/형식 오류는 throw(fail-closed). */
export function keyFromBase64(b64: string): Buffer {
  const key = Buffer.from(b64, 'base64');
  if (key.length !== KEY_LEN) {
    throw new Error(`키 길이 오류: ${key.length}바이트 (32바이트 base64 필요)`);
  }
  return key;
}

/** 평문 문자열을 봉인. iv 는 매 호출 랜덤(동일 평문도 매번 다른 토큰). */
export function seal(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64url');
}

/** 봉인 토큰을 해제. 위변조/형식오류/키불일치는 throw — 호출부에서 catch 하여 fail-closed 처리한다. */
export function open(token: string, key: Buffer): string {
  const raw = Buffer.from(token, 'base64url');
  if (raw.length < IV_LEN + TAG_LEN) throw new Error('봉인 토큰 길이 오류');
  const iv = raw.subarray(0, IV_LEN);
  const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = raw.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

/** 객체를 JSON 직렬화 후 봉인. */
export function sealJson(obj: unknown, key: Buffer): string {
  return seal(JSON.stringify(obj), key);
}

/** 봉인 토큰을 해제 후 JSON 파싱. 위변조/파싱오류는 throw. */
export function openJson<T>(token: string, key: Buffer): T {
  return JSON.parse(open(token, key)) as T;
}
