import { z } from 'zod';
import { uuidSchema, isoTimestampSchema } from '../common';
import { conditionRuleSchema, approvalStepArraySchema } from '../approval-line-dsl';
import {
  approvalRequestTypeEnum,
  approvalStatusEnum,
  approvalStepStatusEnum,
  documentSubTypeEnum,
  documentStatusEnum,
  documentVisibilityEnum,
  certificateRequestStatusEnum,
} from './enums';

/**
 * 결재/문서/증명서 도메인 entity (database.ts Row 1:1, snake_case).
 * approval_lines.conditions/default_line 은 jsonb 배열 — WI-034 조건 분기 DSL(approval-line-dsl.ts).
 * documents.expires_at 은 DB date.
 */

// approval_lines (conditions/default_line = 조건 분기 DSL, WI-034)
export const approvalLineSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  name: z.string(),
  request_type: approvalRequestTypeEnum,
  conditions: z.array(conditionRuleSchema),
  default_line: approvalStepArraySchema,
  is_active: z.boolean(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// approvals (polymorphic)
export const approvalSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  requester_id: uuidSchema,
  request_type: approvalRequestTypeEnum,
  request_object_id: uuidSchema.nullable(),
  title: z.string().nullable(),
  status: approvalStatusEnum,
  current_step: z.number().int(),
  total_steps: z.number().int(),
  sla_deadline: isoTimestampSchema.nullable(),
  requested_at: isoTimestampSchema.nullable(),
  completed_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// approval_steps
export const approvalStepSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  approval_id: uuidSchema,
  approver_id: uuidSchema.nullable(),
  step_order: z.number().int(),
  status: approvalStepStatusEnum,
  comment: z.string().nullable(),
  processed_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// documents (expires_at 은 DB date)
export const documentSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  sub_type: documentSubTypeEnum,
  status: documentStatusEnum,
  visibility: documentVisibilityEnum,
  title: z.string().nullable(),
  owner_id: uuidSchema.nullable(),
  template_id: uuidSchema.nullable(),
  created_by: uuidSchema.nullable(),
  file_url: z.string().nullable(),
  file_size_bytes: z.number().int().nullable(),
  mime_type: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  expires_at: z.string().date().nullable(),
  sent_at: isoTimestampSchema.nullable(),
  viewed_at: isoTimestampSchema.nullable(),
  acknowledged_at: isoTimestampSchema.nullable(),
  deleted_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// certificate_requests
export const certificateRequestSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  employee_id: uuidSchema,
  approval_id: uuidSchema.nullable(),
  certificate_type: z.string().nullable(),
  purpose: z.string().nullable(),
  copies: z.number().int(),
  delivery_method: z.string().nullable(),
  submission_target: z.string().nullable(),
  request_memo: z.string().nullable(),
  status: certificateRequestStatusEnum,
  issued_document_id: uuidSchema.nullable(),
  issued_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});
