'use client';

import { useEffect, useState } from 'react';

export type PlatformKind = 'web' | 'pwa' | 'tauri';

export interface PlatformInfo {
  kind: PlatformKind;
  isStandalone: boolean;
  isTauri: boolean;
  isIOS: boolean;
}

const SSR_DEFAULT: PlatformInfo = {
  kind: 'web',
  isStandalone: false,
  isTauri: false,
  isIOS: false,
};

function detect(): PlatformInfo {
  if (typeof window === 'undefined') return SSR_DEFAULT;

  const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const kind: PlatformKind = isTauri ? 'tauri' : isStandalone ? 'pwa' : 'web';

  return { kind, isStandalone, isTauri, isIOS };
}

/** 현재 실행 환경(web/pwa/tauri) 감지. SSR-안전 기본값 후 마운트 시 재감지. */
export function usePlatform(): PlatformInfo {
  const [info, setInfo] = useState<PlatformInfo>(SSR_DEFAULT);

  useEffect(() => {
    setInfo(detect());
  }, []);

  return info;
}
