'use client';

import { Button } from '@flowhr/ui';
import { useLocale, useTranslations } from 'next-intl';
import { logoutAction } from '@/lib/actions/logout';

export function LogoutButton() {
  const t = useTranslations('app');
  const locale = useLocale();
  return (
    <form action={logoutAction.bind(null, locale)}>
      <Button type="submit" variant="secondary" size="sm">
        {t('logout')}
      </Button>
    </form>
  );
}
