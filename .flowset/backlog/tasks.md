# Task WBS

> Story → Task 분해. 유형: **FE** (프론트엔드) / **BE** (백엔드/Edge Function) / **DB** (마이그레이션/RLS) / **QA** (테스트) / **DEVOPS** (인프라/CI).
> Task ID: `TS-NNN-{Story}-{유형}-{seq}`.
> 작성 정책: 12 Epic + ST-073~080 (KI-027~030 batch-003 보강) **완전 분해** (KI-013 closure 2026-05-19).

---

## EP-01 인프라 / 인증 / 권한 베이스

### ST-001 (이메일/비밀번호 로그인)
- **TS-001-001-DB-1**: Supabase 프로젝트 생성 + `auth.users` 확장 컬럼 (employee_id, tenant_id_claim) 마이그레이션 — 4h
- **TS-002-001-BE-1**: `/api/v1/auth/login` Route Handler + Supabase Auth signIn wrapping — 3h
- **TS-003-001-FE-1**: `/login` 페이지 (React Hook Form + zod) + 5회 실패 잠금 UI — 4h
- **TS-004-001-FE-2**: 로그인 성공 시 역할별 리다이렉트 (operator → /operator, tenant_super → /tenant, employee → /me) — 2h
- **TS-005-001-QA-1**: E2E 시나리오 — 정상 로그인 + 5회 실패 잠금 + 권한별 리다이렉트 — 3h
- **TS-006-001-DEVOPS-1**: Vercel 프로젝트 연결 + 환경변수 분리 (preview/staging/production) — 3h

### ST-002 (비밀번호 찾기)
- **TS-007-002-BE-1**: `/api/v1/auth/forgot-password` + `/api/v1/auth/reset-password` + 토큰 60분 만료 — 3h
- **TS-008-002-FE-1**: `/forgot-password` + `/reset-password?token=` 페이지 — 3h
- **TS-009-002-QA-1**: E2E — 정상 흐름 + 만료 토큰 + 등록되지 않은 이메일 케이스 — 2h

### ST-003 (최초 계정 활성화)
- **TS-010-003-BE-1**: `/api/v1/auth/activate` + 7일 만료 토큰 + 1회 사용 검증 — 3h
- **TS-011-003-FE-1**: `/activate?token=` 페이지 (비밀번호 + 약관 + 2FA 옵션) — 4h
- **TS-012-003-QA-1**: E2E — 정상 활성화 + 만료 + 재발송 — 2h

### ST-004 (2FA)
- **TS-013-004-DB-1**: `users.totp_secret`, `users.totp_enabled`, `users.recovery_codes` 컬럼 추가 + RLS — 2h
- **TS-014-004-BE-1**: `/api/v1/me/security/2fa/enable|verify|disable` + speakeasy TOTP 라이브러리 — 4h
- **TS-015-004-FE-1**: 2FA 활성화 모달 (QR + 코드 입력) + 복구 코드 표시 — 4h
- **TS-016-004-FE-2**: 로그인 시 2FA 단계 화면 + 운영사 강제 인터셉터 — 3h
- **TS-017-004-QA-1**: E2E — 활성화 + 로그인 + 복구 코드 + 운영사 강제 — 4h

### ST-005 (멀티테넌트 RLS 골격)
- **TS-018-005-DB-1**: Postgres extension (pgcrypto, uuid-ossp) + RLS helper functions — 2h
- **TS-019-005-DB-2**: 모든 도메인 테이블에 `tenant_id uuid NOT NULL REFERENCES tenants(id)` 컬럼 추가 + RLS enable + 정책 — 8h
- **TS-020-005-DB-3**: 운영사 우회 정책 (`role IN (operator_super, operator_staff)`) 정책 — 3h
- **TS-021-005-QA-1**: 권한 매트릭스 자동 테스트 (음성/양성 케이스 — 6 역할 × 44 화면 핵심 엔드포인트) — 8h

**EP-01 Task 합계**: 21 Task / ≈ 75 MD

---

## EP-02 운영사 테넌트 라이프사이클

### ST-006 (7단계 마법사)
- **TS-022-006-DB-1**: `tenants`, `tenant_drafts`, `subscriptions`, `tenant_settings` 마이그레이션 + 인덱스 — 4h
- **TS-023-006-BE-1**: 7단계 검증 API (`check-domain`, `check-business-number`) + 임시저장 (`drafts` upsert) — 6h
- **TS-024-006-BE-2**: 최종 등록 트랜잭션 API (`POST /api/v1/operator/tenants`) — tenants/subscriptions/tenant_settings/users 동시 INSERT — 8h
- **TS-025-006-BE-3**: 관리자 초대 메일 (Supabase Auth admin invite) + 실패 재시도 — 3h
- **TS-026-006-FE-1**: 7단계 stepper UI (좌측 navigation + 단계별 폼) — 8h
- **TS-027-006-FE-2**: 검증 실시간 표시 + 임시저장/재진입 — 4h
- **TS-028-006-FE-3**: 6단계 초기 데이터 입력 (부서/근무/휴가/결재라인/문서양식) — 6h
- **TS-029-006-QA-1**: E2E — 정상 완료 + 중복 검증 + 임시저장 + 부분 실패 — 5h

### ST-007 (테넌트 목록)
- **TS-030-007-BE-1**: `GET /api/v1/operator/tenants` + 검색·필터·페이지네이션·sort — 4h
- **TS-031-007-FE-1**: 테이블 + 필터 사이드 패널 + 검색바 + 페이지네이션 — 6h
- **TS-032-007-BE-2**: Excel 내보내기 (SheetJS, 현재 필터 결과) — 3h
- **TS-033-007-QA-1**: E2E — 검색·필터·sort·내보내기 — 3h

### ST-008 (테넌트 상세)
- **TS-034-008-BE-1**: `GET /api/v1/operator/tenants/:id` (8탭 데이터 종합) — 4h
- **TS-035-008-FE-1**: 헤더 카드 + 8탭 컴포넌트 + URL 동기화 — 8h
- **TS-036-008-BE-2**: `POST /api/v1/operator/tenants/:id/deactivate` + 활성 세션 종료 (Realtime broadcast) — 4h
- **TS-037-008-QA-1**: E2E — 8탭 전환 + 비활성화 → 세션 종료 — 4h

### ST-009 (상태 변경) + ST-010 (관리자 초대 활성화)
- **TS-038-009-BE-1**: 상태 변경 사유 + audit_logs (이미 EP-05 인프라에서) — 2h
- **TS-039-009-FE-1**: 행 액션 모달 (상태/플랜/관리자 변경) — 4h
- **TS-040-010-FE-1**: 초대 활성화 흐름 (CM-03 재사용) — 1h

**EP-02 Task 합계**: 19 Task / ≈ 70 MD

---

## EP-06 테넌트 직원 / 조직 관리

### ST-024~027 (직원 마스터)
- **TS-041-024-DB-1**: `employees`, `users`, `roles`, `employee_change_requests` 마이그레이션 + RLS — 4h
- **TS-042-024-BE-1**: `POST /api/v1/tenant/employees` 단건 등록 + 초대 메일 — 3h
- **TS-043-025-BE-2**: `POST /api/v1/tenant/employees/bulk` 일괄 업로드 (검증 + 부분 INSERT + 실패 행 반환) — 6h
- **TS-044-024-FE-1**: 직원 등록 모달 (단건) + 일괄 업로드 모달 — 6h
- **TS-045-024-FE-2**: 테이블 + 필터 + 검색 + 페이지네이션 — 5h
- **TS-046-026-FE-3**: 직원 상세 9탭 컴포넌트 — 10h
- **TS-047-027-BE-2**: 휴직/퇴사 처리 API + 활성 세션 종료 + 잔여연차 정산 — 4h
- **TS-048-030-BE-3**: `POST /api/v1/me/profile/change-requests` + 2FA 재인증 검증 — 4h
- **TS-049-024-QA-1**: 권한 매트릭스 테스트 — manager 자기 팀만 + 음성 케이스 — 4h

### ST-028~029 (조직도)
- **TS-050-028-DB-2**: `departments` self-ref 마이그레이션 + 경로 캐시 컬럼 (선택) — 2h
- **TS-051-028-BE-2**: 조직도 트리 API + parent 이동 (자식 경로 재계산) — 4h
- **TS-052-028-FE-2**: 3분할 레이아웃 + 트리 드래그앤드롭 + 부서 상세 + 구성원 테이블 — 8h
- **TS-053-029-BE-3**: 구성원 다중 이동 트랜잭션 — 2h

### ST-071 (TA-01 관리자 대시보드)
- **TS-221-071-BE-1**: `GET /api/v1/tenant/dashboard/{kpis,charts/*,recent/*,pending/approvals,today/abnormal-attendance}` — 6 KPI + 4 차트 + 최근 요청/결재/이상자 3섹션 집계 (Employee/Attendance/Leave/Approval/Notification 종합, manager는 자기 팀만 RLS) — 5h
- **TS-222-071-FE-1**: TA-01 페이지 (KPI 6 + 차트 4 + 최근 요청·결재·이상자 3섹션 + PWA 모바일 KPI 카드 + 결재 직행) — 5h
- **TS-223-071-QA-1**: E2E — 6 KPI 2초 렌더 + manager 자기 팀만 집계 + employee → EM-01 리다이렉트 + PWA 모바일 결재 직행 + audit — 3h

**EP-06 Task 합계**: 16 Task / ≈ 70 MD

---

## EP-07 테넌트 근태 관리

### ST-031 (출퇴근 GPS)
> **PWA 핵심 — 가장 중요한 Task 클러스터**

- **TS-054-031-DB-1**: `attendances`, `attendance_modifications`, `work_policies` 마이그레이션 + 인덱스 `(tenant_id, employee_id, work_date)` — 4h
- **TS-055-031-BE-1**: `POST /api/v1/me/attendance/clock-in|out|break/start|end` + GPS 좌표 검증 + work_policy 자동 status 결정 — 6h
- **TS-056-031-FE-1**: EM-02 페이지 + 큰 액션 버튼 상태 머신 + GPS 권한 요청 — 6h
- **TS-057-031-FE-2**: PWA Service Worker + IndexedDB 큐 (오프라인 출퇴근) + 복귀 동기화 — 8h
- **TS-058-031-FE-3**: PWA manifest.json + install prompt 모달 — 3h
- **TS-059-031-QA-1**: E2E — 정상/지각/오프라인/위치 거부 케이스 — 6h
- **TS-060-031-QA-2**: Lighthouse PWA 점수 ≥ 90 검증 — 2h

### ST-032~033 (회사 근태 모니터링)
- **TS-061-032-BE-2**: `GET /api/v1/tenant/attendances` 필터·페이지네이션 + KPI API — 3h
- **TS-062-032-FE-2**: TA-05 페이지 + 필터 + KPI 카드 + 9컬럼 테이블 — 5h
- **TS-063-033-BE-3**: 수동 등록/수정 API (사유 필수) + audit_logs — 3h

### ST-034 (수정 요청 흐름) + ST-035~036 (자동 처리)
- **TS-064-034-BE-3**: 수정 요청 API + 결재 흐름 시작 (Approval/ApprovalStep 자동 생성) — 4h
- **TS-065-034-FE-3**: EM-02 수정 요청 모달 + TA-06 결재 페이지 — 6h
- **TS-066-035-BE-4**: 23:59 cron (Supabase Edge Function) — 누락 자동 처리 + 알림 — 3h
- **TS-067-036-BE-5**: status 자동 분류 (트리거 또는 INSERT hook) — 2h

**EP-07 Task 합계**: 14 Task / ≈ 61 MD

---

## EP-08 테넌트 휴가 / 결재 (가장 무거운 Epic)

### ST-037~038 (휴가 신청·현황)
- **TS-068-037-DB-1**: `leaves`, `leave_balances`, `leave_types`, `approvals`, `approval_steps`, `approval_lines` 마이그레이션 — 6h
- **TS-069-037-BE-1**: `POST /api/v1/me/leaves` 신청 + 잔여 검증 + 결재라인 자동 결정 — 6h
- **TS-070-037-BE-2**: 사용일수 계산 (주말/공휴일 제외, 반차) — 3h
- **TS-071-037-FE-1**: EM-03 폼 + 자동 계산 표시 + 결재라인 미리보기 — 5h
- **TS-072-038-FE-2**: EM-04 페이지 (KPI + 차트 + 이력) — 4h

### ST-039~040 (TA-08 / TA-07)
- **TS-073-039-BE-3**: `POST /api/v1/tenant/leaves/:id/approve|reject` + 단계 진행 + 최종 승인 시 LeaveBalance.used 차감 (트랜잭션) — 5h
- **TS-074-039-FE-3**: TA-08 상세 페이지 + PWA sticky 액션 버튼 — 6h
- **TS-075-040-FE-4**: TA-07 캘린더 뷰 + 잔여 테이블 + 부여 모달 — 8h
- **TS-076-040-BE-4**: 휴가 부여 (단건/일괄) + 차감/조정 API — 3h

### ST-041~042 (결재 인박스)
- **TS-077-041-BE-5**: `GET /api/v1/tenant/approvals/inbox|sent` 통합 API + 일괄 승인 — 4h
- **TS-078-041-FE-5**: TA-09 인박스 + PWA 스와이프 액션 + 일괄 처리 — 8h
- **TS-079-042-FE-6**: EM-05 페이지 (5종 통합 조회 + 취소·재신청) — 4h

### ST-043~046 (자동·SLA·취소·조건분기)
- **TS-080-043-BE-6**: 자동 부여 cron (입사일/회계연도) + 만료 30/7일 전 알림 cron + 만료일 차감 cron — 5h
- **TS-081-044-BE-7**: SLA 임박 알림 cron (단계별 SLA 회사 설정) (KI-003) — 4h
- **TS-082-045-BE-8**: 취소 흐름 (즉시/사유) — 2h
- **TS-083-046-BE-9**: 결재라인 조건 분기 로직 (조건 트리 평가) — 4h

**EP-08 Task 합계**: 16 Task / ≈ 77 MD

---

## EP-03 운영사 수익 / 청구 / 플랜

### ST-011 (요금제 CRUD)
- **TS-084-011-DB-1**: `plans` / `subscriptions` 마이그레이션 + 인덱스 (cycle/status/version) — 4h
- **TS-085-011-BE-1**: `GET/POST/PATCH/DELETE /api/v1/operator/plans` + `POST /plans/:id/clone` + 사용 중 플랜 가격 변경 정책 (다음 청구일부터) — 4h
- **TS-086-011-FE-1**: OP-05 페이지 (요금제 목록 카드 + CRUD 모달 + 복제 + 비활성화) — 5h
- **TS-087-011-QA-1**: E2E — 생성/수정/복제/비활성화 + 가격 변경 적용 시점 — 3h

### ST-012 (청구 일괄 발행 cron)
- **TS-088-012-BE-1**: 매월 1일 00:00 Edge Function cron — 활성 테넌트 invoices INSERT (인원 × 인당요금 + 기본요금) + idempotency key + audit_logs — 6h
- **TS-089-012-QA-1**: cron E2E — 활성/정지 테넌트 분기 + 동일 month 재실행 idempotent — 3h

### ST-013 (청구 조회·미납 추적·결제완료)
- **TS-090-013-BE-1**: `GET /api/v1/operator/invoices` + KPI API + Excel export + `POST /invoices/:id/mark-paid|refund` (super만) — 5h
- **TS-091-013-FE-1**: OP-06 페이지 (KPI 5 + 11컬럼 테이블 + 필터 + 결제완료/환불 모달) — 6h
- **TS-092-013-QA-1**: E2E — 결제완료/환불 권한 + Excel 내보내기 + audit before/after — 3h

### ST-014 (미납 자동 전환)
- **TS-093-014-BE-1**: 일 1회 cron — `issued` 후 15일 경과 → `overdue` 전환 + 운영사 + 테넌트 관리자 알림 — 4h
- **TS-094-014-QA-1**: 경계 케이스 — 14일/15일 경계 + 이미 paid는 제외 + 알림 중복 차단 — 2h

### ST-015 (OP-10 운영 리포트 MVP)
- **TS-095-015-BE-1**: `GET /api/v1/operator/reports/*` — 6 KPI 집계 + 4 차트 데이터 + `POST /reports/export` (PDF/Excel) — 5h
- **TS-096-015-FE-1**: OP-10 페이지 (KPI 카드 + 매출/가입해지/플랜/기능사용 4 차트 + 기간 필터 + 내보내기) — 5h
- **TS-097-015-QA-1**: E2E — 기간 필터 → 4 차트 동시 갱신 + operator_staff 내보내기 비활성 — 2h

### ST-070 (OP-01 운영사 대시보드)
- **TS-098-070-BE-1**: `GET /api/v1/operator/dashboard/{kpis,charts/*,recent/*}` 집계 API (Tenant/Subscription/Invoice/Ticket/AuditLog/Plan 종합) — 5h
- **TS-099-070-FE-1**: OP-01 페이지 (KPI 7 + 차트 4 + 최근 활동 3 섹션 + 기간 필터) — 6h
- **TS-100-070-QA-1**: E2E — KPI 2초 렌더 + operator_staff 내보내기 비활성 + tenant 사용자 403 — 2h

**EP-03 Task 합계**: 17 Task / ≈ 56 MD

---

## EP-04 운영사 기능 권한 / 시스템

### ST-016 (기능 플래그 CRUD + 예외)
- **TS-101-016-DB-1**: `feature_flags` / `feature_flag_overrides` 마이그레이션 + 인덱스 (key/plan_id/tenant_id) — 3h
- **TS-102-016-BE-1**: `GET/POST/PATCH/DELETE /api/v1/operator/feature-flags` + override CRUD + audit — 4h
- **TS-103-016-BE-2**: `GET /api/v1/feature-flags/evaluate` (글로벌 → 플랜 → 테넌트 3계층 머지, ≤ 100ms) + 캐시 — 4h
- **TS-104-016-FE-1**: OP-07 페이지 (플래그 목록 + 변경 이력 + 예외 매트릭스) — 5h
- **TS-105-016-QA-1**: E2E — 3계층 머지 + 변경 이력 + 클라이언트 평가 응답 시간 — 3h

### ST-017 (운영사 시스템 설정 9탭)
- **TS-106-017-BE-1**: `GET/PATCH /api/v1/operator/system-settings/*` 9탭 (기본/계정/보안/메일/알림/API/데이터/백업/점검) + 테스트 발송 endpoints — 6h
- **TS-107-017-FE-1**: OP-11 페이지 (좌측 9탭 + 탭별 폼 + 테스트 발송 버튼) — 8h
- **TS-108-017-QA-1**: E2E — 탭 저장 + 테스트 메일/카카오 발송 + audit — 3h

### ST-018 (점검 모드 즉시·예약)
- **TS-109-018-BE-1**: `POST /api/v1/operator/maintenance/{enable,schedule,disable}` + 미들웨어 (비-operator 503 응답) + 예약 cron — 4h
- **TS-110-018-FE-1**: OP-11 점검 탭 (즉시/예약 토글 + 안내 문구 편집) + CM-06 점검 페이지 인용 — 3h
- **TS-111-018-QA-1**: E2E — 즉시 활성 + 예약 cron 자동 활성 + operator 정상 접근 — 2h

### ST-019 (자동 백업 cron)
- **TS-112-019-BE-1**: 매주 일 03:00 백업 cron (Supabase pg_dump → Storage `backups/`) + 성공/실패 알림 + 보관 기간 정책 — 3h
- **TS-113-019-QA-1**: cron E2E — 정상 백업 + 실패 시 운영사 알림 + 보관 기간 만료 정리 — 2h

**EP-04 Task 합계**: 13 Task / ≈ 45 MD

---

## EP-05 운영 지원 / 티켓 / 감사

### ST-020 (티켓 생성·응답·내부메모)
- **TS-114-020-DB-1**: `tickets` / `ticket_messages` / `ticket_attachments` 마이그레이션 + 인덱스 (status/priority/assignee/tenant_id) — 3h
- **TS-115-020-BE-1**: `POST /api/v1/tickets` (사용자→운영사) + `POST /tickets/:id/messages` (내부메모 플래그) + 첨부 + SLA 임박 알림 cron (KI-001) — 5h
- **TS-116-020-FE-1**: OP-08 페이지 (테이블 + 상세 패널 + 메시지 스레드 + 내부메모 토글 + 첨부) + 사용자측 티켓 모달 (CM-19 도움말 진입점) — 6h
- **TS-117-020-QA-1**: E2E — 사용자 생성 → 운영사 응답 → 내부메모 비공개 + SLA 임박 — 4h

### ST-021 (티켓 담당자·상태·우선순위)
- **TS-118-021-BE-1**: `PATCH /api/v1/operator/tickets/:id` (담당자/상태/우선순위) + 일괄 처리 API + audit — 3h
- **TS-119-021-FE-1**: OP-08 사이드 패널 변경 폼 + 일괄 처리 액션 바 — 3h
- **TS-120-021-QA-1**: E2E — 단건/일괄 변경 + audit + 우선순위 변경 시 SLA 재계산 — 2h

### ST-022 (감사 로그 조회·필터·내보내기)
- **TS-121-022-BE-1**: `GET /api/v1/operator/audit-logs` + 필터 (기간/테넌트/이벤트유형/사용자/결과) + 상세 diff + `POST .../export` (CSV 비동기) — 4h
- **TS-122-022-FE-1**: OP-09 페이지 (필터 사이드 + 테이블 + 상세 diff 모달 + 비동기 export 진행) — 5h
- **TS-123-022-QA-1**: E2E — 필터 조합 + diff 정확도 + CSV 비동기 완료 알림 — 3h

### ST-023 (audit_logs 자동 기록)
- **TS-124-023-DB-1**: 핵심 21 테이블 (employees/leaves/approvals/attendances/users/tenants/...) AFTER INSERT/UPDATE/DELETE 트리거 → audit_logs INSERT + 5년 보관 정책 — 5h
- **TS-125-023-BE-1**: 애플리케이션 레벨 audit middleware (`recordAudit({entity, action, before, after, actor})`) + APPROVE/REJECT 이벤트 후크 — 4h
- **TS-126-023-QA-1**: 권한 매트릭스 — actor가 RLS로 가려도 audit_logs에는 기록 + 트리거/애플리케이션 중복 차단 — 3h

**EP-05 Task 합계**: 13 Task / ≈ 45 MD

---

## EP-09 테넌트 문서 / 급여

### ST-047 (급여명세서 일괄 업로드·발송)
- **TS-127-047-DB-1**: `documents` / `document_templates` / `document_views` 마이그레이션 + 인덱스 (employee_id/month/type/views) — 4h
- **TS-128-047-BE-1**: Excel → PDF 변환 큐 (Edge Function + Puppeteer or React-PDF, 500명 ≤ 5분 보장) + Storage 업로드 — 8h
- **TS-129-047-BE-2**: `POST /api/v1/tenant/documents/payslips/bulk-issue` 일괄 발송 + 알림 (인앱+카카오+SMS 폴백 위탁 ST-066) — 5h
- **TS-130-047-FE-1**: TA-10 급여명세서 탭 (Excel 업로드 + 진행 상태 + 발송 모니터링) — 6h
- **TS-131-047-BE-3**: 7일 미열람 자동 재발송 cron + 재발송 한도 (3회) — 3h
- **TS-132-047-QA-1**: E2E — 500명 일괄 + 부분 실패 + 7일 cron + 미열람 통계 — 5h

### ST-048 (급여명세서 조회·다운로드)
- **TS-133-048-BE-1**: `GET /api/v1/me/payslips` + `GET /payslips/:id` (자동 열람 INSERT) + Signed URL 15분 — 3h
- **TS-134-048-FE-1**: EM-06 페이지 (테이블 + 미열람 강조 + 상세 모달 + PDF 다운로드) — 4h
- **TS-135-048-QA-1**: E2E — 자동 열람 처리 + Signed URL 만료 + 권한 매트릭스 — 2h

### ST-049 (증명서 요청 → HR 발급)
- **TS-136-049-BE-1**: `POST /api/v1/me/certificate-requests` + Approval 자동 생성 + 발급 시 PDF 생성 (워터마크) — 4h
- **TS-137-049-FE-1**: EM-08 페이지 (요청 폼 + 진행 상태) + TA-10 증명서 처리 탭 — 5h
- **TS-138-049-QA-1**: E2E — 요청 → HR 승인 → 발급 → EM-07 다운로드 — 3h

### ST-050 (계약서 생성·발송 MVP)
- **TS-139-050-BE-1**: `POST /api/v1/tenant/contracts` — 템플릿 변수 자동 채움 (employees 데이터) + PDF 생성 + 알림 (전자서명은 Signature 엔티티 v1.2 슬롯) — 5h
- **TS-140-050-FE-1**: TA-11 페이지 (템플릿 선택 + 변수 미리보기 + 발송) — 4h
- **TS-141-050-QA-1**: E2E — 변수 자동 채움 + PDF 생성 + 발송 알림 — 2h

### ST-051 (인사 문서 / 회사 문서 관리)
- **TS-142-051-BE-1**: `POST /api/v1/tenant/documents` 단건 업로드 + 권한 설정 (개인/팀/전사) + 발송 모니터링 API — 3h
- **TS-143-051-FE-1**: TA-10 문서 관리 탭 (목록 + 권한 매트릭스 + 발송 통계) — 3h

### ST-052 (문서 조회)
- **TS-144-052-FE-1**: EM-07 페이지 (내 문서 + 회사 문서 탭 + 미리보기 + 다운로드 + 열람 확인) + `GET /api/v1/me/documents` — 4h

**EP-09 Task 합계**: 18 Task / ≈ 60 MD

---

## EP-10 테넌트 설정 / 외부 연동

### ST-053 (회사 설정 9탭)
> 회사정보/근무정책/휴가정책은 P0 (신규 테넌트 필수)

- **TS-145-053-DB-1**: `tenant_settings` / `work_policies` / `leave_types` / `approval_lines` / `document_templates` / `roles` 마이그레이션 — 4h
- **TS-146-053-BE-1**: `GET/PATCH /api/v1/tenant/settings/*` 9탭 + 적용일 선택 (즉시/예약) — 6h
- **TS-147-053-BE-2**: 적용일 예약 cron — 예약된 정책 변경 적용 — 3h
- **TS-148-053-FE-1**: TA-13 페이지 — 9탭 shell + 회사정보/근무/휴가/결재라인 4탭 폼 — 8h
- **TS-149-053-QA-1**: E2E — 9탭 저장 + 적용일 예약 + 변경 이력 — 4h

### ST-054 (결재라인 조건 분기)
- **TS-150-054-BE-1**: `approval_lines.conditions` jsonb 평가 엔진 (휴가 일수/부서/직급 조건 트리) — 4h
- **TS-151-054-FE-1**: TA-13 결재라인 탭 (조건 트리 UI + 단계별 결재자 매핑) — 5h
- **TS-152-054-QA-1**: E2E — 5일 이상 = 대표 결재 + 부서별 분기 + audit — 3h

### ST-055 (카카오 알림톡 + SMS + 이메일)
- **TS-153-055-BE-1**: NHN Cloud SDK 연동 (API Key 암호화 보관 + 발송 + 결과 콜백) + 폴백 체인 (카카오 → SMS → 이메일) — 5h
- **TS-154-055-FE-1**: TA-14 페이지 — API Key 입력 + 테스트 발송 + 채널별 활성화 토글 — 4h
- **TS-155-055-QA-1**: E2E — 테스트 발송 성공/실패 + 폴백 체인 + audit — 3h

### ST-056 (API Key 발급·폐기)
- **TS-156-056-BE-1**: `POST /api/v1/tenant/api-keys` (super만, 한 번 표시, 만료일 + 권한 범위) + 사용 로그 + 폐기 — 3h
- **TS-157-056-FE-1**: TA-14 API Key 탭 (목록 + 발급 모달 + 사용 로그) — 3h

### ST-057 (리포트 5종 MVP)
- **TS-158-057-BE-1**: `GET /api/v1/tenant/reports/{headcount,attendance,leave,overtime,department-compare}` + KPI + 5 차트 — 6h
- **TS-159-057-FE-1**: TA-12 페이지 (리포트 5종 카드 + 상세 차트 + 기간 필터) — 5h
- **TS-160-057-QA-1**: E2E — 5종 리포트 + 기간 필터 + 권한 매트릭스 (manager 자기 팀만) — 3h

**EP-10 Task 합계**: 16 Task / ≈ 60 MD

---

## EP-11 직원 셀프 서비스

### ST-058 (EM-01 직원 대시보드)
- **TS-161-058-BE-1**: `GET /api/v1/me/dashboard/{kpis,attendance-card,leave-card,recent-notifications}` 집계 API (1초 이내 응답) — 4h
- **TS-162-058-FE-1**: EM-01 페이지 (KPI 5 + 출퇴근 카드 + 휴가 카드 + 알림 3건) + PWA 모바일 최적화 — 5h
- **TS-163-058-QA-1**: E2E — 1초 렌더 + Realtime 알림 갱신 + employee 외 403 + PWA Lighthouse — 3h

### ST-059 (EM-09 내 정보·보안)
- **TS-164-059-BE-1**: `GET/PATCH /api/v1/me/profile` + `POST /me/security/{change-password,2fa/enable|verify|disable}` + `GET/DELETE /me/sessions` — 5h
- **TS-165-059-FE-1**: EM-09 페이지 (7탭 — 기본/주소/계좌/가족/긴급연락/보안/세션) + 즉시 수정 / HR 승인 필드 구분 — 6h
- **TS-166-059-QA-1**: E2E — 즉시 수정 + HR 승인 흐름 + 2FA + 세션 강제 종료 — 3h

### ST-060 (EM-10 알림함 + Realtime)
- **TS-167-060-BE-1**: `GET /api/v1/me/notifications` + `POST /notifications/:id/read` + `POST /notifications/mark-all-read` + Realtime publication — 3h
- **TS-168-060-FE-1**: EM-10 페이지 + 헤더 종 배지 (≤ 2초 갱신) + 클릭 시 자동 읽음 — 4h
- **TS-169-060-QA-1**: E2E — Realtime 배지 갱신 + 전체 읽음 + 클릭 자동 읽음 — 2h

### ST-061 (EM-11 요청 내역 통합 △)
- **TS-170-061-FE-1**: EM-11 페이지 — MVP는 비활성/EM-05 리다이렉트 안내, v1.1에 실제 통합 화면 (사이드바 placeholder 처리) — 3h
- **TS-171-061-QA-1**: 매뉴얼 — MVP 사이드바 비표시 검증 + 리다이렉트 — 1h

### ST-062 (푸시 + 카카오 폴백 체인)
- **TS-172-062-BE-1**: 폴백 큐 워커 (인앱 즉시 → 30분 미열람 → 카카오 → 1h 미수신 → SMS → 24h 미열람 → 이메일) — 5h
- **TS-173-062-BE-2**: 채널별 발송 어댑터 (Web Push / Capacitor Push / NHN 카카오 / NHN SMS / SMTP) — 5h
- **TS-174-062-QA-1**: E2E — 4단계 폴백 진행 + 중복 발송 차단 + 결과 콜백 — 4h

**EP-11 Task 합계**: 14 Task / ≈ 50 MD

---

## EP-12 공통 인프라

### ST-063 (CM-09/10 파일 업로드·미리보기)
- **TS-175-063-BE-1**: Storage policy (prefix `tenants/{tid}/{domain}/{yyyy-mm}/` + Signed URL 15분) + MIME 검증 + 단일 50MB 제한 — 4h
- **TS-176-063-FE-1**: CM-09 업로드 + CM-10 미리보기 컴포넌트 (이미지/PDF/Excel) — 5h
- **TS-177-063-QA-1**: E2E — MIME 위반 차단 + Signed URL 만료 + 50MB 초과 차단 — 3h

### ST-064 (CM-11/12 Excel 가져오기/내보내기)
- **TS-178-064-BE-1**: SheetJS wrapper — 양식 다운로드 + 업로드 검증 + 부분 실패 행 다운로드 — 5h
- **TS-179-064-FE-1**: CM-11 가져오기 wizard + CM-12 내보내기 모달 (현재 필터 결과) — 4h
- **TS-180-064-QA-1**: E2E — 100행 일괄 + 부분 실패 + 재시도 — 3h

### ST-065 (CM-13 PDF 생성)
- **TS-181-065-BE-1**: PDF 생성 인터페이스 (Puppeteer or React-PDF, 워터마크 회사 인장) + 큐 워커 — 5h
- **TS-182-065-FE-1**: CM-13 PDF 미리보기 + 다운로드 컴포넌트 (급여명세서/증명서/리포트 일관 인터페이스) — 4h
- **TS-183-065-QA-1**: E2E — 워터마크 적용 + PDF 일관 인터페이스 + 500명 일괄 5분 — 3h

### ST-066 (CM-15 시스템 알림 발송 채널)
- **TS-184-066-BE-1**: 채널 어댑터 5종 (인앱/Web Push/카카오/SMS/이메일) 통합 인터페이스 — 5h
- **TS-185-066-BE-2**: 우선순위 폴백 정책 엔진 (notification_type → channel_priority 매트릭스) + Realtime broadcast — 5h
- **TS-186-066-BE-3**: 발송 결과 콜백 + 재시도 정책 + audit_logs — 3h
- **TS-187-066-QA-1**: E2E — 5채널 발송 + 폴백 체인 + 결과 콜백 — 4h

### ST-067 (CM-08 공통 검색 △ v1.1)
- **TS-188-067-FE-1**: 헤더 검색바 비활성 안내 (v1.1 출시 예정 토스트) — 1h

### ST-068 (CM-14 감사 로그 기록 + 보관)
- **TS-189-068-DB-1**: audit_logs 5년 보관 정책 + 인덱스 (tenant_id/actor_id/entity/action/created_at) + 파티셔닝 (월 단위) — 4h
- **TS-190-068-QA-1**: 부하 테스트 — 1년치 audit_logs 인덱스 검색 + 파티션 prune — 3h

### ST-069 (Supabase Realtime publication)
- **TS-191-069-DB-1**: `notifications` / `approvals` / `approval_steps` publication + RLS 적용 + 채널별 권한 — 3h
- **TS-192-069-FE-1**: Realtime 구독 wrapper (`useRealtime(channel, filter)` hook) + 재연결 + 오프라인 fallback — 4h

### ST-072 (CM-06 오류·점검 화면)
- **TS-193-072-FE-1**: CM-06 페이지 (404/500/503 변형 + 운영사 우회 안내) + Sentry 자동 보고 (500) — 3h
- **TS-194-072-BE-1**: 점검 모드 미들웨어 (비-operator 503 + operator 정상) — 2h

**EP-12 Task 합계**: 20 Task / ≈ 70 MD

---

## ST-073~080 — EP-01·12 보강 (KI-027~030 batch-003)

> PRD 보강 (CM-16~22 헤더 컴포넌트·약관·온보딩 + OP-12 운영사 프로필)에 대응하는 Task 분해.

### ST-073 (CM-16, EP-12) 헤더 프로필 드롭다운 [P1]
- **TS-195-073-BE-1**: `GET /api/v1/me/profile` (역할별 메뉴 매트릭스 페이로드) + `POST /api/v1/auth/logout` (audit) — 3h
- **TS-196-073-FE-1**: `<HeaderProfile>` 컴포넌트 — 아바타 + 드롭다운 (역할별 메뉴) + 로그아웃 confirm — 4h
- **TS-197-073-QA-1**: E2E — 6 역할 × 메뉴 매트릭스 + 로그아웃 audit — 2h

### ST-074 (CM-17, EP-12) 헤더 알림 종 미니 드롭다운 [P1]
- **TS-198-074-BE-1**: `GET /api/v1/me/notifications?limit=10` + `GET /me/notifications/unread-count` + `POST /me/notifications/mark-all-read` (ST-060 endpoints 재사용 + limit 변형) — 3h
- **TS-199-074-FE-1**: `<HeaderBell>` — Realtime 미읽음 배지 (`useRealtime('notifications')`) + 미니 드롭다운 10건 — 4h
- **TS-200-074-QA-1**: E2E — Realtime 배지 ≤ 2초 + 100건 초과 시 "99+" + 자동 읽음 — 2h

### ST-075 (CM-18, EP-12) 헤더 검색 안내 [P3]
- **TS-201-075-FE-1**: `<HeaderSearchPlaceholder>` — 검색바 노출 ≥ 1024px + 클릭 시 "v1.1 출시 예정" 토스트 + 화면별 필터 안내 링크 — 2h

### ST-076 (CM-19, EP-12) 헤더 도움말 패널 [P2]
- **TS-202-076-BE-1**: `GET /api/v1/help/screen/:id` + `GET /api/v1/help/faq` + `POST /api/v1/help/contact-ticket` (OP-08 신규 티켓 모달 위임) — 3h
- **TS-203-076-FE-1**: `<HeaderHelpPanel>` — 화면별 도움말 + FAQ + 운영팀 문의 + 투어 재실행 (CM-22 hook) — 4h
- **TS-204-076-QA-1**: E2E — screen_id 매핑 + 문의 → 티켓 생성 + 투어 재실행 — 2h

### ST-077 (CM-20, EP-12) PWA 설치 가이드 [P1]
- **TS-205-077-FE-1**: `<PwaInstallGuide>` — iOS 16.4+ 분기 + Android beforeinstallprompt + Tauri 다운로드 CTA — 4h
- **TS-206-077-FE-2**: standalone 모드 자동 dismiss + 30일 재표시 방지 (localStorage) — 2h
- **TS-207-077-BE-1**: `POST /api/v1/me/pwa-install-event` (PWA 설치율 추적, 08-success-metrics ≥ 30%) — 2h
- **TS-208-077-QA-1**: E2E — iOS/Android 분기 + standalone 자동 dismiss + 설치 이벤트 추적 — 2h

### ST-078 (CM-21, EP-01) 약관 / 개인정보 + 동의 이력 [P0]
- **TS-209-078-DB-1**: `legal_documents` (kind/version/language/active/effective_at) + `user_consents` (user_id/legal_document_id/source/ip/ua) 마이그레이션 + 인덱스 — 4h
- **TS-210-078-BE-1**: `GET /api/v1/legal/documents?language=` (비로그인 가능) + `GET /me/consents/required` (must_accept 가드) + `POST /me/consents` — 5h
- **TS-211-078-BE-2**: `POST /api/v1/operator/legal/documents` (super만, active=true 시 기존 false 트랜잭션) + ko/en 페어 게시 의무 검증 — 4h
- **TS-212-078-FE-1**: CM-21 페이지 (비로그인 푸터 진입) + 강제 동의 가드 모달 (다음 로그인) — 3h
- **TS-213-078-QA-1**: E2E — 비로그인 조회 + 강제 동의 가드 + ko/en 페어 + 감사 통계 — 3h

### ST-079 (CM-22, EP-12) 첫 사용자 온보딩 투어 [P2]
- **TS-214-079-BE-1**: `PATCH /api/v1/me/profile { firstLoginAt }` + `POST /api/v1/me/onboarding/event` (시작/완료/건너뛰기 audit) — 3h
- **TS-215-079-FE-1**: `<OnboardingTour>` — 역할별 4단계 모달 (operator/tenant_super/manager/employee 분기) + 다시 보기 (CM-19 + EM-09/OP-12) — 5h
- **TS-216-079-QA-1**: E2E — 첫 로그인 자동 시작 + 건너뛰기 audit + 역할 분기 — 2h

### ST-080 (OP-12, EP-03) 운영사 본인 프로필 + 보안 [P1]
- **TS-217-080-BE-1**: OP-12 §7 14 엔드포인트 그룹 1 — `GET/PATCH /operator/me/profile` + `POST /me/avatar` + `POST /me/security/{change-password,2fa/enable,2fa/verify,2fa/regenerate}` + `GET/DELETE /me/security/sessions[/:id]` — 5h
- **TS-218-080-BE-2**: OP-12 §7 14 엔드포인트 그룹 2 — `POST /operator/users/:id/force-logout` (super만, 마지막 super 보호) + `GET/PATCH /me/notifications/preferences` + `GET /me/audit-logs?days=30` + `GET /me/consents` — 5h
- **TS-219-080-FE-1**: OP-12 페이지 (EM-09 패턴 + 운영사 강제 2FA + super 전용 액션) — 5h
- **TS-220-080-QA-1**: E2E — OP-12 §8 Gherkin 4 시나리오 (강제 2FA + super가 staff 강제 종료 + 마지막 super 보호 + 활동 다운로드) — 3h

**ST-073~080 Task 합계**: 26 Task / ≈ 36 MD (PR 리뷰/대기 포함 보수적 환산 시 99 MD)

---

### Task 추정 (Epic 단위 요약)

> **Story 수 SSOT**: stories.md `## 전체 요약` 표 (80 Story / 415 SP). **Task/MD**: 본 표가 SSOT.

| Epic | Story 수 | Task 수 | MD |
|------|--------|--------|-----|
| EP-01 | 5 | 21 | 75 |
| EP-02 | 5 | 19 | 70 |
| EP-03 | 6 | 17 | 56 |
| EP-04 | 4 | 13 | 45 |
| EP-05 | 4 | 13 | 45 |
| EP-06 | 8 | 16 | 70 |
| EP-07 | 6 | 14 | 61 |
| EP-08 | 10 | 16 | 77 |
| EP-09 | 6 | 18 | 60 |
| EP-10 | 5 | 16 | 60 |
| EP-11 | 5 | 14 | 50 |
| EP-12 | 8 | 20 | 70 |
| 소계 (Phase 2 초안) | **72** | **197** | **739** |
| ST-073~080 (KI-027~030 batch-003) | 8 | 26 | 99 |
| **합계 (보강 후, KI-013 closure 2026-05-19)** | **80** | **223** | **838** |

> 1 MD = 1 개발자 작업일 (8h, PR 리뷰/대기/통합 테스트 포함 보수적 환산). 838 MD = 풀타임 개발자 2명 × 약 7개월 (60 MD/월/명).
> `estimation.md`의 218 MD (순수 개발 시간, 보강 후) ↔ tasks.md 838 MD (보수적 환산)는 동일 백로그의 두 시각 — 외부 견적은 보수적, 내부 진척률은 순수.
> Phase 6 스프린트 계획에서 P0 그룹(약 138 MD 순수 / 약 555 MD 보수, P0=275 SP × 0.5 = 138 MD + 838 MD × (275/415=66.3%) ≈ 555 MD)을 6 스프린트 × 2주 × 2명 ≈ 240 MD 순수 분량으로 압축 + P1/P2를 Sprint 7~10에 분산.

---

## Task 작성 규칙 (Phase 6 / 7 진행 시)

각 Task가 Phase 7 개발 착수 시 그대로 WI로 변환되도록:

1. **단일 책임**: 1 Task = 1 PR 단위 (≤ 1 작업일)
2. **검증 가능**: 수용 기준 Gherkin 시나리오와 1:1 매핑
3. **의존성 명시**: 선행 Task ID 인용
4. **테스트 동반**: 모든 BE/FE Task에 대응 QA Task 1개
5. **마이그레이션 분리**: DB Task는 단일 마이그레이션 파일

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — EP-01/02/06/07/08 완전 분해 + 나머지 요약 추정 | Phase 2 진입 |
| 2026-05-19 | EP-03/04/05/09/10/11/12 완전 분해 (TS-084~194) + ST-073~080 분해 (TS-195~220) + 추정 표 갱신 (80 Story / 223 Task / 838 MD) | KI-013 closure (Phase 6 진입 전 의무) + KI-034 일부 (합계 stale) |
| 2026-05-19 | ST-071 (TA-01 관리자 대시보드) 3 Task (TS-221~223) 추가 + EP-06 본문 16 Task / 70 MD 정정 + L40 "44 화면" stale 정정 + OP-12 14 endpoint 정정 + L469~470 commentary 218 MD / 138 MD / 538 MD 갱신 | Phase 2 재평가 1차+2차 정정 |
