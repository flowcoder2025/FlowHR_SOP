'use client';

import { Card, CardSubtitle, CardTitle } from '@flowhr/ui';
import { cn } from '@flowhr/ui';
import type { StepProps } from '../wizard-client';
import { TextField } from '../_components/field';
import { calcBilling } from '@/lib/operator/tenant-registration/wizard';

function krw(n: number): string {
  return `₩${new Intl.NumberFormat('ko-KR').format(n)}`;
}

/** 3단계 — 요금제 + 계약 조건. plan 은 fetched 목록만(위조 plan_id 차단), 가격은 등록 시점 latch(RPC). */
export function StepPlan({ t, form, update, plans, selectedPlan }: StepProps) {
  const p = form.plan;
  const setPlan = (patch: Partial<typeof p>) =>
    update((f) => ({ ...f, plan: { ...f.plan, ...patch } }));

  const onSelectPlan = (planId: string) => {
    // plan 변경 시 enabled_modules 를 새 plan 지원 모듈 subset 으로 축소(서버 P0111 사전 차단).
    const next = plans.find((pl) => pl.id === planId);
    const supported = new Set(next?.modules ?? []);
    update((f) => ({
      ...f,
      plan: { ...f.plan, plan_id: planId },
      enabled_modules: f.enabled_modules.filter((m) => supported.has(m)),
    }));
  };

  const billing = calcBilling(selectedPlan, p.user_limit, p.billing_cycle);

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <CardTitle>{t('plan.title')}</CardTitle>
        <CardSubtitle>{t('plan.subtitle')}</CardSubtitle>
      </div>

      <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label={t('plan.title')}>
        {plans.map((plan) => {
          const active = plan.id === p.plan_id;
          return (
            <button
              key={plan.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectPlan(plan.id)}
              className={cn(
                'flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors',
                active ? 'border-accent bg-accent-bg' : 'border-border hover:bg-surface-2',
              )}
            >
              <span className="text-sm font-semibold text-text">{plan.name}</span>
              <span className="text-lg font-bold text-text">
                {plan.perUserPriceKrw != null ? (
                  <>
                    {krw(plan.perUserPriceKrw)}
                    <span className="text-[12px] font-normal text-text-muted"> {t('plan.per_user')}</span>
                  </>
                ) : (
                  t('plan.negotiable')
                )}
              </span>
              {plan.includedUsers != null && (
                <span className="text-[12px] text-text-muted">
                  {t('plan.included_users', { n: plan.includedUsers })}
                </span>
              )}
              <span className="text-[12px] text-text-muted">
                {t('plan.modules_count', { n: plan.modules.length })}
              </span>
            </button>
          );
        })}
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField
          id="contract-start"
          label={t('plan.contract_start')}
          type="date"
          value={p.contract_start_date}
          onChange={(v) => setPlan({ contract_start_date: v })}
          required
        />
        <TextField
          id="contract-end"
          label={t('plan.contract_end')}
          type="date"
          value={p.contract_end_date}
          onChange={(v) => setPlan({ contract_end_date: v })}
        />
        <TextField
          id="user-limit"
          label={t('plan.user_limit')}
          type="number"
          min={1}
          inputMode="numeric"
          value={p.user_limit}
          onChange={(v) => setPlan({ user_limit: v })}
          required
        />
      </div>

      <fieldset className="flex flex-wrap items-center gap-4">
        <legend className="mb-1 text-[12px] font-medium text-text-muted">{t('plan.billing_cycle')}</legend>
        {(['monthly', 'annual'] as const).map((cycle) => (
          <label key={cycle} className="flex cursor-pointer items-center gap-1.5 text-[13px] text-text">
            <input
              type="radio"
              name="billing-cycle"
              value={cycle}
              checked={p.billing_cycle === cycle}
              onChange={() => setPlan({ billing_cycle: cycle })}
            />
            {t(`plan.cycle.${cycle}`)}
          </label>
        ))}
      </fieldset>

      {selectedPlan && billing.users > 0 && (
        <div className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-text">
          <span className="font-medium">{t('plan.billing_label')}</span>{' '}
          <strong>{krw(billing.monthly)}</strong> {t('plan.per_month')}
          {billing.base > 0 && (
            <span className="text-text-muted">
              {' '}
              ({krw(billing.base)} + {krw(billing.perUser)} × {billing.users})
            </span>
          )}
          {billing.cycle === 'annual' && (
            <span className="ml-2 text-text-muted">
              · {t('plan.annual_label')} {krw(billing.annual)}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
