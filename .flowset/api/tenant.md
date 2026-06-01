# Tenant Admin API (TA-01~14)

> 도메인 프리픽스: `/api/v1/tenant/`. 인증: JWT `tenant_id != null AND role IN (tenant_super|tenant_hr_admin|tenant_manager)`.
> RLS: 자기 테넌트만. 매니저는 자기 팀 추가 제약.

## TA-01 관리자 대시보드

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/dashboard/kpis` | tenant_super/hr_admin (전체), manager (own_team) |
| GET | `/dashboard/charts/attendance-rate?months=6` | RLS 일치 |
| GET | `/dashboard/charts/leave-usage?period=12months&top=10` | RLS |
| GET | `/dashboard/charts/department-headcount` | RLS |
| GET | `/dashboard/charts/request-trends?period=30d` | RLS |
| GET | `/dashboard/recent/requests?limit=10` | RLS |
| GET | `/dashboard/pending/approvals?limit=10` | RLS — 본인이 처리할 결재 |
| GET | `/dashboard/today/abnormal-attendance` | RLS — 지각/결근/누락 직원 |

## TA-02 직원 관리

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/employees?page&sort&filter[department]&filter[employmentType]&filter[status]&q` | RLS |
| POST | `/employees` | super/hr_admin |
| POST | `/employees/bulk` | super/hr_admin | Excel parsed |
| GET | `/employees/bulk-template` | super/hr_admin | Excel 양식 |
| POST | `/employees/export` | RLS |
| PATCH | `/employees/:id` | super/hr_admin (정보 수정), employee (self 일부) |
| POST | `/employees/:id/change-status` | super | body: `{status, reason}` |
| POST | `/employees/:id/send-invite` | super/hr_admin |
| POST | `/employees/:id/leave-of-absence` | super | body: `{startDate, expectedReturnDate}` |
| POST | `/employees/:id/resign` | super | body: `{resignedAt, reason, finalSettlement}` |
| POST | `/employees/:id/documents` | super/hr_admin | 문서 업로드 |
| GET | `/employees/:id/audit-logs` | super | 변경 이력 |
| PATCH | `/employees/:id/role` | super | body: `{role}` |

## TA-03 직원 상세 (8탭)

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/employees/:id` | RLS | 헤더 + 기본정보 탭 |
| GET | `/employees/:id/personnel` | super/hr_admin | 인사정보 탭 |
| GET | `/employees/:id/contracts` | super (연봉), hr_admin (계약), self (read-only 일부) |
| GET | `/employees/:id/attendances?from&to` | RLS |
| GET | `/employees/:id/leaves?status&from&to` | RLS |
| GET | `/employees/:id/payslips?year` | super/hr_admin / self |
| GET | `/employees/:id/documents?type` | RLS |
| GET | `/employees/:id/approvals?role=requester|approver` | RLS |
| GET | `/employees/:id/change-requests` | super/hr_admin / self |
| POST | `/employees/:id/change-requests/:reqId/approve` | super/hr_admin | body: `{comment?}` |
| POST | `/employees/:id/change-requests/:reqId/reject` | super/hr_admin | body: `{reason}` |

## TA-04 조직도

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/departments?format=tree` | 모든 테넌트 사용자 (RLS) |
| GET | `/departments/:id` | RLS |
| POST | `/departments` | super/hr_admin |
| PATCH | `/departments/:id` | super/hr_admin |
| DELETE | `/departments/:id` | super | 자식·직원 0건 검증 |
| POST | `/departments/:id/move` | super | body: `{newParentId}` |
| POST | `/departments/:id/assign-head` | super/hr_admin | body: `{employeeId}` |
| POST | `/departments/:id/members/move` | super/hr_admin | body: `{employeeIds[], toDepartmentId}` |
| GET | `/departments/export?format=pdf|png` | super/hr_admin |

## TA-05 근태 관리

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/attendances?from&to&filter[department]&filter[employee]&filter[status]&filter[workType]&page` | RLS (매니저=team) |
| GET | `/attendances/kpis?date` | RLS |
| POST | `/attendances` | super/hr_admin | 수동 등록, body: `{employeeId, workDate, clockInAt, clockOutAt, status, reason}` |
| PATCH | `/attendances/:id` | super/hr_admin | body: `{clockInAt?, clockOutAt?, breakMinutes?, status?, reason}` |
| GET | `/attendances/:id/detail` | RLS | 위치/디바이스/수정이력 |
| POST | `/attendances/export?from&to` | RLS | Excel 비동기 |

## TA-06 근태 수정 요청

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/attendance-modifications?filter[status]&filter[type]&filter[department]&from&to` | RLS |
| GET | `/attendance-modifications/:id` | RLS |
| POST | `/attendance-modifications/:id/approve` | manager (own_team) / super / hr_admin |
| POST | `/attendance-modifications/:id/reject` | 동일 | body: `{reason}` |
| POST | `/attendance-modifications/:id/comment` | 결재자 / 요청자 | body: `{body}` |

(생성은 `/api/v1/me/attendance-modifications` — employee 도메인)

## TA-07 휴가 관리

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/leaves?from&to&filter[department]&filter[status]&filter[type]&page` | RLS |
| GET | `/leaves/calendar?from&to&filter[department]` | RLS |
| GET | `/leaves/balances?filter[department]&filter[type]&year` | RLS |
| GET | `/leaves/kpis?date` | RLS |
| POST | `/leaves/balances/grant` | super/hr_admin | body: `{employeeIds[]|all, leaveTypeId, days, reason}` |
| PATCH | `/leaves/balances/:id` | super/hr_admin | body: `{remaining, reason}` 차감/조정 |
| POST | `/leaves/export?from&to` | RLS | Excel |

## TA-08 휴가 신청 상세/승인

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/leaves/:id` | RLS | 카드 5개 종합 |
| POST | `/leaves/:id/approve` | 현재 단계 결재자 | (Idempotency-Key) |
| POST | `/leaves/:id/reject` | 동일 | body: `{reason}` |
| POST | `/leaves/:id/comment` | 결재자/요청자 |
| POST | `/leaves/:id/cancel` | 요청자 (pending/in_progress) 또는 super (after-approval, body: `{reason}`) |

## TA-09 결재 통합 인박스

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/approvals/inbox?filter[type]&filter[status]&page` | RLS — 내가 결재할 것 |
| GET | `/approvals/sent?filter[type]&filter[status]&page` | RLS — 내가 제출한 것 |
| GET | `/approvals/delegated?` | v1.1 — 위임받은 |
| GET | `/approvals/:id` | RLS — 유형별 detail 위임 (leave/attendance_mod/...) |
| POST | `/approvals/:id/approve` | 현재 단계 결재자 |
| POST | `/approvals/:id/reject` | 동일 | body: `{reason}` |
| POST | `/approvals/:id/comment` | RLS |
| POST | `/approvals/:id/cancel` | 요청자 | body: `{reason?}` |
| POST | `/approvals/batch-approve` | 같은 유형 결재자 | body: `{approvalIds[]}` (`Idempotency-Key`) |
| POST | `/approvals/:id/delegate` | v1.1 | body: `{toEmployeeId, untilDate}` |

## TA-10 급여/문서 관리

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/documents?type=payslip|contract|certificate|personal|company&page` | RLS |
| POST | `/documents` | super/hr_admin | 단건 업로드 |
| POST | `/documents/bulk-payroll` | super/hr_admin | Excel 일괄 |
| POST | `/documents/:id/preview` | RLS | PDF 미리보기 |
| GET | `/documents/:id/download` | RLS | Signed URL 15분 |
| POST | `/documents/:id/send` | super/hr_admin |
| POST | `/documents/bulk-send` | super/hr_admin | body: `{documentIds[]}` |
| POST | `/documents/:id/resend` | super/hr_admin | 미열람자 |
| DELETE | `/documents/:id` | super | body: `{reason}` soft delete |
| PATCH | `/documents/:id/visibility` | super/hr_admin |

## TA-11 문서함/전자계약

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/contracts?filter[status]&page` | RLS |
| POST | `/contracts` | super/hr_admin | body: `{templateId, variables, employeeId}` |
| GET | `/contracts/:id` | RLS |
| GET | `/contracts/:id/preview` | RLS | PDF |
| GET | `/contracts/:id/download` | RLS |
| POST | `/contracts/:id/send` | super/hr_admin |
| POST | `/contracts/:id/request-sign` | v1.2 | 전자서명 인증사업자 호출 |
| POST | `/contracts/:id/sign` | v1.2 (직원) |

## TA-12 리포트

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/reports/headcount?from&to&filter[department]` | RLS (매니저=team) |
| GET | `/reports/attendance?from&to&filter[department]` | RLS |
| GET | `/reports/leaves?from&to&filter[type]&filter[department]` | RLS |
| GET | `/reports/overtime?from&to&filter[department]&threshold=52` | RLS |
| GET | `/reports/department-comparison?from&to` | super/hr_admin (모든 부서) |
| POST | `/reports/export/pdf?type` | RLS |
| POST | `/reports/export/excel?type` | RLS |

## TA-13 회사 설정

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/settings` | super (전체), hr_admin (회사정보/근무/휴가/문서양식만), manager (조회), employee (public 일부) |
| PATCH | `/settings/{tab}` | super (모든 탭), hr_admin (일부 탭) | tab: company/work_policy/leave_policy/approval_lines/roles/notifications/document_templates/security/audit_logs |
| GET | `/work-policies` | RLS |
| POST | `/work-policies` | super/hr_admin |
| PATCH | `/work-policies/:id` | super/hr_admin |
| GET | `/leave-types` | 모든 테넌트 사용자 |
| POST | `/leave-types` | super/hr_admin |
| PATCH | `/leave-types/:id` | super/hr_admin |
| GET | `/approval-lines?type` | 모든 테넌트 사용자 |
| POST | `/approval-lines` | super/hr_admin |
| PATCH | `/approval-lines/:id` | super/hr_admin |
| GET | `/document-templates?type` | super/hr_admin |
| POST | `/document-templates` | super/hr_admin | body: `{key, labelKo, templateBody, variables[], format}` |
| GET | `/audit-logs?from&to&event&userId&result&page` | super (전체), hr_admin (일부) |

> **구현 노트 (WI-032, 2026-06-01)**: 위 REST 경로는 도메인 계약. 실제 구현은 기존 패턴대로 **Next.js Server Action + `apps/web/lib/tenant-settings/{queries,actions}`** (REST route handler 미신설, `app/api/` 부재). `getTenantSettings()`가 9탭 envelope(탭별 permission/implemented/data/pending) 반환, `patchTenantSetting()`가 P0 4탭(company/work_policy/leave_policy/approval_lines)만 변경 — `scheduled_setting_changes` 큐에 적재(INSERT RLS 가 P0 4 target 으로 제한, mig 41) 후 즉시(apply_at≤now: `apply_one_scheduled_setting_change` service_role RPC) 또는 예약(pg_cron `run_due_scheduled_setting_changes` 매분, mig 40). roles/notifications/document_templates/security PATCH 와 audit_logs 페이지네이션은 후속 WI. `leave_policy.grant_basis`는 tenant_settings 전용 컬럼 부재로 본 WI 제외(leave_types 만 처리, KI-112).
>
> **권한 매트릭스 (구현 — 와이어프레임 TA-13 §1/§6 + RLS 정합, 최소권한)**: 위 표의 GET `hr_admin (회사정보/근무/휴가/문서양식만)` 표기는 본 구현에서 다음으로 구체화한다 — **편집(PATCH)**: super/hr_admin × P0 4탭. **조회(GET)**: super 전탭 / hr_admin 은 `security`·`roles` 제외(audit_logs 포함 — RLS `audit_logs_read=is_tenant_admin` + 본 표 `/audit-logs hr_admin 일부` 정합) / manager 는 `security`·`roles`·`audit_logs` 제외. 와이어프레임 §2 state4 의 hr_admin 보안 read-only 진입은 민감 정책 raw 노출 회피로 본 WI 미적용(KI-113, WI-033/사용자 재확인).

## TA-14 외부 연동

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/integrations` | super (credentials), hr_admin (status만) |
| POST | `/integrations/:type/connect` | super | body: `{credentials, config}` |
| POST | `/integrations/:type/disconnect` | super |
| POST | `/integrations/:type/test` | super | 테스트 발송 |
| GET | `/integrations/:type/logs?from&to&page` | super |
| GET | `/api-keys` | super (credentials masked) | owner_type='tenant', tenant_id 자동 |
| POST | `/api-keys` | super | body: `{label, scopes[], expiresInDays, reason}` 응답: 한 번만 평문 |
| DELETE | `/api-keys/:id` | super |
| POST | `/api-keys/:id/rotate` | super |

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 14 화면 × 약 130 엔드포인트 | Phase 4 진입 |
| 2026-06-01 | TA-13 구현 노트 추가 (WI-032 — Server Action + scheduled_setting_changes 큐 + pg_cron apply 엔진) | Sprint 2 회사설정 API 착수 |
