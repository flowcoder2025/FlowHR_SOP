'use client';

import { Card, CardSubtitle, CardTitle, DomainPrefixInput, Label } from '@flowhr/ui';
import type { StepProps } from '../wizard-client';
import { AsyncStatus } from '../_components/async-status';

/** 2단계 — 도메인 슬러그. `{slug}.flowhr.kr` 실시간 형식/예약어/중복 검증(domainCheck). */
export function StepDomain({ t, form, update, domainCheck }: StepProps) {
  return (
    <Card className="flex flex-col gap-5">
      <div>
        <CardTitle>{t('domain.title')}</CardTitle>
        <CardSubtitle>{t('domain.subtitle')}</CardSubtitle>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="tenant-slug">
          {t('domain.slug')}
          <span className="ml-0.5 text-danger">*</span>
        </Label>
        <DomainPrefixInput
          id="tenant-slug"
          name="tenant-slug"
          suffix=".flowhr.kr"
          value={form.slug}
          inputMode="text"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="chicken-shop"
          onChange={(e) => update((f) => ({ ...f, slug: e.target.value }))}
        />
        <AsyncStatus snap={domainCheck} />
        <p className="text-[12px] text-text-muted">{t('domain.hint')}</p>
      </div>
    </Card>
  );
}
