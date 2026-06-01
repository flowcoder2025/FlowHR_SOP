'use client';

import { Card, CardTitle } from '@flowhr/ui';
import { useTranslations } from 'next-intl';
import type { SettingTabState } from '@/lib/tenant-settings/queries';
import type { SettingTab } from '@/lib/tenant-settings/tabs';
import { PermissionState } from './permission-state';

interface TemplateRow {
  id: string;
  key: string;
  label_ko: string | null;
  template_format: string | null;
}

/**
 * 미구현(implemented=false) 탭 공통 조회/안내 — roles/notifications/document_templates/security.
 * 9탭 shell 을 완성하되 편집 표면은 두지 않는다(codex 협의). audit_logs 는 AuditLogsPane 전용.
 */
export function ReadonlyPane({ tab, state }: { tab: SettingTab; state: SettingTabState }) {
  const t = useTranslations('screens.ta-13');

  // 권한 없음 — security/roles 는 super 전용 안내(KI-113: hr_admin 도 여기로).
  if (state.permission === 'none') {
    return (
      <Card>
        <PermissionState kind={tab === 'security' || tab === 'roles' ? 'super_only' : 'none'} />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <CardTitle>{t(`tab.${tab}`)}</CardTitle>
        <p className="mt-1 text-[13px] text-text-muted">{t(`readonly.${tab}`)}</p>
      </div>
      <PermissionState kind="read_only" />
      <ReadonlyData
        tab={tab}
        data={state.data}
        emptyLabel={t('readonly.no_data')}
        labels={{
          key: t('readonly.templates_table.key'),
          label: t('readonly.templates_table.label'),
          format: t('readonly.templates_table.format'),
        }}
      />
    </Card>
  );
}

function ReadonlyData({
  tab,
  data,
  emptyLabel,
  labels,
}: {
  tab: SettingTab;
  data: unknown;
  emptyLabel: string;
  labels: { key: string; label: string; format: string };
}) {
  if (tab === 'document_templates') {
    const rows = Array.isArray(data) ? (data as TemplateRow[]) : [];
    if (rows.length === 0) return <p className="text-[13px] text-text-muted">{emptyLabel}</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-text-muted">
              <th className="py-2 pr-3 font-medium">{labels.key}</th>
              <th className="pr-3 font-medium">{labels.label}</th>
              <th className="font-medium">{labels.format}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="py-2 pr-3 font-mono text-[12px]">{r.key}</td>
                <td className="pr-3">{r.label_ko ?? '—'}</td>
                <td>{r.template_format ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // notifications/security: 현재값 jsonb read-only 표시(편집은 후속 WI).
  if ((tab === 'notifications' || tab === 'security') && data && typeof data === 'object') {
    return (
      <pre className="overflow-x-auto rounded-md border border-border bg-surface p-3 text-[12px] text-text-muted">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  return <p className="text-[13px] text-text-muted">{emptyLabel}</p>;
}
