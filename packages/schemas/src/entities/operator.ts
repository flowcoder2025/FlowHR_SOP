import { z } from 'zod';
import { uuidSchema, isoTimestampSchema } from '../common';
import {
  planStatusEnum,
  tenantStatusEnum,
  billingCycleEnum,
  invoiceStatusEnum,
  featureFlagStateEnum,
  ticketTypeEnum,
  ticketPriorityEnum,
  ticketStatusEnum,
  maintenanceStatusEnum,
  backupStatusEnum,
  backupKindEnum,
  operatorRoleEnum,
  tenantDraftStatusEnum,
} from './enums';

/**
 * 운영사 도메인 entity (database.ts Row 1:1, snake_case). 가격(_krw/latched)은 numeric 가능성으로
 * z.number()(정수 강제 X), 카운트/order 류만 .int(). 날짜는 staging information_schema 실측 기준.
 */

// plans
export const planSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string(),
  status: planStatusEnum,
  base_price_krw: z.number().nullable(),
  per_user_price_krw: z.number().nullable(),
  included_users: z.number().int().nullable(),
  modules: z.array(z.string()),
  is_public: z.boolean(),
  sort_order: z.number().int(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// tenants
export const tenantSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  slug: z.string(),
  business_number: z.string().nullable(),
  representative_name: z.string().nullable(),
  industry: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  plan_id: uuidSchema.nullable(),
  status: tenantStatusEnum,
  contract_start_date: z.string().date().nullable(),
  contract_end_date: z.string().date().nullable(),
  user_limit: z.number().int().nullable(),
  active_user_count: z.number().int(),
  admin_user_id: uuidSchema.nullable(),
  logo_url: z.string().nullable(),
  metadata: z.record(z.unknown()),
  deleted_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// tenant_drafts (Sprint 2 mig 36: status/submitted_tenant_id/completed_at/abandoned_at 추가)
export const tenantDraftSchema = z.object({
  id: uuidSchema,
  created_by: uuidSchema.nullable(),
  current_step: z.number().int(),
  form_data: z.record(z.unknown()),
  status: tenantDraftStatusEnum,
  submitted_tenant_id: uuidSchema.nullable(),
  completed_at: isoTimestampSchema.nullable(),
  abandoned_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// subscriptions
export const subscriptionSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  plan_id: uuidSchema.nullable(),
  billing_cycle: billingCycleEnum,
  latched_base_price: z.number().nullable(),
  latched_price_per_user: z.number().nullable(),
  period_start: z.string().date().nullable(),
  period_end: z.string().date().nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// invoices (issued_at/paid_at/due_date/period_month 은 DB date)
export const invoiceSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  subscription_id: uuidSchema.nullable(),
  invoice_number: z.string(),
  status: invoiceStatusEnum,
  period_month: z.string().date().nullable(),
  active_users: z.number().int().nullable(),
  subtotal_krw: z.number().nullable(),
  tax_krw: z.number().nullable(),
  total_krw: z.number().nullable(),
  payment_method: z.string().nullable(),
  tax_invoice_id: z.string().nullable(),
  issued_at: z.string().date().nullable(),
  paid_at: z.string().date().nullable(),
  due_date: z.string().date().nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// feature_flags (PK = key, no id)
export const featureFlagSchema = z.object({
  key: z.string(),
  label_ko: z.string().nullable(),
  description: z.string().nullable(),
  module: z.string().nullable(),
  global_state: featureFlagStateEnum,
  is_beta: z.boolean(),
  plan_ids: z.array(z.string()),
  applied_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// feature_flag_overrides (PK = tenant_id + flag_key, no id/updated_at)
export const featureFlagOverrideSchema = z.object({
  tenant_id: uuidSchema,
  flag_key: z.string(),
  value: z.boolean(),
  reason: z.string().nullable(),
  created_by: uuidSchema.nullable(),
  created_at: isoTimestampSchema,
});

// tickets
export const ticketSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema.nullable(),
  ticket_number: z.string(),
  type: ticketTypeEnum,
  priority: ticketPriorityEnum,
  status: ticketStatusEnum,
  title: z.string(),
  requester_id: uuidSchema.nullable(),
  assigned_to: uuidSchema.nullable(),
  sla_deadline: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// ticket_messages (no updated_at)
export const ticketMessageSchema = z.object({
  id: uuidSchema,
  ticket_id: uuidSchema,
  author_id: uuidSchema.nullable(),
  body: z.string(),
  is_internal: z.boolean(),
  attachment_ids: z.array(uuidSchema),
  created_at: isoTimestampSchema,
});

// system_settings (singleton)
export const systemSettingsSchema = z.object({
  id: uuidSchema,
  brand_name: z.string(),
  brand_logo_url: z.string().nullable(),
  brand_logo_url_dark: z.string().nullable(),
  require_operator_2fa: z.boolean(),
  data_retention: z.record(z.unknown()).nullable(),
  mail_config: z.record(z.unknown()).nullable(),
  notification_channels: z.record(z.unknown()).nullable(),
  password_policy: z.record(z.unknown()).nullable(),
  session_policy: z.record(z.unknown()).nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// maintenance_windows (no created_at/updated_at)
export const maintenanceWindowSchema = z.object({
  id: uuidSchema,
  status: maintenanceStatusEnum,
  message_ko: z.string().nullable(),
  scheduled_start: isoTimestampSchema.nullable(),
  scheduled_end: isoTimestampSchema.nullable(),
  activated_at: isoTimestampSchema.nullable(),
  deactivated_at: isoTimestampSchema.nullable(),
  created_by: uuidSchema.nullable(),
});

// backup_jobs (no created_at/updated_at)
export const backupJobSchema = z.object({
  id: uuidSchema,
  kind: backupKindEnum,
  status: backupStatusEnum,
  size_bytes: z.number().int().nullable(),
  storage_url: z.string().nullable(),
  error_message: z.string().nullable(),
  started_at: isoTimestampSchema.nullable(),
  finished_at: isoTimestampSchema.nullable(),
  triggered_by: uuidSchema.nullable(),
});

// operator_users (PK = user_id, no id/created_at/updated_at)
export const operatorUserSchema = z.object({
  user_id: uuidSchema,
  role: operatorRoleEnum,
  is_active: z.boolean(),
  invited_at: isoTimestampSchema.nullable(),
  activated_at: isoTimestampSchema.nullable(),
});
