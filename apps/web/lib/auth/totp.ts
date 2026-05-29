import QRCode from 'qrcode';
import speakeasy from 'speakeasy';

// TOTP(RFC 6238) 비밀 생성 / otpauth URL / QR / 코드 검증 래퍼 (speakeasy + qrcode).
// 순수 래퍼 — env 비밀에 의존하지 않으므로 단위 테스트로 verify 왕복을 검증한다.
// 비밀 암호화-at-rest 는 lib/auth/two-factor.ts(server-only, AUTH_TOTP_ENC_KEY)가 담당.

const ISSUER = 'FlowHR';
const ENCODING = 'base32' as const;
// 클라이언트 시계 ±1 스텝(30초) 허용 — 모바일 시계 드리프트 수용(CM-04 §7 "클라이언트 시계 30초 ±1").
const WINDOW = 1;

/** 새 TOTP 비밀(base32) 생성. 평문 비밀은 저장 전 반드시 암호화한다. */
export function generateTotpSecret(): string {
  return speakeasy.generateSecret({ length: 20 }).base32;
}

/** 인증 앱 등록용 otpauth:// URL. label 은 통상 사용자 이메일. */
export function buildOtpAuthUrl(secret: string, accountLabel: string): string {
  return speakeasy.otpauthURL({
    secret,
    encoding: ENCODING,
    label: `${ISSUER}:${accountLabel}`,
    issuer: ISSUER,
  });
}

/** otpauth URL 을 PNG data URL(QR)로 렌더. */
export function toQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, { margin: 1, width: 200 });
}

/** 6자리 숫자 TOTP 코드 검증. 형식(6자리 숫자)이 아니면 즉시 false. */
export function verifyTotp(secret: string, token: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  return speakeasy.totp.verify({ secret, encoding: ENCODING, token, window: WINDOW });
}

/** 테스트/검증용 — 현재 시각 기준 유효 코드 생성(서버 코드 경로에서는 사용하지 않음). */
export function currentTotp(secret: string): string {
  return speakeasy.totp({ secret, encoding: ENCODING });
}
