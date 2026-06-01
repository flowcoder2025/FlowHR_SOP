import { describe, expect, it } from 'vitest';
import {
  PATCHABLE_SETTING_TABS,
  approvalLinesPayloadSchema,
  companySettingsPayloadSchema,
  leavePolicyPayloadSchema,
  parseSettingPayload,
  settingsPatchInputSchema,
  workPolicyPayloadSchema,
} from './tenant-settings';

describe('companySettingsPayloadSchema', () => {
  it('유효한 회사정보 통과', () => {
    const r = companySettingsPayloadSchema.safeParse({
      company_name: '치킨매니아',
      ceo_name: '홍길동',
      email: 'ceo@chicken.kr',
      industry: '외식업',
    });
    expect(r.success).toBe(true);
  });
  it('빈 객체도 통과(전부 optional, full replace)', () => {
    expect(companySettingsPayloadSchema.safeParse({}).success).toBe(true);
  });
  it('잘못된 이메일 거부', () => {
    expect(companySettingsPayloadSchema.safeParse({ email: 'bad' }).success).toBe(false);
  });
  it('잘못된 logo_url 거부', () => {
    expect(companySettingsPayloadSchema.safeParse({ logo_url: 'not-a-url' }).success).toBe(false);
  });
  it('알 수 없는 키(strict) 거부 — payload 주입 방지', () => {
    expect(companySettingsPayloadSchema.safeParse({ malicious: 'x' }).success).toBe(false);
  });
});

describe('workPolicyPayloadSchema', () => {
  const base = { name: '표준', break_minutes_default: 60, weekly_max_hours: 52 };
  it('유효한 근무정책 통과 + applicable_departments 기본 []', () => {
    const r = workPolicyPayloadSchema.safeParse({ ...base, standard_clock_in: '09:00' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.applicable_departments).toEqual([]);
  });
  it('HH:MM:SS 형식도 허용', () => {
    expect(workPolicyPayloadSchema.safeParse({ ...base, late_threshold: '09:10:30' }).success).toBe(true);
  });
  it('잘못된 시각 형식 거부', () => {
    expect(workPolicyPayloadSchema.safeParse({ ...base, standard_clock_in: '25:00' }).success).toBe(false);
    expect(workPolicyPayloadSchema.safeParse({ ...base, standard_clock_in: '9:0' }).success).toBe(false);
  });
  it('null 시각 허용(미설정)', () => {
    expect(workPolicyPayloadSchema.safeParse({ ...base, standard_clock_in: null }).success).toBe(true);
  });
  it('name 누락 거부', () => {
    expect(workPolicyPayloadSchema.safeParse({ break_minutes_default: 60, weekly_max_hours: 52 }).success).toBe(false);
  });
  it('음수 break_minutes 거부', () => {
    expect(workPolicyPayloadSchema.safeParse({ ...base, break_minutes_default: -1 }).success).toBe(false);
  });
  it('weekly_max_hours 범위 초과 거부', () => {
    expect(workPolicyPayloadSchema.safeParse({ ...base, weekly_max_hours: 200 }).success).toBe(false);
  });
  it('applied_from date 형식 검증', () => {
    expect(workPolicyPayloadSchema.safeParse({ ...base, applied_from: '2026-07-01' }).success).toBe(true);
    expect(workPolicyPayloadSchema.safeParse({ ...base, applied_from: '2026/07/01' }).success).toBe(false);
  });
});

describe('leavePolicyPayloadSchema', () => {
  const annual = {
    key: 'annual', label_ko: '연차', default_days: 15,
    is_paid: true, carryover_allowed: true, evidence_required: false, sort_order: 1,
  };
  it('유효한 휴가정책 통과', () => {
    expect(leavePolicyPayloadSchema.safeParse({ leave_types: [annual] }).success).toBe(true);
  });
  it('delete_keys 동반 허용', () => {
    expect(
      leavePolicyPayloadSchema.safeParse({ leave_types: [annual], delete_keys: ['sick'] }).success,
    ).toBe(true);
  });
  it('빈 leave_types 배열 허용', () => {
    expect(leavePolicyPayloadSchema.safeParse({ leave_types: [] }).success).toBe(true);
  });
  it('default_days 음수 거부', () => {
    expect(leavePolicyPayloadSchema.safeParse({ leave_types: [{ ...annual, default_days: -1 }] }).success).toBe(false);
  });
  it('key 누락 거부', () => {
    const { key: _omit, ...noKey } = annual;
    expect(leavePolicyPayloadSchema.safeParse({ leave_types: [noKey] }).success).toBe(false);
  });
});

describe('approvalLinesPayloadSchema', () => {
  it('id 없는 신규 라인(insert) 통과 + is_active 기본 true', () => {
    const r = approvalLinesPayloadSchema.safeParse({
      lines: [{ name: '휴가결재', request_type: 'leave' }],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.lines[0]!.is_active).toBe(true);
  });
  it('id 있는 기존 라인(update) 통과', () => {
    expect(
      approvalLinesPayloadSchema.safeParse({
        lines: [{ id: '11111111-1111-4111-8111-111111111111', name: 'x', request_type: 'leave', is_active: false }],
      }).success,
    ).toBe(true);
  });
  it('잘못된 request_type 거부', () => {
    expect(approvalLinesPayloadSchema.safeParse({ lines: [{ name: 'x', request_type: 'nope' }] }).success).toBe(false);
  });
  it('잘못된 id(uuid 아님) 거부', () => {
    expect(
      approvalLinesPayloadSchema.safeParse({ lines: [{ id: 'not-uuid', name: 'x', request_type: 'leave' }] }).success,
    ).toBe(false);
  });
});

describe('settingsPatchInputSchema + parseSettingPayload', () => {
  it('PATCHABLE 탭 목록 = P0 4탭', () => {
    expect([...PATCHABLE_SETTING_TABS]).toEqual(['company', 'work_policy', 'leave_policy', 'approval_lines']);
  });
  it('지원 탭 + payload + apply_at 통과', () => {
    const r = settingsPatchInputSchema.safeParse({
      tab: 'company',
      payload: { company_name: 'A' },
      apply_at: '2026-07-01T00:00:00Z',
    });
    expect(r.success).toBe(true);
  });
  it('apply_at 생략 허용(즉시)', () => {
    expect(settingsPatchInputSchema.safeParse({ tab: 'company', payload: {} }).success).toBe(true);
  });
  it('미지원 탭(security) 거부', () => {
    expect(settingsPatchInputSchema.safeParse({ tab: 'security', payload: {} }).success).toBe(false);
  });
  it('parseSettingPayload 가 tab 별 스키마로 재검증', () => {
    expect(parseSettingPayload('company', { email: 'bad' }).success).toBe(false);
    expect(parseSettingPayload('work_policy', { name: 'x', break_minutes_default: 60, weekly_max_hours: 52 }).success).toBe(true);
  });
});
