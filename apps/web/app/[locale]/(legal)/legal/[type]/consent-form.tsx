'use client';

import { Alert, Button } from '@flowhr/ui';
import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import { LogoutButton } from '@/components/logout-button';
import { submitConsentAction, type ConsentFormState } from './consent-action';

const INITIAL: ConsentFormState = { status: 'idle' };

/** 강제 동의 폼 (force_consent / new_version). 체크 후에만 제출 활성, 거부 시 로그아웃. */
export function ConsentForm({
  documentId,
  returnUrl,
  locale,
}: {
  documentId: string;
  returnUrl: string | null;
  locale: string;
}) {
  const t = useTranslations('legal');
  const [checked, setChecked] = useState(false);
  const [state, formAction, pending] = useActionState<ConsentFormState, FormData>(
    submitConsentAction.bind(null, documentId, returnUrl, locale),
    INITIAL,
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      {state.status === 'error' && <Alert variant="danger">{t('consent_error')}</Alert>}
      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex items-start gap-2 text-sm text-text">
          <input
            type="checkbox"
            name="agree"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
          />
          <span>{t('consent_required')}</span>
        </label>
        <div className="flex justify-end">
          <Button type="submit" disabled={!checked || pending}>
            {pending ? t('consenting') : t('consent_submit')}
          </Button>
        </div>
      </form>
      <div className="flex justify-end border-t border-border pt-2">
        <LogoutButton />
      </div>
    </div>
  );
}
