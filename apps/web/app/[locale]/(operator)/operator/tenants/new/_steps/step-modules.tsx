'use client';

import { Card, CardSubtitle, CardTitle } from '@flowhr/ui';
import { cn } from '@flowhr/ui';
import type { TenantModule } from '@flowhr/schemas';
import type { StepProps } from '../wizard-client';
import { modulesForPlan } from '@/lib/operator/tenant-registration/wizard';

/** 5단계 — 모듈 선택. plan 이 지원하는 모듈(plan.modules subset)만 토글 노출(서버 P0111 정합). */
export function StepModules({ t, form, update, selectedPlan }: StepProps) {
  const available = modulesForPlan(selectedPlan);
  const enabled = new Set(form.enabled_modules);

  const toggle = (m: TenantModule) =>
    update((f) => {
      const has = f.enabled_modules.includes(m);
      return {
        ...f,
        enabled_modules: has
          ? f.enabled_modules.filter((x) => x !== m)
          : [...f.enabled_modules, m],
      };
    });

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <CardTitle>{t('modules.title')}</CardTitle>
        <CardSubtitle>{t('modules.subtitle')}</CardSubtitle>
      </div>

      {available.length === 0 ? (
        <p className="text-[12px] text-text-muted">{t('modules.none')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {available.map((m) => {
            const on = enabled.has(m);
            return (
              <button
                key={m}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => toggle(m)}
                className={cn(
                  'flex items-center justify-between rounded-md border p-3 text-left transition-colors',
                  on ? 'border-accent bg-accent-bg' : 'border-border hover:bg-surface-2',
                )}
              >
                <span>
                  <span className="block text-sm font-medium text-text">{t(`modules.label.${m}`)}</span>
                  <span className="block text-[12px] text-text-muted">{t(`modules.desc.${m}`)}</span>
                </span>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[12px] font-semibold',
                    on ? 'bg-success text-white' : 'bg-surface-2 text-text-muted',
                  )}
                >
                  {on ? t('modules.on') : t('modules.off')}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
