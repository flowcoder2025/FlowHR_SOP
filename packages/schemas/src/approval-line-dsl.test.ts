import { describe, expect, it } from 'vitest';
import {
  approvalLineDslSchema,
  approvalStepTemplateSchema,
  conditionRuleSchema,
  evaluateCondition,
  resolveApprovalLine,
  type ApprovalContext,
  type ConditionRule,
} from './approval-line-dsl';

const UID = '11111111-1111-1111-1111-111111111111';
const UID2 = '22222222-2222-2222-2222-222222222222';

const manager = { order: 1, approver_role: 'tenant_manager', dept_scope: 'own_team' } as const;
const ceo = { order: 1, approver_role: 'tenant_super', dept_scope: 'all' } as const;

describe('approvalStepTemplateSchema', () => {
  it('기본 단계(테넌트 역할 + 부서범위) 통과', () => {
    expect(approvalStepTemplateSchema.safeParse(manager).success).toBe(true);
  });

  it("dept_scope='specific' 은 specific_employee_id 필수", () => {
    expect(
      approvalStepTemplateSchema.safeParse({ order: 1, approver_role: 'employee', dept_scope: 'specific' })
        .success,
    ).toBe(false);
    expect(
      approvalStepTemplateSchema.safeParse({
        order: 1,
        approver_role: 'employee',
        dept_scope: 'specific',
        specific_employee_id: UID,
      }).success,
    ).toBe(true);
  });

  it("specific_employee_id 는 'specific' 이 아닌 scope 에서 거부", () => {
    expect(
      approvalStepTemplateSchema.safeParse({ ...manager, specific_employee_id: UID }).success,
    ).toBe(false);
  });

  it('operator_* 역할은 결재자가 될 수 없다', () => {
    expect(
      approvalStepTemplateSchema.safeParse({ order: 1, approver_role: 'operator_super', dept_scope: 'all' })
        .success,
    ).toBe(false);
  });
});

describe('conditionRuleSchema — field/op/value 매트릭스', () => {
  const line = [manager];

  it('leave_days 는 숫자 비교 연산자 전부 허용', () => {
    for (const op of ['==', '!=', '>=', '<=', '>', '<'] as const) {
      expect(conditionRuleSchema.safeParse({ field: 'leave_days', op, value: 5, line }).success).toBe(true);
    }
  });

  it('leave_days 비교값 문자열은 거부(자동변환 없음)', () => {
    expect(conditionRuleSchema.safeParse({ field: 'leave_days', op: '>=', value: '5', line }).success).toBe(
      false,
    );
  });

  it('leave_days in/not_in 은 숫자 배열만', () => {
    expect(
      conditionRuleSchema.safeParse({ field: 'leave_days', op: 'in', value: [3, 5, 10], line }).success,
    ).toBe(true);
    expect(
      conditionRuleSchema.safeParse({ field: 'leave_days', op: 'in', value: ['3'], line }).success,
    ).toBe(false);
    expect(conditionRuleSchema.safeParse({ field: 'leave_days', op: 'in', value: [], line }).success).toBe(
      false,
    );
  });

  it('NaN 비교값 거부', () => {
    expect(
      conditionRuleSchema.safeParse({ field: 'leave_days', op: '>=', value: Number.NaN, line }).success,
    ).toBe(false);
  });

  it('문자 필드는 숫자 비교 연산자 거부', () => {
    for (const op of ['>=', '<=', '>', '<'] as const) {
      expect(
        conditionRuleSchema.safeParse({ field: 'department_id', op, value: 'sales', line }).success,
      ).toBe(false);
    }
  });

  it('department_id 는 ==/!=/in/not_in 허용(문자열/문자열배열)', () => {
    expect(
      conditionRuleSchema.safeParse({ field: 'department_id', op: '==', value: UID, line }).success,
    ).toBe(true);
    expect(
      conditionRuleSchema.safeParse({ field: 'department_id', op: 'in', value: [UID, UID2], line }).success,
    ).toBe(true);
  });

  it('employment_type 값은 enum 으로 강제', () => {
    expect(
      conditionRuleSchema.safeParse({ field: 'employment_type', op: '==', value: 'contract', line }).success,
    ).toBe(true);
    expect(
      conditionRuleSchema.safeParse({ field: 'employment_type', op: '==', value: 'intern', line }).success,
    ).toBe(false);
    expect(
      conditionRuleSchema.safeParse({
        field: 'employment_type',
        op: 'in',
        value: ['regular', 'part_time'],
        line,
      }).success,
    ).toBe(true);
  });

  it('line(매칭 결재선)은 최소 1단계 + order 배열위치(1..n) 일치', () => {
    expect(conditionRuleSchema.safeParse({ field: 'leave_days', op: '>=', value: 5, line: [] }).success).toBe(
      false,
    );
    // order 누락(2부터 시작) 거부
    expect(
      conditionRuleSchema.safeParse({
        field: 'leave_days',
        op: '>=',
        value: 5,
        line: [{ order: 2, approver_role: 'tenant_super', dept_scope: 'all' }],
      }).success,
    ).toBe(false);
    // order 역순(배열위치 불일치) 거부 — 정렬 없이 반환하므로 위치 정합 강제
    expect(
      conditionRuleSchema.safeParse({
        field: 'leave_days',
        op: '>=',
        value: 5,
        line: [
          { order: 2, approver_role: 'tenant_manager', dept_scope: 'own_team' },
          { order: 1, approver_role: 'tenant_super', dept_scope: 'all' },
        ],
      }).success,
    ).toBe(false);
  });

  it('알 수 없는 필드/연산자 거부', () => {
    expect(conditionRuleSchema.safeParse({ field: 'salary', op: '>=', value: 5, line }).success).toBe(false);
    expect(conditionRuleSchema.safeParse({ field: 'leave_days', op: 'gte', value: 5, line }).success).toBe(
      false,
    );
  });

  it('strict — 알 수 없는 키 거부', () => {
    expect(
      conditionRuleSchema.safeParse({ field: 'leave_days', op: '>=', value: 5, line, extra: 1 }).success,
    ).toBe(false);
  });
});

describe('evaluateCondition', () => {
  const rule = (over: Partial<ConditionRule>): ConditionRule =>
    conditionRuleSchema.parse({ field: 'leave_days', op: '>=', value: 5, line: [manager], ...over });

  it('숫자 비교(>=,<=,>,<,==,!=)', () => {
    expect(evaluateCondition(rule({ op: '>=', value: 5 }), { leave_days: 5 })).toBe(true);
    expect(evaluateCondition(rule({ op: '>=', value: 5 }), { leave_days: 4 })).toBe(false);
    expect(evaluateCondition(rule({ op: '>', value: 5 }), { leave_days: 5 })).toBe(false);
    expect(evaluateCondition(rule({ op: '<=', value: 3 }), { leave_days: 3 })).toBe(true);
    expect(evaluateCondition(rule({ op: '==', value: 1 }), { leave_days: 1 })).toBe(true);
    expect(evaluateCondition(rule({ op: '!=', value: 1 }), { leave_days: 2 })).toBe(true);
  });

  it('문자 ==/!=', () => {
    const r = rule({ field: 'position', op: '==', value: '팀장' });
    expect(evaluateCondition(r, { position: '팀장' })).toBe(true);
    expect(evaluateCondition(r, { position: '사원' })).toBe(false);
  });

  it('in/not_in', () => {
    const rin = rule({ field: 'department_id', op: 'in', value: [UID, UID2] });
    expect(evaluateCondition(rin, { department_id: UID })).toBe(true);
    expect(evaluateCondition(rin, { department_id: 'other' })).toBe(false);
    const rnot = rule({ field: 'employment_type', op: 'not_in', value: ['contract', 'part_time'] });
    expect(evaluateCondition(rnot, { employment_type: 'regular' })).toBe(true);
    expect(evaluateCondition(rnot, { employment_type: 'contract' })).toBe(false);
  });

  it('컨텍스트에 필드가 없으면 모든 연산자에서 false (과매칭 차단)', () => {
    const empty: ApprovalContext = {};
    expect(evaluateCondition(rule({ op: '!=', value: 5 }), empty)).toBe(false);
    expect(evaluateCondition(rule({ field: 'employment_type', op: 'not_in', value: ['contract'] }), empty)).toBe(
      false,
    );
    expect(evaluateCondition(rule({ op: '>=', value: 5 }), { leave_days: null })).toBe(false);
  });

  it('유효하지 않은 actual(NaN/빈문자/잘못된 enum)은 모든 연산자에서 false', () => {
    // leave_days=NaN 이 != / not_in 에서 과매칭되지 않아야(P2-1).
    expect(evaluateCondition(rule({ op: '!=', value: 5 }), { leave_days: Number.NaN })).toBe(false);
    expect(evaluateCondition(rule({ field: 'leave_days', op: 'not_in', value: [1, 2] }), { leave_days: Number.NaN })).toBe(
      false,
    );
    // 빈/공백 문자 actual.
    expect(evaluateCondition(rule({ field: 'position', op: '!=', value: '팀장' }), { position: '  ' })).toBe(
      false,
    );
    // employment_type 은 enum 으로 actual 검증 — 잘못된 값은 false.
    expect(
      evaluateCondition(rule({ field: 'employment_type', op: '!=', value: 'contract' }), {
        employment_type: 'intern',
      }),
    ).toBe(false);
  });
});

describe('resolveApprovalLine — 첫 매칭 조건 우선, 미매칭 시 default_line', () => {
  const line = {
    conditions: [
      { field: 'leave_days', op: '>=', value: 5, line: [ceo] }, // 5일 이상 = 대표 결재
    ],
    default_line: [manager], // 그 외 = 팀장
  };

  it('5일 이상 = 대표 결재 분기', () => {
    const r = resolveApprovalLine(line, { leave_days: 7 });
    expect(r.matchedConditionIndex).toBe(0);
    expect(r.steps).toEqual([ceo]);
  });

  it('5일 미만 = 기본(팀장) 결재선', () => {
    const r = resolveApprovalLine(line, { leave_days: 3 });
    expect(r.matchedConditionIndex).toBeNull();
    expect(r.steps).toEqual([manager]);
  });

  it('여러 조건 중 첫 매칭이 우선', () => {
    const multi = {
      conditions: [
        { field: 'department_id', op: '==', value: UID, line: [ceo] },
        { field: 'leave_days', op: '>=', value: 1, line: [manager] },
      ],
      default_line: [manager],
    };
    const r = resolveApprovalLine(multi, { department_id: UID, leave_days: 10 });
    expect(r.matchedConditionIndex).toBe(0);
    expect(r.steps).toEqual([ceo]);
  });

  it('malformed 조건은 건너뛰고 다음 유효 조건/기본선 평가', () => {
    const withBad = {
      conditions: [
        { field: 'leave_days', op: 'gte', value: 5, line: [ceo] }, // invalid op → skip
        { field: 'leave_days', op: '>=', value: 5, line: [ceo] }, // valid (index 1)
      ],
      default_line: [manager],
    };
    const r = resolveApprovalLine(withBad, { leave_days: 9 });
    expect(r.matchedConditionIndex).toBe(1);
    expect(r.steps).toEqual([ceo]);
  });

  it('default_line 이 malformed 면 빈 steps (graceful degrade)', () => {
    const r = resolveApprovalLine(
      { conditions: [], default_line: [{ order: 5, approver_role: 'x', dept_scope: 'all' }] },
      { leave_days: 1 },
    );
    expect(r.steps).toEqual([]);
    expect(r.matchedConditionIndex).toBeNull();
  });

  it('rawLine 이 비-객체/null 이어도 throw 없이 빈 steps', () => {
    expect(resolveApprovalLine(null, {}).steps).toEqual([]);
    expect(resolveApprovalLine('garbage', {}).steps).toEqual([]);
    expect(resolveApprovalLine([], {}).steps).toEqual([]);
  });
});

describe('approvalLineDslSchema', () => {
  it('conditions/default_line 생략 시 빈 배열 기본값', () => {
    const r = approvalLineDslSchema.parse({});
    expect(r).toEqual({ conditions: [], default_line: [] });
  });

  it('정상 DSL 통과', () => {
    expect(
      approvalLineDslSchema.safeParse({
        conditions: [{ field: 'leave_days', op: '>=', value: 5, line: [ceo] }],
        default_line: [manager],
      }).success,
    ).toBe(true);
  });
});
