'use client';

import { Alert, Button, Input, Label } from '@flowhr/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import { verifyTwoFactorAction, type TwoFactorState } from './actions';

const INITIAL: TwoFactorState = { status: 'idle' };

export function TwoFactorForm() {
  const t = useTranslations('auth.two_fa');
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<TwoFactorState, FormData>(
    verifyTwoFactorAction.bind(null, locale),
    INITIAL,
  );
  const [recovery, setRecovery] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="mode" value={recovery ? 'recovery' : 'totp'} />

      {state.status === 'error' && (
        <Alert variant="danger">
          <span>
            {t(state.messageKey)}
            {typeof state.remaining === 'number' && state.remaining > 0 && (
              <span className="ml-1 font-medium">
                {t('error.remaining', { count: state.remaining })}
              </span>
            )}
          </span>
        </Alert>
      )}

      {recovery ? (
        <div key="recovery">
          <Label htmlFor="code" required>
            {t('recovery_label')}
          </Label>
          <Input
            id="code"
            name="code"
            autoComplete="one-time-code"
            placeholder="XXXX-XXXX"
            className="text-center font-mono uppercase tracking-widest"
            autoFocus
            required
          />
          <p className="mt-1.5 text-[13px] text-text-muted">{t('recovery_one_time')}</p>
        </div>
      ) : (
        <div key="totp">
          <Label htmlFor="code" required>
            {t('code_label')}
          </Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="\d{6}"
            placeholder="000000"
            className="text-center text-lg tracking-[0.5em]"
            autoFocus
            required
          />
          <p className="mt-1.5 text-[13px] text-text-muted">{t('code_refresh')}</p>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t('submitting') : t('submit')}
      </Button>

      <button
        type="button"
        onClick={() => setRecovery((v) => !v)}
        className="text-center text-[13px] font-medium text-accent hover:underline"
      >
        {recovery ? t('use_totp_link') : t('recovery_link')}
      </button>
    </form>
  );
}
