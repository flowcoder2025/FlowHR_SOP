import { describe, expect, it } from 'vitest';
import type { PlanOption } from './queries';
import {
  type WizardForm,
  buildRegistrationPayload,
  calcBilling,
  emptyWizardForm,
  isStepComplete,
  modulesForPlan,
  parseDraftFormData,
  serializeDraftFormData,
  validateFullPayload,
  validateStepSync,
} from './wizard';

const PLAN_ID = '11111111-1111-4111-8111-111111111111';

const PREMIUM: PlanOption = {
  id: PLAN_ID,
  slug: 'premium',
  name: '프리미엄',
  basePriceKrw: 0,
  perUserPriceKrw: 19800,
  includedUsers: 200,
  modules: ['attendance', 'leave', 'approval', 'payroll'],
  status: 'active',
};

const ALL_OK = { domain: true, business: true, adminEmail: true };

/** 전체 payload 검증을 통과하는 최소 유효 폼. */
function validForm(): WizardForm {
  const f = emptyWizardForm();
  f.company.name = '플로우상사';
  f.company.business_number = '123-45-67890';
  f.company.representative_name = '이대표';
  f.slug = 'flow-trading';
  f.plan.plan_id = PLAN_ID;
  f.plan.contract_start_date = '2026-07-01';
  f.plan.user_limit = '30';
  f.admin.email = 'ceo@flow.kr';
  f.admin.name = '이대표';
  return f;
}

describe('emptyWizardForm', () => {
  it('빈 폼은 모든 배열이 비어 있고 work_policy.enabled=false', () => {
    const f = emptyWizardForm();
    expect(f.departments).toEqual([]);
    expect(f.additional_admins).toEqual([]);
    expect(f.enabled_modules).toEqual([]);
    expect(f.work_policy.enabled).toBe(false);
    expect(f.plan.billing_cycle).toBe('monthly');
  });
});

describe('validateStepSync', () => {
  it('company: 사업자번호 형식 위반이면 실패, 정상이면 통과', () => {
    const f = validForm();
    f.company.business_number = '123456';
    expect(validateStepSync('company', f)).toBe(false);
    f.company.business_number = '123-45-67890';
    expect(validateStepSync('company', f)).toBe(true);
  });

  it('company: 필수값(회사명/대표자) 누락이면 실패', () => {
    const f = validForm();
    f.company.name = '';
    expect(validateStepSync('company', f)).toBe(false);
  });

  it('domain: 예약어/형식 위반은 실패, 정상 슬러그는 통과', () => {
    const f = validForm();
    f.slug = 'admin'; // 예약어
    expect(validateStepSync('domain', f)).toBe(false);
    f.slug = 'ab'; // 너무 짧음
    expect(validateStepSync('domain', f)).toBe(false);
    f.slug = 'flow-trading';
    expect(validateStepSync('domain', f)).toBe(true);
  });

  it('plan: 계약 종료일 ≤ 시작일이면 실패, 인원 범위 검증', () => {
    const f = validForm();
    f.plan.contract_end_date = '2026-06-01'; // 시작 이전
    expect(validateStepSync('plan', f)).toBe(false);
    f.plan.contract_end_date = '2027-06-30';
    expect(validateStepSync('plan', f)).toBe(true);
    f.plan.user_limit = '0';
    expect(validateStepSync('plan', f)).toBe(false);
    f.plan.user_limit = '30';
    expect(validateStepSync('plan', f)).toBe(true);
  });

  it('admin: 추가 관리자 이메일이 대표와 중복이면 실패', () => {
    const f = validForm();
    f.additional_admins = [{ ui_id: 'x', email: 'ceo@flow.kr', name: '중복' }];
    expect(validateStepSync('admin', f)).toBe(false);
    f.additional_admins = [{ ui_id: 'x', email: 'hr@flow.kr', name: '인사' }];
    expect(validateStepSync('admin', f)).toBe(true);
  });

  it('admin: 추가 관리자 4명 이상이면 실패', () => {
    const f = validForm();
    f.additional_admins = [1, 2, 3, 4].map((n) => ({
      ui_id: `x${n}`,
      email: `a${n}@flow.kr`,
      name: `n${n}`,
    }));
    expect(validateStepSync('admin', f)).toBe(false);
  });

  it('modules: 항상 통과(선택)', () => {
    expect(validateStepSync('modules', validForm())).toBe(true);
  });
});

describe('buildRegistrationPayload', () => {
  it('빈 회사 선택필드는 omit 된다', () => {
    const payload = buildRegistrationPayload(validForm()) as {
      company: Record<string, unknown>;
      contract_end_date?: string;
      work_policy?: unknown;
    };
    expect(payload.company.industry).toBeUndefined();
    expect(payload.company.logo_url).toBeUndefined();
    expect(payload.contract_end_date).toBeUndefined();
    expect(payload.work_policy).toBeUndefined();
  });

  it('부서 parent_ui_id → 앞선 행의 code 로 parent_code 변환(토폴로지)', () => {
    const f = validForm();
    f.departments = [
      { ui_id: 'a', name: '본사', code: 'HQ', parent_ui_id: null },
      { ui_id: 'b', name: '주방', code: 'KITCHEN', parent_ui_id: 'a' },
    ];
    const payload = buildRegistrationPayload(f) as {
      departments: { name: string; code?: string; parent_code?: string }[];
    };
    expect(payload.departments).toEqual([
      { name: '본사', code: 'HQ' },
      { name: '주방', code: 'KITCHEN', parent_code: 'HQ' },
    ]);
  });

  it('code 없는 행을 parent 로 지정하면 parent_code 가 드롭된다', () => {
    const f = validForm();
    f.departments = [
      { ui_id: 'a', name: '본사', code: '', parent_ui_id: null },
      { ui_id: 'b', name: '주방', code: 'KITCHEN', parent_ui_id: 'a' },
    ];
    const payload = buildRegistrationPayload(f) as {
      departments: { name: string; parent_code?: string }[];
    };
    expect(payload.departments[1].parent_code).toBeUndefined();
  });

  it('결재라인 steps → default_line(order 1..n) + conditions 빈배열', () => {
    const f = validForm();
    f.approval_lines = [
      {
        ui_id: 'l1',
        name: '휴가 결재',
        request_type: 'leave',
        steps: [
          { approver_role: 'tenant_hr_admin', dept_scope: 'all' },
          { approver_role: 'tenant_super', dept_scope: 'all' },
        ],
        is_active: true,
      },
    ];
    const payload = buildRegistrationPayload(f) as {
      approval_lines: { conditions: unknown[]; default_line: { order: number }[] }[];
    };
    expect(payload.approval_lines[0].conditions).toEqual([]);
    expect(payload.approval_lines[0].default_line.map((s) => s.order)).toEqual([1, 2]);
  });

  it('work_policy.enabled=true 면 숫자 coerce + applicable_departments 빈배열 포함', () => {
    const f = validForm();
    f.work_policy = {
      enabled: true,
      name: '표준',
      standard_clock_in: '09:00',
      standard_clock_out: '18:00',
      late_threshold: '',
      break_minutes_default: '60',
      weekly_max_hours: '52',
    };
    const payload = buildRegistrationPayload(f) as {
      work_policy?: { break_minutes_default: number; applicable_departments: unknown[]; late_threshold?: string };
    };
    expect(payload.work_policy?.break_minutes_default).toBe(60);
    expect(payload.work_policy?.applicable_departments).toEqual([]);
    expect(payload.work_policy?.late_threshold).toBeUndefined();
  });

  it('leave_types sort_order 는 배열 인덱스', () => {
    const f = validForm();
    f.leave_types = [
      { ui_id: '1', key: 'annual', label_ko: '연차', default_days: '15', is_paid: true, carryover_allowed: false, evidence_required: false },
      { ui_id: '2', key: 'sick', label_ko: '병가', default_days: '0', is_paid: false, carryover_allowed: false, evidence_required: true },
    ];
    const payload = buildRegistrationPayload(f) as {
      leave_types: { key: string; sort_order: number; default_days: number }[];
    };
    expect(payload.leave_types.map((l) => l.sort_order)).toEqual([0, 1]);
    expect(payload.leave_types[0].default_days).toBe(15);
  });

  it('생성한 payload 는 등록 스키마를 통과한다', () => {
    expect(validateFullPayload(validForm()).ok).toBe(true);
  });

  it('활성 결재라인인데 단계가 없으면 스키마 실패', () => {
    const f = validForm();
    f.approval_lines = [
      { ui_id: 'l1', name: '빈 라인', request_type: 'leave', steps: [], is_active: true },
    ];
    expect(validateFullPayload(f).ok).toBe(false);
  });
});

describe('draft serde', () => {
  it('serialize → parse 라운드트립: 멱등키 + 폼 보존', () => {
    const f = validForm();
    f.enabled_modules = ['attendance', 'leave'];
    f.departments = [{ ui_id: 'a', name: '본사', code: 'HQ', parent_ui_id: null }];
    const serialized = serializeDraftFormData(f, 'idem-key-1234');
    const { form, idempotencyKey } = parseDraftFormData(serialized);
    expect(idempotencyKey).toBe('idem-key-1234');
    expect(form.company.name).toBe('플로우상사');
    expect(form.slug).toBe('flow-trading');
    expect(form.enabled_modules).toEqual(['attendance', 'leave']);
    expect(form.departments[0].code).toBe('HQ');
  });

  it('손상된 form_data 는 기본 폼으로 degrade', () => {
    expect(parseDraftFormData(null).form).toEqual(emptyWizardForm());
    expect(parseDraftFormData('garbage').form).toEqual(emptyWizardForm());
    expect(parseDraftFormData({ form: 42 }).form).toEqual(emptyWizardForm());
  });

  it('짧은 멱등키(<8)는 null 로 무시', () => {
    const parsed = parseDraftFormData({ _wizard: { idempotency_key: 'short' }, form: {} });
    expect(parsed.idempotencyKey).toBeNull();
  });
});

describe('calcBilling', () => {
  it('월 청구액 = base + perUser × users, annual = ×12', () => {
    const b = calcBilling(PREMIUM, '30', 'monthly');
    expect(b.monthly).toBe(19800 * 30);
    expect(b.annual).toBe(19800 * 30 * 12);
    expect(b.users).toBe(30);
  });

  it('plan null 또는 인원 비정상이면 0 처리', () => {
    expect(calcBilling(null, '30', 'monthly').monthly).toBe(0);
    expect(calcBilling(PREMIUM, '', 'monthly').users).toBe(0);
  });
});

describe('modulesForPlan', () => {
  it('plan.modules subset 만 + 표시 순서 유지', () => {
    expect(modulesForPlan(PREMIUM)).toEqual(['attendance', 'leave', 'approval', 'payroll']);
    expect(modulesForPlan(null)).toEqual([]);
  });
});

describe('isStepComplete', () => {
  it('domain 단계는 동기검증 + async.domain 둘 다 통과해야 완료', () => {
    const f = validForm();
    expect(isStepComplete('domain', f, ALL_OK)).toBe(true);
    expect(isStepComplete('domain', f, { ...ALL_OK, domain: false })).toBe(false);
  });

  it('company 단계는 async.business 게이트에 의존', () => {
    const f = validForm();
    expect(isStepComplete('company', f, { ...ALL_OK, business: false })).toBe(false);
    expect(isStepComplete('company', f, ALL_OK)).toBe(true);
  });

  it('modules 단계는 async 게이트 없음', () => {
    expect(isStepComplete('modules', validForm(), { domain: false, business: false, adminEmail: false })).toBe(true);
  });
});
