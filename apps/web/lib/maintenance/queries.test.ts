import type { FlowHRSupabaseClient } from '@flowhr/api-client';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearMaintenanceCache,
  computeRetryAfterSeconds,
  getActiveMaintenance,
  getUserRole,
  isMaintenanceExempt,
} from './queries';

/** 체이닝 쿼리 빌더 목 — 종단(maybeSingle)에서 고정 결과를 반환. */
function fakeResult(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.eq = chain;
  builder.order = chain;
  builder.limit = chain;
  builder.maybeSingle = () => Promise.resolve(result);
  return builder;
}

function fakeClient(byTable: Record<string, { data: unknown; error: unknown }>): FlowHRSupabaseClient {
  return {
    from: (table: string) => fakeResult(byTable[table] ?? { data: null, error: null }),
  } as unknown as FlowHRSupabaseClient;
}

const NOW = 1_700_000_000_000;

describe('computeRetryAfterSeconds', () => {
  it('예약 종료가 없으면 기본 300초', () => {
    expect(computeRetryAfterSeconds(null, NOW)).toBe(300);
  });

  it('미래 종료까지 남은 초(올림)', () => {
    const end = new Date(NOW + 100_500).toISOString(); // 100.5s → 101
    expect(computeRetryAfterSeconds(end, NOW)).toBe(101);
  });

  it('이미 지난 종료는 기본 300초', () => {
    const end = new Date(NOW - 5_000).toISOString();
    expect(computeRetryAfterSeconds(end, NOW)).toBe(300);
  });

  it('파싱 불가 문자열은 기본 300초', () => {
    expect(computeRetryAfterSeconds('not-a-date', NOW)).toBe(300);
  });

  it('비정상적으로 먼 미래는 24h(86400초)로 상한', () => {
    const end = new Date(NOW + 10 * 86_400_000).toISOString();
    expect(computeRetryAfterSeconds(end, NOW)).toBe(86_400);
  });
});

describe('isMaintenanceExempt', () => {
  it('정확한 로그인/점검 경로만 점검 중 허용', () => {
    expect(isMaintenanceExempt('/login')).toBe(true);
    expect(isMaintenanceExempt('/maintenance')).toBe(true);
  });

  it('미정의 중첩 경로는 비예외(503 대상) — prefix 면제 누수 차단', () => {
    expect(isMaintenanceExempt('/login/foo')).toBe(false);
    expect(isMaintenanceExempt('/maintenance/anything')).toBe(false);
    expect(isMaintenanceExempt('/login-something')).toBe(false);
  });

  it('보호/일반 경로는 비예외', () => {
    expect(isMaintenanceExempt('/me')).toBe(false);
    expect(isMaintenanceExempt('/admin/employees')).toBe(false);
    expect(isMaintenanceExempt('/operator')).toBe(false);
    expect(isMaintenanceExempt('/')).toBe(false);
  });
});

describe('getActiveMaintenance', () => {
  beforeEach(() => clearMaintenanceCache());

  it('활성 창을 camelCase 로 매핑', async () => {
    const client = fakeClient({
      maintenance_windows: {
        data: {
          id: 'mw-1',
          message_ko: '서버 점검 안내',
          scheduled_start: '2026-05-29T01:00:00Z',
          scheduled_end: '2026-05-29T03:00:00Z',
          activated_at: '2026-05-29T01:00:00Z',
        },
        error: null,
      },
    });
    const m = await getActiveMaintenance(client);
    expect(m).toEqual({
      id: 'mw-1',
      message: '서버 점검 안내',
      scheduledStart: '2026-05-29T01:00:00Z',
      scheduledEnd: '2026-05-29T03:00:00Z',
      activatedAt: '2026-05-29T01:00:00Z',
    });
  });

  it('활성 창이 없으면 null', async () => {
    const client = fakeClient({ maintenance_windows: { data: null, error: null } });
    expect(await getActiveMaintenance(client)).toBeNull();
  });

  it('DB 오류 시 fail-open(null)', async () => {
    const client = fakeClient({ maintenance_windows: { data: null, error: { message: 'boom' } } });
    expect(await getActiveMaintenance(client)).toBeNull();
  });

  it('TTL 캐시 — 두 번째 호출은 client 를 다시 조회하지 않음', async () => {
    const active = fakeClient({
      maintenance_windows: { data: { id: 'mw-1', message_ko: null, scheduled_start: null, scheduled_end: null, activated_at: null }, error: null },
    });
    const empty = fakeClient({ maintenance_windows: { data: null, error: null } });
    const first = await getActiveMaintenance(active);
    expect(first?.id).toBe('mw-1');
    // 캐시 적중 — empty client 를 줘도 직전 값 유지
    const cached = await getActiveMaintenance(empty);
    expect(cached?.id).toBe('mw-1');
    // 무효화 후에는 empty client 결과 반영
    clearMaintenanceCache();
    expect(await getActiveMaintenance(empty)).toBeNull();
  });
});

describe('getUserRole', () => {
  it('users.role 반환', async () => {
    const client = fakeClient({ users: { data: { role: 'operator_super' }, error: null } });
    expect(await getUserRole(client, 'u-1')).toBe('operator_super');
  });

  it('row 없으면 null', async () => {
    const client = fakeClient({ users: { data: null, error: null } });
    expect(await getUserRole(client, 'u-1')).toBeNull();
  });
});
