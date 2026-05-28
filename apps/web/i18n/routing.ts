import { defaultLocale, locales } from '@flowhr/i18n';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
});
