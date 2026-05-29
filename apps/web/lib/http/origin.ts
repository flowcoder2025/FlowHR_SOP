/**
 * 현재 요청의 외부 origin(scheme://host)을 결정한다.
 * 우선순위: NEXT_PUBLIC_SITE_URL(명시 배포 도메인) → 프록시 헤더 → host 헤더.
 * 이메일 재설정 링크(redirectTo)처럼 절대 URL이 필요한 곳에서 사용한다.
 */
export function resolveOrigin(headerList: Headers): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000';
  const isLocal = host.startsWith('localhost') || host.startsWith('127.');
  const proto = headerList.get('x-forwarded-proto') ?? (isLocal ? 'http' : 'https');
  return `${proto}://${host}`;
}
