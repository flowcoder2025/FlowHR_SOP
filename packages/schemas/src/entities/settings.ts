import { z } from 'zod';
import { uuidSchema, isoTimestampSchema } from '../common';
import { integrationStatusEnum, signatureStatusEnum } from './enums';

/**
 * 설정/연동/문서양식/서명 도메인 entity (database.ts Row 1:1, snake_case).
 * work_policies 시각 컬럼(standard_clock_in 등)은 DB time → z.string(); api_keys.expires_at 은 DB date.
 */

// tenant_settings (1:1 with tenant)
export const tenantSettingsSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  company_info: z.record(z.unknown()).nullable(),
  notification_config: z.record(z.unknown()).nullable(),
  security_policy: z.record(z.unknown()).nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// work_policies (clock/threshold 는 DB time, applied_from 은 DB date)
export const workPolicySchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  name: z.string(),
  is_default: z.boolean(),
  standard_clock_in: z.string().nullable(),
  standard_clock_out: z.string().nullable(),
  late_threshold: z.string().nullable(),
  break_minutes_default: z.number().int(),
  weekly_max_hours: z.number().int(),
  applicable_departments: z.array(uuidSchema),
  applied_from: z.string().date().nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// document_templates
export const documentTemplateSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  key: z.string(),
  label_ko: z.string().nullable(),
  template_body: z.string().nullable(),
  template_format: z.string().nullable(),
  variables: z.array(z.string()),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// integrations
export const integrationSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  type: z.string(),
  status: integrationStatusEnum,
  config: z.record(z.unknown()).nullable(),
  credentials_encrypted: z.record(z.unknown()).nullable(),
  failure_count_24h: z.number().int(),
  last_synced_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// integration_logs (no updated_at)
export const integrationLogSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  integration_id: uuidSchema,
  event_type: z.string().nullable(),
  http_status: z.number().int().nullable(),
  request_payload: z.record(z.unknown()).nullable(),
  response_payload: z.record(z.unknown()).nullable(),
  error_message: z.string().nullable(),
  created_at: isoTimestampSchema,
});

// api_keys (expires_at 은 DB date, no updated_at)
export const apiKeySchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema.nullable(),
  owner_type: z.string(),
  key_hash: z.string(),
  label: z.string().nullable(),
  scopes: z.array(z.string()),
  reason: z.string().nullable(),
  usage_count: z.number().int(),
  expires_at: z.string().date().nullable(),
  last_used_at: isoTimestampSchema.nullable(),
  revoked_at: isoTimestampSchema.nullable(),
  created_by: uuidSchema.nullable(),
  created_at: isoTimestampSchema,
});

// signatures (v1.2, no updated_at)
export const signatureSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  document_id: uuidSchema,
  signer_employee_id: uuidSchema.nullable(),
  signer_method: z.string().nullable(),
  status: signatureStatusEnum,
  signature_image_url: z.string().nullable(),
  external_provider: z.string().nullable(),
  external_id: z.string().nullable(),
  evidence_payload: z.record(z.unknown()).nullable(),
  signed_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
});
