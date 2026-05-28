-- Enum 타입 (SSOT: .flowset/db/enums.md) — 모든 enum은 영문 snake_case.

-- 운영사 도메인
create type tenant_status as enum ('active', 'inactive', 'overdue', 'expiring_soon', 'expired', 'archived');
create type plan_status as enum ('active', 'inactive', 'sales_stopped', 'custom');
create type invoice_status as enum ('draft', 'issued', 'paid', 'overdue', 'failed', 'refunded');
create type feature_flag_state as enum ('active', 'inactive', 'beta', 'restricted');
create type ticket_type as enum ('inquiry', 'incident', 'request', 'other');
create type ticket_priority as enum ('p0', 'p1', 'p2', 'p3');
create type ticket_status as enum ('open', 'in_progress', 'waiting_user', 'resolved', 'closed');
create type maintenance_status as enum ('inactive', 'scheduled', 'active');
create type backup_status as enum ('pending', 'running', 'success', 'failed');
create type backup_kind as enum ('auto', 'manual');
create type operator_role as enum ('operator_super', 'operator_staff');
create type billing_cycle as enum ('monthly', 'annual');

-- HR 도메인
create type employment_type as enum ('regular', 'contract', 'part_time', 'freelancer');
create type employee_status as enum ('invited', 'probation', 'active', 'on_leave', 'resigned', 'inactive');
create type attendance_status as enum (
  'normal', 'late', 'early_leave', 'absent',
  'leave', 'remote', 'outside', 'business_trip',
  'missing', 'modification_pending', 'modification_done'
);
create type work_type as enum ('office', 'remote', 'outside', 'business_trip');
create type modification_request_type as enum ('clock_in', 'clock_out', 'break', 'outside');
create type half_day as enum ('none', 'start', 'end');
create type leave_status as enum ('draft', 'pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'completed');
create type approval_status as enum ('draft', 'pending', 'in_progress', 'approved', 'rejected', 'cancelled');
create type approval_step_status as enum ('pending', 'approved', 'rejected', 'skipped', 'delegated');
create type approval_request_type as enum ('leave', 'attendance_mod', 'certificate', 'change_request', 'document');
create type document_sub_type as enum ('payslip', 'contract', 'certificate', 'personal', 'company');
create type document_status as enum ('draft', 'created', 'sent', 'viewed', 'acknowledged', 'expired');
create type document_visibility as enum ('owner_only', 'owner_and_hr', 'company_wide');
create type certificate_request_status as enum ('pending', 'in_progress', 'issued', 'rejected', 'cancelled');
create type notification_type as enum ('approval', 'document', 'system', 'announcement');
create type audit_result as enum ('success', 'failed', 'denied');
create type change_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- 설정/연동/v1.2
create type integration_status as enum ('disconnected', 'connected', 'error', 'expired');
create type signature_status as enum ('pending', 'signed', 'rejected', 'expired');

-- 컴플라이언스 (KI-030 batch-003)
create type legal_document_type as enum ('terms', 'privacy');
create type consent_source as enum ('activate', 'forced', 'footer');
