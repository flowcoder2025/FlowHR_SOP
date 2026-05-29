import { z } from 'zod';
import { uuidSchema, isoTimestampSchema } from '../common';
import { halfDayEnum, leaveStatusEnum } from './enums';

/**
 * 휴가 도메인 entity (database.ts Row 1:1, snake_case).
 * start_date/end_date/expires_at 는 DB date. 일수(used_days/granted 등)는 0.5 단위 numeric.
 */

// leave_types
export const leaveTypeSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  key: z.string(),
  label_ko: z.string().nullable(),
  default_days: z.number(),
  is_paid: z.boolean(),
  carryover_allowed: z.boolean(),
  evidence_required: z.boolean(),
  sort_order: z.number().int(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// leaves (start_date/end_date 는 DB date)
export const leaveSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  employee_id: uuidSchema,
  leave_type_id: uuidSchema,
  approval_id: uuidSchema.nullable(),
  substitute_employee_id: uuidSchema.nullable(),
  start_date: z.string().date().nullable(),
  end_date: z.string().date().nullable(),
  half_day: halfDayEnum,
  used_days: z.number(),
  reason: z.string().nullable(),
  attachment_ids: z.array(uuidSchema),
  status: leaveStatusEnum,
  requested_at: isoTimestampSchema.nullable(),
  completed_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// leave_balances (expires_at 은 DB date)
export const leaveBalanceSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  employee_id: uuidSchema,
  leave_type_id: uuidSchema,
  year: z.number().int(),
  granted: z.number(),
  used: z.number(),
  scheduled: z.number(),
  remaining: z.number().nullable(),
  expires_at: z.string().date().nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
