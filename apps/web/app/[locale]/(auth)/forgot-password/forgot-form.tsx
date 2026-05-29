'use client';

import { Alert, Button, Input, Label } from '@flowhr/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState } from 'react';
import { Link } from '../../../../i18n/navigation';
import { forgotPasswordAction, type ForgotState } from './actions';

const INITIAL: ForgotState = { status: 'idle' };

export function ForgotForm() {
  const t = useTranslations('auth.forgot');
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<ForgotState, FormData>(
    forgotPasswordAction.bind(null, locale),
    INITIAL,
  );

  if (state.status === 'sent') {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success">{t('sent_desc')}</Alert>
        <p className="text-[13px] text-text-muted">{t('sent_hint')}</p>
        <Link href="/login" className="text-center text-sm font-medium text-accent hover:underline">
          {t('back_to_login')}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.status === 'error' && <Alert variant="danger">{t(state.messageKey)}</Alert>}

      <div>
        <Label htmlFor="email" required>
          {t('email')}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder={t('email_placeholder')}
          required
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t('submitting') : t('submit')}
      </Button>

      <Link href="/login" className="text-center text-sm font-medium text-accent hover:underline">
        {t('back_to_login')}
      </Link>
    </form>
  );
}
