# Operator API (OP-01~11)

> 도메인 프리픽스: `/api/v1/operator/`. 인증: JWT `role IN (operator_super, operator_staff)`.
> SSOT: matrix.json `screens_to_entities_map.OP-*` + Phase 3 ERD.

## OP-01 운영사 대시보드

| 메서드 | 경로 | 권한 | 응답 |
|--------|------|------|------|
| GET | `/dashboard/kpis?period=today|week|month|quarter` | operator_* | 7 KPI 객체 |
| GET | `/dashboard/charts/mrr?months=12` | operator_* | 월별 매출 시계열 |
| GET | `/dashboard/charts/tenants?months=6` | operator_* | 신규/해지 시계열 |
| GET | `/dashboard/charts/plans` | operator_* | 플랜별 분포 |
| GET | `/dashboard/charts/tickets?period=30d` | operator_* | 티켓 유형 분포 |
| GET | `/dashboard/recent/tenants?limit=10` | operator_* | 최근 가입 테넌트 |
| GET | `/dashboard/recent/tickets?limit=10` | operator_* | 최근 티켓 (SLA 임박 우선) |
| GET | `/dashboard/recent/events?limit=10` | operator_* | 최근 시스템 이벤트 (audit_logs 필터) |
| POST | `/dashboard/export` | operator_super (E) | PDF/Excel 비동기 작업 (202 + jobId) |

## OP-02 테넌트 관리

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/tenants?page&pageSize&sort&filter[status]&filter[plan]&filter[overdue]&q` | operator_* |
| POST | `/tenants/export` | operator_* (E) — Excel |
| PATCH | `/tenants/:id` | operator_super (U) — 기본 정보 |
| POST | `/tenants/:id/change-status` | operator_super | body: `{status, reason}` |
| POST | `/tenants/:id/change-plan` | operator_super | body: `{planId, effectiveFrom}` |
| POST | `/tenants/:id/change-admin` | operator_* | body: `{newAdminEmail}` → 초대 |

## OP-03 테넌트 상세

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/tenants/:id` | operator_* | 헤더 카드 데이터 |
| GET | `/tenants/:id/usage?period=12months` | operator_* | 월별 사용량 차트 |
| GET | `/tenants/:id/feature-flags` | operator_* | 본 테넌트 + 글로벌 머지 |
| PATCH | `/tenants/:id/feature-flags/:flagKey` | operator_super | 예외 토글 |
| GET | `/tenants/:id/audit-logs?from&to&event` | operator_* | 본 테넌트 감사 로그 |
| GET | `/tenants/:id/tickets?status` | operator_* | 본 테넌트 티켓 |
| POST | `/tenants/:id/deactivate` | operator_super | body: `{reason}` + Realtime broadcast → 세션 종료 |

## OP-04 신규 테넌트 등록

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/plans` | operator_* | 선택 가능한 플랜 |
| POST | `/tenants/check-domain` | operator_* | body: `{slug}` → 중복/예약어/형식 검증 |
| POST | `/tenants/check-business-number` | operator_* | body: `{businessNumber}` |
| POST | `/tenants/drafts` | operator_* | 임시저장 (upsert) |
| GET | `/tenants/drafts/:draftId` | operator_* (own) |
| DELETE | `/tenants/drafts/:draftId` | operator_* (own) |
| PATCH | `/tenants/drafts/:draftId` | operator_* (own) — 단계 갱신 |
| POST | `/tenants` | operator_* | 7단계 최종 트랜잭션 + 초대 발송 (`Idempotency-Key` 필수) |
| POST | `/tenants/:id/send-invite` | operator_* | 초대 실패 시 재발송 |

### POST /tenants — 트랜잭션 본체
```typescript
{
  // 1. 회사정보
  name, businessNumber, representativeName, industry, address, phone, logoUrl?,
  // 2. 도메인
  slug,
  // 3. 요금제
  planId, contractStartDate, contractEndDate, userLimit, billingCycle,
  // 4. 관리자 계정
  adminEmail, adminName, adminPhone,
  additionalAdmins?: [{email, name}], // 최대 3명
  // 5. 모듈
  enabledModules: ['attendance', 'leave', 'approval', 'payroll', 'documents', 'integrations'],
  // 6. 초기 데이터
  departments: [{name, code, parentSlug?}],
  workPolicy: {standardClockIn, standardClockOut, lateThreshold, ...},
  leaveTypes: [{key, labelKo, defaultDays, ...}],
  approvalLines: [...],
  documentTemplates: [...]
}
```

**응답**: 201 + Location: `/operator/tenants/:newId` + 초대 발송 상태.

## OP-05 구독/요금제 관리

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/plans?filter[status]` | operator_* |
| POST | `/plans` | operator_super | body: 플랜 |
| GET | `/plans/:id` | operator_* |
| PATCH | `/plans/:id` | operator_super |
| DELETE | `/plans/:id` | operator_super | soft delete |
| POST | `/plans/:id/clone` | operator_super |
| GET | `/plans/:id/usage` | operator_* | 사용 테넌트 + 직원 합계 |

## OP-06 청구/정산

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/invoices?page&filter[status]&filter[periodMonth]&filter[tenantId]` | operator_* |
| GET | `/invoices/kpis` | operator_* | 5 KPI |
| POST | `/invoices/batch-issue` | operator_super | cron 또는 수동 트리거 (`Idempotency-Key`) |
| POST | `/invoices/:id/issue` | operator_* | 개별 재발행 |
| POST | `/invoices/:id/mark-paid` | operator_* | body: `{paidAt, paymentMethod}` |
| POST | `/invoices/:id/refund` | operator_super | body: `{refundAmount, reason}` |
| GET | `/invoices/:id/pdf` | operator_* | Signed URL |
| POST | `/invoices/export` | operator_* | Excel (비동기 202) |

## OP-07 기능 플래그

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/feature-flags?filter[module]&filter[state]` | operator_* |
| POST | `/feature-flags` | operator_super |
| PATCH | `/feature-flags/:key` | operator_* (U state/plans) |
| DELETE | `/feature-flags/:key` | operator_super | 사용 중이면 차단 |
| GET | `/feature-flags/:key/history` | operator_* | audit_logs 필터 |
| POST | `/feature-flags/:key/overrides` | operator_* | body: `{tenantId, value, reason}` |
| DELETE | `/feature-flags/:key/overrides/:tenantId` | operator_* |
| GET | `/feature-flags/:key/overrides` | operator_* | 본 플래그의 모든 예외 |

(클라이언트 평가는 `/api/v1/feature-flags` — auth 도메인 외부)

## OP-08 지원 티켓 (사용자 + 운영사 양방향)

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/tickets?role=operator&filter[status]&filter[priority]&filter[assignee]` | operator_* | 전체 |
| POST | `/tickets` | 모든 로그인 사용자 (자기 테넌트) | 사용자 신규 작성 — 본 라우트는 `/api/v1/tickets` (도메인 무관) |
| GET | `/tickets/:id` | RLS | 운영사 전체, 사용자는 자기 권한 범위 |
| PATCH | `/tickets/:id` | operator_* (assign/status/priority) |
| POST | `/tickets/:id/messages` | RLS | body: `{body, isInternal?, attachmentIds[]}` |
| POST | `/tickets/:id/close` | operator_* |
| POST | `/tickets/batch-assign` | operator_super | body: `{ticketIds[], assigneeId}` |

## OP-09 감사 로그

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/audit-logs?from&to&tenantId&event&userId&result&page` | operator_* |
| GET | `/audit-logs/:id` | operator_* | 상세 (before/after diff) |
| POST | `/audit-logs/export` | operator_super | CSV 비동기 (큰 경우 이메일 발송) |

## OP-10 운영 리포트 (MVP 단순화)

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/reports/kpis?from&to` | operator_* | 6 KPI |
| GET | `/reports/charts/revenue?from&to&compare` | operator_* |
| GET | `/reports/charts/tenants?from&to` | operator_* |
| GET | `/reports/charts/plans?at` | operator_* |
| GET | `/reports/charts/feature-usage?from&to&top=10` | operator_* |
| POST | `/reports/export/pdf` | operator_* |
| POST | `/reports/export/excel` | operator_* |

## OP-11 시스템 설정

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/system-settings` | operator_super (전체), operator_staff (partial) |
| PATCH | `/system-settings` | operator_super | 탭별 patch (jsonb merge) |
| POST | `/system-settings/test-email` | operator_super |
| POST | `/system-settings/test-kakao` | operator_super |
| POST | `/system-settings/backup` | operator_super | 수동 트리거 → BackupJob INSERT |
| GET | `/backup-jobs?from&to` | operator_* |
| GET | `/maintenance` | 모든 사용자 (공개) | 현재 상태 |
| POST | `/maintenance/toggle` | operator_super | body: `{message}` 즉시 ON, body 없으면 OFF |
| POST | `/maintenance/schedule` | operator_super | body: `{startAt, endAt?, message}` |
| GET | `/users` | operator_super | 운영자 목록 |
| POST | `/users/invite` | operator_super | body: `{email, role}` |
| DELETE | `/users/:id` | operator_super |
| GET | `/api-keys` | operator_super | owner_type='operator' 자동 |
| POST | `/api-keys` | operator_super | body: `{label, scopes, expiresInDays, reason}` |
| DELETE | `/api-keys/:id` | operator_super |
| POST | `/api-keys/:id/rotate` | operator_super |

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 11 화면 × 약 75 엔드포인트 | Phase 4 진입 |
