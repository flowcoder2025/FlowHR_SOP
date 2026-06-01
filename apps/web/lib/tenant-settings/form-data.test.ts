import { describe, expect, it } from 'vitest';
import {
  buildApprovalLinesPayload,
  buildCompanyPayload,
  buildLeavePolicyPayload,
  buildWorkPolicyPayload,
  collectSpecificEmployeeIds,
  normalizeApplyAt,
  type ApprovalLineDraft,
  type LeaveTypeDraft,
} from './form-data';
import {
  approvalLinesPayloadSchema,
  companySettingsPayloadSchema,
  leavePolicyPayloadSchema,
  workPolicyPayloadSchema,
} from '@flowhr/schemas';

describe('normalizeApplyAt', () => {
  it("mode=now 는 apply_at 을 생략한다(즉시)", () => {
    expect(normalizeApplyAt('now', '2026-06-10T09:30')).toEqual({ ok: true, applyAt: undefined });
    expect(normalizeApplyAt('now', '')).toEqual({ ok: true, applyAt: undefined });
  });

  it('mode=scheduled + 16자 datetime-local → KST offset(초 보강)', () => {
    expect(normalizeApplyAt('scheduled', '2026-06-10T09:30')).toEqual({
      ok: true,
      applyAt: '2026-06-10T09:30:00+09:00',
    });
  });

  it('mode=scheduled + 19자(초 포함) → 그대로 KST offset', () => {
    expect(normalizeApplyAt('scheduled', '2026-06-10T09:30:45')).toEqual({
      ok: true,
      applyAt: '2026-06-10T09:30:45+09:00',
    });
  });

  it('mode=scheduled + 빈값 → apply_at_required', () => {
    expect(normalizeApplyAt('scheduled', '')).toEqual({ ok: false, error: 'apply_at_required' });
    expect(normalizeApplyAt('scheduled', '   ')).toEqual({ ok: false, error: 'apply_at_required' });
    expect(normalizeApplyAt('scheduled', null)).toEqual({ ok: false, error: 'apply_at_required' });
  });

  it('정규화 결과는 settingApplyAtSchema(datetime offset)와 호환된다', () => {
    const r = normalizeApplyAt('scheduled', '2026-06-10T09:30');
    expect(r.ok).toBe(true);
    if (r.ok && r.applyAt) {
      // z.string().datetime({offset:true}) 는 offset 포함 ISO 를 허용.
      expect(new Date(r.applyAt).toISOString()).toBe('2026-06-10T00:30:00.000Z');
    }
  });
});

describe('buildCompanyPayload (full-replace, 빈 필드 생략)', () => {
  it('빈/공백 필드는 키 자체를 제외하고 trim 한다', () => {
    const payload = buildCompanyPayload({
      company_name: '  (주)치킨매니아  ',
      ceo_name: '',
      contact: '   ',
      email: 'ceo@example.com',
      address: undefined,
      industry: '외식업',
      logo_url: '',
    });
    expect(payload).toEqual({
      company_name: '(주)치킨매니아',
      email: 'ceo@example.com',
      industry: '외식업',
    });
    expect(companySettingsPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it('전부 비면 빈 객체(저장 시 company_info 초기화)', () => {
    const payload = buildCompanyPayload({ company_name: '', email: '' });
    expect(payload).toEqual({});
    expect(companySettingsPayloadSchema.safeParse(payload).success).toBe(true);
  });
});

describe('buildWorkPolicyPayload (시간 optional, late_threshold 게이트)', () => {
  it('표준 시간/부서/적용일을 정규화하고 zod 통과', () => {
    const payload = buildWorkPolicyPayload({
      name: '기본 근무정책',
      standard_clock_in: '09:00',
      standard_clock_out: '18:00',
      late_threshold: '09:10',
      break_minutes_default: '60',
      weekly_max_hours: '52',
      applicable_departments: '개발팀, 영업팀 , ,디자인팀',
      applied_from: '2026-07-01',
    });
    expect(payload).toMatchObject({
      name: '기본 근무정책',
      standard_clock_in: '09:00',
      standard_clock_out: '18:00',
      late_threshold: '09:10',
      break_minutes_default: 60,
      weekly_max_hours: 52,
      applicable_departments: ['개발팀', '영업팀', '디자인팀'],
      applied_from: '2026-07-01',
    });
    expect(workPolicyPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it('빈 시간 필드는 생략(DB NULL) — zod 통과', () => {
    const payload = buildWorkPolicyPayload({
      name: '교대 근무',
      standard_clock_in: '',
      standard_clock_out: '',
      late_threshold: '',
      break_minutes_default: '30',
      weekly_max_hours: '40',
      applicable_departments: '',
    });
    expect(payload).not.toHaveProperty('standard_clock_in');
    expect(payload).not.toHaveProperty('late_threshold');
    expect(payload.applicable_departments).toEqual([]);
    expect(workPolicyPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it('출근 표준시간이 없으면 late_threshold 를 무시한다', () => {
    const payload = buildWorkPolicyPayload({
      name: '유연 근무',
      standard_clock_in: '',
      late_threshold: '09:30',
      break_minutes_default: '0',
      weekly_max_hours: '52',
    });
    expect(payload).not.toHaveProperty('late_threshold');
  });
});

describe('buildLeavePolicyPayload (delete_keys 산출)', () => {
  const drafts: LeaveTypeDraft[] = [
    {
      key: 'annual',
      label_ko: '연차',
      default_days: 15,
      is_paid: true,
      carryover_allowed: true,
      evidence_required: false,
      sort_order: 0,
    },
    {
      key: 'sick',
      label_ko: '병가',
      default_days: 5,
      is_paid: false,
      carryover_allowed: false,
      evidence_required: true,
      sort_order: 1,
    },
  ];

  it('원본에서 사라진 key 만 delete_keys 로 산출', () => {
    const payload = buildLeavePolicyPayload(drafts, ['annual', 'sick', 'reward', 'congratulation']);
    expect(payload.leave_types).toHaveLength(2);
    expect(payload.delete_keys?.sort()).toEqual(['congratulation', 'reward']);
    expect(leavePolicyPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it('삭제 대상이 없으면 delete_keys 를 생략', () => {
    const payload = buildLeavePolicyPayload(drafts, ['annual', 'sick']);
    expect(payload).not.toHaveProperty('delete_keys');
    expect(leavePolicyPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it('신규 key 만 있고 원본이 비면 삭제 없음', () => {
    const payload = buildLeavePolicyPayload(drafts, []);
    expect(payload).not.toHaveProperty('delete_keys');
  });

  it('label_ko 빈값은 null 로 정규화', () => {
    const payload = buildLeavePolicyPayload(
      [{ ...drafts[0], label_ko: '   ' }],
      ['annual'],
    );
    expect(payload.leave_types[0].label_ko).toBeNull();
    expect(leavePolicyPayloadSchema.safeParse(payload).success).toBe(true);
  });
});

describe('buildApprovalLinesPayload (WI-034 조건 분기 DSL)', () => {
  const managerStep = { approver_role: 'tenant_manager', dept_scope: 'own_team' };
  const ceoStep = { approver_role: 'tenant_super', dept_scope: 'all' };

  it('조건/기본선을 편집한 라인을 DSL payload 로 변환 + order 를 위치로 부여', () => {
    const edited: ApprovalLineDraft[] = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: '휴가 결재선',
        request_type: 'leave',
        is_active: true,
        conditions: [{ field: 'leave_days', op: '>=', value: '5', line: [ceoStep] }],
        default_line: [managerStep, { approver_role: 'tenant_hr_admin', dept_scope: 'all' }],
      },
    ];
    const payload = buildApprovalLinesPayload(edited);
    expect(payload.lines[0]).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      name: '휴가 결재선',
      request_type: 'leave',
      is_active: true,
      conditions: [
        {
          field: 'leave_days',
          op: '>=',
          value: 5, // 문자열 '5' → 숫자 5 정규화
          line: [{ order: 1, approver_role: 'tenant_super', dept_scope: 'all' }],
        },
      ],
      default_line: [
        { order: 1, approver_role: 'tenant_manager', dept_scope: 'own_team' },
        { order: 2, approver_role: 'tenant_hr_admin', dept_scope: 'all' },
      ],
    });
    expect(approvalLinesPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it('in/not_in 은 콤마 문자열을 배열로(숫자/문자 타입별) 정규화', () => {
    const edited: ApprovalLineDraft[] = [
      {
        name: 'L1',
        request_type: 'leave',
        is_active: true,
        conditions: [
          { field: 'leave_days', op: 'in', value: '3, 5, 10', line: [managerStep] },
          { field: 'employment_type', op: 'in', value: 'regular, contract', line: [managerStep] },
        ],
        default_line: [managerStep],
      },
    ];
    const payload = buildApprovalLinesPayload(edited);
    expect(payload.lines[0].conditions[0].value).toEqual([3, 5, 10]);
    expect(payload.lines[0].conditions[1].value).toEqual(['regular', 'contract']);
    expect(approvalLinesPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it("dept_scope!=='specific' 단계는 specific_employee_id 를 생략", () => {
    const edited: ApprovalLineDraft[] = [
      {
        name: 'L1',
        request_type: 'leave',
        is_active: true,
        conditions: [],
        default_line: [{ approver_role: 'tenant_manager', dept_scope: 'own_team', specific_employee_id: 'x' }],
      },
    ];
    const payload = buildApprovalLinesPayload(edited);
    expect(payload.lines[0].default_line[0]).not.toHaveProperty('specific_employee_id');
  });

  it("dept_scope==='specific' 단계는 specific_employee_id 보존", () => {
    const eid = '99999999-9999-4999-8999-999999999999';
    const edited: ApprovalLineDraft[] = [
      {
        name: 'L1',
        request_type: 'leave',
        is_active: true,
        conditions: [],
        default_line: [{ approver_role: 'employee', dept_scope: 'specific', specific_employee_id: eid }],
      },
    ];
    const payload = buildApprovalLinesPayload(edited);
    expect(payload.lines[0].default_line[0]).toMatchObject({ dept_scope: 'specific', specific_employee_id: eid });
    expect(approvalLinesPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it('비활성 라인은 빈 기본선 허용(zod 통과)', () => {
    const edited: ApprovalLineDraft[] = [
      { name: 'inactive', request_type: 'document', is_active: false, conditions: [], default_line: [] },
    ];
    const payload = buildApprovalLinesPayload(edited);
    expect(approvalLinesPayloadSchema.safeParse(payload).success).toBe(true);
  });
});

describe('collectSpecificEmployeeIds', () => {
  it('conditions[].line + default_line 의 specific 직원 id 를 중복 제거 수집', () => {
    const e1 = '11111111-1111-4111-8111-111111111111';
    const e2 = '22222222-2222-4222-8222-222222222222';
    const edited: ApprovalLineDraft[] = [
      {
        name: 'L1',
        request_type: 'leave',
        is_active: true,
        conditions: [
          {
            field: 'leave_days',
            op: '>=',
            value: '5',
            line: [{ approver_role: 'employee', dept_scope: 'specific', specific_employee_id: e1 }],
          },
        ],
        default_line: [
          { approver_role: 'employee', dept_scope: 'specific', specific_employee_id: e2 },
          { approver_role: 'employee', dept_scope: 'specific', specific_employee_id: e1 }, // 중복
          { approver_role: 'tenant_manager', dept_scope: 'own_team' }, // specific 아님 → 제외
        ],
      },
    ];
    expect(collectSpecificEmployeeIds(edited).sort()).toEqual([e1, e2].sort());
  });

  it('specific 단계가 없으면 빈 배열', () => {
    expect(
      collectSpecificEmployeeIds([
        { name: 'L', request_type: 'leave', is_active: true, conditions: [], default_line: [] },
      ]),
    ).toEqual([]);
  });
});
