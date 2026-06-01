'use client';

import { Card, CardTitle, Input, Label } from '@flowhr/ui';
import { useTranslations } from 'next-intl';
import { useActionState } from 'react';
import type { PendingChangeSummary } from '@/lib/tenant-settings/queries';
import { SAVE_INIT, saveCompanyAction } from '../actions';
import { PendingChangeList } from '../_components/pending-change-list';
import { PermissionState } from '../_components/permission-state';
import { SettingsActionBar } from '../_components/settings-action-bar';

interface CompanyInfo {
  company_name?: string;
  ceo_name?: string;
  contact?: string;
  email?: string;
  address?: string;
  industry?: string;
  logo_url?: string;
}

/** 1. 회사정보 탭 — company_info(full-replace). 빈 필드는 저장 시 제외(form-data.ts). */
export function CompanyForm({
  editable,
  data,
  pending,
}: {
  editable: boolean;
  data: unknown;
  pending: PendingChangeSummary[];
}) {
  const t = useTranslations('screens.ta-13.company');
  const [state, formAction, submitting] = useActionState(saveCompanyAction, SAVE_INIT);
  const info = (data ?? {}) as CompanyInfo;

  return (
    <Card className="flex flex-col">
      <CardTitle>{t('section')}</CardTitle>
      <form action={formAction} className="mt-2 flex flex-col">
        <fieldset disabled={!editable} className="flex flex-col gap-4">
          <Field name="company_name" label={t('name')} defaultValue={info.company_name} placeholder={t('name_placeholder')} />
          <Field name="ceo_name" label={t('ceo_name')} defaultValue={info.ceo_name} />
          <Field name="contact" label={t('contact')} defaultValue={info.contact} placeholder={t('contact_placeholder')} />
          <Field name="email" type="email" label={t('email')} defaultValue={info.email} placeholder={t('email_placeholder')} />
          <Field name="address" label={t('address')} defaultValue={info.address} />
          <Field name="industry" label={t('industry')} defaultValue={info.industry} />
          <Field name="logo_url" type="url" label={t('logo_url')} defaultValue={info.logo_url} placeholder={t('logo_url_placeholder')} />
        </fieldset>
        {editable ? (
          <SettingsActionBar pending={submitting} state={state} />
        ) : (
          <div className="mt-5">
            <PermissionState kind="read_only" />
          </div>
        )}
      </form>
      <PendingChangeList items={pending} />
    </Card>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = 'text',
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ''} placeholder={placeholder} />
    </div>
  );
}
