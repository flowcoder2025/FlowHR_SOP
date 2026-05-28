import type { AbstractIntlMessages } from 'next-intl';

export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ko';

/** 통화/시간대 고정 (한국 사업장 — 08-i18n.md). */
export const timeZone = 'Asia/Seoul';
export const currency = 'KRW';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** locale별 메시지 카탈로그 로더 (next-intl getRequestConfig에서 사용). */
export async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
  const mod = await import(`./locales/${locale}.json`);
  return mod.default as AbstractIntlMessages;
}
