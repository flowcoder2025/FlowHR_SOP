import { z } from 'zod';
import {
  type ApprovalStepRole,
  type DeptScope,
  type TenantModule,
  type TenantRegistrationPayload,
  approvalRequestTypeEnum,
  approvalStepRoleEnum,
  billingCycleEnum,
  normalizeBusinessNumber,
  tenantAdminInputSchema,
  tenantCompanyInputSchema,
  tenantModuleEnum,
  tenantRegistrationSchema,
  validateSlugFormat,
} from '@flowhr/schemas';
import type { PlanOption } from './queries';

/**
 * OP-04 7단계 마법사 — 순수 클라이언트 헬퍼 (WI-036, ST-006).
 *
 * 서버 의존 없는 순수 로직만 모은다(단위 테스트 대상): 단계별 검증, 등록 payload 빌더,
 * draft 직렬화/역직렬화, 월 청구액 계산. 비즈니스 검증의 SSOT 는 `@flowhr/schemas`
 * (operator-onboarding.ts / approval-line-dsl.ts) — 본 파일은 UI 입력 shape ↔ payload shape 변환만 한다.
 *
 * 마법사 입력은 UI 편의를 위해 숫자/배열을 문자/ui_id 보유 행으로 들고(WizardForm), 제출 직전
 * buildRegistrationPayload 로 schema 입력 shape(snake_case)로 변환한다. 최종 권위 검증은 서버
 * register_tenant RPC(mig 42) + tenantRegistrationSchema.safeParse 가 수행한다.
 *
 * 부서: codex 2라운드 협의 — UI 는 parent 를 ui_id 로 참조(parent row code 수정에도 안 깨짐),
 * serialize 시 parent_code 로 변환. UI 가 "현재 행보다 위 + code 보유" 행만 parent 후보로 노출하므로
 * 배열 순서가 토폴로지 순서(상위 먼저)를 만족 → RPC 단일 패스 parent_code 해소 정합.
 */

export const WIZARD_VERSION = 1;
export const TOTAL_STEPS = 7;
export const STEP_KEYS = [
  'company',
  'domain',
  'plan',
  'admin',
  'modules',
  'initial_data',
  'review',
] as const;
export type StepKey = (typeof STEP_KEYS)[number];

/** 온보딩 결재 단계 부서 범위 — specific(특정 직원)은 등록 시점 직원 부재로 제외(codex 2라운드). */
export const ONBOARDING_DEPT_SCOPES: readonly DeptScope[] = ['own_team', 'parent', 'all'];
/** 모듈 표시 순서(plan.modules subset 와 교차해 토글 노출). */
export const ALL_MODULES: readonly TenantModule[] = [
  'attendance',
  'leave',
  'approval',
  'payroll',
  'documents',
  'integrations',
];

// =====================================================================
// 마법사 입력 모델 (UI shape) — 숫자/날짜는 input 친화적으로 문자열 보관, 행은 ui_id 보유.
// =====================================================================

export interface WizardCompany {
  name: string;
  business_number: string;
  representative_name: string;
  industry: string;
  address: string;
  phone: string;
  logo_url: string;
}

export interface WizardPlanInfo {
  plan_id: string;
  contract_start_date: string;
  contract_end_date: string;
  user_limit: string;
  billing_cycle: 'monthly' | 'annual';
}

export interface WizardAdmin {
  email: string;
  name: string;
  phone: string;
}

export interface WizardAdditionalAdmin {
  ui_id: string;
  email: string;
  name: string;
}

export interface WizardDepartmentRow {
  ui_id: string;
  name: string;
  code: string;
  parent_ui_id: string | null;
}

export interface WizardWorkPolicy {
  enabled: boolean;
  name: string;
  standard_clock_in: string;
  standard_clock_out: string;
  late_threshold: string;
  break_minutes_default: string;
  weekly_max_hours: string;
}

export interface WizardLeaveType {
  ui_id: string;
  key: string;
  label_ko: string;
  default_days: string;
  is_paid: boolean;
  carryover_allowed: boolean;
  evidence_required: boolean;
}

export interface WizardApprovalStep {
  approver_role: ApprovalStepRole;
  dept_scope: DeptScope;
}

export interface WizardApprovalLine {
  ui_id: string;
  name: string;
  request_type: z.infer<typeof approvalRequestTypeEnum>;
  steps: WizardApprovalStep[];
  is_active: boolean;
}

export interface WizardDocTemplate {
  ui_id: string;
  key: string;
  label_ko: string;
}

export interface WizardForm {
  company: WizardCompany;
  slug: string;
  plan: WizardPlanInfo;
  admin: WizardAdmin;
  additional_admins: WizardAdditionalAdmin[];
  enabled_modules: TenantModule[];
  departments: WizardDepartmentRow[];
  work_policy: WizardWorkPolicy;
  leave_types: WizardLeaveType[];
  approval_lines: WizardApprovalLine[];
  document_templates: WizardDocTemplate[];
}

/** 빈 마법사 폼 — 신규 진입 기본값. */
export function emptyWizardForm(): WizardForm {
  return {
    company: {
      name: '',
      business_number: '',
      representative_name: '',
      industry: '',
      address: '',
      phone: '',
      logo_url: '',
    },
    slug: '',
    plan: {
      plan_id: '',
      contract_start_date: '',
      contract_end_date: '',
      user_limit: '',
      billing_cycle: 'monthly',
    },
    admin: { email: '', name: '', phone: '' },
    additional_admins: [],
    enabled_modules: [],
    departments: [],
    work_policy: {
      enabled: false,
      name: '기본 근무제',
      standard_clock_in: '',
      standard_clock_out: '',
      late_threshold: '',
      break_minutes_default: '0',
      weekly_max_hours: '52',
    },
    leave_types: [],
    approval_lines: [],
    document_templates: [],
  };
}

// =====================================================================
// draft 역직렬화 — 신뢰 불가한 저장 form_data 에서 known field 만 방어적 재구성.
// =====================================================================

const idSchema = z.string().min(1).catch(() => cryptoId());

const departmentRowSchema = z
  .object({
    ui_id: idSchema,
    name: z.string().catch(''),
    code: z.string().catch(''),
    parent_ui_id: z.string().nullable().catch(null),
  })
  .transform((d) => ({
    ui_id: d.ui_id,
    name: d.name,
    code: d.code,
    parent_ui_id: d.parent_ui_id,
  }));

const approvalStepSchema = z.object({
  approver_role: approvalStepRoleEnum.catch('tenant_hr_admin'),
  dept_scope: z.enum(['own_team', 'parent', 'all']).catch('all'),
});

const wizardFormSchema = z
  .object({
    company: z
      .object({
        name: z.string().catch(''),
        business_number: z.string().catch(''),
        representative_name: z.string().catch(''),
        industry: z.string().catch(''),
        address: z.string().catch(''),
        phone: z.string().catch(''),
        logo_url: z.string().catch(''),
      })
      .partial()
      .catch({}),
    slug: z.string().catch(''),
    plan: z
      .object({
        plan_id: z.string().catch(''),
        contract_start_date: z.string().catch(''),
        contract_end_date: z.string().catch(''),
        user_limit: z.string().catch(''),
        billing_cycle: billingCycleEnum.catch('monthly'),
      })
      .partial()
      .catch({}),
    admin: z
      .object({
        email: z.string().catch(''),
        name: z.string().catch(''),
        phone: z.string().catch(''),
      })
      .partial()
      .catch({}),
    additional_admins: z
      .array(
        z.object({
          ui_id: idSchema,
          email: z.string().catch(''),
          name: z.string().catch(''),
        }),
      )
      .catch([]),
    enabled_modules: z.array(tenantModuleEnum).catch([]),
    departments: z.array(departmentRowSchema).catch([]),
    work_policy: z
      .object({
        enabled: z.boolean().catch(false),
        name: z.string().catch('기본 근무제'),
        standard_clock_in: z.string().catch(''),
        standard_clock_out: z.string().catch(''),
        late_threshold: z.string().catch(''),
        break_minutes_default: z.string().catch('0'),
        weekly_max_hours: z.string().catch('52'),
      })
      .partial()
      .catch({}),
    leave_types: z
      .array(
        z.object({
          ui_id: idSchema,
          key: z.string().catch(''),
          label_ko: z.string().catch(''),
          default_days: z.string().catch('0'),
          is_paid: z.boolean().catch(true),
          carryover_allowed: z.boolean().catch(false),
          evidence_required: z.boolean().catch(false),
        }),
      )
      .catch([]),
    approval_lines: z
      .array(
        z.object({
          ui_id: idSchema,
          name: z.string().catch(''),
          request_type: approvalRequestTypeEnum.catch('leave'),
          steps: z.array(approvalStepSchema).catch([]),
          is_active: z.boolean().catch(true),
        }),
      )
      .catch([]),
    document_templates: z
      .array(
        z.object({
          ui_id: idSchema,
          key: z.string().catch(''),
          label_ko: z.string().catch(''),
        }),
      )
      .catch([]),
  })
  .partial()
  .catch({});

function cryptoId(): string {
  // 브라우저/Node 18+ 공통. 테스트(node)에서도 globalThis.crypto.randomUUID 사용 가능.
  return globalThis.crypto?.randomUUID?.() ?? `id-${Math.round(performance.now() * 1000)}`;
}

/** draft.form_data 에서 마법사 폼 + 멱등키 복원(known field 만, 손상값은 기본값으로 degrade). */
export function parseDraftFormData(formData: unknown): {
  form: WizardForm;
  idempotencyKey: string | null;
} {
  const base = emptyWizardForm();
  if (!formData || typeof formData !== 'object') return { form: base, idempotencyKey: null };

  const record = formData as Record<string, unknown>;
  const wizardMeta =
    record._wizard && typeof record._wizard === 'object'
      ? (record._wizard as Record<string, unknown>)
      : {};
  const idempotencyKey =
    typeof wizardMeta.idempotency_key === 'string' && wizardMeta.idempotency_key.length >= 8
      ? wizardMeta.idempotency_key
      : null;

  const parsed = wizardFormSchema.safeParse(record.form);
  if (!parsed.success || !parsed.data) return { form: base, idempotencyKey };

  const f = parsed.data;
  return {
    idempotencyKey,
    form: {
      company: { ...base.company, ...f.company },
      slug: f.slug ?? base.slug,
      plan: { ...base.plan, ...f.plan },
      admin: { ...base.admin, ...f.admin },
      additional_admins: f.additional_admins ?? base.additional_admins,
      enabled_modules: f.enabled_modules ?? base.enabled_modules,
      departments: f.departments ?? base.departments,
      work_policy: { ...base.work_policy, ...f.work_policy },
      leave_types: f.leave_types ?? base.leave_types,
      approval_lines: f.approval_lines ?? base.approval_lines,
      document_templates: f.document_templates ?? base.document_templates,
    },
  };
}

/** 마법사 폼 → draft.form_data(서버 저장). _wizard 네임스페이스에 멱등키 보관(RPC 의 _submission 과 분리). */
export function serializeDraftFormData(
  form: WizardForm,
  idempotencyKey: string,
): Record<string, unknown> {
  return {
    _wizard: { version: WIZARD_VERSION, idempotency_key: idempotencyKey },
    form,
  };
}

// =====================================================================
// 등록 payload 빌더 — UI shape → tenantRegistrationSchema 입력(snake_case).
// =====================================================================

function trimOrUndef(v: string): string | undefined {
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function toIntOr(v: string, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/**
 * 마법사 폼을 등록 payload(schema 입력 shape)로 변환한다.
 * 빈 선택 필드는 omit(스키마 .nullable().optional() / .default()). 부서 parent_ui_id → parent_code.
 * 결재라인 steps → default_line(order=배열위치, conditions=[] 고정 — 조건 DSL 은 WI-034 소유).
 */
export function buildRegistrationPayload(form: WizardForm): Record<string, unknown> {
  // 부서: ui_id → code 맵으로 parent_code 해소. code 없는 parent 참조는 드롭(스키마가 거부).
  const codeByUiId = new Map<string, string>();
  for (const d of form.departments) {
    const code = d.code.trim();
    if (code) codeByUiId.set(d.ui_id, code);
  }

  const departments = form.departments
    .map((d) => {
      const name = d.name.trim();
      if (!name) return null;
      const code = trimOrUndef(d.code);
      const parentCode = d.parent_ui_id ? codeByUiId.get(d.parent_ui_id) : undefined;
      return {
        name,
        ...(code ? { code } : {}),
        ...(parentCode ? { parent_code: parentCode } : {}),
      };
    })
    .filter((d): d is { name: string; code?: string; parent_code?: string } => d !== null);

  const company = {
    name: form.company.name.trim(),
    business_number: form.company.business_number,
    representative_name: form.company.representative_name.trim(),
    ...(trimOrUndef(form.company.industry) ? { industry: trimOrUndef(form.company.industry) } : {}),
    ...(trimOrUndef(form.company.address) ? { address: trimOrUndef(form.company.address) } : {}),
    ...(trimOrUndef(form.company.phone) ? { phone: trimOrUndef(form.company.phone) } : {}),
    ...(trimOrUndef(form.company.logo_url) ? { logo_url: trimOrUndef(form.company.logo_url) } : {}),
  };

  const workPolicy = form.work_policy.enabled
    ? {
        name: trimOrUndef(form.work_policy.name) ?? '기본 근무제',
        ...(trimOrUndef(form.work_policy.standard_clock_in)
          ? { standard_clock_in: trimOrUndef(form.work_policy.standard_clock_in) }
          : {}),
        ...(trimOrUndef(form.work_policy.standard_clock_out)
          ? { standard_clock_out: trimOrUndef(form.work_policy.standard_clock_out) }
          : {}),
        ...(trimOrUndef(form.work_policy.late_threshold)
          ? { late_threshold: trimOrUndef(form.work_policy.late_threshold) }
          : {}),
        break_minutes_default: toIntOr(form.work_policy.break_minutes_default, 0),
        weekly_max_hours: toIntOr(form.work_policy.weekly_max_hours, 52),
        applicable_departments: [],
      }
    : undefined;

  return {
    company,
    slug: form.slug,
    plan_id: form.plan.plan_id,
    contract_start_date: form.plan.contract_start_date,
    ...(trimOrUndef(form.plan.contract_end_date)
      ? { contract_end_date: form.plan.contract_end_date }
      : {}),
    user_limit: toIntOr(form.plan.user_limit, 0),
    billing_cycle: form.plan.billing_cycle,
    admin: {
      email: form.admin.email,
      name: form.admin.name.trim(),
      ...(trimOrUndef(form.admin.phone) ? { phone: trimOrUndef(form.admin.phone) } : {}),
    },
    additional_admins: form.additional_admins.map((a) => ({
      email: a.email,
      name: a.name.trim(),
    })),
    enabled_modules: form.enabled_modules,
    departments,
    ...(workPolicy ? { work_policy: workPolicy } : {}),
    leave_types: form.leave_types.map((lt, i) => ({
      key: lt.key.trim(),
      ...(trimOrUndef(lt.label_ko) ? { label_ko: trimOrUndef(lt.label_ko) } : {}),
      default_days: toIntOr(lt.default_days, 0),
      is_paid: lt.is_paid,
      carryover_allowed: lt.carryover_allowed,
      evidence_required: lt.evidence_required,
      sort_order: i,
    })),
    approval_lines: form.approval_lines.map((line) => ({
      name: line.name.trim(),
      request_type: line.request_type,
      conditions: [],
      default_line: line.steps.map((s, i) => ({
        order: i + 1,
        approver_role: s.approver_role,
        dept_scope: s.dept_scope,
      })),
      is_active: line.is_active,
    })),
    document_templates: form.document_templates.map((dt) => ({
      key: dt.key.trim(),
      ...(trimOrUndef(dt.label_ko) ? { label_ko: trimOrUndef(dt.label_ko) } : {}),
    })),
  };
}

/** 전체 payload 가 등록 스키마를 통과하는지(UX 사전 검증). 서버가 권위 재검증. */
export function validateFullPayload(
  form: WizardForm,
): { ok: true; payload: TenantRegistrationPayload } | { ok: false } {
  const parsed = tenantRegistrationSchema.safeParse(buildRegistrationPayload(form));
  return parsed.success ? { ok: true, payload: parsed.data } : { ok: false };
}

// =====================================================================
// 단계별 검증 — "다음" 버튼 게이팅. 동기(형식) 검증만; 비동기 중복검사는 호출측(asyncOk)에서 합류.
// =====================================================================

export interface AsyncAvailability {
  /** 마지막으로 확인된 값이 현재 입력과 일치하고 available=true 인가. */
  domain: boolean;
  business: boolean;
  adminEmail: boolean;
}

/**
 * 한 단계의 동기 검증 통과 여부. 비동기(slug/business/email 중복) 게이트는 stepRequiresAsync 로
 * 어떤 비동기 체크가 통과해야 하는지 알리고, 호출측이 asyncOk 와 AND 한다.
 */
export function validateStepSync(step: StepKey, form: WizardForm): boolean {
  switch (step) {
    case 'company':
      return (
        tenantCompanyInputSchema.safeParse({
          name: form.company.name,
          business_number: form.company.business_number,
          representative_name: form.company.representative_name,
          industry: trimOrUndef(form.company.industry) ?? null,
          address: trimOrUndef(form.company.address) ?? null,
          phone: trimOrUndef(form.company.phone) ?? null,
          logo_url: trimOrUndef(form.company.logo_url) ?? null,
        }).success && normalizeBusinessNumber(form.company.business_number) !== null
      );
    case 'domain':
      return validateSlugFormat(form.slug).ok;
    case 'plan': {
      if (!form.plan.plan_id) return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.plan.contract_start_date)) return false;
      if (form.plan.contract_end_date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(form.plan.contract_end_date)) return false;
        if (form.plan.contract_end_date <= form.plan.contract_start_date) return false;
      }
      const limit = Number(form.plan.user_limit);
      return Number.isInteger(limit) && limit >= 1 && limit <= 100_000;
    }
    case 'admin': {
      if (!tenantAdminInputSchema.safeParse(form.admin).success) return false;
      if (form.additional_admins.length > 3) return false;
      const emails = [
        form.admin.email.trim().toLowerCase(),
        ...form.additional_admins.map((a) => a.email.trim().toLowerCase()),
      ];
      // 추가 관리자 형식 + 전체 이메일 유일.
      for (const a of form.additional_admins) {
        if (!z.string().email().safeParse(a.email.trim().toLowerCase()).success) return false;
        if (a.name.trim().length === 0) return false;
      }
      return new Set(emails).size === emails.length;
    }
    case 'modules':
      // 모듈은 0개 이상 허용(선택). 항상 통과.
      return true;
    case 'initial_data':
      // 초기 데이터는 전부 선택 — 전체 payload 검증으로 정합 확인(부서 토폴로지/유일 key/활성 라인 default_line 등).
      return validateFullPayload(form).ok;
    case 'review':
      return validateFullPayload(form).ok;
    default:
      return false;
  }
}

/** 단계가 비동기 중복검사 통과를 요구하는지 + 어떤 키인지. */
export function stepAsyncGate(step: StepKey): (keyof AsyncAvailability)[] {
  if (step === 'company') return ['business'];
  if (step === 'domain') return ['domain'];
  if (step === 'admin') return ['adminEmail'];
  return [];
}

/** 단계 전체(동기 + 비동기) 통과 여부. */
export function isStepComplete(step: StepKey, form: WizardForm, async: AsyncAvailability): boolean {
  if (!validateStepSync(step, form)) return false;
  return stepAsyncGate(step).every((k) => async[k]);
}

// =====================================================================
// 청구액 계산 — review 단계 표시용. per-user × 인원 (+ base). annual 은 12개월 환산 표기.
// =====================================================================

export interface BillingSummary {
  perUser: number;
  base: number;
  users: number;
  monthly: number;
  /** 연 계약(annual) 환산 — monthly × 12. */
  annual: number;
  cycle: 'monthly' | 'annual';
}

export function calcBilling(
  plan: Pick<PlanOption, 'basePriceKrw' | 'perUserPriceKrw'> | null,
  userLimit: string,
  cycle: 'monthly' | 'annual',
): BillingSummary {
  const perUser = plan?.perUserPriceKrw ?? 0;
  const base = plan?.basePriceKrw ?? 0;
  const users = Math.max(0, toIntOr(userLimit, 0));
  const monthly = base + perUser * users;
  return { perUser, base, users, monthly, annual: monthly * 12, cycle };
}

/** plan.modules 와 교차한 표시 가능 모듈(plan 이 지원하는 모듈만 토글 노출). */
export function modulesForPlan(plan: PlanOption | null): TenantModule[] {
  if (!plan) return [];
  const supported = new Set(plan.modules);
  return ALL_MODULES.filter((m) => supported.has(m));
}
