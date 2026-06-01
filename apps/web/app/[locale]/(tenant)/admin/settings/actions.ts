'use server';

import { getSessionProfile } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { approvalLinesPayloadSchema } from '@flowhr/schemas';
import { patchTenantSetting } from '@/lib/tenant-settings/actions';
import {
  buildApprovalLinesPayload,
  buildCompanyPayload,
  buildLeavePolicyPayload,
  buildWorkPolicyPayload,
  collectSpecificEmployeeIds,
  normalizeApplyAt,
  type ApprovalLineDraft,
  type LeaveTypeDraft,
} from '@/lib/tenant-settings/form-data';

/**
 * TA-13 회사 설정 P0 4탭 저장 Server Action (WI-033) — useActionState FormData 래퍼.
 *
 * 기존 8개 폼과 동일한 useActionState 패턴. FormData 의 raw 입력을 `form-data.ts` 순수
 * 빌더로 payload 화한 뒤 WI-032 `patchTenantSetting`(즉시/예약 + apply_one RPC)에 위임한다.
 *
 * 동적 배열(leave_types/approval_lines)은 클라이언트가 **편집 대상만** JSON hidden input 으로
 * 보낸다. 보존이 필요한 원본(approval conditions/default_line, leave 원본 key)은 클라이언트가
 * 위조할 수 있으므로 신뢰하지 않고 **서버가 DB(RLS tenant 격리)에서 권위 조회**한다.
 * (codex 듀얼검증 P1: 클라 original 위조로 같은 테넌트 내 조건 변조/대량삭제 차단.)
 */

/** patchTenantSetting status 그대로(applied=즉시 / scheduled=예약 / pending|applying / failed). */
export type SaveStatus = 'applied' | 'scheduled' | 'pending' | 'applying' | 'failed';

export type SaveState =
  | { status: 'idle' }
  | { status: 'success'; result: SaveStatus }
  | { status: 'error'; messageKey: string };

export const SAVE_INIT: SaveState = { status: 'idle' };

function readMode(formData: FormData): 'now' | 'scheduled' {
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

/** 동적 배열 hidden JSON 파싱 — 손상/위조(malformed/비배열)는 null(=invalid 중단). 빈/미존재는 빈 배열. */
function parseJsonArrayStrict(formData: FormData, key: string): unknown[] | null {
  const raw = formData.get(key);
  if (typeof raw !== 'string' || raw === '') return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
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

  const current = parseJsonArrayStrict(formData, 'leave_types_json');
  if (current === null) return { status: 'error', messageKey: 'action.save_failed' };

  const profile = await getSessionProfile();
  if (!profile?.tenantId) return { status: 'error', messageKey: 'action.save_failed' };

  // 원본 key 는 클라이언트(위조 가능) 대신 DB(RLS tenant 격리)에서 권위 조회 → delete_keys 변조 차단.
  // 조회 실패 시 원본 미상 → 잘못된 delete_keys 산출 위험 → fail-closed(저장 중단).
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from('leave_types')
    .select('id, key')
    .eq('tenant_id', profile.tenantId);
  if (fetchError) return { status: 'error', messageKey: 'action.save_failed' };
  const rows = existing ?? [];

  const payload = buildLeavePolicyPayload(
    current as LeaveTypeDraft[],
    rows.map((r) => r.key),
  );

  // 삭제 대상이 leaves/leave_balances 에서 참조되면(FK on delete restrict, mig 13) apply 가
  // FK 위반으로 실패 큐를 만든다 → enqueue 전 사전 차단(codex 듀얼검증 P2).
  if (payload.delete_keys && payload.delete_keys.length > 0) {
    const deleteIds = rows.filter((r) => payload.delete_keys!.includes(r.key)).map((r) => r.id);
    if (deleteIds.length > 0) {
      const [leaves, balances] = await Promise.all([
        supabase.from('leaves').select('id', { count: 'exact', head: true }).in('leave_type_id', deleteIds),
        supabase
          .from('leave_balances')
          .select('id', { count: 'exact', head: true })
          .in('leave_type_id', deleteIds),
      ]);
      // 참조 검사 실패 시 안전 차단(미검증 삭제 enqueue 방지).
      if (leaves.error || balances.error) return { status: 'error', messageKey: 'action.save_failed' };
      if ((leaves.count ?? 0) + (balances.count ?? 0) > 0) {
        return { status: 'error', messageKey: 'action.leave_in_use' };
      }
    }
  }

  return toState(await patchTenantSetting({ tab: 'leave_policy', payload, apply_at: at.applyAt }));
}

export async function saveApprovalLinesAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const at = resolveApplyAt(formData);
  if ('error' in at) return { status: 'error', messageKey: at.error };

  const edited = parseJsonArrayStrict(formData, 'lines_json');
  if (edited === null) return { status: 'error', messageKey: 'action.save_failed' };

  const profile = await getSessionProfile();
  if (!profile?.tenantId) return { status: 'error', messageKey: 'action.save_failed' };

  // WI-034: 사용자가 conditions/default_line(조건 분기 DSL)을 직접 편집한다.
  const drafts = edited as ApprovalLineDraft[];
  const payload = buildApprovalLinesPayload(drafts);

  // 1. strict DSL 검증(서버 권위). patchTenantSetting 도 재검증하나, 여기서 명시적 사용자 에러를 준다.
  const parsed = approvalLinesPayloadSchema.safeParse(payload);
  if (!parsed.success) return { status: 'error', messageKey: 'action.approval_invalid' };

  const supabase = await createSupabaseServerClient();

  // 2. unknown line id fail-closed — 제출된 id 가 현재 테넌트 라인에 없으면 거부(클라 위조/예약 후 삭제 방어).
  const submittedIds = parsed.data.lines.map((l) => l.id).filter((id): id is string => Boolean(id));
  if (submittedIds.length > 0) {
    const { data: existing, error: fetchError } = await supabase
      .from('approval_lines')
      .select('id')
      .eq('tenant_id', profile.tenantId);
    if (fetchError) return { status: 'error', messageKey: 'action.save_failed' };
    const existingIds = new Set((existing ?? []).map((r) => r.id));
    if (submittedIds.some((id) => !existingIds.has(id))) {
      return { status: 'error', messageKey: 'action.approval_unknown_line' };
    }
  }

  // 3. specific_employee_id 테넌트 소속 검증 — uuid 형식만으론 cross-tenant 직원 지정을 못 막는다.
  const empIds = collectSpecificEmployeeIds(drafts);
  if (empIds.length > 0) {
    const { data: emps, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('tenant_id', profile.tenantId)
      .in('id', empIds);
    if (empError) return { status: 'error', messageKey: 'action.save_failed' };
    const found = new Set((emps ?? []).map((r) => r.id));
    if (empIds.some((id) => !found.has(id))) {
      return { status: 'error', messageKey: 'action.approval_unknown_employee' };
    }
  }

  return toState(
    await patchTenantSetting({ tab: 'approval_lines', payload: parsed.data, apply_at: at.applyAt }),
  );
}
