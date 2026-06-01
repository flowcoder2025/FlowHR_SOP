'use client';

import { Button, Card, CardSubtitle, CardTitle } from '@flowhr/ui';
import type { StepProps } from '../wizard-client';
import { AsyncStatus } from '../_components/async-status';
import { TextField } from '../_components/field';

const MAX_ADDITIONAL = 3;

/** 4단계 — 관리자 계정. 대표 관리자(tenant_super) + 추가 관리자(tenant_hr_admin) 최대 3명. */
export function StepAdmin({ t, form, update, adminEmailCheck }: StepProps) {
  const a = form.admin;
  const setAdmin = (patch: Partial<typeof a>) =>
    update((f) => ({ ...f, admin: { ...f.admin, ...patch } }));

  const addAdditional = () =>
    update((f) =>
      f.additional_admins.length >= MAX_ADDITIONAL
        ? f
        : {
            ...f,
            additional_admins: [
              ...f.additional_admins,
              { ui_id: globalThis.crypto.randomUUID(), email: '', name: '' },
            ],
          },
    );

  const updateAdditional = (uiId: string, patch: { email?: string; name?: string }) =>
    update((f) => ({
      ...f,
      additional_admins: f.additional_admins.map((x) => (x.ui_id === uiId ? { ...x, ...patch } : x)),
    }));

  const removeAdditional = (uiId: string) =>
    update((f) => ({
      ...f,
      additional_admins: f.additional_admins.filter((x) => x.ui_id !== uiId),
    }));

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <CardTitle>{t('admin.title')}</CardTitle>
        <CardSubtitle>{t('admin.subtitle')}</CardSubtitle>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="admin-email"
          label={t('admin.email')}
          type="email"
          inputMode="email"
          value={a.email}
          onChange={(v) => setAdmin({ email: v })}
          required
          status={<AsyncStatus snap={adminEmailCheck} />}
        />
        <TextField
          id="admin-name"
          label={t('admin.name')}
          value={a.name}
          onChange={(v) => setAdmin({ name: v })}
          required
        />
        <TextField
          id="admin-phone"
          label={t('admin.phone')}
          inputMode="tel"
          value={a.phone}
          onChange={(v) => setAdmin({ phone: v })}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text">{t('admin.additional_title')}</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={form.additional_admins.length >= MAX_ADDITIONAL}
            onClick={addAdditional}
          >
            {t('admin.add')}
          </Button>
        </div>

        {form.additional_admins.length === 0 ? (
          <p className="text-[12px] text-text-muted">{t('admin.additional_empty')}</p>
        ) : (
          form.additional_admins.map((adm, i) => (
            <div key={adm.ui_id} className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <TextField
                id={`additional-email-${i}`}
                label={t('admin.email')}
                type="email"
                inputMode="email"
                value={adm.email}
                onChange={(v) => updateAdditional(adm.ui_id, { email: v })}
                required
              />
              <TextField
                id={`additional-name-${i}`}
                label={t('admin.name')}
                value={adm.name}
                onChange={(v) => updateAdditional(adm.ui_id, { name: v })}
                required
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeAdditional(adm.ui_id)}
                aria-label={t('admin.remove')}
              >
                {t('admin.remove')}
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
