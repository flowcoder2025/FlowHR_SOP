'use server';

import { patchTenantSetting } from '@/lib/tenant-settings/actions';
import {
  buildApprovalLinesPayload,
  buildCompanyPayload,
  buildLeavePolicyPayload,
  buildWorkPolicyPayload,
  normalizeApplyAt,
  type ApplyMode,
  type ApprovalLineDraft,
  type ApprovalLineOriginal,
  type LeaveTypeDraft,
} from '@/lib/tenant-settings/form-data';

/**
 * TA-13 회사 설정 P0 4탭 저장 Server Action (WI-033) — useActionState FormData 래퍼.
 *
 * 기존 8개 폼과 동일한 useActionState 패턴. FormData 의 raw 입력을 `form-data.ts` 순수
 * 빌더로 payload 화한 뒤 WI-032 `patchTenantSetting`(즉시/예약 + apply_one RPC)에 위임한다.
 * 동적 배열(leave_types/approval_lines)은 클라이언트가 JSON hidden input 으로 전송한다.
 */

/** patchTenantSetting status 그대로(applied=즉시 / scheduled=예약 / pending|applying / failed). */
export type SaveStatus = 'applied' | 'scheduled' | 'pending' | 'applying' | 'failed';

export type SaveState =
  | { status: 'idle' }
  | { status: 'success'; result: SaveStatus }
  | { status: 'error'; messageKey: string };

export const SAVE_INIT: SaveState = { status: 'idle' };

function readMode(formData: FormData): ApplyMode {
  return formData.get('apply_mode') === 'scheduled' ? 'scheduled' : 'now';
}

/** apply_mode/apply_at → 즉시(undefined) 또는 KST offset ISO. 빈/과거 예약은 거부. */
function resolveApplyAt(formData: FormData): { applyAt?: string } | { error: string } {
  const norm = normalizeApplyAt(readMode(formData), formData.get('apply_at') as string | null);
  if (!norm.ok) return { error: `action.${norm.error}` };
  // 예약인데 과거 시각이면 즉시 적용으로 처리돼 혼란 → 막는다(patchTenantSetting >now+1s 경계와 동일).
  if (norm.applyAt && Date.parse(norm.applyAt) <= Date.now() + 1000) {
    return { error: 'action.apply_at_past' };
  }
  return { applyAt: norm.applyAt };
}

function toState(result: Awaited<ReturnType<typeof patchTenantSetting>>): SaveState {
  if (result.ok) return { status: 'success', result: result.status };
  return { status: 'error', messageKey: 'action.save_failed' };
}

function parseJsonArray(formData: FormData, key: string): unknown[] {
  const raw = formData.get(key);
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCompanyAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const at = resolveApplyAt(formData);
  if ('error' in at) return { status: 'error', messageKey: at.error };
  const payload = buildCompanyPayload({
    company_name: formData.get('company_name'),
    ceo_name: formData.get('ceo_name'),
    contact: formData.get('contact'),
    email: formData.get('email'),
    address: formData.get('address'),
    industry: formData.get('industry'),
    logo_url: formData.get('logo_url'),
  });
  return toState(await patchTenantSetting({ tab: 'company', payload, apply_at: at.applyAt }));
}

export async function saveWorkPolicyAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const at = resolveApplyAt(formData);
  if ('error' in at) return { status: 'error', messageKey: at.error };
  const payload = buildWorkPolicyPayload({
    name: formData.get('name'),
    standard_clock_in: formData.get('standard_clock_in'),
    standard_clock_out: formData.get('standard_clock_out'),
    late_threshold: formData.get('late_threshold'),
    break_minutes_default: formData.get('break_minutes_default'),
    weekly_max_hours: formData.get('weekly_max_hours'),
    applicable_departments: formData.get('applicable_departments'),
    applied_from: formData.get('applied_from'),
  });
  return toState(await patchTenantSetting({ tab: 'work_policy', payload, apply_at: at.applyAt }));
}

export async function saveLeavePolicyAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const at = resolveApplyAt(formData);
  if ('error' in at) return { status: 'error', messageKey: at.error };
  const current = parseJsonArray(formData, 'leave_types_json') as LeaveTypeDraft[];
  const originalKeys = parseJsonArray(formData, 'original_keys_json').map(String);
  const payload = buildLeavePolicyPayload(current, originalKeys);
  return toState(await patchTenantSetting({ tab: 'leave_policy', payload, apply_at: at.applyAt }));
}

export async function saveApprovalLinesAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const at = resolveApplyAt(formData);
  if ('error' in at) return { status: 'error', messageKey: at.error };
  const edited = parseJsonArray(formData, 'lines_json') as ApprovalLineDraft[];
  const original = parseJsonArray(formData, 'original_lines_json') as ApprovalLineOriginal[];
  const payload = buildApprovalLinesPayload(edited, original);
  return toState(await patchTenantSetting({ tab: 'approval_lines', payload, apply_at: at.applyAt }));
}
