'use client';

import { passwordRules } from '@flowhr/schemas';
import { Alert, Button, Input, Label } from '@flowhr/ui';
import { Check, Eye, EyeOff, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import { resetPasswordAction, type ResetState } from './actions';

const INITIAL: ResetState = { status: 'idle' };

function PolicyChecklist({ value }: { value: string }) {
  const t = useTranslations('auth.password');
  return (
    <ul className="flex flex-col gap-1" aria-label={t('policy_title')}>
      {passwordRules.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.key}
            className={`flex items-center gap-1.5 text-[13px] ${met ? 'text-success' : 'text-text-muted'}`}
          >
            {met ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
            {t(`rule.${rule.key}`)}
          </li>
        );
      })}
    </ul>
  );
}

export function ResetForm() {
  const t = useTranslations('auth.reset');
  const tp = useTranslations('auth.password');
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    resetPasswordAction.bind(null, locale),
    INITIAL,
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.status === 'error' && <Alert variant="danger">{t(state.messageKey)}</Alert>}

      <div>
        <Label htmlFor="newPassword" required>
          {t('new_password')}
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className="pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={t(showPassword ? 'hide_password' : 'show_password')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:text-text"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="mt-2 rounded-md border border-border bg-surface p-3">
          <p className="mb-1.5 text-[13px] font-medium text-text">{tp('policy_title')}</p>
          <PolicyChecklist value={password} />
        </div>
      </div>

      <div>
        <Label htmlFor="confirmPassword" required>
          {t('confirm_password')}
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
        />
      </div>

      <Alert variant="warning">{t('session_warning')}</Alert>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
