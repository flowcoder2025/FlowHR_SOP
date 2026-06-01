'use client';

import { Alert, Card, CardSubtitle, CardTitle } from '@flowhr/ui';
import type { ReactNode } from 'react';
import type { StepProps } from '../wizard-client';
import { calcBilling } from '@/lib/operator/tenant-registration/wizard';

function krw(n: number): string {
  return `₩${new Intl.NumberFormat('ko-KR').format(n)}`;
}

/** 7단계 — 검토. 입력 요약(read-only) + 등록 후 동작 안내. 등록은 nav 의 "등록 완료"로. */
export function StepReview({ t, form, selectedPlan }: StepProps) {
  const billing = calcBilling(selectedPlan, form.plan.user_limit, form.plan.billing_cycle);
  const modules = form.enabled_modules.map((m) => t(`modules.label.${m}`)).join(' · ');
  const adminCount = 1 + form.additional_admins.length;

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <CardTitle>{t('review.title')}</CardTitle>
        <CardSubtitle>{t('review.subtitle')}</CardSubtitle>
      </div>

      <table className="w-full border-collapse text-sm">
        <tbody>
          <Row label={t('review.company')} value={form.company.name} />
          <Row label={t('company.business_number')} value={form.company.business_number} />
          <Row
            label={t('review.domain')}
            value={<code className="font-mono text-[13px]">{form.slug}.flowhr.kr</code>}
          />
          <Row label={t('review.plan')} value={selectedPlan?.name ?? '—'} />
          <Row
            label={t('review.contract')}
            value={
              form.plan.contract_end_date
                ? `${form.plan.contract_start_date} ~ ${form.plan.contract_end_date} · ${form.plan.user_limit}${t('review.persons')}`
                : `${form.plan.contract_start_date} ~ · ${form.plan.user_limit}${t('review.persons')}`
            }
          />
          {selectedPlan && billing.users > 0 && (
            <Row
              label={t('review.billing')}
              value={
                <strong>
                  {krw(billing.monthly)} {t('plan.per_month')}
                </strong>
              }
            />
          )}
          <Row
            label={t('review.admin')}
            value={`${form.admin.name} · ${form.admin.email}${adminCount > 1 ? ` ${t('review.plus_admins', { n: adminCount - 1 })}` : ''}`}
          />
          <Row label={t('review.modules')} value={modules || '—'} />
          <Row
            label={t('review.initial_data')}
            value={t('review.initial_summary', {
              dept: form.departments.length,
              leave: form.leave_types.length,
              approval: form.approval_lines.length,
              doc: form.document_templates.length,
            })}
          />
        </tbody>
      </table>

      <Alert variant="info">{t('review.after_register')}</Alert>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <tr className="border-b border-border last:border-0">
      <th className="w-40 bg-surface-2 px-3 py-2 text-left text-[12px] font-semibold text-text-muted">
        {label}
      </th>
      <td className="px-3 py-2 text-text">{value}</td>
    </tr>
  );
}
