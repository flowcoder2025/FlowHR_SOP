'use client';

import { Alert, Button } from '@flowhr/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { SaveState } from '../actions';

/**
 * 탭별 저장 + 즉시/예약 적용 시점 컨트롤 (TA-13 P0 편집 폼 공통).
 * 폼(<form action={...}>) 자식으로 두어 apply_mode/apply_at 을 FormData 에 함께 제출한다.
 * patchTenantSetting 이 tab 단위이므로 페이지 전역이 아닌 탭별로 배치한다(codex 협의).
 */
export function SettingsActionBar({ pending, state }: { pending: boolean; state: SaveState }) {
  const t = useTranslations('screens.ta-13.action');
  const [mode, setMode] = useState<'now' | 'scheduled'>('now');

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
      {state.status === 'success' && (
        <Alert variant="success">
          {t(
            state.result === 'scheduled'
              ? 'saved_scheduled'
              : state.result === 'applied'
                ? 'saved_now'
                : 'saved_pending',
          )}
        </Alert>
      )}
      {state.status === 'error' && (
        <Alert variant="danger">{t(state.messageKey.replace('action.', '') as 'save_failed')}</Alert>
      )}

      <fieldset className="flex flex-wrap items-center gap-4">
        <legend className="mb-1 text-[12px] font-medium text-text-muted">{t('timing_label')}</legend>
        <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-text">
          <input
            type="radio"
            name="apply_mode"
            value="now"
            checked={mode === 'now'}
            onChange={() => setMode('now')}
          />
          {t('now')}
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-text">
          <input
            type="radio"
            name="apply_mode"
            value="scheduled"
            checked={mode === 'scheduled'}
            onChange={() => setMode('scheduled')}
          />
          {t('scheduled')}
        </label>
        {mode === 'scheduled' && (
          <label className="flex flex-col gap-1 text-[12px] text-text-muted">
            {t('apply_at_label')}
            <input
              type="datetime-local"
              name="apply_at"
              required
              className="rounded-md border border-border bg-bg px-2 py-1 text-[13px] text-text"
            />
          </label>
        )}
      </fieldset>
      {mode === 'scheduled' && <p className="text-[12px] text-text-muted">{t('apply_at_hint')}</p>}

      <Button type="submit" variant="primary" disabled={pending} className="self-start">
        {pending ? t('saving') : t(mode === 'scheduled' ? 'save_scheduled' : 'save')}
      </Button>
    </div>
  );
}
