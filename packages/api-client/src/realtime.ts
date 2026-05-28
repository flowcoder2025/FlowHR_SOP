'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { FlowHRSupabaseClient } from './client';

/**
 * Supabase Realtime 구독 wrapper (ST-069).
 * - 자동 재연결: 채널 오류/타임아웃/종료 시 지수 백오프 재구독.
 * - 오프라인 fallback: 네트워크 단절 시 구독 해제 + 'offline' 상태, 복구 시 자동 재구독.
 * - onReconnect: 재연결 시점에 호출 — 오프라인/단절 동안 누락된 변경 보정용 refetch 훅.
 *
 * 핵심 로직은 프레임워크 비종속 createRealtimeSubscription 으로 분리(node 단위 테스트 가능),
 * useRealtimeSubscription 은 React 상태로 감싸는 얇은 어댑터.
 */

export type RealtimeStatus = 'connecting' | 'subscribed' | 'reconnecting' | 'offline' | 'error';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

/** 네트워크 연결성 어댑터 (테스트 주입 가능, 기본은 브라우저 window/navigator). */
export interface ConnectivityAdapter {
  isOnline(): boolean;
  addListener(type: 'online' | 'offline', cb: () => void): void;
  removeListener(type: 'online' | 'offline', cb: () => void): void;
}

export interface RealtimeSubscriptionOptions<Row extends Record<string, unknown>> {
  client: FlowHRSupabaseClient;
  /** 구독 테이블 (예: 'notifications' | 'approvals' | 'approval_steps') */
  table: string;
  event?: RealtimeEvent;
  schema?: string;
  /** PostgREST 필터 (예: `user_id=eq.${userId}`) */
  filter?: string;
  onChange: (payload: RealtimePostgresChangesPayload<Row>) => void;
  onStatus?: (status: RealtimeStatus) => void;
  /** 최초 구독 성공이 아닌 "재"연결 성공 시 호출 (누락분 refetch 용) */
  onReconnect?: () => void;
  connectivity?: ConnectivityAdapter;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  /** 테스트 주입용 타이머 (기본 globalThis) */
  setTimeoutFn?: (cb: () => void, ms: number) => unknown;
  clearTimeoutFn?: (handle: unknown) => void;
}

export interface RealtimeSubscription {
  getStatus(): RealtimeStatus;
  unsubscribe(): void;
}

let channelSeq = 0;

/** 브라우저 window/navigator 기반 기본 연결성 어댑터 (SSR/비브라우저에서는 항상 online 가정). */
function defaultConnectivity(): ConnectivityAdapter {
  const w: typeof globalThis & {
    navigator?: { onLine?: boolean };
    addEventListener?: (t: string, cb: () => void) => void;
    removeEventListener?: (t: string, cb: () => void) => void;
  } = globalThis;
  const hasWindow = typeof w.addEventListener === 'function';
  return {
    isOnline: () => (typeof w.navigator?.onLine === 'boolean' ? w.navigator.onLine : true),
    addListener: (type, cb) => {
      if (hasWindow) w.addEventListener?.(type, cb);
    },
    removeListener: (type, cb) => {
      if (hasWindow) w.removeEventListener?.(type, cb);
    },
  };
}

/**
 * 프레임워크 비종속 Realtime 구독 매니저. 즉시 구독을 시작하고 핸들을 반환한다.
 */
export function createRealtimeSubscription<Row extends Record<string, unknown>>(
  opts: RealtimeSubscriptionOptions<Row>,
): RealtimeSubscription {
  const {
    client,
    table,
    event = '*',
    schema = 'public',
    filter,
    onChange,
    onStatus,
    onReconnect,
    baseBackoffMs = 1000,
    maxBackoffMs = 30000,
  } = opts;
  const connectivity = opts.connectivity ?? defaultConnectivity();
  const setTimeoutFn =
    opts.setTimeoutFn ?? ((cb, ms) => (globalThis.setTimeout as typeof setTimeout)(cb, ms));
  const clearTimeoutFn =
    opts.clearTimeoutFn ?? ((h) => (globalThis.clearTimeout as typeof clearTimeout)(h as never));

  let status: RealtimeStatus = 'connecting';
  let channel: RealtimeChannel | null = null;
  let retryHandle: unknown = null;
  let attempt = 0;
  let everSubscribed = false;
  let disposed = false;

  function setStatus(next: RealtimeStatus): void {
    status = next;
    onStatus?.(next);
  }

  function teardownChannel(): void {
    if (channel) {
      void client.removeChannel(channel);
      channel = null;
    }
  }

  function clearRetry(): void {
    if (retryHandle !== null) {
      clearTimeoutFn(retryHandle);
      retryHandle = null;
    }
  }

  function scheduleReconnect(): void {
    if (disposed || retryHandle !== null) return;
    const delay = Math.min(maxBackoffMs, baseBackoffMs * 2 ** attempt);
    attempt += 1;
    setStatus('reconnecting');
    retryHandle = setTimeoutFn(() => {
      retryHandle = null;
      if (!disposed && connectivity.isOnline()) connect();
    }, delay);
  }

  function connect(): void {
    if (disposed) return;
    teardownChannel();
    const name = `flowhr-rt:${table}:${(channelSeq += 1)}`;
    const ch = client.channel(name);
    const changeConfig = { event, schema, table, ...(filter ? { filter } : {}) };
    // @supabase/supabase-js 의 postgres_changes 오버로드 해소를 위해 .on 시그니처를 명시 캐스팅
    // (event union 리터럴 + Row 제네릭 payload). any 미사용.
    const onPostgresChanges = ch.on as (
      type: 'postgres_changes',
      cfg: typeof changeConfig,
      cb: (payload: RealtimePostgresChangesPayload<Row>) => void,
    ) => RealtimeChannel;
    onPostgresChanges('postgres_changes', changeConfig, (payload) => onChange(payload)).subscribe(
      (subStatus: string) => {
      if (disposed) return;
      if (subStatus === 'SUBSCRIBED') {
        attempt = 0;
        const wasReconnect = everSubscribed;
        everSubscribed = true;
        setStatus('subscribed');
        if (wasReconnect) onReconnect?.();
      } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
        setStatus('error');
        if (connectivity.isOnline()) scheduleReconnect();
      } else if (subStatus === 'CLOSED') {
        if (!disposed && connectivity.isOnline()) scheduleReconnect();
      }
    });
    channel = ch;
  }

  function handleOffline(): void {
    if (disposed) return;
    clearRetry();
    teardownChannel();
    attempt = 0;
    setStatus('offline');
  }

  function handleOnline(): void {
    if (disposed || status !== 'offline') return;
    setStatus('reconnecting');
    connect();
  }

  connectivity.addListener('offline', handleOffline);
  connectivity.addListener('online', handleOnline);

  if (connectivity.isOnline()) {
    connect();
  } else {
    setStatus('offline');
  }

  return {
    getStatus: () => status,
    unsubscribe: () => {
      disposed = true;
      clearRetry();
      teardownChannel();
      connectivity.removeListener('offline', handleOffline);
      connectivity.removeListener('online', handleOnline);
    },
  };
}

export interface UseRealtimeOptions<Row extends Record<string, unknown>>
  extends Omit<RealtimeSubscriptionOptions<Row>, 'onStatus'> {
  /** false 시 구독 비활성화 */
  enabled?: boolean;
}

/**
 * React 훅 — 구독 상태를 반환. onChange/onReconnect 는 ref로 보관해 불필요한 재구독을 막는다.
 * 재구독 트리거: client/table/event/schema/filter/enabled 변경 시.
 */
export function useRealtimeSubscription<Row extends Record<string, unknown>>(
  opts: UseRealtimeOptions<Row>,
): RealtimeStatus {
  const { client, table, event, schema, filter, enabled = true } = opts;
  const [status, setStatus] = useState<RealtimeStatus>(enabled ? 'connecting' : 'offline');

  const onChangeRef = useRef(opts.onChange);
  onChangeRef.current = opts.onChange;
  const onReconnectRef = useRef(opts.onReconnect);
  onReconnectRef.current = opts.onReconnect;

  useEffect(() => {
    if (!enabled) return;
    const sub = createRealtimeSubscription<Row>({
      client,
      table,
      event,
      schema,
      filter,
      onChange: (payload) => onChangeRef.current(payload),
      onReconnect: () => onReconnectRef.current?.(),
      onStatus: setStatus,
      connectivity: opts.connectivity,
    });
    return () => sub.unsubscribe();
    // 재구독 트리거는 아래 식별 키 변경 시로 한정 — onChange/onReconnect/connectivity는 ref/안정 참조로 처리.
  }, [client, table, event, schema, filter, enabled]);

  return status;
}
