# 공통 스키마 (zod)

> Phase 7 코드 생성 시 `packages/schemas/`에 그대로 변환. zod-to-openapi로 OpenAPI 스키마 자동 생성.
> 37 엔티티 응답 스키마는 `database.ts`(Supabase 자동 생성) + 가공 변환 wrapper.

## 1. Envelope

```typescript
import { z } from 'zod';

export const MetaSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.string().datetime(),
  tenantId: z.string().uuid().nullable(),
});

export const SuccessEnvelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    ok: z.literal(true),
    data,
    meta: MetaSchema,
  });

export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fields: z.record(z.string()).optional(),
  traceId: z.string().uuid(),
});

export const ErrorEnvelope = z.object({
  ok: z.literal(false),
  error: ErrorSchema,
  meta: MetaSchema,
});

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const PaginatedEnvelope = <T extends z.ZodTypeAny>(itemSchema: T) =>
  SuccessEnvelope(z.object({
    items: z.array(itemSchema),
    pagination: PaginationSchema,
  }));
```

## 2. 공통 입력 (페이지네이션 / 정렬 / 필터)

```typescript
export const PaginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  q: z.string().optional(),
});
```

## 3. 도메인 베이스 — 모든 테이블 공통

```typescript
export const BaseRecord = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TenantScoped = BaseRecord.extend({
  tenantId: z.string().uuid(),
});

export const SoftDeletable = z.object({
  deletedAt: z.string().datetime().nullable(),
});
```

## 4. Enum 스키마 (enums.md ↔ zod)

```typescript
export const TenantStatus = z.enum(['active', 'inactive', 'overdue', 'expiring_soon', 'expired', 'archived']);
export const EmployeeStatus = z.enum(['invited', 'probation', 'active', 'on_leave', 'resigned', 'inactive']);
export const AttendanceStatus = z.enum([
  'normal', 'late', 'early_leave', 'absent',
  'leave', 'remote', 'outside', 'business_trip',
  'missing', 'modification_pending', 'modification_done',
]);
export const WorkType = z.enum(['office', 'remote', 'outside', 'business_trip']);
export const LeaveStatus = z.enum(['draft', 'pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'completed']);
export const ApprovalStatus = z.enum(['draft', 'pending', 'in_progress', 'approved', 'rejected', 'cancelled']);
export const ApprovalRequestType = z.enum(['leave', 'attendance_mod', 'certificate', 'change_request', 'document']);
export const DocumentSubType = z.enum(['payslip', 'contract', 'certificate', 'personal', 'company']);
export const DocumentStatus = z.enum(['draft', 'created', 'sent', 'viewed', 'acknowledged', 'expired']);
export const TicketPriority = z.enum(['p0', 'p1', 'p2', 'p3']);
export const TicketStatus = z.enum(['open', 'in_progress', 'waiting_user', 'resolved', 'closed']);
export const IntegrationStatus = z.enum(['disconnected', 'connected', 'error', 'expired']);
export const Role = z.enum(['operator_super', 'operator_staff', 'tenant_super', 'tenant_hr_admin', 'tenant_manager', 'employee']);
```

## 5. 핵심 엔티티 스키마 (Phase 7 detail)

### Tenant
```typescript
export const TenantSchema = BaseRecord.extend({
  name: z.string().min(2).max(100),
  businessNumber: z.string().regex(/^\d{3}-\d{2}-\d{5}$/),
  slug: z.string().regex(/^[a-z0-9-]{3,30}$/),
  representativeName: z.string(),
  industry: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  planId: z.string().uuid(),
  status: TenantStatus,
  contractStartDate: z.string().date(),
  contractEndDate: z.string().date(),
  userLimit: z.number().int().positive(),
  activeUserCount: z.number().int().nonnegative(),
  adminUserId: z.string().uuid(),
  logoUrl: z.string().url().nullable(),
});
```

### Employee
```typescript
export const EmployeeSchema = TenantScoped.merge(SoftDeletable).extend({
  employeeNumber: z.string(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().nullable(),
  departmentId: z.string().uuid(),
  position: z.string().nullable(),
  jobTitle: z.string().nullable(),
  employmentType: z.enum(['regular', 'contract', 'part_time', 'freelancer']),
  status: EmployeeStatus,
  joinedAt: z.string().date(),
  probationEndsAt: z.string().date().nullable(),
  leftAt: z.string().date().nullable(),
  birthDate: z.string().date().nullable(),
  avatarUrl: z.string().url().nullable(),
  role: Role,
});
```

### Attendance (위치는 jsonb — KI-018 결정)
```typescript
export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
});

export const AttendanceSchema = TenantScoped.extend({
  employeeId: z.string().uuid(),
  workDate: z.string().date(),
  clockInAt: z.string().datetime().nullable(),
  clockOutAt: z.string().datetime().nullable(),
  breakMinutes: z.number().int().nonnegative().default(0),
  workType: WorkType,
  status: AttendanceStatus,
  clockInLocation: LocationSchema.nullable(),
  clockOutLocation: LocationSchema.nullable(),
  deviceId: z.string().nullable(),
  modifiedBy: z.string().uuid().nullable(),
  modificationReason: z.string().nullable(),
  workMinutes: z.number().int().nonnegative().nullable(),
});

export const ClockInRequest = z.object({
  location: LocationSchema,
  deviceId: z.string(),
});
```

### Leave
```typescript
export const LeaveSchema = TenantScoped.extend({
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  halfDay: z.enum(['none', 'start', 'end']).default('none'),
  usedDays: z.number().positive().multipleOf(0.5),
  reason: z.string(),
  substituteEmployeeId: z.string().uuid().nullable(),
  attachmentIds: z.array(z.string().uuid()).default([]),
  approvalId: z.string().uuid(),
  status: LeaveStatus,
  requestedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});

export const LeaveCreateRequest = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  halfDay: z.enum(['none', 'start', 'end']).default('none'),
  reason: z.string().min(1),
  substituteEmployeeId: z.string().uuid().nullable(),
  attachmentIds: z.array(z.string().uuid()).default([]),
});
```

### Approval Line conditions (KI-019 해소)
```typescript
export const ConditionOperator = z.enum(['==', '!=', '>=', '<=', '>', '<', 'in', 'not_in']);

export const ApprovalStepTemplate = z.object({
  order: z.number().int().positive(),
  approverRole: Role,
  deptScope: z.enum(['own_team', 'parent', 'all', 'specific']),
  specificEmployeeId: z.string().uuid().optional(),
});

export const ConditionRule = z.object({
  field: z.string(),       // e.g. 'leave_days', 'department_id', 'employment_type'
  op: ConditionOperator,
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
  line: z.array(ApprovalStepTemplate),
});

export const ApprovalLineSchema = TenantScoped.extend({
  name: z.string(),
  requestType: ApprovalRequestType,
  conditions: z.array(ConditionRule).default([]),
  defaultLine: z.array(ApprovalStepTemplate),
  isActive: z.boolean(),
});
```

### Approval (polymorphic)
```typescript
export const ApprovalSchema = TenantScoped.extend({
  requesterId: z.string().uuid(),
  requestType: ApprovalRequestType,
  requestObjectId: z.string().uuid(),
  title: z.string(),
  status: ApprovalStatus,
  currentStep: z.number().int(),
  totalSteps: z.number().int(),
  slaDeadline: z.string().datetime().nullable(),
  requestedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});

export const ApprovalStepSchema = TenantScoped.extend({
  approvalId: z.string().uuid(),
  stepOrder: z.number().int(),
  approverId: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected', 'skipped', 'delegated']),
  comment: z.string().nullable(),
  processedAt: z.string().datetime().nullable(),
});
```

### Notification
```typescript
export const NotificationSchema = TenantScoped.extend({
  userId: z.string().uuid(),
  type: z.enum(['approval', 'document', 'system', 'announcement']),
  title: z.string(),
  message: z.string(),
  linkUrl: z.string().nullable(),
  metadata: z.record(z.unknown()).default({}),
  readStatus: z.boolean().default(false),
  readAt: z.string().datetime().nullable(),
});
```

### LegalDocument (KI-030 batch-003)
```typescript
export const LegalDocumentTypeEnum = z.enum(['terms', 'privacy']);
export const SemverSchema = z.string().regex(/^\d+\.\d+\.\d+$/, 'must be semver (e.g. 2.0.0)');

export const LegalDocumentSchema = z.object({
  id: z.string().uuid(),
  type: LegalDocumentTypeEnum,
  version: SemverSchema,
  effectiveDate: z.string().date(),
  title: z.string().min(1).max(200),
  contentMd: z.string().min(1),
  summaryMd: z.string().nullable(),
  isActive: z.boolean(),
  publishedBy: z.string().uuid(),
  publishedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PublishLegalDocumentInput = LegalDocumentSchema.pick({
  type: true,
  version: true,
  effectiveDate: true,
  title: true,
  contentMd: true,
  summaryMd: true,
}).extend({
  activateImmediately: z.boolean().default(true),
});
```

### UserConsent (KI-030 batch-003)
```typescript
export const ConsentSourceEnum = z.enum(['activate', 'forced', 'footer']);

export const UserConsentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().nullable(),  // operator user는 null
  userId: z.string().uuid(),
  documentId: z.string().uuid(),
  documentType: LegalDocumentTypeEnum,
  version: SemverSchema,
  consentedAt: z.string().datetime(),
  ipAddress: z.string().ip(),
  userAgent: z.string().max(500),
  source: ConsentSourceEnum,
});

export const RecordConsentInput = z.object({
  documentId: z.string().uuid(),
  version: SemverSchema,
  source: ConsentSourceEnum.default('footer'),
});

export const RequiredConsentsResponse = z.object({
  required: z.array(LegalDocumentSchema.pick({
    id: true, type: true, version: true, effectiveDate: true, title: true, summaryMd: true,
  })),
});
```

### Notification (헤더 미니, CM-17 — 기존 NotificationSchema 재사용)

`GET /api/v1/me/notifications?limit=10` 응답:
```typescript
export const NotificationListResponse = SuccessEnvelope(z.object({
  items: z.array(NotificationSchema),
  unreadCount: z.number().int().nonnegative(),
}));
```

## 6. Realtime 이벤트 스키마

```typescript
export const RealtimeEvent = <T extends z.ZodTypeAny>(payloadSchema: T) =>
  z.object({
    type: z.enum(['INSERT', 'UPDATE', 'DELETE']),
    table: z.string(),
    schema: z.string(),
    commit_timestamp: z.string().datetime(),
    record: payloadSchema,
    old_record: payloadSchema.optional(),
  });
```

## 7. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — Envelope + 페이지네이션 + 핵심 엔티티 8 + Approval polymorphic + ConditionRule (KI-019 해소) + Location jsonb (KI-018 해소) | Phase 4 진입 |
| 2026-05-15 | LegalDocument / UserConsent zod + NotificationListResponse | KI-030 batch-003 |
