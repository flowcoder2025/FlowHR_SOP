# Enum 타입 + 상태값 (영문 통일)

> KI-004 해소. 모든 DB enum은 **영문 snake_case**. 화면 한글 표시는 클라이언트 i18n 매핑.

## Postgres CREATE TYPE 정의

```sql
-- 운영사 도메인
CREATE TYPE tenant_status AS ENUM ('active', 'inactive', 'overdue', 'expiring_soon', 'expired', 'archived');
CREATE TYPE plan_status AS ENUM ('active', 'inactive', 'sales_stopped', 'custom');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'overdue', 'failed', 'refunded');
CREATE TYPE feature_flag_state AS ENUM ('active', 'inactive', 'beta', 'restricted');
CREATE TYPE ticket_type AS ENUM ('inquiry', 'incident', 'request', 'other');
CREATE TYPE ticket_priority AS ENUM ('p0', 'p1', 'p2', 'p3');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_user', 'resolved', 'closed');
CREATE TYPE maintenance_status AS ENUM ('inactive', 'scheduled', 'active');
CREATE TYPE backup_status AS ENUM ('pending', 'running', 'success', 'failed');
CREATE TYPE backup_kind AS ENUM ('auto', 'manual');
CREATE TYPE operator_role AS ENUM ('operator_super', 'operator_staff');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'annual');

-- HR 도메인
CREATE TYPE employment_type AS ENUM ('regular', 'contract', 'part_time', 'freelancer');
CREATE TYPE employee_status AS ENUM ('invited', 'probation', 'active', 'on_leave', 'resigned', 'inactive');
CREATE TYPE attendance_status AS ENUM (
  'normal', 'late', 'early_leave', 'absent',
  'leave', 'remote', 'outside', 'business_trip',
  'missing', 'modification_pending', 'modification_done'
);
CREATE TYPE work_type AS ENUM ('office', 'remote', 'outside', 'business_trip');
CREATE TYPE modification_request_type AS ENUM ('clock_in', 'clock_out', 'break', 'outside');
CREATE TYPE half_day AS ENUM ('none', 'start', 'end');
CREATE TYPE leave_status AS ENUM ('draft', 'pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'completed');
CREATE TYPE approval_status AS ENUM ('draft', 'pending', 'in_progress', 'approved', 'rejected', 'cancelled');
CREATE TYPE approval_step_status AS ENUM ('pending', 'approved', 'rejected', 'skipped', 'delegated');
CREATE TYPE approval_request_type AS ENUM ('leave', 'attendance_mod', 'certificate', 'change_request', 'document');
CREATE TYPE document_sub_type AS ENUM ('payslip', 'contract', 'certificate', 'personal', 'company');
CREATE TYPE document_status AS ENUM ('draft', 'created', 'sent', 'viewed', 'acknowledged', 'expired');
CREATE TYPE document_visibility AS ENUM ('owner_only', 'owner_and_hr', 'company_wide');
CREATE TYPE certificate_request_status AS ENUM ('pending', 'in_progress', 'issued', 'rejected', 'cancelled');
CREATE TYPE notification_type AS ENUM ('approval', 'document', 'system', 'announcement');
CREATE TYPE audit_result AS ENUM ('success', 'failed', 'denied');
CREATE TYPE change_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- 설정/연동/v1.2
CREATE TYPE integration_status AS ENUM ('disconnected', 'connected', 'error', 'expired');
CREATE TYPE signature_status AS ENUM ('pending', 'signed', 'rejected', 'expired');

-- 컴플라이언스 (KI-030 batch-003)
CREATE TYPE legal_document_type AS ENUM ('terms', 'privacy');
CREATE TYPE consent_source AS ENUM ('activate', 'forced', 'footer');
```

## 한글 표시 매핑 (클라이언트 i18n)

```typescript
// packages/utils/enum-labels.ts
export const enumLabels = {
  attendance_status: {
    normal: '정상',
    late: '지각',
    early_leave: '조퇴',
    absent: '결근',
    leave: '휴가',
    remote: '재택',
    outside: '외근',
    business_trip: '출장',
    missing: '누락',
    modification_pending: '수정요청중',
    modification_done: '수정완료',
  },
  leave_status: {
    draft: '임시저장',
    pending: '승인 대기',
    in_progress: '진행 중',
    approved: '승인 완료',
    rejected: '반려',
    cancelled: '취소',
    completed: '사용 완료',
  },
  tenant_status: {
    active: '활성',
    inactive: '비활성',
    overdue: '미납',
    expiring_soon: '만료 예정',
    expired: '계약 만료',
    archived: '보관',
  },
  employee_status: {
    invited: '초대 대기',
    probation: '수습',
    active: '재직',
    on_leave: '휴직',
    resigned: '퇴사',
    inactive: '비활성',
  },
  // ... 나머지 enum도 동일 패턴
} as const;
```

## 색상 매핑 (style-guide.md 정합)

| Enum 값 | 색상 토큰 |
|--------|---------|
| `normal`, `approved`, `paid`, `active` (재직), `connected`, `success`, `issued` | success |
| `pending`, `in_progress`, `probation`, `scheduled`, `running` | info |
| `late`, `overdue`, `expiring_soon`, `waiting_user`, `failed` (재시도 가능) | warning |
| `absent`, `rejected`, `inactive`, `expired`, `denied`, `failed` (영구) | danger |
| `cancelled`, `archived`, `on_leave`, `resigned`, `closed`, `skipped`, `draft` | text-muted |

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — KI-004 해소 (Attendance 등 모든 enum 영문 통일) | Phase 3 진입 |
| 2026-05-15 | legal_document_type, consent_source enum 추가 | KI-030 batch-003 |
