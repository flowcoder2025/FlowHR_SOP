import { describe, it, expect } from 'vitest';
import {
  tenantSchema,
  employeeSchema,
  userSchema,
  attendanceSchema,
  locationSchema,
  leaveSchema,
  approvalSchema,
  legalDocumentSchema,
  userConsentSchema,
  apiKeySchema,
  auditLogSchema,
  tenantStatusEnum,
  leaveStatusEnum,
} from './index';

const UUID = '00000000-0000-4000-8000-000000000000';
const TS = '2026-05-29T09:00:00Z'; // timestamptz (offset)
const DATE = '2026-05-29'; // date

describe('entities: enum', () => {
  it('유효 enum 값 통과 / 미정의 값 거부', () => {
    expect(tenantStatusEnum.safeParse('active').success).toBe(true);
    expect(tenantStatusEnum.safeParse('bogus').success).toBe(false);
    expect(leaveStatusEnum.safeParse('in_progress').success).toBe(true);
    expect(leaveStatusEnum.safeParse('done').success).toBe(false);
  });
});

describe('entities: tenant (operator)', () => {
  const valid = {
    id: UUID, name: 'A사', slug: 'a-corp', business_number: null,
    representative_name: null, industry: null, address: null, phone: null,
    plan_id: null, status: 'active', contract_start_date: null, contract_end_date: null,
    user_limit: null, active_user_count: 0, admin_user_id: null, logo_url: null,
    metadata: {}, deleted_at: null, created_at: TS, updated_at: TS,
  };
  it('유효 Row 통과', () => {
    expect(tenantSchema.safeParse(valid).success).toBe(true);
  });
  it('잘못된 status enum 거부', () => {
    expect(tenantSchema.safeParse({ ...valid, status: 'unknown' }).success).toBe(false);
  });
  it('비-UUID id 거부', () => {
    expect(tenantSchema.safeParse({ ...valid, id: 'not-a-uuid' }).success).toBe(false);
  });
  it('contract_start_date 는 date — datetime 값 거부', () => {
    expect(tenantSchema.safeParse({ ...valid, contract_start_date: TS }).success).toBe(false);
    expect(tenantSchema.safeParse({ ...valid, contract_start_date: DATE }).success).toBe(true);
  });
});

describe('entities: employee / user (hr) — role 은 DB text → z.string()', () => {
  const validEmp = {
    id: UUID, tenant_id: UUID, user_id: null, employee_number: null, name: '홍길동',
    email: null, phone: null, department_id: null, position: null, job_title: null,
    employment_type: 'regular', status: 'active', role: 'tenant_manager',
    birth_date: null, joined_at: DATE, left_at: null, probation_ends_at: null,
    address: null, emergency_contact: null, family_info: null,
    bank_account_encrypted: null, avatar_url: null, deleted_at: null,
    created_at: TS, updated_at: TS,
  };
  it('유효 Row 통과 (joined_at=date)', () => {
    expect(employeeSchema.safeParse(validEmp).success).toBe(true);
  });
  it('role 은 임의 text 허용 (DB Row 정합 — enum 강제 아님)', () => {
    expect(employeeSchema.safeParse({ ...validEmp, role: 'custom_role_x' }).success).toBe(true);
  });
  it('joined_at 은 date — datetime 거부', () => {
    expect(employeeSchema.safeParse({ ...validEmp, joined_at: TS }).success).toBe(false);
  });
  it('잘못된 employment_type enum 거부', () => {
    expect(employeeSchema.safeParse({ ...validEmp, employment_type: 'intern' }).success).toBe(false);
  });
  it('email 형식 검증 (잘못된 이메일 거부)', () => {
    expect(employeeSchema.safeParse({ ...validEmp, email: 'not-email' }).success).toBe(false);
    expect(employeeSchema.safeParse({ ...validEmp, email: 'a@b.com' }).success).toBe(true);
  });
  it('user.role 도 nullable text', () => {
    const u = {
      id: UUID, employee_id: null, tenant_id: null, role: 'anything', locale: 'ko',
      totp_enabled: false, totp_secret_encrypted: null, recovery_codes_hash: null,
      last_login_at: null, last_login_ip: null, created_at: TS, updated_at: TS,
    };
    expect(userSchema.safeParse(u).success).toBe(true);
    expect(userSchema.safeParse({ ...u, role: null }).success).toBe(true);
  });
});

describe('entities: attendance — work_date(date) vs clock_in_at(datetime)', () => {
  const valid = {
    id: UUID, tenant_id: UUID, employee_id: UUID, work_date: DATE,
    clock_in_at: TS, clock_out_at: null, break_minutes: 0, work_minutes: null,
    work_type: 'office', status: 'normal', clock_in_location: null,
    clock_out_location: null, device_id: null, modified_by: null,
    modification_reason: null, created_at: TS, updated_at: TS,
  };
  it('유효 Row 통과', () => {
    expect(attendanceSchema.safeParse(valid).success).toBe(true);
  });
  it('work_date 에 datetime 값 거부 (date 필드)', () => {
    expect(attendanceSchema.safeParse({ ...valid, work_date: TS }).success).toBe(false);
  });
  it('clock_in_at 에 date 값 거부 (datetime 필드)', () => {
    expect(attendanceSchema.safeParse({ ...valid, clock_in_at: DATE }).success).toBe(false);
  });
  it('location 좌표 범위 검증', () => {
    expect(locationSchema.safeParse({ lat: 37.5, lng: 127.0 }).success).toBe(true);
    expect(locationSchema.safeParse({ lat: 200, lng: 127.0 }).success).toBe(false);
    expect(attendanceSchema.safeParse({ ...valid, clock_in_location: { lat: 37.5, lng: 127.0, accuracy: 5 } }).success).toBe(true);
  });
});

describe('entities: leave', () => {
  const valid = {
    id: UUID, tenant_id: UUID, employee_id: UUID, leave_type_id: UUID, approval_id: null,
    substitute_employee_id: null, start_date: DATE, end_date: DATE, half_day: 'none',
    used_days: 0.5, reason: null, attachment_ids: [], status: 'pending',
    requested_at: TS, completed_at: null, created_at: TS, updated_at: TS,
  };
  it('유효 Row 통과 (used_days 0.5 단위)', () => {
    expect(leaveSchema.safeParse(valid).success).toBe(true);
  });
  it('잘못된 half_day enum 거부', () => {
    expect(leaveSchema.safeParse({ ...valid, half_day: 'middle' }).success).toBe(false);
  });
  it('attachment_ids 비-UUID 원소 거부', () => {
    expect(leaveSchema.safeParse({ ...valid, attachment_ids: ['x'] }).success).toBe(false);
  });
});

describe('entities: approval / compliance / settings', () => {
  it('approval 유효 Row 통과', () => {
    const a = {
      id: UUID, tenant_id: UUID, requester_id: UUID, request_type: 'leave',
      request_object_id: null, title: null, status: 'pending', current_step: 0,
      total_steps: 1, sla_deadline: null, requested_at: null, completed_at: null,
      created_at: TS, updated_at: TS,
    };
    expect(approvalSchema.safeParse(a).success).toBe(true);
    expect(approvalSchema.safeParse({ ...a, request_type: 'bogus' }).success).toBe(false);
  });
  it('legal_document 유효 (type enum + language text + effective_date date)', () => {
    const d = {
      id: UUID, type: 'terms', version: '1.0.0', language: 'ko', effective_date: DATE,
      title: null, content_md: null, summary_md: null, is_active: true,
      published_by: null, published_at: null, created_at: TS, updated_at: TS,
    };
    expect(legalDocumentSchema.safeParse(d).success).toBe(true);
    expect(legalDocumentSchema.safeParse({ ...d, type: 'eula' }).success).toBe(false);
  });
  it('user_consent.document_type 는 DB text → 임의 string 허용, source 는 enum', () => {
    const c = {
      id: UUID, tenant_id: null, user_id: UUID, document_id: UUID,
      document_type: 'terms', version: '1.0.0', source: 'activate',
      ip_address: '127.0.0.1', user_agent: null, consented_at: TS,
    };
    expect(userConsentSchema.safeParse(c).success).toBe(true);
    expect(userConsentSchema.safeParse({ ...c, document_type: 'whatever' }).success).toBe(true);
    expect(userConsentSchema.safeParse({ ...c, source: 'bogus' }).success).toBe(false);
    expect(userConsentSchema.safeParse({ ...c, ip_address: null }).success).toBe(true); // DB nullable inet
    expect(userConsentSchema.safeParse({ ...c, tenant_id: null }).success).toBe(true); // operator 동의는 tenant 없음
  });
  it('api_key.expires_at 는 DB date', () => {
    const k = {
      id: UUID, tenant_id: null, owner_type: 'operator', key_hash: 'h', label: null,
      scopes: [], reason: null, usage_count: 0, expires_at: DATE,
      last_used_at: null, revoked_at: null, created_by: null, created_at: TS,
    };
    expect(apiKeySchema.safeParse(k).success).toBe(true);
    expect(apiKeySchema.safeParse({ ...k, expires_at: TS }).success).toBe(false);
  });
  it('audit_log.request_id 는 DB text → 임의 string 허용', () => {
    const log = {
      id: UUID, tenant_id: null, actor_id: null, actor_role: null, action: 'auth.login',
      target_type: null, target_id: null, before: null, after: null, result: 'success',
      ip: null, user_agent: null, request_id: 'req-non-uuid-123', created_at: TS,
    };
    expect(auditLogSchema.safeParse(log).success).toBe(true);
  });
});
