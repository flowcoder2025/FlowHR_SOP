/**
 * zod 스키마 → OpenAPI 3.1 명세 자동 생성 (sprint-001 Day 13~14 / WI-021 + WI-021-1).
 *
 * 출력: packages/schemas/dist/openapi.yaml — API 계약 SSOT.
 *   phase7-code.yml 의 "OpenAPI 최신성" diff 게이트 대상이라 git 추적한다(.gitignore 예외).
 *   zod 스키마를 고치면 이 스크립트를 재실행(turbo build)하고 openapi.yaml 을 함께 커밋해야 한다.
 *
 * WI-021-1: ERD 39 entity zod schema(snake_case, database.ts Row 1:1) 등록.
 *   엔드포인트 req/res schema 는 Sprint 2~6 에 점진 확장.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { stringify } from 'yaml';

import { registry } from '../src/index';
import { loginSchema } from '../src/auth';
import { uuidSchema, isoTimestampSchema, timestampsSchema, paginationQuerySchema } from '../src/common';
import {
  planSchema, tenantSchema, tenantDraftSchema, subscriptionSchema, invoiceSchema,
  featureFlagSchema, featureFlagOverrideSchema, ticketSchema, ticketMessageSchema,
  systemSettingsSchema, maintenanceWindowSchema, backupJobSchema, operatorUserSchema,
} from '../src/entities/operator';
import {
  departmentSchema, employeeSchema, userSchema, roleSchema, notificationSchema,
  auditLogSchema, employeeChangeRequestSchema,
} from '../src/entities/hr';
import {
  tenantSettingsSchema, workPolicySchema, documentTemplateSchema, integrationSchema,
  integrationLogSchema, apiKeySchema, signatureSchema,
} from '../src/entities/settings';
import { locationSchema, attendanceSchema, attendanceModificationSchema } from '../src/entities/attendance';
import { leaveTypeSchema, leaveSchema, leaveBalanceSchema } from '../src/entities/leave';
import {
  approvalLineSchema, approvalSchema, approvalStepSchema, documentSchema, certificateRequestSchema,
} from '../src/entities/approval';
import { legalDocumentSchema, userConsentSchema } from '../src/entities/compliance';

// ── 공통/인증 utility 스키마 ───────────────────────────────────
registry.register('Login', loginSchema);
registry.register('Uuid', uuidSchema);
registry.register('IsoTimestamp', isoTimestampSchema);
registry.register('Timestamps', timestampsSchema);
registry.register('PaginationQuery', paginationQuerySchema);

// ── 운영사 도메인 (13) ─────────────────────────────────────────
registry.register('Plan', planSchema);
registry.register('Tenant', tenantSchema);
registry.register('TenantDraft', tenantDraftSchema);
registry.register('Subscription', subscriptionSchema);
registry.register('Invoice', invoiceSchema);
registry.register('FeatureFlag', featureFlagSchema);
registry.register('FeatureFlagOverride', featureFlagOverrideSchema);
registry.register('Ticket', ticketSchema);
registry.register('TicketMessage', ticketMessageSchema);
registry.register('SystemSettings', systemSettingsSchema);
registry.register('MaintenanceWindow', maintenanceWindowSchema);
registry.register('BackupJob', backupJobSchema);
registry.register('OperatorUser', operatorUserSchema);

// ── HR 도메인 (7) ──────────────────────────────────────────────
registry.register('Department', departmentSchema);
registry.register('Employee', employeeSchema);
registry.register('User', userSchema);
registry.register('Role', roleSchema);
registry.register('Notification', notificationSchema);
registry.register('AuditLog', auditLogSchema);
registry.register('EmployeeChangeRequest', employeeChangeRequestSchema);

// ── 설정/연동 도메인 (7) ───────────────────────────────────────
registry.register('TenantSettings', tenantSettingsSchema);
registry.register('WorkPolicy', workPolicySchema);
registry.register('DocumentTemplate', documentTemplateSchema);
registry.register('Integration', integrationSchema);
registry.register('IntegrationLog', integrationLogSchema);
registry.register('ApiKey', apiKeySchema);
registry.register('Signature', signatureSchema);

// ── 근태 도메인 (2 + Location 헬퍼) ────────────────────────────
registry.register('Location', locationSchema);
registry.register('Attendance', attendanceSchema);
registry.register('AttendanceModification', attendanceModificationSchema);

// ── 휴가 도메인 (3) ────────────────────────────────────────────
registry.register('LeaveType', leaveTypeSchema);
registry.register('Leave', leaveSchema);
registry.register('LeaveBalance', leaveBalanceSchema);

// ── 결재/문서 도메인 (5) ───────────────────────────────────────
registry.register('ApprovalLine', approvalLineSchema);
registry.register('Approval', approvalSchema);
registry.register('ApprovalStep', approvalStepSchema);
registry.register('Document', documentSchema);
registry.register('CertificateRequest', certificateRequestSchema);

// ── 컴플라이언스 도메인 (2) ────────────────────────────────────
registry.register('LegalDocument', legalDocumentSchema);
registry.register('UserConsent', userConsentSchema);

const generator = new OpenApiGeneratorV31(registry.definitions);
const document = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'FlowHR API',
    version: '0.1.0',
    description:
      'FlowHR 멀티테넌트 HR SaaS API 명세. zod 스키마(@flowhr/schemas)에서 zod-to-openapi 로 자동 생성한다. ' +
      'WI-021-1: ERD 39 entity(snake_case, DB Row 1:1) 등록. 엔드포인트 req/res 는 Sprint 2~6 점진 확장.',
  },
});

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const outPath = resolve(outDir, 'openapi.yaml');
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, stringify(document), 'utf8');

console.log(
  `OpenAPI 3.1 명세 생성 완료 → ${outPath} (${registry.definitions.length} definitions)`,
);
