'use client';

import { Button, Card, CardTitle, Input, Label } from '@flowhr/ui';
import { useTranslations } from 'next-intl';
import { useActionState, useRef, useState } from 'react';
import type { PendingChangeSummary } from '@/lib/tenant-settings/queries';
import { SAVE_INIT, saveApprovalLinesAction } from '../actions';
import { PendingChangeList } from '../_components/pending-change-list';
import { PermissionState } from '../_components/permission-state';
import { SettingsActionBar } from '../_components/settings-action-bar';

const APPROVAL_TYPES = ['leave', 'attendance_mod', 'certificate', 'change_request', 'document'] as const;

interface ApprovalLineData {
  id: string;
  name: string;
  request_type: string;
  conditions: unknown;
  default_line: unknown;
  is_active: boolean;
}

interface ApprovalRow {
  id?: string;
  name: string;
  request_type: string;
  is_active: boolean;
  /** 표시 전용 — 편집은 WI-034. 제출 시 서버가 원본에서 병합(form-data.ts). */
  conditions: unknown[];
}

/**
 * 4. 결재라인 탭 — name/request_type/is_active 기본 필드만 편집.
 * conditions/default_line 은 read-only(WI-034 조건 분기 엔진 소유) — 제출 시 원본 보존.
 */
export function ApprovalLinesForm({
  editable,
  data,
  pending,
}: {
  editable: boolean;
  data: unknown;
  pending: PendingChangeSummary[];
}) {
  const t = useTranslations('screens.ta-13.approval');
  const [state, formAction, submitting] = useActionState(saveApprovalLinesAction, SAVE_INIT);

  const initial = (Array.isArray(data) ? data : []) as ApprovalLineData[];
  // 조건/단계 원본 — 제출 시 id 매칭으로 병합 보존.
  const originalLines = useRef(
    initial.map((l) => ({ id: l.id, conditions: l.conditions, default_line: l.default_line })),
  ).current;
  const [lines, setLines] = useState<ApprovalRow[]>(
    initial.map((l) => ({
      id: l.id,
      name: l.name,
      request_type: l.request_type,
      is_active: l.is_active,
      conditions: Array.isArray(l.conditions) ? l.conditions : [],
    })),
  );

  const update = (i: number, patch: Partial<ApprovalRow>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const add = () =>
    setLines((ls) => [...ls, { name: '', request_type: 'leave', is_active: true, conditions: [] }]);

  // 제출 payload — conditions 제외(서버가 원본에서 병합).
  const submitLines = lines.map((l) => ({
    id: l.id,
    name: l.name,
    request_type: l.request_type,
    is_active: l.is_active,
  }));

  return (
    <Card className="flex flex-col">
      <CardTitle>{t('section')}</CardTitle>
      <form action={formAction} className="mt-2 flex flex-col gap-3">
        <input type="hidden" name="lines_json" value={JSON.stringify(submitLines)} />
        <input type="hidden" name="original_lines_json" value={JSON.stringify(originalLines)} />

        <p className="text-[12px] text-text-muted">{t('conditions_readonly')}</p>

        {lines.length === 0 ? (
          <p className="py-4 text-[13px] text-text-muted">{t('empty')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {lines.map((line, i) => {
              const condCount = line.conditions.length;
              return (
                <div
                  key={i}
                  className={`flex flex-col gap-3 rounded-md border border-border p-4 ${
                    line.is_active ? '' : 'opacity-60'
                  }`}
                >
                  <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                    <div>
                      <Label htmlFor={`approval-name-${i}`}>{t('name')}</Label>
                      <Input
                        id={`approval-name-${i}`}
                        value={line.name}
                        onChange={(e) => update(i, { name: e.currentTarget.value })}
                        disabled={!editable}
                        placeholder={t('name_placeholder')}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`approval-type-${i}`}>{t('request_type')}</Label>
                      <select
                        id={`approval-type-${i}`}
                        value={line.request_type}
                        onChange={(e) => update(i, { request_type: e.currentTarget.value })}
                        disabled={!editable}
                        className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70"
                      >
                        {APPROVAL_TYPES.map((rt) => (
                          <option key={rt} value={rt}>
                            {t(`type.${rt}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[12px] text-text-muted">
                      {condCount === 0 ? t('no_conditions') : t('condition_count', { count: condCount })}
                    </span>
                    <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-text">
                      <input
                        type="checkbox"
                        checked={line.is_active}
                        onChange={(e) => update(i, { is_active: e.currentTarget.checked })}
                        disabled={!editable}
                      />
                      {t('is_active')}
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {editable && (
          <Button type="button" variant="secondary" size="sm" className="self-start" onClick={add}>
            + {t('add')}
          </Button>
        )}

        {editable ? (
          <SettingsActionBar pending={submitting} state={state} />
        ) : (
          <div className="mt-2">
            <PermissionState kind="read_only" />
          </div>
        )}
      </form>
      <PendingChangeList items={pending} />
    </Card>
  );
}
