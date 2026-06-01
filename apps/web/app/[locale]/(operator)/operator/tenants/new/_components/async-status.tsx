'use client';

import { useTranslations } from 'next-intl';
import type { CheckSnapshot } from '../wizard-client';

/**
 * 실시간 중복검사 결과 인라인 표시 — checking / available / 사유별 불가(invalid_format/reserved/taken).
 * value 가 비어 idle 이면 표시하지 않는다.
 */
export function AsyncStatus({ snap }: { snap: CheckSnapshot }) {
  const t = useTranslations('screens.op-04.check');
  if (snap.phase === 'idle') return null;
  if (snap.phase === 'checking') {
    return <p className="text-[12px] text-text-muted">{t('checking')}</p>;
  }
  if (snap.available) {
    return <p className="text-[12px] font-medium text-success">{t('available')}</p>;
  }
  const reasonKey = snap.reason ?? 'taken';
  return <p className="text-[12px] font-medium text-danger">{t(`unavailable.${reasonKey}`)}</p>;
}
