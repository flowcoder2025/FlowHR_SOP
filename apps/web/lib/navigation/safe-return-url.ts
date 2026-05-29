import { canAccessPath } from '@flowhr/api-client';

/**
 * 내부 안전 경로 검증 (오픈 리다이렉트 방지, 09-routing.md §5).
 * 내부 절대경로 + 동일 locale prefix + 역할 접근 가능 경로만 허용한다. 그 외엔 null.
 * 로그인 return_url 과 강제 동의(must_accept) 복귀 경로 검증에 공통 사용.
 */
export function safeInternalPath(
  raw: string | null | undefined,
  locale: string,
  role: string | null,
): string | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null;
  const prefix = `/${locale}`;
  if (raw !== prefix && !raw.startsWith(`${prefix}/`)) return null;
  const rest = raw.slice(prefix.length) || '/';
  if (!canAccessPath(role, rest)) return null;
  return raw;
}
