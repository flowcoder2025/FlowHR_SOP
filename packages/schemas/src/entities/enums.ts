import { z } from 'zod';

/**
 * DB enum (enums.md SSOT) → zod.enum. 모든 값은 영문 snake_case (KI-004).
 * 화면 한글 표시는 클라이언트 i18n 매핑(enum-labels). 필드 casing 은 DB snake_case 단일
 * (WI-021-1 codex 협의 — database.ts/actions.ts 정합).
 */

// ── 운영사 도메인 ──────────────────────────────────────────────
export const tenantStatusEnum = z.enum(['active', 'inactive', 'overdue', 'expiring_soon', 'expired', 'archived']);
export const planStatusEnum = z.enum(['active', 'inactive', 'sales_stopped', 'custom']);
export const invoiceStatusEnum = z.enum(['draft', 'issued', 'paid', 'overdue', 'failed', 'refunded']);
export const featureFlagStateEnum = z.enum(['active', 'inactive', 'beta', 'restricted']);
export const ticketTypeEnum = z.enum(['inquiry', 'incident', 'request', 'other']);
export const ticketPriorityEnum = z.enum(['p0', 'p1', 'p2', 'p3']);
export const ticketStatusEnum = z.enum(['open', 'in_progress', 'waiting_user', 'resolved', 'closed']);
export const maintenanceStatusEnum = z.enum(['inactive', 'scheduled', 'active']);
export const backupStatusEnum = z.enum(['pending', 'running', 'success', 'failed']);
export const backupKindEnum = z.enum(['auto', 'manual']);
export const operatorRoleEnum = z.enum(['operator_super', 'operator_staff']);
export const billingCycleEnum = z.enum(['monthly', 'annual']);

// ── 역할 (6 역할 통합 — api/schemas.md Role) ─────────────────────
export const appRoleEnum = z.enum([
  'operator_super',
  'operator_staff',
  'tenant_super',
  'tenant_hr_admin',
  'tenant_manager',
  'employee',
]);

// ── HR / 근태 / 휴가 / 결재 도메인 ──────────────────────────────
export const employmentTypeEnum = z.enum(['regular', 'contract', 'part_time', 'freelancer']);
export const employeeStatusEnum = z.enum(['invited', 'probation', 'active', 'on_leave', 'resigned', 'inactive']);
export const attendanceStatusEnum = z.enum([
  'normal', 'late', 'early_leave', 'absent',
  'leave', 'remote', 'outside', 'business_trip',
  'missing', 'modification_pending', 'modification_done',
]);
export const workTypeEnum = z.enum(['office', 'remote', 'outside', 'business_trip']);
export const modificationRequestTypeEnum = z.enum(['clock_in', 'clock_out', 'break', 'outside']);
export const halfDayEnum = z.enum(['none', 'start', 'end']);
export const leaveStatusEnum = z.enum(['draft', 'pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'completed']);
export const approvalStatusEnum = z.enum(['draft', 'pending', 'in_progress', 'approved', 'rejected', 'cancelled']);
export const approvalStepStatusEnum = z.enum(['pending', 'approved', 'rejected', 'skipped', 'delegated']);
export const approvalRequestTypeEnum = z.enum(['leave', 'attendance_mod', 'certificate', 'change_request', 'document']);
export const documentSubTypeEnum = z.enum(['payslip', 'contract', 'certificate', 'personal', 'company']);
export const documentStatusEnum = z.enum(['draft', 'created', 'sent', 'viewed', 'acknowledged', 'expired']);
export const documentVisibilityEnum = z.enum(['owner_only', 'owner_and_hr', 'company_wide']);
export const certificateRequestStatusEnum = z.enum(['pending', 'in_progress', 'issued', 'rejected', 'cancelled']);
export const notificationTypeEnum = z.enum(['approval', 'document', 'system', 'announcement']);
export const auditResultEnum = z.enum(['success', 'failed', 'denied']);
export const changeRequestStatusEnum = z.enum(['pending', 'approved', 'rejected', 'cancelled']);

// ── 설정 / 연동 / v1.2 ─────────────────────────────────────────
export const integrationStatusEnum = z.enum(['disconnected', 'connected', 'error', 'expired']);
export const signatureStatusEnum = z.enum(['pending', 'signed', 'rejected', 'expired']);

// ── 컴플라이언스 (KI-030) ──────────────────────────────────────
export const legalDocumentTypeEnum = z.enum(['terms', 'privacy']);
export const consentSourceEnum = z.enum(['activate', 'forced', 'footer']);
