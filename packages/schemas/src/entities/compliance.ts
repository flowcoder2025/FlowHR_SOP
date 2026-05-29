import { z } from 'zod';
import { uuidSchema, isoTimestampSchema } from '../common';
import { legalDocumentTypeEnum, consentSourceEnum } from './enums';

/**
 * 컴플라이언스 도메인 entity (database.ts Row 1:1, snake_case, KI-030).
 * legal_documents 는 운영사 게시(tenant 없음) + language(ko|en) ko/en 페어(ST-078, ERD SSOT).
 * user_consents.ip_address 는 DB inet → z.string().
 */

// legal_documents (no tenant_id — 운영사 게시, language ko/en)
export const legalDocumentSchema = z.object({
  id: uuidSchema,
  type: legalDocumentTypeEnum,
  version: z.string(),
  language: z.string(),
  effective_date: z.string().date().nullable(),
  title: z.string().nullable(),
  content_md: z.string().nullable(),
  summary_md: z.string().nullable(),
  is_active: z.boolean(),
  published_by: uuidSchema.nullable(),
  published_at: isoTimestampSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

// user_consents (consented_at 만, created_at/updated_at 없음)
export const userConsentSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema.nullable(),
  user_id: uuidSchema,
  document_id: uuidSchema,
  document_type: legalDocumentTypeEnum,
  version: z.string(),
  source: consentSourceEnum,
  ip_address: z.string(),
  user_agent: z.string().nullable(),
  consented_at: isoTimestampSchema,
});
