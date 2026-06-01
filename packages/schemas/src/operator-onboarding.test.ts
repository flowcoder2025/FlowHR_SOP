import { describe, expect, it } from 'vitest';
import {
  RESERVED_SLUGS,
  businessNumberSchema,
  checkAdminEmailInputSchema,
  checkBusinessNumberInputSchema,
  checkDomainInputSchema,
  normalizeBusinessNumber,
  tenantDraftInputSchema,
  tenantRegistrationInputSchema,
  tenantRegistrationSchema,
  tenantSlugSchema,
  validateSlugFormat,
} from './operator-onboarding';

// ── 슬러그 ──────────────────────────────────────────────────────────
describe('validateSlugFormat / tenantSlugSchema', () => {
  it('유효 슬러그 통과 + lowercase 정규화', () => {
    const r = validateSlugFormat('  Chicken-Shop  ');
    expect(r).toEqual({ ok: true, slug: 'chicken-shop' });
    expect(tenantSlugSchema.safeParse('Chicken-Shop')).toMatchObject({
      success: true,
      data: 'chicken-shop',
    });
  });
  it('형식 위반(짧음/대문자 이후 정규화 길이/특수문자) 거부', () => {
    expect(validateSlugFormat('ab')).toEqual({ ok: false, reason: 'invalid_format' });
    expect(validateSlugFormat('has space')).toEqual({ ok: false, reason: 'invalid_format' });
    expect(validateSlugFormat('가나다')).toEqual({ ok: false, reason: 'invalid_format' });
  });
  it('선/후행 하이픈·연속 하이픈 거부', () => {
    expect(validateSlugFormat('-abc')).toEqual({ ok: false, reason: 'invalid_format' });
    expect(validateSlugFormat('abc-')).toEqual({ ok: false, reason: 'invalid_format' });
    expect(validateSlugFormat('ab--cd')).toEqual({ ok: false, reason: 'invalid_format' });
  });
  it('예약어 거부', () => {
    expect(validateSlugFormat('admin')).toEqual({ ok: false, reason: 'reserved' });
    expect(validateSlugFormat('API')).toEqual({ ok: false, reason: 'reserved' });
    expect(RESERVED_SLUGS.has('www')).toBe(true);
    expect(tenantSlugSchema.safeParse('admin').success).toBe(false);
  });
});

// ── 사업자등록번호 ───────────────────────────────────────────────────
describe('normalizeBusinessNumber / businessNumberSchema', () => {
  it('하이픈 유무 무관하게 canonical 정규화', () => {
    expect(normalizeBusinessNumber('1234567890')).toBe('123-45-67890');
    expect(normalizeBusinessNumber('123-45-67890')).toBe('123-45-67890');
    expect(normalizeBusinessNumber(' 123 45 67890 ')).toBe('123-45-67890');
  });
  it('10자리 아니면 null', () => {
    expect(normalizeBusinessNumber('123456')).toBeNull();
    expect(normalizeBusinessNumber('12345678901')).toBeNull();
  });
  it('스키마는 정규화 형태로 변환', () => {
    const r = businessNumberSchema.safeParse('1234567890');
    expect(r).toMatchObject({ success: true, data: '123-45-67890' });
    expect(businessNumberSchema.safeParse('abc').success).toBe(false);
  });
});

// ── check 입력 ───────────────────────────────────────────────────────
describe('check input schemas', () => {
  it('check-domain/business/email 형식', () => {
    expect(checkDomainInputSchema.safeParse({ slug: 'abc' }).success).toBe(true);
    expect(checkDomainInputSchema.safeParse({}).success).toBe(false);
    expect(checkBusinessNumberInputSchema.safeParse({ business_number: '1-1-1' }).success).toBe(true);
    expect(checkAdminEmailInputSchema.safeParse({ email: 'A@B.com' })).toMatchObject({
      success: true,
      data: { email: 'a@b.com' },
    });
    expect(checkAdminEmailInputSchema.safeParse({ email: 'bad' }).success).toBe(false);
  });
});

// ── draft ────────────────────────────────────────────────────────────
describe('tenantDraftInputSchema', () => {
  it('단계 1~7 + 자유 form_data', () => {
    expect(tenantDraftInputSchema.safeParse({ current_step: 3, form_data: { a: 1 } }).success).toBe(true);
    expect(tenantDraftInputSchema.safeParse({ current_step: 3 })).toMatchObject({ success: true });
    expect(tenantDraftInputSchema.safeParse({ current_step: 0, form_data: {} }).success).toBe(false);
    expect(tenantDraftInputSchema.safeParse({ current_step: 8, form_data: {} }).success).toBe(false);
  });
});

// ── 등록 payload ─────────────────────────────────────────────────────
function basePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    company: {
      name: '치킨공방',
      business_number: '123-45-67890',
      representative_name: '김대표',
    },
    slug: 'chicken-shop',
    plan_id: '20f0b6c2-4e17-4bfa-8fbe-232593f84a71',
    contract_start_date: '2026-06-01',
    user_limit: 30,
    admin: { email: 'admin@chicken.test', name: '관리자' },
    ...overrides,
  };
}

describe('tenantRegistrationSchema', () => {
  it('최소 필수 payload 통과 + 배열 기본값 적용', () => {
    const r = tenantRegistrationSchema.safeParse(basePayload());
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.additional_admins).toEqual([]);
      expect(r.data.enabled_modules).toEqual([]);
      expect(r.data.departments).toEqual([]);
      expect(r.data.billing_cycle).toBe('monthly');
      expect(r.data.company.business_number).toBe('123-45-67890');
    }
  });

  it('사업자번호 하이픈 없이 입력해도 정규화', () => {
    const r = tenantRegistrationSchema.safeParse(
      basePayload({ company: { name: 'x', business_number: '1234567890', representative_name: 'r' } }),
    );
    expect(r.success && r.data.company.business_number).toBe('123-45-67890');
  });

  it('계약 종료일 ≤ 시작일 거부', () => {
    expect(
      tenantRegistrationSchema.safeParse(
        basePayload({ contract_start_date: '2026-06-01', contract_end_date: '2026-05-31' }),
      ).success,
    ).toBe(false);
    expect(
      tenantRegistrationSchema.safeParse(
        basePayload({ contract_start_date: '2026-06-01', contract_end_date: '2027-06-01' }),
      ).success,
    ).toBe(true);
  });

  it('user_limit < 1 거부', () => {
    expect(tenantRegistrationSchema.safeParse(basePayload({ user_limit: 0 })).success).toBe(false);
  });

  it('예약 슬러그 거부', () => {
    expect(tenantRegistrationSchema.safeParse(basePayload({ slug: 'admin' })).success).toBe(false);
  });

  it('관리자 이메일 중복(대표=추가) 거부', () => {
    const r = tenantRegistrationSchema.safeParse(
      basePayload({
        admin: { email: 'dup@x.test', name: 'a' },
        additional_admins: [{ email: 'dup@x.test', name: 'b' }],
      }),
    );
    expect(r.success).toBe(false);
  });

  it('추가 관리자 최대 3명', () => {
    const four = Array.from({ length: 4 }, (_, i) => ({ email: `a${i}@x.test`, name: `n${i}` }));
    expect(tenantRegistrationSchema.safeParse(basePayload({ additional_admins: four })).success).toBe(false);
  });

  it('leave_types key 중복 거부', () => {
    const r = tenantRegistrationSchema.safeParse(
      basePayload({
        leave_types: [
          { key: 'annual', default_days: 15 },
          { key: 'annual', default_days: 5 },
        ],
      }),
    );
    expect(r.success).toBe(false);
  });

  it('부서 code 중복 거부', () => {
    const r = tenantRegistrationSchema.safeParse(
      basePayload({
        departments: [
          { name: 'a', code: 'HQ' },
          { name: 'b', code: 'HQ' },
        ],
      }),
    );
    expect(r.success).toBe(false);
  });

  it('부서 parent_code 가 앞선 code 참조해야 통과(토폴로지 순서)', () => {
    expect(
      tenantRegistrationSchema.safeParse(
        basePayload({
          departments: [
            { name: '본사', code: 'HQ' },
            { name: '주방', code: 'KITCHEN', parent_code: 'HQ' },
          ],
        }),
      ).success,
    ).toBe(true);
    // 자식이 부모보다 먼저 → 거부
    expect(
      tenantRegistrationSchema.safeParse(
        basePayload({
          departments: [
            { name: '주방', code: 'KITCHEN', parent_code: 'HQ' },
            { name: '본사', code: 'HQ' },
          ],
        }),
      ).success,
    ).toBe(false);
    // 자기 자신 참조 거부
    expect(
      tenantRegistrationSchema.safeParse(
        basePayload({ departments: [{ name: 'x', code: 'A', parent_code: 'A' }] }),
      ).success,
    ).toBe(false);
  });

  it('approval_lines 활성 라인은 default_line 1단계 이상', () => {
    const r = tenantRegistrationSchema.safeParse(
      basePayload({
        approval_lines: [
          { name: '휴가', request_type: 'leave', conditions: [], default_line: [], is_active: true },
        ],
      }),
    );
    expect(r.success).toBe(false);
  });

  it('알 수 없는 키 거부(strict)', () => {
    expect(tenantRegistrationSchema.safeParse(basePayload({ unexpected: 1 })).success).toBe(false);
  });
});

describe('tenantRegistrationInputSchema', () => {
  it('멱등키 + payload 통과, 짧은 키 거부', () => {
    expect(
      tenantRegistrationInputSchema.safeParse({
        idempotency_key: 'idem-key-0001',
        payload: basePayload(),
      }).success,
    ).toBe(true);
    expect(
      tenantRegistrationInputSchema.safeParse({ idempotency_key: 'short', payload: basePayload() })
        .success,
    ).toBe(false);
  });
});
