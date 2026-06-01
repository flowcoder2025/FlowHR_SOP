'use client';

import { SettingsPane, VerticalTabs } from '@flowhr/ui';
import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { SettingTabState, TenantSettingsResult } from '@/lib/tenant-settings/queries';
import { SETTING_TABS, type SettingTab } from '@/lib/tenant-settings/tabs';
import { AuditLogsPane } from './_components/audit-logs-pane';
import { ReadonlyPane } from './_components/readonly-pane';
import { ApprovalLinesForm } from './_panes/approval-lines-form';
import { CompanyForm } from './_panes/company-form';
import { LeavePolicyForm } from './_panes/leave-policy-form';
import { WorkPolicyForm } from './_panes/work-policy-form';

/**
 * TA-13 회사 설정 셸 (WI-033) — SettingsPane + VerticalTabs(WI-030) 9탭.
 * 서버에서 1회 받은 envelope(result.tabs)를 탭별 pane 에 분배. 탭 전환은 client state +
 * history.replaceState 로 URL ?tab= 만 갱신(RSC refetch 회피). 각 pane 은 key={tab} 으로
 * 탭 전환 시 폼 상태가 초기화되도록 remount 한다.
 */
export function SettingsClient({
  result,
  initialTab,
}: {
  result: TenantSettingsResult;
  initialTab: SettingTab;
}) {
  const t = useTranslations('screens.ta-13');
  const [active, setActive] = useState<SettingTab>(initialTab);

  const handleChange = (id: string) => {
    const tab = id as SettingTab;
    setActive(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const tabs = SETTING_TABS.map((id) => ({
    id,
    label: t(`tab.${id}`),
    icon: id === 'security' ? <Lock size={14} aria-hidden="true" /> : undefined,
  }));

  return (
    <SettingsPane
      nav={
        <VerticalTabs tabs={tabs} activeId={active} onChange={handleChange} ariaLabel={t('title')} />
      }
    >
      {renderPane(active, result.tabs[active])}
    </SettingsPane>
  );
}

function renderPane(tab: SettingTab, state: SettingTabState) {
  const editable = state.permission === 'edit';
  switch (tab) {
    case 'company':
      return <CompanyForm key={tab} editable={editable} data={state.data} pending={state.pending} />;
    case 'work_policy':
      return <WorkPolicyForm key={tab} editable={editable} data={state.data} pending={state.pending} />;
    case 'leave_policy':
      return <LeavePolicyForm key={tab} editable={editable} data={state.data} pending={state.pending} />;
    case 'approval_lines':
      return <ApprovalLinesForm key={tab} editable={editable} data={state.data} pending={state.pending} />;
    case 'audit_logs':
      return <AuditLogsPane key={tab} state={state} />;
    default:
      return <ReadonlyPane key={tab} tab={tab} state={state} />;
  }
}
