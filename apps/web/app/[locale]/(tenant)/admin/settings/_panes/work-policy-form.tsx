'use client';

import { Card, CardTitle, Input, Label } from '@flowhr/ui';
import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import type { PendingChangeSummary } from '@/lib/tenant-settings/queries';
import { SAVE_INIT, saveWorkPolicyAction } from '../actions';
import { PendingChangeList } from '../_components/pending-change-list';
import { PermissionState } from '../_components/permission-state';
import { SettingsActionBar } from '../_components/settings-action-bar';

interface WorkPolicy {
  name?: string;
  standard_clock_in?: string | null;
  standard_clock_out?: string | null;
  late_threshold?: string | null;
  break_minutes_default?: number;
  weekly_max_hours?: number;
  applicable_departments?: string[] | null;
  applied_from?: string | null;
}

/** 2. 근무정책 탭 — work_policies 기본 1행. 시간 선택입력, late_threshold 는 출근시간 게이트. */
export function WorkPolicyForm({
  editable,
  data,
  pending,
}: {
  editable: boolean;
  data: unknown;
  pending: PendingChangeSummary[];
}) {
  const t = useTranslations('screens.ta-13.work');
  const [state, formAction, submitting] = useActionState(saveWorkPolicyAction, SAVE_INIT);
  const wp = (data ?? {}) as WorkPolicy;

  // 지각 기준은 출근 표준시간이 있을 때만 활성화(form-data.ts 가 서버에서도 동일 게이트).
  const [clockIn, setClockIn] = useState(wp.standard_clock_in ?? '');

  return (
    <Card className="flex flex-col">
      <CardTitle>{t('section')}</CardTitle>
      <form action={formAction} className="mt-2 flex flex-col">
        <fieldset disabled={!editable} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="name" required>
              {t('name')}
            </Label>
            <Input id="name" name="name" defaultValue={wp.name ?? ''} placeholder={t('name_placeholder')} required />
          </div>

          <p className="text-[12px] text-text-muted">{t('time_optional_hint')}</p>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <div>
              <Label htmlFor="standard_clock_in">{t('standard_clock_in')}</Label>
              <Input
                id="standard_clock_in"
                name="standard_clock_in"
                type="time"
                defaultValue={wp.standard_clock_in ?? ''}
                onChange={(e) => setClockIn(e.currentTarget.value)}
              />
            </div>
            <div>
              <Label htmlFor="standard_clock_out">{t('standard_clock_out')}</Label>
              <Input
                id="standard_clock_out"
                name="standard_clock_out"
                type="time"
                defaultValue={wp.standard_clock_out ?? ''}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="late_threshold">{t('late_threshold')}</Label>
            <Input
              id="late_threshold"
              name="late_threshold"
              type="time"
              defaultValue={wp.late_threshold ?? ''}
              disabled={!editable || !clockIn}
            />
            {!clockIn && <p className="mt-1 text-[12px] text-text-muted">{t('late_threshold_hint')}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <div>
              <Label htmlFor="break_minutes_default" required>
                {t('break_minutes_default')}
              </Label>
              <Input
                id="break_minutes_default"
                name="break_minutes_default"
                type="number"
                min={0}
                max={1440}
                defaultValue={wp.break_minutes_default ?? 0}
                required
              />
            </div>
            <div>
              <Label htmlFor="weekly_max_hours" required>
                {t('weekly_max_hours')}
              </Label>
              <Input
                id="weekly_max_hours"
                name="weekly_max_hours"
                type="number"
                min={0}
                max={168}
                defaultValue={wp.weekly_max_hours ?? 52}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="applicable_departments">{t('applicable_departments')}</Label>
            <Input
              id="applicable_departments"
              name="applicable_departments"
              defaultValue={(wp.applicable_departments ?? []).join(', ')}
            />
            <p className="mt-1 text-[12px] text-text-muted">{t('departments_hint')}</p>
          </div>

          <div>
            <Label htmlFor="applied_from">{t('applied_from')}</Label>
            <Input id="applied_from" name="applied_from" type="date" defaultValue={wp.applied_from ?? ''} />
          </div>
        </fieldset>
        {editable ? (
          <SettingsActionBar pending={submitting} state={state} />
        ) : (
          <div className="mt-5">
            <PermissionState kind="read_only" />
          </div>
        )}
      </form>
      <PendingChangeList items={pending} />
    </Card>
  );
}
