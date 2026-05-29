import { z } from 'zod';
import { uuidSchema, isoTimestampSchema } from '../common';
import { workTypeEnum, attendanceStatusEnum, modificationRequestTypeEnum, approvalStatusEnum } from './enums';

/**
 * 근태 도메인 entity (database.ts Row 1:1, snake_case).
 * 위치는 jsonb(KI-018). work_date/target_date 는 DB date,
 * attendance_modifications.original_value/requested_value 는 DB timestamptz(수정 전/후 시각).
 */

// 출퇴근 위치 (jsonb)
export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
});

// attendances
export const attendanceSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  employee_id: uuidSchema,
  work_date: z.string().date(),
  clock_in_at: isoTimestampSchema.nullable(),
  clock_out_at: isoTimestampSchema.nullable(),
  break_minutes: z.number().int(),
  work_minutes: z.number().int().nullable(),
  work_type: workTypeEnum,
  status: attendanceStatusEnum,
  clock_in_location: locationSchema.nullable(),
  clock_out_location: locationSchema.nullable(),
  device_id: z.string().nullable(),
  modified_by: uuidSchema.nullable(),
  modification_reason: z.string().nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// attendance_modifications
export const attendanceModificationSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  employee_id: uuidSchema,
  attendance_id: uuidSchema.nullable(),
  approval_id: uuidSchema.nullable(),
  request_type: modificationRequestTypeEnum,
  status: approvalStatusEnum,
  target_date: z.string().date().nullable(),
  original_value: isoTimestampSchema.nullable(),
  requested_value: isoTimestampSchema.nullable(),
  reason: z.string().nullable(),
  attachment_ids: z.array(uuidSchema),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
