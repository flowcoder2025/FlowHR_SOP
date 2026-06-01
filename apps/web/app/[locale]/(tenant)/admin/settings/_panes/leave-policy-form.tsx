'use client';

import { Button, Card, CardTitle, Input } from '@flowhr/ui';
import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import type { PendingChangeSummary } from '@/lib/tenant-settings/queries';
import { SAVE_INIT, saveLeavePolicyAction } from '../actions';
import { PendingChangeList } from '../_components/pending-change-list';
import { PermissionState } from '../_components/permission-state';
import { SettingsActionBar } from '../_components/settings-action-bar';

interface LeaveTypeData {
  key: string;
  label_ko: string | null;
  default_days: number;
  is_paid: boolean;
  carryover_allowed: boolean;
  evidence_required: boolean;
  sort_order: number;
}

interface LeaveRow {
  key: string;
  label_ko: string;
  default_days: number;
  is_paid: boolean;
  carryover_allowed: boolean;
  evidence_required: boolean;
  sort_order: number;
  /** 신규 행만 key 편집 가능(기존 key 는 immutable — DB upsert 대상). */
  _isNew: boolean;
}

function toRow(d: LeaveTypeData): LeaveRow {
  return {
    key: d.key,
    label_ko: d.label_ko ?? '',
    default_days: d.default_days ?? 0,
    is_paid: Boolean(d.is_paid),
    carryover_allowed: Boolean(d.carryover_allowed),
    evidence_required: Boolean(d.evidence_required),
    sort_order: d.sort_order ?? 0,
    _isNew: false,
  };
}

/** 3. 휴가정책 탭 — leave_types 인라인 테이블 편집. 원본에서 빠진 key 는 delete_keys 로 삭제. */
export function LeavePolicyForm({
  editable,
  data,
  pending,
}: {
  editable: boolean;
  data: unknown;
  pending: PendingChangeSummary[];
}) {
  const t = useTranslations('screens.ta-13.leave');
  const [state, formAction, submitting] = useActionState(saveLeavePolicyAction, SAVE_INIT);

  const initial = (((data as { leave_types?: LeaveTypeData[] } | null)?.leave_types ?? []) as LeaveTypeData[]).map(toRow);
  // 원본 key 는 제출 시 서버가 DB(RLS)에서 권위 조회해 delete_keys 를 산출한다(클라 위조 차단).
  const [rows, setRows] = useState<LeaveRow[]>(initial);

  const update = (i: number, patch: Partial<LeaveRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const add = () =>
    setRows((rs) => [
      ...rs,
      {
        key: '',
        label_ko: '',
        default_days: 0,
        is_paid: true,
        carryover_allowed: false,
        evidence_required: false,
        sort_order: rs.length,
        _isNew: true,
      },
    ]);

  return (
    <Card className="flex flex-col">
      <CardTitle>{t('section')}</CardTitle>
      <form action={formAction} className="mt-2 flex flex-col">
        <input type="hidden" name="leave_types_json" value={JSON.stringify(rows)} />

        {rows.length === 0 ? (
          <p className="py-4 text-[13px] text-text-muted">{t('empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[12px] text-text-muted">
                  <th className="py-2 pr-2 font-medium">{t('key')}</th>
                  <th className="pr-2 font-medium">{t('label_ko')}</th>
                  <th className="pr-2 font-medium">{t('default_days')}</th>
                  <th className="px-1 text-center font-medium">{t('is_paid')}</th>
                  <th className="px-1 text-center font-medium">{t('carryover_allowed')}</th>
                  <th className="px-1 text-center font-medium">{t('evidence_required')}</th>
                  <th className="pr-2 font-medium">{t('sort_order')}</th>
                  <th aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 align-middle">
                    <td className="py-1.5 pr-2">
                      <Input
                        aria-label={t('key')}
                        value={row.key}
                        onChange={(e) => update(i, { key: e.currentTarget.value })}
                        disabled={!editable || !row._isNew}
                        placeholder={t('key_placeholder')}
                        className="h-9 min-w-[110px]"
                      />
                    </td>
                    <td className="pr-2">
                      <Input
                        aria-label={t('label_ko')}
                        value={row.label_ko}
                        onChange={(e) => update(i, { label_ko: e.currentTarget.value })}
                        disabled={!editable}
                        placeholder={t('label_placeholder')}
                        className="h-9 min-w-[120px]"
                      />
                    </td>
                    <td className="pr-2">
                      <Input
                        aria-label={t('default_days')}
                        type="number"
                        min={0}
                        max={365}
                        value={row.default_days}
                        onChange={(e) => update(i, { default_days: e.currentTarget.valueAsNumber || 0 })}
                        disabled={!editable}
                        className="h-9 w-20"
                      />
                    </td>
                    <td className="px-1 text-center">
                      <input
                        type="checkbox"
                        aria-label={t('is_paid')}
                        checked={row.is_paid}
                        onChange={(e) => update(i, { is_paid: e.currentTarget.checked })}
                        disabled={!editable}
                      />
                    </td>
                    <td className="px-1 text-center">
                      <input
                        type="checkbox"
                        aria-label={t('carryover_allowed')}
                        checked={row.carryover_allowed}
                        onChange={(e) => update(i, { carryover_allowed: e.currentTarget.checked })}
                        disabled={!editable}
                      />
                    </td>
                    <td className="px-1 text-center">
                      <input
                        type="checkbox"
                        aria-label={t('evidence_required')}
                        checked={row.evidence_required}
                        onChange={(e) => update(i, { evidence_required: e.currentTarget.checked })}
                        disabled={!editable}
                      />
                    </td>
                    <td className="pr-2">
                      <Input
                        aria-label={t('sort_order')}
                        type="number"
                        min={0}
                        max={9999}
                        value={row.sort_order}
                        onChange={(e) => update(i, { sort_order: e.currentTarget.valueAsNumber || 0 })}
                        disabled={!editable}
                        className="h-9 w-16"
                      />
                    </td>
                    <td className="text-right">
                      {editable && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-danger"
                          onClick={() => remove(i)}
                        >
                          {t('remove')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editable && (
          <div className="mt-3 flex flex-col gap-1">
            <Button type="button" variant="secondary" size="sm" className="self-start" onClick={add}>
              + {t('add')}
            </Button>
            <p className="text-[12px] text-text-muted">{t('key_immutable_hint')}</p>
            <p className="text-[12px] text-text-muted">{t('delete_warning')}</p>
          </div>
        )}

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
