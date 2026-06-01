import { z } from 'zod';
import { uuidSchema } from './common';
import { approvalRequestTypeEnum, billingCycleEnum } from './entities/enums';
import { approvalStepArraySchema, conditionRuleSchema } from './approval-line-dsl';

/**
 * OP-04 신규 테넌트 등록(온보딩) DTO + 실시간 검증 SSOT (WI-035, ST-006).
 *
 * SSOT: .flowset/api/operator.md OP-04 + .flowset/prd/domains/operator/OP-04-onboarding.md +
 *       .flowset/wireframes/html/OP-04.html (7단계 마법사, Phase 5 PASS).
 * 본 파일이 슬러그 예약어/regex, 사업자번호 정규화, 7단계 등록 payload 의 SSOT —
 * lib(서버 액션)와 WI-036 마법사 UI 가 함께 import 한다.
 *
 * **snake_case** — DB 컬럼/jsonb 와 1:1(repo entity 컨벤션). 최종 등록은 service_role RPC
 * `register_tenant`(mig 42)가 payload(jsonb)를 받아 단일 트랜잭션으로 tenants/subscriptions/
 * tenant_settings + 초기 데이터 + 관리자 invitation 을 원자 INSERT 한다(create-at-activate:
 * 관리자 user 는 활성화 시점 생성, 등록 시점엔 invitation 행만).
 */

const HHMM = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const timeString = z.string().regex(HHMM, 'HH:MM 또는 HH:MM:SS 형식이어야 합니다');

// =====================================================================
// 도메인 슬러그 — `{slug}.flowhr.kr` (OP-04 2단계)
// =====================================================================

/**
 * 예약 슬러그 — 시스템/인프라/공용 경로와 충돌하는 서브도메인 차단.
 * SSOT(이 Set) — check-domain 액션과 UI 가 동일 목록을 참조한다.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set<string>([
  'admin', 'api', 'www', 'app', 'apps', 'mail', 'smtp', 'imap', 'pop', 'ftp', 'root',
  'support', 'help', 'helpdesk', 'status', 'blog', 'news', 'dev', 'staging', 'stage',
  'test', 'testing', 'demo', 'sandbox', 'billing', 'invoice', 'pay', 'payment',
  'account', 'accounts', 'login', 'logout', 'signup', 'signin', 'auth', 'oauth', 'sso',
  'dashboard', 'console', 'internal', 'system', 'public', 'static', 'assets', 'cdn',
  'img', 'images', 'file', 'files', 'download', 'downloads', 'upload', 'uploads',
  'operator', 'operators', 'tenant', 'tenants', 'settings', 'setting', 'config',
  'flowhr', 'flow', 'about', 'contact', 'pricing', 'docs', 'doc', 'security',
  'privacy', 'terms', 'legal', 'me', 'us', 'no-reply', 'noreply', 'webmaster',
]);

/** 슬러그 형식: 소문자 영숫자+하이픈 3~30자. 선/후행 하이픈·연속 하이픈 금지(DNS 라벨 정합). */
export const SLUG_PATTERN = /^[a-z0-9-]{3,30}$/;

export type SlugCheckReason = 'invalid_format' | 'reserved' | 'taken';

/** 슬러그 형식/예약어 검증(중복은 DB 조회). 통과 시 정규화된(lowercase) 슬러그 반환. */
export function validateSlugFormat(
  raw: string,
): { ok: true; slug: string } | { ok: false; reason: 'invalid_format' | 'reserved' } {
  const slug = raw.trim().toLowerCase();
  if (
    !SLUG_PATTERN.test(slug) ||
    slug.startsWith('-') ||
    slug.endsWith('-') ||
    slug.includes('--')
  ) {
    return { ok: false, reason: 'invalid_format' };
  }
  if (RESERVED_SLUGS.has(slug)) return { ok: false, reason: 'reserved' };
  return { ok: true, slug };
}

export const tenantSlugSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .superRefine((slug, ctx) => {
    const result = validateSlugFormat(slug);
    if (!result.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          result.reason === 'reserved'
            ? '예약된 도메인입니다'
            : '도메인 형식이 올바르지 않습니다(소문자/숫자/하이픈 3~30자)',
      });
    }
  });

// =====================================================================
// 사업자등록번호 — ###-##-##### (OP-04 1단계)
// =====================================================================

export const BUSINESS_NUMBER_PATTERN = /^\d{3}-\d{2}-\d{5}$/;

/** 입력에서 숫자만 추출해 canonical(###-##-#####)로 정규화. 10자리 아니면 null. */
export function normalizeBusinessNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 10) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export const businessNumberSchema = z
  .string()
  .superRefine((raw, ctx) => {
    if (normalizeBusinessNumber(raw) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '사업자등록번호 형식이 올바르지 않습니다(###-##-#####)',
      });
    }
  })
  // 검증 통과분만 canonical 로 변환(refine 실패 시 transform 미도달).
  .transform((raw) => normalizeBusinessNumber(raw) ?? raw);

// =====================================================================
// 실시간 검증 입력 (check-domain / check-business-number / check-admin-email)
// =====================================================================

export const checkDomainInputSchema = z.object({ slug: z.string().min(1).max(64) }).strict();
export const checkBusinessNumberInputSchema = z
  .object({ business_number: z.string().min(1).max(32) })
  .strict();
export const checkAdminEmailInputSchema = z
  .object({ email: z.string().trim().toLowerCase().email().max(200) })
  .strict();

// =====================================================================
// 7단계 등록 payload
// =====================================================================

// ── 1단계 회사정보 → tenants 컬럼 + tenant_settings.company_info ─────────────────
export const tenantCompanyInputSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    business_number: businessNumberSchema,
    representative_name: z.string().trim().min(1).max(100),
    industry: z.string().trim().max(100).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    phone: z.string().trim().max(50).nullable().optional(),
    logo_url: z.string().trim().url().max(1000).nullable().optional(),
  })
  .strict();

// ── 4단계 관리자 계정 ───────────────────────────────────────────────────────────
export const tenantAdminInputSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(200),
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(50).nullable().optional(),
  })
  .strict();

export const additionalAdminInputSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(200),
    name: z.string().trim().min(1).max(100),
  })
  .strict();

// ── 5단계 모듈 선택 → tenants.metadata.enabled_modules ───────────────────────────
export const tenantModuleEnum = z.enum([
  'attendance',
  'leave',
  'approval',
  'payroll',
  'documents',
  'integrations',
]);
export type TenantModule = z.infer<typeof tenantModuleEnum>;

// ── 6단계 초기 데이터 ────────────────────────────────────────────────────────────
export const departmentInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    code: z.string().trim().min(1).max(50).nullable().optional(),
    // 상위 부서 code(같은 목록 내 존재 강제 — superRefine). 루트 부서는 생략.
    parent_code: z.string().trim().min(1).max(50).nullable().optional(),
  })
  .strict();

export const workPolicyInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100).default('기본 근무제'),
    standard_clock_in: timeString.nullable().optional(),
    standard_clock_out: timeString.nullable().optional(),
    late_threshold: timeString.nullable().optional(),
    break_minutes_default: z.number().int().min(0).max(1440).default(0),
    weekly_max_hours: z.number().int().min(0).max(168).default(52),
    applicable_departments: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export const leaveTypeInputSchema = z
  .object({
    key: z.string().trim().min(1).max(50),
    label_ko: z.string().trim().max(100).nullable().optional(),
    default_days: z.number().int().min(0).max(365).default(0),
    is_paid: z.boolean().default(true),
    carryover_allowed: z.boolean().default(false),
    evidence_required: z.boolean().default(false),
    sort_order: z.number().int().min(0).max(9999).default(0),
  })
  .strict();

export const approvalLineInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    request_type: approvalRequestTypeEnum,
    conditions: z.array(conditionRuleSchema).default([]),
    default_line: approvalStepArraySchema.default([]),
    is_active: z.boolean().default(true),
  })
  .strict()
  .superRefine((line, ctx) => {
    if (line.is_active && line.default_line.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['default_line'],
        message: '활성 결재라인은 기본 결재선(default_line)이 1단계 이상이어야 합니다',
      });
    }
  });

export const documentTemplateInputSchema = z
  .object({
    key: z.string().trim().min(1).max(50),
    label_ko: z.string().trim().max(100).nullable().optional(),
    template_body: z.string().max(20_000).nullable().optional(),
    variables: z.array(z.string().trim().min(1)).default([]),
    template_format: z.string().trim().max(50).nullable().optional(),
  })
  .strict();

// ── 등록 payload 본체 ────────────────────────────────────────────────────────────
export const tenantRegistrationSchema = z
  .object({
    // 1단계 회사정보
    company: tenantCompanyInputSchema,
    // 2단계 도메인
    slug: tenantSlugSchema,
    // 3단계 요금제 — 가격은 등록 시점 plan 에서 latch(RPC)
    plan_id: uuidSchema,
    contract_start_date: z.string().date(),
    contract_end_date: z.string().date().nullable().optional(),
    user_limit: z.number().int().min(1).max(100_000),
    billing_cycle: billingCycleEnum.default('monthly'),
    // 4단계 관리자
    admin: tenantAdminInputSchema,
    additional_admins: z.array(additionalAdminInputSchema).max(3).default([]),
    // 5단계 모듈
    enabled_modules: z.array(tenantModuleEnum).default([]),
    // 6단계 초기 데이터(전부 선택)
    departments: z.array(departmentInputSchema).max(200).default([]),
    work_policy: workPolicyInputSchema.nullable().optional(),
    leave_types: z.array(leaveTypeInputSchema).max(50).default([]),
    approval_lines: z.array(approvalLineInputSchema).max(50).default([]),
    document_templates: z.array(documentTemplateInputSchema).max(50).default([]),
  })
  .strict()
  .superRefine((data, ctx) => {
    // 계약 기간 정합 — 종료일은 시작일 이후.
    if (data.contract_end_date && data.contract_end_date <= data.contract_start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contract_end_date'],
        message: '계약 종료일은 시작일 이후여야 합니다',
      });
    }

    // 관리자 이메일 중복(대표 + 추가) 차단.
    const adminEmails = [data.admin.email, ...data.additional_admins.map((a) => a.email)];
    const seenEmails = new Set<string>();
    adminEmails.forEach((email, i) => {
      if (seenEmails.has(email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: i === 0 ? ['admin', 'email'] : ['additional_admins', i - 1, 'email'],
          message: '관리자 이메일이 중복되었습니다',
        });
      }
      seenEmails.add(email);
    });

    // leave_types key 유일.
    const leaveKeys = new Set<string>();
    data.leave_types.forEach((lt, i) => {
      if (leaveKeys.has(lt.key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['leave_types', i, 'key'],
          message: '휴가 종류 key 가 중복되었습니다',
        });
      }
      leaveKeys.add(lt.key);
    });

    // document_templates key 유일.
    const docKeys = new Set<string>();
    data.document_templates.forEach((dt, i) => {
      if (docKeys.has(dt.key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['document_templates', i, 'key'],
          message: '문서 양식 key 가 중복되었습니다',
        });
      }
      docKeys.add(dt.key);
    });

    // departments code 유일 + parent_code 는 **앞선 인덱스의 code** 참조 강제.
    // 토폴로지 순서(상위 먼저)를 강제해 RPC 가 단일 패스로 parent_id 를 code 조회로 해소하게 한다.
    const seenCodes = new Set<string>();
    data.departments.forEach((d, i) => {
      if (d.parent_code) {
        if (d.parent_code === d.code) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['departments', i, 'parent_code'],
            message: '부서는 자기 자신을 상위로 가질 수 없습니다',
          });
        } else if (!seenCodes.has(d.parent_code)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['departments', i, 'parent_code'],
            message: '상위 부서는 목록에서 먼저 정의되어야 합니다',
          });
        }
      }
      if (d.code) {
        if (seenCodes.has(d.code)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['departments', i, 'code'],
            message: '부서 code 가 중복되었습니다',
          });
        }
        seenCodes.add(d.code);
      }
    });
  });

export type TenantRegistrationPayload = z.infer<typeof tenantRegistrationSchema>;

// =====================================================================
// 임시저장 draft (OP-04 임시저장/재진입)
// =====================================================================

/** 임시저장 입력 — 진행 단계 + 부분 form_data(검증 전 자유 형태). 최종 검증은 submit 시점. */
export const tenantDraftInputSchema = z
  .object({
    current_step: z.number().int().min(1).max(7),
    form_data: z.record(z.unknown()).default({}),
  })
  .strict();

export type TenantDraftInput = z.infer<typeof tenantDraftInputSchema>;

// =====================================================================
// 최종 등록 입력(서버 액션 계약) — 멱등키 + (선택)draftId + payload
// =====================================================================
export const tenantRegistrationInputSchema = z
  .object({
    draft_id: uuidSchema.optional(),
    // 클라이언트 생성 멱등키(재시도/중복제출 방지) — draft 에 보관.
    idempotency_key: z.string().trim().min(8).max(200),
    payload: tenantRegistrationSchema,
  })
  .strict();

export type TenantRegistrationInput = z.infer<typeof tenantRegistrationInputSchema>;
