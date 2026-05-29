import { z } from 'zod';
import { uuidSchema, isoTimestampSchema } from '../common';
import {
  employmentTypeEnum,
  employeeStatusEnum,
  notificationTypeEnum,
  auditResultEnum,
  changeRequestStatusEnum,
} from './enums';

/**
 * HR 도메인 entity (database.ts Row 1:1, snake_case).
 * employees.role / users.role 는 DB text 컬럼이라 z.string()(DB Row 정합) — 6 역할 enum(appRoleEnum)은
 * 애플리케이션 입력/권한 검증용이며 entity(DB row 표현)엔 적용하지 않는다 (WI-021-1 듀얼검증 정정).
 */

// departments
export const departmentSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  name: z.string(),
  code: z.string().nullable(),
  description: z.string().nullable(),
  parent_id: uuidSchema.nullable(),
  head_employee_id: uuidSchema.nullable(),
  path_cache: z.string().nullable(),
  sort_order: z.number().int(),
  is_active: z.boolean(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// employees (birth_date/joined_at/left_at/probation_ends_at 은 DB date, role 은 DB text)
export const employeeSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  user_id: uuidSchema.nullable(),
  employee_number: z.string().nullable(),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  department_id: uuidSchema.nullable(),
  position: z.string().nullable(),
  job_title: z.string().nullable(),
  employment_type: employmentTypeEnum,
  status: employeeStatusEnum,
  role: z.string(),
  birth_date: z.string().date().nullable(),
  joined_at: z.string().date().nullable(),
  left_at: z.string().date().nullable(),
  probation_ends_at: z.string().date().nullable(),
  address: z.record(z.unknown()).nullable(),
  emergency_contact: z.record(z.unknown()).nullable(),
  family_info: z.record(z.unknown()).nullable(),
  bank_account_encrypted: z.string().nullable(),
  avatar_url: z.string().nullable(),
  deleted_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// users (role/last_login_ip 은 DB text)
export const userSchema = z.object({
  id: uuidSchema,
  employee_id: uuidSchema.nullable(),
  tenant_id: uuidSchema.nullable(),
  role: z.string().nullable(),
  locale: z.string(),
  totp_enabled: z.boolean(),
  totp_secret_encrypted: z.string().nullable(),
  recovery_codes_hash: z.array(z.string()).nullable(),
  last_login_at: isoTimestampSchema.nullable(),
  last_login_ip: z.string().nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// roles (PK = key, no id/created_at/updated_at)
export const roleSchema = z.object({
  key: z.string(),
  label_ko: z.string().nullable(),
  is_system: z.boolean(),
  default_permissions: z.record(z.unknown()),
});

// notifications (no updated_at)
export const notificationSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema.nullable(),
  user_id: uuidSchema,
  type: notificationTypeEnum,
  title: z.string().nullable(),
  message: z.string().nullable(),
  link_url: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  read_status: z.boolean(),
  read_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
});

// audit_logs (ip/request_id 은 DB text, no updated_at)
export const auditLogSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema.nullable(),
  actor_id: uuidSchema.nullable(),
  actor_role: z.string().nullable(),
  action: z.string(),
  target_type: z.string().nullable(),
  target_id: uuidSchema.nullable(),
  before: z.record(z.unknown()).nullable(),
  after: z.record(z.unknown()).nullable(),
  result: auditResultEnum,
  ip: z.string().nullable(),
  user_agent: z.string().nullable(),
  request_id: z.string().nullable(),
  created_at: isoTimestampSchema,
});

// employee_change_requests
export const employeeChangeRequestSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  employee_id: uuidSchema,
  approval_id: uuidSchema.nullable(),
  field_name: z.string(),
  old_value: z.record(z.unknown()).nullable(),
  new_value: z.record(z.unknown()).nullable(),
  reason: z.string().nullable(),
  status: changeRequestStatusEnum,
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
