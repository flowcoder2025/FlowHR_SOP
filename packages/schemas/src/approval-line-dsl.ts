import { z } from 'zod';
import { uuidSchema } from './common';
import { employmentTypeEnum } from './entities/enums';

/**
 * 결재라인 조건 분기 DSL + 평가엔진 (WI-034, ST-054).
 *
 * `approval_lines.conditions` / `approval_lines.default_line` (둘 다 jsonb) 의 내부 shape SSOT.
 * - 저장: TA-13 결재라인 탭 PATCH 가 본 스키마로 strict 검증 후 scheduled_setting_changes.payload 적재 →
 *   mig 40 apply 엔진(_apply_claimed_scheduled_setting_change)이 jsonb 그대로 approval_lines 에 반영.
 * - 평가: `resolveApprovalLine(rawLine, ctx)` 가 요청 컨텍스트로 결재 단계 시퀀스를 결정한다.
 *   실제 요청 시점 소비(휴가 신청 → approvals 생성)는 ST-046(Sprint 6) — 본 WI 는 엔진 + 정의를 소유.
 *
 * 내부 키는 repo entity 컨벤션대로 **snake_case**(DB jsonb 1:1). `.flowset/api/schemas.md` 의
 * Phase 4 camelCase 초안(ConditionRule/ApprovalStepTemplate)은 폐기 — 본 파일이 SSOT.
 *
 * 보안(codex 2라운드 협의): 평가엔진은 **방어적** parse — Data API 로 malformed payload 가 저장돼도
 * (같은 테넌트 admin 의 self-DoS, 권한상승 아님) invalid condition 은 건너뛰고, line/default_line parse
 * 실패 시 빈 steps 로 graceful degrade 한다. specific_employee_id 의 테넌트 소속 검증은 저장 경로
 * (actions.ts)와 소비 경로(ST-046)에서 별도로 수행한다(uuid 형식만으론 cross-tenant 차단 불가).
 */

// ── 결재 단계 템플릿 ────────────────────────────────────────────────
// 결재자 역할은 **테넌트 역할만** — operator_* 는 결재라인 결재자가 될 수 없다.
export const approvalStepRoleEnum = z.enum([
  'tenant_super',
  'tenant_hr_admin',
  'tenant_manager',
  'employee',
]);
export type ApprovalStepRole = z.infer<typeof approvalStepRoleEnum>;

// 결재자 부서 범위. 'specific' 이면 specific_employee_id 로 특정 직원 지정.
export const deptScopeEnum = z.enum(['own_team', 'parent', 'all', 'specific']);
export type DeptScope = z.infer<typeof deptScopeEnum>;

export const approvalStepTemplateSchema = z
  .object({
    order: z.number().int().positive(),
    approver_role: approvalStepRoleEnum,
    dept_scope: deptScopeEnum,
    specific_employee_id: uuidSchema.optional(),
  })
  .strict()
  .superRefine((step, ctx) => {
    if (step.dept_scope === 'specific') {
      if (!step.specific_employee_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['specific_employee_id'],
          message: "dept_scope='specific' 이면 specific_employee_id 가 필요합니다",
        });
      }
    } else if (step.specific_employee_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specific_employee_id'],
        message: "specific_employee_id 는 dept_scope='specific' 에서만 허용됩니다",
      });
    }
  });
export type ApprovalStepTemplate = z.infer<typeof approvalStepTemplateSchema>;

/**
 * order 가 **배열 위치와 일치**(steps[i].order === i+1)하는지 검증한다.
 * 단순 집합(1..n) 검사가 아니라 위치 정합까지 강제 — `[{order:2},{order:1}]` 같은 역순 저장을 차단해
 * resolveApprovalLine 이 정렬 없이 배열 순서 그대로 반환해도 항상 order 오름차순이 보장된다.
 */
function refineStepOrder(steps: { order: number }[], ctx: z.RefinementCtx, path: (string | number)[] = []): void {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step || step.order !== i + 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message: 'order 는 배열 순서대로 1..n 이어야 합니다(중복/누락/역순 금지)',
      });
      return;
    }
  }
}

/** 결재 단계 배열 — order 연속 강제. 비어 있을 수 있음(활성 라인 default_line 의 min(1) 은 라인 레벨). */
export const approvalStepArraySchema = z
  .array(approvalStepTemplateSchema)
  .superRefine((steps, ctx) => refineStepOrder(steps, ctx));

// ── 조건 규칙 ────────────────────────────────────────────────────────
export const conditionOperatorEnum = z.enum(['==', '!=', '>=', '<=', '>', '<', 'in', 'not_in']);
export type ConditionOperator = z.infer<typeof conditionOperatorEnum>;

// 평가 대상 필드. leave_days 만 숫자, 나머지는 문자(테넌트별 식별자/enum).
export const conditionFieldEnum = z.enum([
  'leave_days',
  'department_id',
  'employment_type',
  'position',
  'job_title',
]);
export type ConditionField = z.infer<typeof conditionFieldEnum>;

const STRING_FIELD_OPS = new Set<ConditionOperator>(['==', '!=', 'in', 'not_in']);
const ARRAY_OPS = new Set<ConditionOperator>(['in', 'not_in']);

export const conditionRuleSchema = z
  .object({
    field: conditionFieldEnum,
    op: conditionOperatorEnum,
    // 좌변 field 값과 비교할 우변. 숫자/문자 scalar 또는 in/not_in 용 배열.
    value: z.union([z.number(), z.string(), z.array(z.union([z.number(), z.string()]))]),
    // 조건 매칭 시 사용할 결재 단계 시퀀스 — 최소 1단계.
    line: z.array(approvalStepTemplateSchema).min(1),
  })
  .strict()
  .superRefine((rule, ctx) => {
    refineStepOrder(rule.line, ctx, ['line']);

    const { field, op, value } = rule;
    const isArrayOp = ARRAY_OPS.has(op);

    if (field === 'leave_days') {
      // 숫자 필드 — 모든 연산자 허용. in/not_in 은 유한 숫자 배열, 그 외는 유한 숫자 scalar.
      if (isArrayOp) {
        if (
          !Array.isArray(value) ||
          value.length === 0 ||
          !value.every((v) => typeof v === 'number' && Number.isFinite(v))
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['value'],
            message: 'leave_days in/not_in 은 비어있지 않은 숫자 배열이어야 합니다',
          });
        }
      } else if (typeof value !== 'number' || !Number.isFinite(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: 'leave_days 비교값은 숫자여야 합니다(문자열 자동변환 없음)',
        });
      }
      return;
    }

    // 문자 필드(department_id/employment_type/position/job_title) — ==,!=,in,not_in 만.
    if (!STRING_FIELD_OPS.has(op)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['op'],
        message: `${field} 는 ==, !=, in, not_in 연산자만 허용합니다`,
      });
      return;
    }

    // employment_type 은 enum(regular/contract/part_time/freelancer)으로 값 강제, 그 외는 비어있지 않은 문자열.
    const isValidScalar =
      field === 'employment_type'
        ? (v: unknown) => employmentTypeEnum.safeParse(v).success
        : (v: unknown) => typeof v === 'string' && v.trim().length > 0;

    if (isArrayOp) {
      if (!Array.isArray(value) || value.length === 0 || !value.every(isValidScalar)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: `${field} in/not_in 은 비어있지 않은 ${
            field === 'employment_type' ? '고용형태' : '문자열'
          } 배열이어야 합니다`,
        });
      }
    } else if (Array.isArray(value) || !isValidScalar(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: `${field} 비교값이 올바르지 않습니다`,
      });
    }
  });
export type ConditionRule = z.infer<typeof conditionRuleSchema>;

// ── 결재라인 DSL (conditions + default_line) ─────────────────────────
export const approvalLineDslSchema = z
  .object({
    conditions: z.array(conditionRuleSchema).default([]),
    default_line: approvalStepArraySchema.default([]),
  })
  .strict();
export type ApprovalLineDsl = z.infer<typeof approvalLineDslSchema>;

// =====================================================================
// 평가엔진 — 순수 함수(서버/클라 무관). ST-046 이 휴가 신청 시점에 소비.
// =====================================================================

/** 결재라인 평가 컨텍스트 — 요청(예: 휴가 신청)에서 추출한 분기 판단 필드. */
export interface ApprovalContext {
  leave_days?: number | null;
  department_id?: string | null;
  employment_type?: string | null;
  position?: string | null;
  job_title?: string | null;
}

export interface ApprovalResolution {
  /** 적용할 결재 단계 시퀀스(order 오름차순). 빈 배열 = 매칭/기본선 없음(상위에서 "결재자 없음" 처리). */
  steps: ApprovalStepTemplate[];
  /** 매칭된 조건의 원본 conditions 배열 인덱스. null = 조건 미매칭(default_line 사용). */
  matchedConditionIndex: number | null;
}

/**
 * 컨텍스트의 실제 필드 값이 평가 가능한 유효값인지 검사한다.
 * 미존재(undefined/null) + 타입/유한성 위반(예 leave_days=NaN, 빈 문자열)은 false → 모든 연산자에서
 * 과매칭(특히 !=/not_in 이 invalid actual 에서 true 가 되는 것)을 차단한다.
 */
function isValidActual(field: ConditionField, actual: unknown): boolean {
  if (actual === undefined || actual === null) return false;
  if (field === 'leave_days') return typeof actual === 'number' && Number.isFinite(actual);
  if (field === 'employment_type') return employmentTypeEnum.safeParse(actual).success;
  return typeof actual === 'string' && actual.trim().length > 0;
}

/** 단일 조건 평가. 컨텍스트 필드가 없거나 유효하지 않으면(NaN/빈값 등) 모든 연산자에서 false. */
export function evaluateCondition(rule: ConditionRule, ctx: ApprovalContext): boolean {
  const actual = ctx[rule.field];
  if (!isValidActual(rule.field, actual)) return false;

  const { op, value } = rule;
  switch (op) {
    case '==':
      return actual === value;
    case '!=':
      return actual !== value;
    case '>=':
      return typeof actual === 'number' && typeof value === 'number' && actual >= value;
    case '<=':
      return typeof actual === 'number' && typeof value === 'number' && actual <= value;
    case '>':
      return typeof actual === 'number' && typeof value === 'number' && actual > value;
    case '<':
      return typeof actual === 'number' && typeof value === 'number' && actual < value;
    case 'in':
      return Array.isArray(value) && value.some((v) => v === actual);
    case 'not_in':
      return Array.isArray(value) && !value.some((v) => v === actual);
    default:
      return false;
  }
}

/**
 * 결재라인의 conditions 를 순서대로 평가해 **첫 매칭 조건의 line**을, 매칭이 없으면 default_line 을 반환한다.
 * rawLine 은 DB jsonb(검증 전)일 수 있으므로 방어적으로 parse — malformed condition 은 건너뛰고,
 * default_line parse 실패 시 빈 steps 를 돌려준다(런타임 throw 없이 graceful degrade).
 */
export function resolveApprovalLine(rawLine: unknown, ctx: ApprovalContext): ApprovalResolution {
  const obj =
    rawLine && typeof rawLine === 'object' && !Array.isArray(rawLine)
      ? (rawLine as Record<string, unknown>)
      : {};
  const rawConditions = Array.isArray(obj.conditions) ? obj.conditions : [];

  for (let i = 0; i < rawConditions.length; i++) {
    const parsed = conditionRuleSchema.safeParse(rawConditions[i]);
    if (!parsed.success) continue; // malformed 조건은 건너뜀
    if (evaluateCondition(parsed.data, ctx)) {
      return { steps: parsed.data.line, matchedConditionIndex: i };
    }
  }

  const def = approvalStepArraySchema.safeParse(obj.default_line);
  return { steps: def.success ? def.data : [], matchedConditionIndex: null };
}
