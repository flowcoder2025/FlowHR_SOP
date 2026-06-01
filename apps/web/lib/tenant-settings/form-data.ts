import type {
  ApprovalLinesPayload,
  CompanySettingsPayload,
  LeavePolicyPayload,
  WorkPolicyPayload,
} from '@flowhr/schemas';

/**
 * TA-13 회사 설정 폼 입력 → PATCH payload 변환 (WI-033) — 순수 로직(서버/클라 무관, 단위 테스트).
 *
 * SSOT: payload 계약 = `packages/schemas/src/tenant-settings.ts`,
 *       apply 의미 = `supabase/migrations/00000000000040_*.sql` `_apply_claimed_scheduled_setting_change`.
 *
 * 핵심 변환 규칙(apply 엔진 동작에 맞춰 설계):
 *  - company: company_info 는 **full-replace**(on conflict do update set company_info=excluded) →
 *    빈 필드는 키 자체를 생략해 저장값에서 제외(누락=삭제).
 *  - work_policy: 시간 3필드는 `nullif(...,'')::time`(coalesce 없음) → 빈값은 생략(DB NULL).
 *    late_threshold 는 standard_clock_in 이 있을 때만 의미 → 출근 표준시간 없으면 무시.
 *  - leave_policy: leave_types upsert + (원본에서 사라진 key) delete_keys. key 는 immutable.
 *  - approval_lines: conditions/default_line 은 WI-033 편집 대상 아님 — 기존 라인은 원본(id 매칭)에서
 *    그대로 병합(passthrough), 신규는 빈 배열. 생략하면 zod default []/apply coalesce 가 기존 조건을 삭제.
 */

export type ApplyMode = 'now' | 'scheduled';

const KST_OFFSET = '+09:00';

/**
 * `<input type="datetime-local">` 값을 KST offset ISO 문자열로 정규화.
 * datetime-local 은 offset 이 없어(`z.string().datetime({offset:true})` 거부) 입력값을
 * "KST 벽시계 시각"으로 보고 +09:00 을 부여한다(단일 운영 TZ=Asia/Seoul 전제).
 * mode='now' 면 apply_at 미전송(undefined → 즉시 적용). 과거 검증은 호출측(서버)에서 수행.
 */
export function normalizeApplyAt(
  mode: ApplyMode,
  raw: string | null | undefined,
): { ok: true; applyAt: string | undefined } | { ok: false; error: 'apply_at_required' } {
  if (mode === 'now') return { ok: true, applyAt: undefined };
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return { ok: false, error: 'apply_at_required' };
  // "YYYY-MM-DDTHH:mm"(16) → 초 보강, "YYYY-MM-DDTHH:mm:ss"(19) → 그대로.
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  return { ok: true, applyAt: `${withSeconds}${KST_OFFSET}` };
}

function trimmed(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function numberOrNaN(v: unknown): number {
  if (typeof v === 'number') return v;
  const s = trimmed(v);
  return s === '' ? Number.NaN : Number(s);
}

// ── company ─────────────────────────────────────────────────────────────────
const COMPANY_FIELDS = [
  'company_name',
  'ceo_name',
  'contact',
  'email',
  'address',
  'industry',
  'logo_url',
] as const;

export function buildCompanyPayload(fields: Record<string, unknown>): CompanySettingsPayload {
  const out: Record<string, string> = {};
  for (const key of COMPANY_FIELDS) {
    const s = trimmed(fields[key]);
    if (s) out[key] = s; // 빈 필드는 생략(full-replace 에서 제외).
  }
  return out as CompanySettingsPayload;
}

// ── work_policy ─────────────────────────────────────────────────────────────
/** 부서 입력(콤마 구분 문자열 또는 배열) → string[]. */
function parseDepartments(v: unknown): string[] {
  const raw = Array.isArray(v) ? v.map((x) => String(x)) : trimmed(v).split(',');
  return raw.map((s) => s.trim()).filter(Boolean);
}

export function buildWorkPolicyPayload(fields: Record<string, unknown>): WorkPolicyPayload {
  const out: Record<string, unknown> = {
    name: trimmed(fields.name),
    break_minutes_default: numberOrNaN(fields.break_minutes_default),
    weekly_max_hours: numberOrNaN(fields.weekly_max_hours),
    applicable_departments: parseDepartments(fields.applicable_departments),
  };
  const clockIn = trimmed(fields.standard_clock_in);
  if (clockIn) out.standard_clock_in = clockIn;
  const clockOut = trimmed(fields.standard_clock_out);
  if (clockOut) out.standard_clock_out = clockOut;
  // 지각 기준은 출근 표준시간이 있을 때만 의미.
  const late = trimmed(fields.late_threshold);
  if (late && clockIn) out.late_threshold = late;
  const appliedFrom = trimmed(fields.applied_from);
  if (appliedFrom) out.applied_from = appliedFrom;
  return out as WorkPolicyPayload;
}

// ── leave_policy ────────────────────────────────────────────────────────────
export interface LeaveTypeDraft {
  key: string;
  label_ko?: string | null;
  default_days: number;
  is_paid: boolean;
  carryover_allowed: boolean;
  evidence_required: boolean;
  sort_order: number;
}

export function buildLeavePolicyPayload(
  current: LeaveTypeDraft[],
  originalKeys: string[],
): LeavePolicyPayload {
  const leave_types = current.map((t, i) => ({
    key: trimmed(t.key),
    label_ko: t.label_ko == null ? null : trimmed(t.label_ko) || null,
    default_days: numberOrNaN(t.default_days),
    is_paid: Boolean(t.is_paid),
    carryover_allowed: Boolean(t.carryover_allowed),
    evidence_required: Boolean(t.evidence_required),
    sort_order: typeof t.sort_order === 'number' ? t.sort_order : i,
  }));
  const currentKeys = new Set(leave_types.map((t) => t.key));
  const delete_keys = originalKeys.filter((k) => !currentKeys.has(k));
  return delete_keys.length > 0 ? { leave_types, delete_keys } : { leave_types };
}

// ── approval_lines ──────────────────────────────────────────────────────────
export interface ApprovalLineDraft {
  id?: string;
  name: string;
  request_type: string;
  is_active: boolean;
}

export interface ApprovalLineOriginal {
  id: string;
  conditions?: unknown;
  default_line?: unknown;
}

export function buildApprovalLinesPayload(
  edited: ApprovalLineDraft[],
  original: ApprovalLineOriginal[],
): ApprovalLinesPayload {
  const byId = new Map(original.map((o) => [o.id, o]));
  const lines = edited.map((line) => {
    const id = trimmed(line.id);
    const base = {
      name: trimmed(line.name),
      request_type: line.request_type,
      is_active: Boolean(line.is_active),
    };
    const o = id ? byId.get(id) : undefined;
    if (o) {
      // 기존 라인 — 조건/단계는 원본 보존(WI-034 가 편집 소유).
      return {
        id,
        ...base,
        conditions: Array.isArray(o.conditions) ? o.conditions : [],
        default_line: Array.isArray(o.default_line) ? o.default_line : [],
      };
    }
    // 신규 라인 — 빈 조건.
    return { ...base, conditions: [], default_line: [] };
  });
  return { lines } as ApprovalLinesPayload;
}
