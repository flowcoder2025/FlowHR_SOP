import { SETTING_TABS, type SettingTab } from './permissions';

/**
 * TA-13 설정 화면 탭 메타 (WI-033) — 순수 헬퍼(server/client 공용).
 * 탭 순서/식별자는 `./permissions` SETTING_TABS 가 SSOT. 본 모듈은 URL ?tab= 검증만 담당한다.
 * (permissions.ts 는 server-only 가 아니므로 client 컴포넌트에서도 안전하게 import 가능.)
 */

export { SETTING_TABS };
export type { SettingTab };

const TAB_SET: ReadonlySet<string> = new Set<string>(SETTING_TABS);

export function isSettingTab(raw: string | null | undefined): raw is SettingTab {
  return typeof raw === 'string' && TAB_SET.has(raw);
}

/** URL ?tab= 값을 검증해 초기 탭으로 해석. 유효하지 않으면 첫 탭(company). */
export function resolveInitialTab(raw: string | null | undefined): SettingTab {
  return isSettingTab(raw) ? raw : SETTING_TABS[0];
}
