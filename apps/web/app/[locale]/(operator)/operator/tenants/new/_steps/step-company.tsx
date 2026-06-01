'use client';

import { Card, CardSubtitle, CardTitle } from '@flowhr/ui';
import type { StepProps } from '../wizard-client';
import { AsyncStatus } from '../_components/async-status';
import { TextField } from '../_components/field';

/** 1단계 — 회사정보. 사업자번호는 실시간 형식/중복 검증(businessCheck). */
export function StepCompany({ t, form, update, businessCheck }: StepProps) {
  const c = form.company;
  const set = (patch: Partial<typeof c>) =>
    update((f) => ({ ...f, company: { ...f.company, ...patch } }));

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <CardTitle>{t('company.title')}</CardTitle>
        <CardSubtitle>{t('company.subtitle')}</CardSubtitle>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="company-name"
          label={t('company.name')}
          value={c.name}
          onChange={(v) => set({ name: v })}
          placeholder={t('company.name_placeholder')}
          required
        />
        <TextField
          id="company-business-number"
          label={t('company.business_number')}
          value={c.business_number}
          onChange={(v) => set({ business_number: v })}
          placeholder="123-45-67890"
          inputMode="numeric"
          required
          status={<AsyncStatus snap={businessCheck} />}
        />
        <TextField
          id="company-representative"
          label={t('company.representative_name')}
          value={c.representative_name}
          onChange={(v) => set({ representative_name: v })}
          required
        />
        <TextField
          id="company-industry"
          label={t('company.industry')}
          value={c.industry}
          onChange={(v) => set({ industry: v })}
          placeholder={t('company.industry_placeholder')}
        />
        <div className="sm:col-span-2">
          <TextField
            id="company-address"
            label={t('company.address')}
            value={c.address}
            onChange={(v) => set({ address: v })}
            placeholder={t('company.address_placeholder')}
          />
        </div>
        <TextField
          id="company-phone"
          label={t('company.phone')}
          value={c.phone}
          onChange={(v) => set({ phone: v })}
          placeholder="02-1234-5678"
          inputMode="tel"
        />
        <TextField
          id="company-logo-url"
          label={t('company.logo_url')}
          value={c.logo_url}
          onChange={(v) => set({ logo_url: v })}
          type="url"
          placeholder="https://"
        />
      </div>
    </Card>
  );
}
