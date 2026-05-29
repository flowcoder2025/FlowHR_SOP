import { loadMessages, type Locale } from '@flowhr/i18n';
import { describe, expect, it } from 'vitest';

// WI-020-4 회귀 가드: forgot/reset 폼은 useTranslations(<네임스페이스>) 로 messageKey 를 해석한다.
// action/schema 가 전체경로 키를 반환하면 next-intl 이 <네임스페이스>.<전체경로> 로 이어붙여
// MISSING_MESSAGE → 원시 키가 사용자에게 노출된다(evaluator P2). 폼이 실제로 사용하는
// (네임스페이스 + 상대 키) 조합이 두 locale 모두에서 문자열로 해소되는지 검증한다.
const CONTRACT: { ns: string; keys: string[] }[] = [
  // forgot-form: useTranslations('auth.forgot') + t(state.messageKey)
  { ns: 'auth.forgot', keys: ['error.invalid'] },
  // reset-form: useTranslations('auth.reset') + t(state.messageKey)
  {
    ns: 'auth.reset',
    keys: ['error.mismatch', 'error.weak_password', 'error.session_invalid', 'error.update_failed'],
  },
  // reset-form PolicyChecklist: useTranslations('auth.password')
  {
    ns: 'auth.password',
    keys: ['policy_title', 'rule.length', 'rule.lower', 'rule.upper', 'rule.digit', 'rule.special'],
  },
  // login page: useTranslations('auth.login') reset=success 배너
  { ns: 'auth.login', keys: ['reset_success'] },
];

function resolve(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj);
}

describe('비밀번호 재설정 i18n 키 해소 (폼 네임스페이스 + messageKey)', () => {
  const locales: Locale[] = ['ko', 'en'];
  for (const locale of locales) {
    it(`${locale}: 폼이 사용하는 모든 (네임스페이스+키) 조합이 비어있지 않은 문자열로 해소`, async () => {
      const messages = await loadMessages(locale);
      for (const { ns, keys } of CONTRACT) {
        for (const key of keys) {
          const value = resolve(messages, `${ns}.${key}`);
          expect(typeof value, `${locale} ${ns}.${key} (type)`).toBe('string');
          expect((value as string).length, `${locale} ${ns}.${key} (empty)`).toBeGreaterThan(0);
        }
      }
    });
  }
});
