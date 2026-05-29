import type { FlowHRSupabaseClient } from '@flowhr/api-client';

/** 활성 점검 창 (CM-06 / ST-072). message 는 운영사 작성 ko 본문(maintenance_windows.message_ko). */
export interface ActiveMaintenance {
  id: string;
  message: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  activatedAt: string | null;
}

// 미들웨어가 매 요청마다 점검 상태를 조회하지 않도록 하는 best-effort TTL 캐시.
// Edge/서버 인스턴스가 warm 일 때 모듈 스코프가 유지되어 조회량을 줄인다(cold 시 즉시 재조회).
// 점검 토글 반영 지연은 최대 TTL(15초). 정합 강화(Realtime 무효화)는 KI 로 추적.
const TTL_MS = 15_000;
let cache: { value: ActiveMaintenance | null; expiresAt: number } | null = null;

/** 테스트/강제 무효화용 (운영 코드 경로에서는 사용하지 않음). */
export function clearMaintenanceCache(): void {
  cache = null;
}

async function fetchActiveMaintenance(
  client: FlowHRSupabaseClient,
): Promise<ActiveMaintenance | null> {
  const { data, error } = await client
    .from('maintenance_windows')
    .select('id, message_ko, scheduled_start, scheduled_end, activated_at')
    .eq('status', 'active')
    .order('activated_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  // DB 오류 시 fail-open(점검 아님 처리) — 일시적 장애로 전체 사용자를 잠그지 않는다.
  if (error || !data) return null;
  return {
    id: data.id,
    message: data.message_ko,
    scheduledStart: data.scheduled_start,
    scheduledEnd: data.scheduled_end,
    activatedAt: data.activated_at,
  };
}

/** 활성 점검 창을 조회한다(TTL 캐시 적용). 없으면 null. */
export async function getActiveMaintenance(
  client: FlowHRSupabaseClient,
): Promise<ActiveMaintenance | null> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.value;
  const value = await fetchActiveMaintenance(client);
  cache = { value, expiresAt: now + TTL_MS };
  return value;
}

/** 현재 사용자의 역할(점검 우회 판정용). 세션 client 로 본인 users row 조회. */
export async function getUserRole(
  client: FlowHRSupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await client.from('users').select('role').eq('id', userId).maybeSingle();
  return data?.role ?? null;
}

const MAINTENANCE_ALLOW = ['/login', '/maintenance'];

/**
 * 점검 중에도 비-operator 가 접근 가능한 경로(locale 제거 기준):
 * 로그인(operator_super 가 인증해 우회하도록) + 점검 페이지(rewrite 대상).
 */
export function isMaintenanceExempt(restPath: string): boolean {
  return MAINTENANCE_ALLOW.some((p) => restPath === p || restPath.startsWith(`${p}/`));
}

/**
 * 503 Retry-After(초) — 예약 종료까지 남은 시간, 양수일 때만. 그 외 기본 300초.
 * 상한 86400초(24h)로 비정상 값 방어.
 */
export function computeRetryAfterSeconds(scheduledEnd: string | null, nowMs: number): number {
  if (scheduledEnd) {
    const end = Date.parse(scheduledEnd);
    if (!Number.isNaN(end)) {
      const secs = Math.ceil((end - nowMs) / 1000);
      if (secs > 0) return Math.min(secs, 86_400);
    }
  }
  return 300;
}
