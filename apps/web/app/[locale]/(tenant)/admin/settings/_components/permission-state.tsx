'use client';

import { Alert } from '@flowhr/ui';
import { useTranslations } from 'next-intl';

/** 조회 전용/권한 없음/super 전용 안내 박스 (TA-13 read-only 탭 공통). */
export function PermissionState({ kind }: { kind: 'none' | 'read_only' | 'super_only' }) {
  const t = useTranslations('screens.ta-13.permission');
  return <Alert variant="info">{t(kind)}</Alert>;
}
