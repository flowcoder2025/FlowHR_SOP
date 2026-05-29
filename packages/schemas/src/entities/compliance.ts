import { z } from 'zod';
import { uuidSchema, isoTimestampSchema } from '../common';
import { legalDocumentTypeEnum, consentSourceEnum } from './enums';

/**
 * 컴플라이언스 도메인 entity (database.ts Row 1:1, snake_case, KI-030).
 * legal_documents 는 운영사 게시(tenant 없음) + language(ko|en) ko/en 페어(ST-078, ERD SSOT).
 * user_consents.ip_address 는 DB nullable inet → z.string().nullable().
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
  document_type: z.string(),
  version: z.string(),
  source: consentSourceEnum,
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  consented_at: isoTimestampSchema,
});

/**
 * 입력/응답 DTO (API 계약 — camelCase, api/common.md 정합).
 * entity(snake_case, DB Row 1:1)와 달리 요청/응답 본문은 클라이언트↔서버 계약이므로
 * API 명세 표기를 따른다. 서버 lib 에서 snake_case 컬럼으로 매핑한다. (schemas.md SSOT 정합 노트)
 */

// POST /me/consents — 본인 동의 기록. source/ip/ua 는 서버에서 결정(클라이언트 위조 방지).
export const consentInputSchema = z.object({
  documentId: uuidSchema,
  version: z.string().min(1),
});
export type ConsentInput = z.infer<typeof consentInputSchema>;

// 게시 본문 한 언어분 (title/contentMd 필수, summaryMd 선택).
export const legalDocumentContentSchema = z.object({
  title: z.string().min(1),
  contentMd: z.string().min(1),
  summaryMd: z.string().min(1).nullable().optional(),
});

// POST /operator/legal/documents — ko/en 페어 게시(operator_super). ko·en 모두 필수 →
// 스키마 레벨에서 페어 게시 의무 강제(ST-078 AC-6, rls.md §6-1 i18n 게시 정책).
export const legalDocumentPublishSchema = z.object({
  type: legalDocumentTypeEnum,
  version: z.string().min(1),
  effectiveDate: z.string().date().nullable().optional(),
  ko: legalDocumentContentSchema,
  en: legalDocumentContentSchema,
});
export type LegalDocumentPublishInput = z.infer<typeof legalDocumentPublishSchema>;

// GET /me/consents/required — 강제 동의 필요 문서(사용자 locale 본문, ST-078 AC-2).
export const requiredConsentSchema = z.object({
  type: legalDocumentTypeEnum,
  documentId: uuidSchema,
  version: z.string(),
  language: z.string(),
  title: z.string().nullable(),
  effectiveDate: z.string().date().nullable(),
  summaryMd: z.string().nullable(),
});
export type RequiredConsent = z.infer<typeof requiredConsentSchema>;
