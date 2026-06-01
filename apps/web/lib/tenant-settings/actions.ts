'use server';

import {
  type PatchableSettingTab,
  parseSettingPayload,
  settingsPatchInputSchema,
} from '@flowhr/schemas';
import type { Json } from '@flowhr/types';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@flowhr/api-client/server';
import { getSessionProfile } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/** PATCH /api/v1/tenant/settings/{tab} 결과. */
export type SettingsPatchResult =
  | {
      ok: true;
      id: string;
      /** applied=즉시 반영 완료 / scheduled=예약(미래 적용) / pending|applying=처리중 / failed=즉시 적용 실패(재시도 예약) */
      status: 'applied' | 'scheduled' | 'pending' | 'applying' | 'failed';
      errorMessage: string | null;
    }
  | { ok: false; error: 'unauthenticated' | 'forbidden' | 'invalid' | 'failed' };

/** PATCH 가능 + 관리자만 편집(scheduled_setting_changes INSERT RLS 경계와 정합). */
function canEditTab(role: string | null): boolean {
  return role === 'tenant_super' || role === 'tenant_hr_admin';
}

/**
 * 회사 설정 변경(즉시 또는 예약). full desired-state payload 를 scheduled_setting_changes 에 적재하고,
 * apply_at 이 현재 이하면 즉시 apply_one RPC(service_role)로 target 테이블에 반영한다.
 * 미래면 pending 으로 두고 pg_cron(run_due, 매분)이 도래 시 적용한다.
 *
 * - 큐 insert 는 사용자 세션 client — RLS(tenant_admin + created_by=auth.uid())가 방어선이고,
 *   audit_scheduled_setting_changes 트리거가 "변경 예약" 행위를 사용자 actor 로 자동 감사한다.
 * - 실제 적용(target 변경)은 service_role apply_one 이 수행하며, audit_row_change 가
 *   시스템 actor(app.audit_actor_* GUC, 예약자+system:scheduled-settings)로 감사한다(KI-110).
 */
export async function patchTenantSetting(input: unknown): Promise<SettingsPatchResult> {
  const parsedInput = settingsPatchInputSchema.safeParse(input);
  if (!parsedInput.success) return { ok: false, error: 'invalid' };
  const { tab, payload, apply_at } = parsedInput.data;

  // tab 별 payload 정밀 검증(settingsPatchInputSchema 는 payload 를 record 로만 받음).
  const parsedPayload = parseSettingPayload(tab as PatchableSettingTab, payload);
  if (!parsedPayload.success) return { ok: false, error: 'invalid' };

  const profile = await getSessionProfile();
  if (!profile) return { ok: false, error: 'unauthenticated' };
  if (!profile.tenantId || !canEditTab(profile.role)) return { ok: false, error: 'forbidden' };

  // 적용 시점: 미래(>now+1s)면 예약, 그 외(생략/과거/현재)는 즉시.
  // 즉시는 apply_at 을 1초 과거로 둬 app↔DB 시계 차로 인한 due 누락을 막는다.
  const requestedMs = apply_at ? Date.parse(apply_at) : Number.NaN;
  const isScheduled = Number.isFinite(requestedMs) && requestedMs > Date.now() + 1000;
  const applyAtIso = isScheduled
    ? new Date(requestedMs).toISOString()
    : new Date(Date.now() - 1000).toISOString();

  const supabase = await createSupabaseServerClient();
  const { data: inserted, error: insertError } = await supabase
    .from('scheduled_setting_changes')
    .insert({
      tenant_id: profile.tenantId,
      target: tab,
      payload: parsedPayload.data as Json,
      apply_at: applyAtIso,
      created_by: profile.user.id,
    })
    .select('id, status')
    .single();

  if (insertError || !inserted) {
    console.error('patchTenantSetting insert failed', insertError);
    return { ok: false, error: 'failed' };
  }

  // 미래 예약: cron 이 적용. 즉시 적용은 하지 않는다.
  if (isScheduled) {
    revalidatePath('/[locale]/admin/settings', 'page');
    return { ok: true, id: inserted.id, status: 'scheduled', errorMessage: null };
  }

  // 즉시 적용: service_role 로 apply_one(원자 claim + apply). cron 과 경합해도 중복 적용 없음.
  const service = createServiceRoleClient();
  const { data: applied, error: applyError } = await service.rpc('apply_one_scheduled_setting_change', {
    p_id: inserted.id,
  });
  if (applyError) {
    // 적용 RPC 자체 실패 — 행은 pending 으로 남아 cron 이 재시도한다.
    console.error('patchTenantSetting apply_one failed', applyError);
    revalidatePath('/[locale]/admin/settings', 'page');
    return { ok: true, id: inserted.id, status: 'pending', errorMessage: applyError.message };
  }

  revalidatePath('/[locale]/admin/settings', 'page');
  const raw = applied?.status ?? 'pending';
  const status: 'applied' | 'pending' | 'applying' | 'failed' =
    raw === 'applied' || raw === 'failed' || raw === 'applying' ? raw : 'pending';
  return { ok: true, id: inserted.id, status, errorMessage: applied?.error_message ?? null };
}
