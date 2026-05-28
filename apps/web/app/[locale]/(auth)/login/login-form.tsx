'use client';

import { Alert, Button, Input, Label } from '@flowhr/ui';
import { Eye, EyeOff } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import { Link } from '../../../../i18n/navigation';
import { loginAction, type LoginState } from './actions';

const INITIAL: LoginState = { status: 'idle' };

export function LoginForm() {
  const t = useTranslations('auth.login');
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction.bind(null, locale),
    INITIAL,
  );
  const [showPassword, setShowPassword] = useState(false);
  const isLocked = state.status === 'locked';

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.status === 'error' && (
        <Alert variant="danger">
          <span>
            {t(state.messageKey)}
            {typeof state.remaining === 'number' && state.remaining > 0 && (
              <span className="ml-1 font-medium">{t('error.remaining', { count: state.remaining })}</span>
            )}
          </span>
        </Alert>
      )}
      {isLocked && (
        <Alert variant="warning">
          {t('error.locked', { minutes: Math.ceil(state.retryAfterSeconds / 60) })}
        </Alert>
      )}

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
          disabled={isLocked}
        />
      </div>

      <div>
        <Label htmlFor="password" required>
          {t('password')}
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="pr-10"
            required
            disabled={isLocked}
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
      </div>

      <div className="flex items-center justify-between text-[13px]">
        <label className="flex cursor-pointer items-center gap-2 text-text-muted">
          <input
            type="checkbox"
            name="rememberMe"
            className="h-4 w-4 rounded border-border accent-accent"
          />
          {t('remember')}
        </label>
        <Link
          href="/forgot-password"
          prefetch={false}
          className="font-medium text-accent hover:underline"
        >
          {t('forgot')}
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending || isLocked}>
        {pending ? t('submitting') : t('submit')}
      </Button>

      <p className="text-center text-[13px] text-text-muted">
        {t('activate_prompt')}{' '}
        <Link href="/activate" prefetch={false} className="font-medium text-accent hover:underline">
          {t('activate_invite')}
        </Link>
      </p>
    </form>
  );
}
