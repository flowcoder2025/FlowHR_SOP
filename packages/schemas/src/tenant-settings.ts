import { z } from 'zod';
import { uuidSchema } from './common';
import { approvalRequestTypeEnum } from './entities/enums';

/**
 * TA-13 회사 설정 PATCH payload DTO (WI-032).
 *
 * SSOT: .flowset/api/tenant.md TA-13 + .flowset/wireframes/analysis/TA-13.md.
 * 각 payload 는 **full desired-state** — DB(mig 11) 컬럼과 1:1 정합되도록 snake_case.
 * scheduled_setting_changes.payload(jsonb)에 그대로 저장되고, DB apply 함수
 * (_apply_claimed_scheduled_setting_change, mig 40)가 `payload->>'<key>'` 로 읽어 target 에 반영한다.
 *
 * WI-032 는 **P0 4탭(company/work_policy/leave_policy/approval_lines)만 PATCH 구현**.
 * roles/notifications/document_templates/security 는 후속 WI, audit_logs 는 GET 전용(스키마 미정의).
 * leave_policy.grant_basis 는 tenant_settings 전용 컬럼 부재로 본 WI 제외(KI 등재) — leave_types 만 처리.
 */

const HHMM = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const timeString = z.string().regex(HHMM, 'HH:MM 또는 HH:MM:SS 형식이어야 합니다');

// ── company (tenant_settings.company_info full replace) ─────────────────────────
export const companySettingsPayloadSchema = z
  .object({
    company_name: z.string().trim().min(1).max(200).optional(),
    ceo_name: z.string().trim().max(100).optional(),
    contact: z.string().trim().max(50).optional(),
    email: z.string().trim().email().max(200).optional(),
    address: z.string().trim().max(500).optional(),
    industry: z.string().trim().max(100).optional(),
    logo_url: z.string().trim().url().max(1000).optional(),
  })
  .strict();

// ── work_policy (work_policies 테넌트 기본(default) 1행 upsert) ──────────────────
// is_default 는 본 WI 에서 항상 true 로 정규화(기본 정책 편집). DB apply 가 default 행을 갱신/생성.
export const workPolicyPayloadSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    standard_clock_in: timeString.nullable().optional(),
    standard_clock_out: timeString.nullable().optional(),
    late_threshold: timeString.nullable().optional(),
    break_minutes_default: z.number().int().min(0).max(1440),
    weekly_max_hours: z.number().int().min(0).max(168),
    applicable_departments: z.array(z.string().trim().min(1)).default([]),
    applied_from: z.string().date().nullable().optional(),
  })
  .strict();

// ── leave_policy (leave_types (tenant,key) upsert + 명시 삭제) ───────────────────
export const leavePolicyTypeSchema = z
  .object({
    key: z.string().trim().min(1).max(50),
    label_ko: z.string().trim().max(100).nullable().optional(),
    default_days: z.number().int().min(0).max(365),
    is_paid: z.boolean(),
    carryover_allowed: z.boolean(),
    evidence_required: z.boolean(),
    sort_order: z.number().int().min(0).max(9999),
  })
  .strict();

export const leavePolicyPayloadSchema = z
  .object({
    leave_types: z.array(leavePolicyTypeSchema),
    // 명시적으로 나열된 key 만 삭제 — 암묵적 full-snapshot 삭제는 FK/운영 위험으로 미허용(codex 협의).
    delete_keys: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

// ── approval_lines (id 있으면 update, 없으면 insert. 삭제는 is_active=false) ──────
// 조건 DSL(conditions/default_line) 검증 고도화는 WI-034 — 본 WI 는 jsonb passthrough.
const jsonbArray = z.array(z.unknown()).default([]);

export const approvalLinePayloadSchema = z
  .object({
    id: uuidSchema.optional(),
    name: z.string().trim().min(1).max(100),
    request_type: approvalRequestTypeEnum,
    conditions: jsonbArray,
    default_line: jsonbArray,
    is_active: z.boolean().default(true),
  })
  .strict();

export const approvalLinesPayloadSchema = z
  .object({
    lines: z.array(approvalLinePayloadSchema),
  })
  .strict();

// ── PATCH /tenant/settings/{tab} 입력 계약 ──────────────────────────────────────
export const PATCHABLE_SETTING_TABS = [
  'company',
  'work_policy',
  'leave_policy',
  'approval_lines',
] as const;
export type PatchableSettingTab = (typeof PATCHABLE_SETTING_TABS)[number];

/** 탭별 payload 스키마 매핑 — Server Action 이 tab 으로 조회해 검증. */
export const settingTabPayloadSchemas = {
  company: companySettingsPayloadSchema,
  work_policy: workPolicyPayloadSchema,
  leave_policy: leavePolicyPayloadSchema,
  approval_lines: approvalLinesPayloadSchema,
} as const;

export type CompanySettingsPayload = z.infer<typeof companySettingsPayloadSchema>;
export type WorkPolicyPayload = z.infer<typeof workPolicyPayloadSchema>;
export type LeavePolicyPayload = z.infer<typeof leavePolicyPayloadSchema>;
export type ApprovalLinesPayload = z.infer<typeof approvalLinesPayloadSchema>;

/** 적용 시점: 생략/now 이하 = 즉시, 미래 = 예약(scheduled_setting_changes). */
export const settingApplyAtSchema = z.string().datetime({ offset: true }).optional();

export const settingsPatchInputSchema = z
  .object({
    tab: z.enum(PATCHABLE_SETTING_TABS),
    payload: z.record(z.unknown()),
    apply_at: settingApplyAtSchema,
  });

export type SettingsPatchInput = z.infer<typeof settingsPatchInputSchema>;

/**
 * tab 별 payload 를 정확한 스키마로 검증해 정규화한다.
 * settingsPatchInputSchema 는 payload 를 record 로만 받으므로(디스크리미네이션 불가),
 * 호출부는 본 헬퍼로 tab 에 맞는 스키마 검증을 한 번 더 수행한다.
 */
export function parseSettingPayload(
  tab: PatchableSettingTab,
  payload: unknown,
): z.SafeParseReturnType<unknown, unknown> {
  return settingTabPayloadSchemas[tab].safeParse(payload);
}
