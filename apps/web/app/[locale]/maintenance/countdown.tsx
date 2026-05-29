'use client';

import { useEffect, useState } from 'react';

function format(totalSeconds: number): string {
  const secs = Math.max(0, totalSeconds);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * 점검 종료까지 남은 시간 라이브 카운트다운 (CM-06 maintenance 상태).
 * 시간 의존 값이라 SSR/CSR 불일치를 피하려고 마운트 후에만 채운다(초기 '—').
 */
export function MaintenanceCountdown({ endIso, label }: { endIso: string; label: string }) {
  const endMs = Date.parse(endIso);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (Number.isNaN(endMs)) return;
    const tick = () => setRemaining(Math.max(0, Math.ceil((endMs - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endMs]);

  if (Number.isNaN(endMs)) return null;

  return (
    <p className="text-sm">
      <span className="text-text-muted">{label}</span>{' '}
      <span className="font-mono font-semibold text-warning">
        {remaining === null ? '—' : format(remaining)}
      </span>
    </p>
  );
}
