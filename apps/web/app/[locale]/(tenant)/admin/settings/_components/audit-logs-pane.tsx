'use client';

import { Card, CardTitle } from '@flowhr/ui';
import { useTranslations } from 'next-intl';
import type { SettingTabState } from '@/lib/tenant-settings/queries';
import { PermissionState } from './permission-state';
import { formatKstDateTime } from './format';

interface AuditRow {
  id: string;
  action: string;
  actor_role: string | null;
  target_type: string | null;
  result: string;
  created_at: string;
}

/** 본 테넌트 감사 로그 (최근 20건, read-only). manager 는 권한 없음. */
export function AuditLogsPane({ state }: { state: SettingTabState }) {
  const t = useTranslations('screens.ta-13.audit');

  if (state.permission === 'none') {
    return (
      <Card>
        <PermissionState kind="none" />
      </Card>
    );
  }

  const rows = Array.isArray(state.data) ? (state.data as AuditRow[]) : [];

  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>{t('section')}</CardTitle>
      {rows.length === 0 ? (
        <p className="text-[13px] text-text-muted">{t('empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="py-2 pr-3 font-medium">{t('time')}</th>
                <th className="pr-3 font-medium">{t('actor')}</th>
                <th className="pr-3 font-medium">{t('action')}</th>
                <th className="pr-3 font-medium">{t('target')}</th>
                <th className="font-medium">{t('result')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="whitespace-nowrap py-2 pr-3 text-text-muted">
                    {formatKstDateTime(r.created_at)}
                  </td>
                  <td className="pr-3">{r.actor_role ?? '—'}</td>
                  <td className="pr-3 font-mono text-[12px]">{r.action}</td>
                  <td className="pr-3">{r.target_type ?? '—'}</td>
                  <td>{r.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
