import { describe, expect, it, vi } from 'vitest';
import {
  type ConnectivityAdapter,
  type RealtimeStatus,
  createRealtimeSubscription,
} from './realtime';
import type { FlowHRSupabaseClient } from './client';

type SubscribeCb = (status: string) => void;
type ChangeCb = (payload: unknown) => void;

function makeFakeClient() {
  let subscribeCb: SubscribeCb | undefined;
  let changeCb: ChangeCb | undefined;
  let channelCount = 0;
  let removeCount = 0;
  const client = {
    channel(_name: string) {
      channelCount += 1;
      const ch = {
        on(_type: string, _cfg: unknown, cb: ChangeCb) {
          changeCb = cb;
          return ch;
        },
        subscribe(cb: SubscribeCb) {
          subscribeCb = cb;
          return ch;
        },
      };
      return ch;
    },
    removeChannel(_ch: unknown) {
      removeCount += 1;
      return Promise.resolve('ok');
    },
  };
  return {
    client: client as unknown as FlowHRSupabaseClient,
    emitStatus: (s: string) => subscribeCb?.(s),
    emitChange: (p: unknown) => changeCb?.(p),
    channelCount: () => channelCount,
    removeCount: () => removeCount,
  };
}

function makeConnectivity(initialOnline: boolean) {
  let online = initialOnline;
  const listeners: Record<'online' | 'offline', Array<() => void>> = { online: [], offline: [] };
  const adapter: ConnectivityAdapter = {
    isOnline: () => online,
    addListener: (t, cb) => listeners[t].push(cb),
    removeListener: (t, cb) => {
      listeners[t] = listeners[t].filter((x) => x !== cb);
    },
  };
  return {
    adapter,
    goOffline: () => {
      online = false;
      listeners.offline.forEach((cb) => cb());
    },
    goOnline: () => {
      online = true;
      listeners.online.forEach((cb) => cb());
    },
    listenerCount: () => listeners.online.length + listeners.offline.length,
  };
}

function makeTimers() {
  let pending: Array<{ cb: () => void }> = [];
  return {
    setTimeoutFn: (cb: () => void) => {
      const h = { cb };
      pending.push(h);
      return h;
    },
    clearTimeoutFn: (h: unknown) => {
      pending = pending.filter((x) => x !== h);
    },
    flush: () => {
      const p = pending;
      pending = [];
      p.forEach((h) => h.cb());
    },
    count: () => pending.length,
  };
}

describe('createRealtimeSubscription', () => {
  it('online 시작 → SUBSCRIBED 면 subscribed 상태', () => {
    const fake = makeFakeClient();
    const conn = makeConnectivity(true);
    const statuses: RealtimeStatus[] = [];
    const sub = createRealtimeSubscription({
      client: fake.client,
      table: 'notifications',
      filter: 'user_id=eq.u1',
      onChange: () => {},
      onStatus: (s) => statuses.push(s),
      connectivity: conn.adapter,
    });
    expect(fake.channelCount()).toBe(1);
    fake.emitStatus('SUBSCRIBED');
    expect(sub.getStatus()).toBe('subscribed');
    expect(statuses).toContain('subscribed');
    sub.unsubscribe();
  });

  it('변경 payload 를 onChange 로 전달', () => {
    const fake = makeFakeClient();
    const conn = makeConnectivity(true);
    const onChange = vi.fn();
    const sub = createRealtimeSubscription({
      client: fake.client,
      table: 'approvals',
      onChange,
      connectivity: conn.adapter,
    });
    fake.emitStatus('SUBSCRIBED');
    fake.emitChange({ eventType: 'INSERT', new: { id: 'a1' } });
    expect(onChange).toHaveBeenCalledWith({ eventType: 'INSERT', new: { id: 'a1' } });
    sub.unsubscribe();
  });

  it('CHANNEL_ERROR → 백오프 재구독 후 SUBSCRIBED 면 onReconnect 호출', () => {
    const fake = makeFakeClient();
    const conn = makeConnectivity(true);
    const timers = makeTimers();
    const onReconnect = vi.fn();
    const sub = createRealtimeSubscription({
      client: fake.client,
      table: 'notifications',
      onChange: () => {},
      onReconnect,
      connectivity: conn.adapter,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });
    fake.emitStatus('SUBSCRIBED'); // 최초 구독 — onReconnect 미호출
    expect(onReconnect).not.toHaveBeenCalled();
    fake.emitStatus('CHANNEL_ERROR'); // 오류 → 재연결 예약
    expect(sub.getStatus()).toBe('reconnecting');
    expect(timers.count()).toBe(1);
    timers.flush(); // 재구독
    expect(fake.channelCount()).toBe(2);
    fake.emitStatus('SUBSCRIBED'); // 재연결 성공 → onReconnect
    expect(onReconnect).toHaveBeenCalledTimes(1);
    expect(sub.getStatus()).toBe('subscribed');
    sub.unsubscribe();
  });

  it('오프라인 이벤트 → offline 상태 + 채널 정리, 온라인 복귀 시 재구독', () => {
    const fake = makeFakeClient();
    const conn = makeConnectivity(true);
    const sub = createRealtimeSubscription({
      client: fake.client,
      table: 'notifications',
      onChange: () => {},
      connectivity: conn.adapter,
    });
    fake.emitStatus('SUBSCRIBED');
    conn.goOffline();
    expect(sub.getStatus()).toBe('offline');
    expect(fake.removeCount()).toBe(1);
    conn.goOnline();
    expect(fake.channelCount()).toBe(2); // 재구독
    sub.unsubscribe();
  });

  it('오프라인 상태로 시작하면 구독하지 않음', () => {
    const fake = makeFakeClient();
    const conn = makeConnectivity(false);
    const sub = createRealtimeSubscription({
      client: fake.client,
      table: 'notifications',
      onChange: () => {},
      connectivity: conn.adapter,
    });
    expect(sub.getStatus()).toBe('offline');
    expect(fake.channelCount()).toBe(0);
    sub.unsubscribe();
  });

  it('unsubscribe 시 채널 제거 + 리스너 해제', () => {
    const fake = makeFakeClient();
    const conn = makeConnectivity(true);
    const sub = createRealtimeSubscription({
      client: fake.client,
      table: 'notifications',
      onChange: () => {},
      connectivity: conn.adapter,
    });
    fake.emitStatus('SUBSCRIBED');
    expect(conn.listenerCount()).toBe(2);
    sub.unsubscribe();
    expect(fake.removeCount()).toBe(1);
    expect(conn.listenerCount()).toBe(0);
  });
});
