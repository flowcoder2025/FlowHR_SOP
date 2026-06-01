import { describe, expect, it } from 'vitest';
import {
  buildApprovalLinesPayload,
  buildCompanyPayload,
  buildLeavePolicyPayload,
  buildWorkPolicyPayload,
  normalizeApplyAt,
  type ApprovalLineDraft,
  type ApprovalLineOriginal,
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

describe('buildApprovalLinesPayload (conditions 병합/보존)', () => {
  const original: ApprovalLineOriginal[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      conditions: [{ field: 'days', op: 'gte', value: 5 }],
      default_line: [{ step: 1, approver: 'manager' }],
    },
  ];

  it('기존 라인은 원본의 conditions/default_line 을 병합(passthrough)', () => {
    const edited: ApprovalLineDraft[] = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: '휴가 결재선(수정)',
        request_type: 'leave',
        is_active: true,
      },
    ];
    const payload = buildApprovalLinesPayload(edited, original);
    expect(payload.lines[0]).toMatchObject({
      id: '11111111-1111-1111-1111-111111111111',
      name: '휴가 결재선(수정)',
      request_type: 'leave',
      is_active: true,
      conditions: [{ field: 'days', op: 'gte', value: 5 }],
      default_line: [{ step: 1, approver: 'manager' }],
    });
    expect(approvalLinesPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it('신규 라인(id 없음)은 빈 조건', () => {
    const edited: ApprovalLineDraft[] = [
      { name: '근태정정 결재선', request_type: 'attendance_mod', is_active: true },
    ];
    const payload = buildApprovalLinesPayload(edited, original);
    expect(payload.lines[0]).toEqual({
      name: '근태정정 결재선',
      request_type: 'attendance_mod',
      is_active: true,
      conditions: [],
      default_line: [],
    });
    expect(approvalLinesPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it('id 가 원본에 없으면(누락/위조) 빈 조건으로 안전 처리', () => {
    const edited: ApprovalLineDraft[] = [
      { id: 'deadbeef-0000-0000-0000-000000000000', name: 'X', request_type: 'document', is_active: false },
    ];
    const payload = buildApprovalLinesPayload(edited, original);
    expect(payload.lines[0].conditions).toEqual([]);
  });
});
