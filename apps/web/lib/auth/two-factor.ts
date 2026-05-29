import 'server-only';
import { randomBytes } from 'node:crypto';
import { keyFromBase64, openJson, sealJson } from './crypto';

// 2FA 서버 비밀 + 쿠키 봉인 오케스트레이션 (server-only).
// - challenge 쿠키(fh-2fa-challenge): 1단계(비번) 통과 후 세션 토큰을 봉인해 /two-factor 로 전달.
// - setup 쿠키(fh-2fa-setup): enable 흐름의 pending TOTP 비밀을 DB 컬럼 추가 없이 단기 보관.
// - TOTP 비밀 암호화-at-rest: users.totp_secret_encrypted = AES-256-GCM(secret, AUTH_TOTP_ENC_KEY).
// 전용 키 2개(service_role 겸용 금지). 키 부재 시 keyFromBase64 가 throw → fail-closed.

export const CHALLENGE_COOKIE = 'fh-2fa-challenge';
export const SETUP_COOKIE = 'fh-2fa-setup';

const CHALLENGE_TTL_MS = 300_000; // 5분 (api/auth.md challengeToken 5분)
const SETUP_TTL_MS = 600_000; // 10분 (enable 진행 중 pending 비밀)

function challengeKey(): Buffer {
  const b64 = process.env.AUTH_CHALLENGE_SECRET;
  if (!b64) throw new Error('AUTH_CHALLENGE_SECRET 미설정 — 2FA challenge 봉인 불가(fail-closed)');
  return keyFromBase64(b64);
}

function totpEncKey(): Buffer {
  const b64 = process.env.AUTH_TOTP_ENC_KEY;
  if (!b64) throw new Error('AUTH_TOTP_ENC_KEY 미설정 — TOTP 비밀 암호화 불가(fail-closed)');
  return keyFromBase64(b64);
}

// ── challenge (로그인 1단계 통과 → 2FA 대기) ──────────────────────────────

export interface ChallengePayload {
  purpose: '2fa-challenge';
  userId: string;
  email: string;
  /** 1단계에서 발급받은 Supabase 세션 토큰 — OTP 통과 시 setSession 으로 복원. */
  accessToken: string;
  refreshToken: string;
  /** 2FA 통과 후 이동할 내부 경로(locale 포함). */
  returnTo: string;
  jti: string;
  /** 만료 시각(ms epoch). */
  exp: number;
}

export function sealChallenge(
  input: Omit<ChallengePayload, 'purpose' | 'jti' | 'exp'>,
  nowMs: number = Date.now(),
): string {
  const payload: ChallengePayload = {
    ...input,
    purpose: '2fa-challenge',
    jti: randomBytes(12).toString('base64url'),
    exp: nowMs + CHALLENGE_TTL_MS,
  };
  return sealJson(payload, challengeKey());
}

/** 봉인 해제 + purpose/exp 검증. 위변조/만료/형식오류는 모두 null(fail-closed). */
export function openChallenge(
  token: string | undefined | null,
  nowMs: number = Date.now(),
): ChallengePayload | null {
  if (!token) return null;
  try {
    const payload = openJson<ChallengePayload>(token, challengeKey());
    if (payload.purpose !== '2fa-challenge') return null;
    if (!Number.isFinite(payload.exp) || payload.exp < nowMs) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── setup (TOTP enable 진행 중 pending 비밀) ─────────────────────────────

export interface SetupPayload {
  purpose: '2fa-setup';
  userId: string;
  /** pending TOTP base32 비밀 — enable 검증 통과 시에만 암호화 저장. */
  secret: string;
  exp: number;
}

export function sealSetup(userId: string, secret: string, nowMs: number = Date.now()): string {
  const payload: SetupPayload = {
    purpose: '2fa-setup',
    userId,
    secret,
    exp: nowMs + SETUP_TTL_MS,
  };
  return sealJson(payload, challengeKey());
}

export function openSetup(
  token: string | undefined | null,
  nowMs: number = Date.now(),
): SetupPayload | null {
  if (!token) return null;
  try {
    const payload = openJson<SetupPayload>(token, challengeKey());
    if (payload.purpose !== '2fa-setup') return null;
    if (!Number.isFinite(payload.exp) || payload.exp < nowMs) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── TOTP 비밀 암호화-at-rest ─────────────────────────────────────────────

export function encryptTotpSecret(secret: string): string {
  return sealJson({ s: secret }, totpEncKey());
}

export function decryptTotpSecret(encrypted: string): string {
  return openJson<{ s: string }>(encrypted, totpEncKey()).s;
}

// ── 쿠키 옵션 ────────────────────────────────────────────────────────────

function baseCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  };
}

export function challengeCookieOptions() {
  return baseCookieOptions(CHALLENGE_TTL_MS / 1000);
}

export function setupCookieOptions() {
  return baseCookieOptions(SETUP_TTL_MS / 1000);
}
