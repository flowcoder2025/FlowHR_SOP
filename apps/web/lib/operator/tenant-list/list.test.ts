import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  allowedStatusTargets,
  buildCsv,
  calcMonthlyFeeKrw,
  csvEscape,
  deriveDisplayStatus,
  isManualStatusTarget,
  isValidStatusTransition,
  kstDateString,
  parseListParams,
  sanitizeSearchTerm,
} from './list';

const PLAN_A = '11111111-1111-4111-8111-111111111111';

describe('parseListParams', () => {
  it('빈 입력은 기본값', () => {
    const p = parseListParams({});
    expect(p).toEqual({
      q: '',
      status: [],
      planId: [],
      sortField: 'updated_at',
      sortDirection: 'desc',
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it('유효한 status/plan 만 통과(잘못된 값 제거)', () => {
    const p = parseListParams({ status: 'active,bogus,expired', plan: `${PLAN_A},not-uuid` });
    expect(p.status).toEqual(['active', 'expired']);
    expect(p.planId).toEqual([PLAN_A]);
  });

  it('배열 파라미터/콤마 혼합 처리', () => {
    const p = parseListParams({ status: ['active', 'inactive,archived'] });
    expect(p.status).toEqual(['active', 'inactive', 'archived']);
  });

  it('정렬 화이트리스트 외 값은 기본값으로', () => {
    expect(parseListParams({ sort: 'name', dir: 'asc' }).sortField).toBe('name');
    expect(parseListParams({ sort: 'name', dir: 'asc' }).sortDirection).toBe('asc');
    expect(parseListParams({ sort: 'evil', dir: 'sideways' })).toMatchObject({
      sortField: 'updated_at',
      sortDirection: 'desc',
    });
  });

  it('page/pageSize 경계 보정', () => {
    expect(parseListParams({ page: '0' }).page).toBe(1);
    expect(parseListParams({ page: '-3' }).page).toBe(1);
    expect(parseListParams({ page: '5' }).page).toBe(5);
    expect(parseListParams({ pageSize: '0' }).pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(parseListParams({ pageSize: String(MAX_PAGE_SIZE + 1) }).pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(parseListParams({ pageSize: '50' }).pageSize).toBe(50);
  });
});

describe('sanitizeSearchTerm', () => {
  it('PostgREST or/ilike 메타문자 제거(각 메타문자 → 공백)', () => {
    // , ( ) * % \ 가 각각 공백으로 치환됨 — ) 와 * 사이엔 공백 2개.
    expect(sanitizeSearchTerm('a,b(c)*d%e\\f')).toBe('a b c  d e f');
  });

  it('일반 검색어/하이픈은 보존', () => {
    expect(sanitizeSearchTerm('  ACME-Corp  ')).toBe('ACME-Corp');
    expect(sanitizeSearchTerm('카페 24')).toBe('카페 24');
  });

  it('SQL LIKE 와일드카드 _ 제거(과매칭 방지)', () => {
    expect(sanitizeSearchTerm('a_b_c')).toBe('a b c');
  });

  it('길이 100 제한', () => {
    expect(sanitizeSearchTerm('x'.repeat(200)).length).toBe(100);
  });

  it('메타문자만이면 빈 문자열', () => {
    expect(sanitizeSearchTerm(',,()%')).toBe('');
  });
});

describe('deriveDisplayStatus (KI-123)', () => {
  const base = {
    adminUserId: 'u1',
    hasPendingAdminInvite: false,
    contractStartDate: null,
    today: '2026-06-02',
  };

  it('DB status 가 active 가 아니면 그대로', () => {
    expect(deriveDisplayStatus({ ...base, status: 'inactive' })).toBe('inactive');
    expect(deriveDisplayStatus({ ...base, status: 'expired' })).toBe('expired');
    expect(deriveDisplayStatus({ ...base, status: 'archived' })).toBe('archived');
    expect(deriveDisplayStatus({ ...base, status: 'overdue' })).toBe('overdue');
  });

  it('admin 미연결 + pending 초대 → pending_invite', () => {
    expect(
      deriveDisplayStatus({ ...base, status: 'active', adminUserId: null, hasPendingAdminInvite: true }),
    ).toBe('pending_invite');
  });

  it('admin 미연결인데 pending 초대 없으면 pending_invite 아님', () => {
    expect(
      deriveDisplayStatus({ ...base, status: 'active', adminUserId: null, hasPendingAdminInvite: false }),
    ).toBe('active');
  });

  it('계약 시작일이 오늘 이후면 scheduled', () => {
    expect(
      deriveDisplayStatus({ ...base, status: 'active', contractStartDate: '2026-06-10', today: '2026-06-02' }),
    ).toBe('scheduled');
  });

  it('계약 시작일이 오늘이면 scheduled 아님(active)', () => {
    expect(
      deriveDisplayStatus({ ...base, status: 'active', contractStartDate: '2026-06-02', today: '2026-06-02' }),
    ).toBe('active');
  });

  it('우선순위: pending_invite 가 scheduled 보다 앞', () => {
    expect(
      deriveDisplayStatus({
        status: 'active',
        adminUserId: null,
        hasPendingAdminInvite: true,
        contractStartDate: '2026-12-31',
        today: '2026-06-02',
      }),
    ).toBe('pending_invite');
  });

  it('우선순위: DB status(비active) 가 파생값보다 앞', () => {
    expect(
      deriveDisplayStatus({
        status: 'inactive',
        adminUserId: null,
        hasPendingAdminInvite: true,
        contractStartDate: '2026-12-31',
        today: '2026-06-02',
      }),
    ).toBe('inactive');
  });
});

describe('상태 전이 검증', () => {
  it('isManualStatusTarget', () => {
    expect(isManualStatusTarget('active')).toBe(true);
    expect(isManualStatusTarget('inactive')).toBe(true);
    expect(isManualStatusTarget('expired')).toBe(true);
    expect(isManualStatusTarget('archived')).toBe(false);
    expect(isManualStatusTarget('overdue')).toBe(false);
    expect(isManualStatusTarget(123)).toBe(false);
  });

  it('active 전이', () => {
    expect(isValidStatusTransition('active', 'inactive')).toBe(true);
    expect(isValidStatusTransition('active', 'expired')).toBe(true);
    expect(isValidStatusTransition('active', 'active')).toBe(false);
  });

  it('expired→active/inactive 복구 허용', () => {
    expect(isValidStatusTransition('expired', 'active')).toBe(true);
    expect(isValidStatusTransition('expired', 'inactive')).toBe(true);
  });

  it('archived 는 어떤 전이도 불가', () => {
    expect(isValidStatusTransition('archived', 'active')).toBe(false);
    expect(isValidStatusTransition('archived', 'inactive')).toBe(false);
    expect(isValidStatusTransition('archived', 'expired')).toBe(false);
  });

  it('overdue/expiring_soon 수동 정리 허용', () => {
    expect(isValidStatusTransition('overdue', 'active')).toBe(true);
    expect(isValidStatusTransition('expiring_soon', 'expired')).toBe(true);
  });

  it('allowedStatusTargets', () => {
    expect(allowedStatusTargets('active').sort()).toEqual(['expired', 'inactive']);
    expect(allowedStatusTargets('archived')).toEqual([]);
    expect(allowedStatusTargets('overdue').sort()).toEqual(['active', 'expired', 'inactive']);
  });
});

describe('calcMonthlyFeeKrw', () => {
  it('base + perUser × activeUserCount', () => {
    expect(calcMonthlyFeeKrw({ latchedBasePrice: 0, latchedPerUser: 9900, activeUserCount: 10 })).toBe(99000);
    expect(calcMonthlyFeeKrw({ latchedBasePrice: 50000, latchedPerUser: 9900, activeUserCount: 3 })).toBe(79700);
  });

  it('latched 둘 다 null 이면 null', () => {
    expect(calcMonthlyFeeKrw({ latchedBasePrice: null, latchedPerUser: null, activeUserCount: 5 })).toBeNull();
  });

  it('한쪽만 있으면 그 값만 반영', () => {
    expect(calcMonthlyFeeKrw({ latchedBasePrice: 30000, latchedPerUser: null, activeUserCount: 5 })).toBe(30000);
    expect(calcMonthlyFeeKrw({ latchedBasePrice: null, latchedPerUser: 1000, activeUserCount: 4 })).toBe(4000);
  });

  it('음수 사용자 수는 0으로 클램프', () => {
    expect(calcMonthlyFeeKrw({ latchedBasePrice: 10000, latchedPerUser: 1000, activeUserCount: -3 })).toBe(10000);
  });
});

describe('kstDateString', () => {
  it('UTC → KST(+9) 날짜', () => {
    // 2026-06-01 20:00 UTC → KST 2026-06-02 05:00
    expect(kstDateString(new Date('2026-06-01T20:00:00Z'))).toBe('2026-06-02');
    // 2026-06-02 14:00 UTC → KST 2026-06-02 23:00
    expect(kstDateString(new Date('2026-06-02T14:00:00Z'))).toBe('2026-06-02');
    // 2026-06-02 15:30 UTC → KST 2026-06-03 00:30
    expect(kstDateString(new Date('2026-06-02T15:30:00Z'))).toBe('2026-06-03');
  });
});

describe('CSV', () => {
  it('csvEscape 따옴표/콤마/개행', () => {
    expect(csvEscape('plain')).toBe('plain');
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('a"b')).toBe('"a""b"');
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(1000)).toBe('1000');
  });

  it('csvEscape CSV injection 완화(수식 트리거 접두사)', () => {
    // 콤마/따옴표/개행이 없으면 접두사 ' 만 붙고 래핑은 안 함.
    expect(csvEscape('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvEscape('+1')).toBe("'+1");
    expect(csvEscape('@cmd')).toBe("'@cmd");
    // 접두사 + 콤마가 함께면 래핑까지.
    expect(csvEscape('=A,B')).toBe('"\'=A,B"');
    // 선행 공백 뒤 수식 문자도 완화(Excel 선행공백 무시 대응).
    expect(csvEscape(' =cmd')).toBe("' =cmd");
    // 수식 문자 없는 일반 셀은 접두사 없음.
    expect(csvEscape('hello')).toBe('hello');
  });

  it('buildCsv BOM + CRLF + 헤더', () => {
    const csv = buildCsv(['이름', '값'], [['회사', 100], ['a,b', null]]);
    expect(csv.startsWith('﻿')).toBe(true);
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('이름,값');
    expect(lines[1]).toBe('회사,100');
    expect(lines[2]).toBe('"a,b",');
  });
});
