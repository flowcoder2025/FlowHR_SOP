'use client';

import { passwordRules } from '@flowhr/schemas';
import { Alert, Button, Input, Label } from '@flowhr/ui';
import { Check, Eye, EyeOff, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import { Link } from '../../../../i18n/navigation';
import { activateAction, type ActivateState } from './actions';

const INITIAL: ActivateState = { status: 'idle' };

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

export function ActivateForm({ token }: { token: string }) {
  const t = useTranslations('auth.activate');
  const tp = useTranslations('auth.password');
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<ActivateState, FormData>(
    activateAction.bind(null, locale, token),
    INITIAL,
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.status === 'error' && <Alert variant="danger">{t(state.messageKey)}</Alert>}

      <div>
        <Label htmlFor="newPassword" required>
          {t('field_password')}
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
          {t('field_confirm')}
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-[13px] text-text">
        <input type="checkbox" name="agree" className="mt-0.5 h-4 w-4 rounded border-border accent-accent" required />
        <span>
          {t('agree_label')}{' '}
          <Link href="/legal/terms" prefetch={false} className="text-accent hover:underline">
            {t('agree_terms')}
          </Link>{' '}·{' '}
          <Link href="/legal/privacy" prefetch={false} className="text-accent hover:underline">
            {t('agree_privacy')}
          </Link>
        </span>
      </label>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
