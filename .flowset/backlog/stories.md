# User Story 백로그

> Story = 역할 × 화면 × 골든 패스 1건. Acceptance Criteria는 PRD 화면 §8 Gherkin 시나리오 ID를 인용.
> Story 번호: `ST-NNN` (3자리). MVP 우선순위(P0/P1/P2) 표기.

## Story ↔ PRD §8 인용 표 (전체 80 Story 일괄 매핑)

> README.md L69 규칙 이행. 각 Story의 Acceptance는 본 표의 PRD 경로 §8를 인용하는 것과 동일.

| Story 범위 | 화면 / 인용 경로 |
|----------|---------------|
| ST-001~005 | CM-01~05 → `.flowset/prd/domains/common.md` 각 CM 섹션 |
| ST-006~009 | OP-02/03/04 → `.flowset/prd/domains/operator/OP-02-tenants.md#8` / `OP-03-tenant-detail.md#8` / `OP-04-onboarding.md#8` |
| ST-010 | CM-03 → `.flowset/prd/domains/common.md#cm-03-최초-계정-활성화` |
| ST-011~015 | OP-05/06/10 → `.flowset/prd/domains/operator/OP-05-subscriptions.md#8` / `OP-06-billing.md#8` / `OP-10-reports.md#8` |
| ST-016~019 | OP-07/11 → `.flowset/prd/domains/operator/OP-07-feature-flags.md#8` / `OP-11-system-settings.md#8` |
| ST-020~023 | OP-08/09 → `.flowset/prd/domains/operator/OP-08-tickets.md#8` / `OP-09-audit-logs.md#8` |
| ST-024~030 | TA-02/03/04 → `.flowset/prd/domains/tenant-admin/TA-02-employees.md#8` / `TA-03-employee-detail.md#8` / `TA-04-org-chart.md#8` |
| ST-031~036 | EM-02/TA-05/06 → `.flowset/prd/domains/employee/EM-02-attendance.md#8` / `.flowset/prd/domains/tenant-admin/TA-05-attendance.md#8` / `TA-06-attendance-modifications.md#8` |
| ST-037~046 | EM-03~05/TA-07~09 → `.flowset/prd/domains/employee/EM-03-leave-request.md#8` / `EM-04-my-leaves.md#8` / `EM-05-my-approvals.md#8` / `.flowset/prd/domains/tenant-admin/TA-07-leave-management.md#8` / `TA-08-leave-detail.md#8` / `TA-09-approvals.md#8` |
| ST-047~052 | TA-10/11/EM-06~08 → `.flowset/prd/domains/tenant-admin/TA-10-payroll-documents.md#8` / `TA-11-contracts.md#8` / `.flowset/prd/domains/employee/EM-06-payslip.md#8` / `EM-07-documents.md#8` / `EM-08-certificate-request.md#8` |
| ST-053~057 | TA-13/14/12 → `.flowset/prd/domains/tenant-admin/TA-13-settings.md#8` / `TA-14-integrations.md#8` / `TA-12-reports.md#8` |
| ST-058~062 | EM-01/09/10/11 → `.flowset/prd/domains/employee/EM-01-dashboard.md#8` / `EM-09-profile.md#8` / `EM-10-notifications.md#8` / `EM-11-my-requests.md#8` |
| ST-063~069 | CM-09~15/Realtime → `.flowset/prd/domains/common.md` 해당 CM 섹션 + `.flowset/prd/04-data-model.md#5-알림-흐름` |
| ST-070 | OP-01 → `.flowset/prd/domains/operator/OP-01-dashboard.md#8` |
| ST-071 | TA-01 → `.flowset/prd/domains/tenant-admin/TA-01-dashboard.md#8` |
| ST-072 | CM-06 → `.flowset/prd/domains/common.md#cm-06-오류점검-화면` |
| ST-073~076 | CM-16~19 → `.flowset/prd/domains/common.md` 각 CM 섹션 (헤더 컴포넌트 4종) |
| ST-077 | CM-20 → `.flowset/prd/domains/common.md#cm-20-pwa-설치-가이드` |
| ST-078 | CM-21 → `.flowset/prd/domains/common.md#cm-21-약관·개인정보처리방침` |
| ST-079 | CM-22 → `.flowset/prd/domains/common.md#cm-22-첫-사용자-온보딩-투어` |
| ST-080 | OP-12 → `.flowset/prd/domains/operator/OP-12-profile.md#8` |

본 표를 통해 모든 Story의 Acceptance는 해당 PRD §8 Gherkin 시나리오 전체와 1:1 매핑. 개별 Story에 시나리오 ID 인라인 기재가 필요한 경우 Phase 7 개발 착수 시 WI 변환 단계에서 보강.

---

## EP-01 인프라 / 인증 / 권한 베이스

### ST-001 (CM-01, all roles) 이메일/비밀번호 로그인 [P0]
> As a 모든 사용자
> I want to 이메일과 비밀번호로 로그인
> So that 역할별 대시보드에 접근

- **Acceptance** (PRD CM-01 §수용 기준):
  - AC-1: 정상 로그인 → 역할별 대시보드 이동
  - AC-2: 5회 실패 → 5분 IP+이메일 잠금
  - AC-3: 2FA 활성화 사용자 → TOTP 입력 화면
- **API**: `POST /api/v1/auth/login`, `POST /api/v1/auth/2fa/verify`
- **추정**: 5 SP

### ST-002 (CM-02, all roles) 비밀번호 찾기 [P0]
> As a 비밀번호 분실 사용자
> I want to 이메일로 재설정 링크 받기
> So that 비밀번호를 재설정하고 로그인

- **Acceptance**:
  - AC-1: 등록되지 않은 이메일에도 "보냈습니다" 동일 응답 (계정 존재 노출 방지)
  - AC-2: 토큰 60분 만료
  - AC-3: 재설정 후 모든 활성 세션 무효화
- **API**: `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`
- **추정**: 3 SP

### ST-003 (CM-03, invited employees) 최초 계정 활성화 [P0]
> As a 초대받은 사용자 (직원/관리자)
> I want to 초대 링크로 비밀번호를 설정하고 활성화
> So that FlowHR을 사용

- **Acceptance**:
  - AC-1: 7일 만료 토큰, 1회 사용
  - AC-2: 비밀번호 정책 검증 + 약관 동의 + 선택적 2FA
  - AC-3: 만료 시 재발송 요청 버튼
- **API**: `POST /api/v1/auth/activate`
- **추정**: 3 SP

### ST-004 (CM-04, all roles) 2FA TOTP 활성화·로그인 [P0]
> As a 보안 강화 원하는 사용자 (운영사는 강제)
> I want to TOTP 2FA 활성화 + 로그인 시 코드 입력
> So that 계정 보호

- **Acceptance**:
  - AC-1: QR + 6자리 코드 검증 후 활성화
  - AC-2: 복구 코드 8개 발급 (한 번 사용)
  - AC-3: 운영사 계정 2FA 미설정 시 다음 화면에서 강제
- **API**: `POST /api/v1/me/security/2fa/enable|verify|disable`
- **추정**: 5 SP

### ST-005 (RLS 인프라, all entities) 멀티테넌트 격리 [P0]
> As a 시스템
> I want to 모든 도메인 테이블에 tenant_id 기반 RLS 적용
> So that 타 테넌트 데이터 노출 차단 (R-02 리스크 완화)

- **Acceptance**:
  - AC-1: 운영사 전용 테이블(tenants, plans, feature_flags) 외 모든 테이블 RLS enabled
  - AC-2: `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid` 정책 + 운영사 우회 정책
  - AC-3: 음성 케이스: 테넌트 A 사용자가 B의 ID로 GET → 403
- **추정**: 5 SP

**EP-01 합계**: 5 Story / 21 SP

---

## EP-02 운영사 테넌트 라이프사이클

### ST-006 (OP-04, operator_*) 신규 테넌트 등록 7단계 마법사 [P0]
> As a 운영사 (김운영)
> I want to 회사정보→도메인→플랜→관리자→모듈→초기데이터→완료 7단계 마법사
> So that 신규 고객사 가입을 한 흐름에 완료

- **Acceptance** (PRD OP-04 §8):
  - AC-1: 7단계 완료 트랜잭션 (tenants/subscriptions/tenant_settings/users 동시 INSERT)
  - AC-2: 슬러그/사업자번호/이메일 실시간 중복 검증
  - AC-3: 관리자 초대 메일 발송 실패 시 재시도 가능
  - AC-4: 임시저장 → 재진입 (3단계까지 입력 후 이탈해도 복원)
- **API**: `POST /api/v1/operator/tenants/*` (drafts/check-*/배치)
- **추정**: 13 SP

### ST-007 (OP-02, operator_*) 테넌트 목록 조회·검색·필터 [P0]
> As a 운영사
> I want to 모든 고객사를 한 화면에서 검색·필터·일괄 작업
> So that 영업/CS 빠른 진입

- **Acceptance**:
  - AC-1: 검색 (회사명/사업자번호/도메인/관리자) 단일 입력 자동 분기
  - AC-2: 사이드 필터 (상태/요금제/결제/만료/활동)
  - AC-3: 페이지네이션 20/페이지, sort 적용
  - AC-4: 미납 필터 → 내보내기 (Excel)
- **API**: `GET /api/v1/operator/tenants` + `POST .../export`
- **추정**: 5 SP

### ST-008 (OP-03, operator_*) 테넌트 상세 통합 관리 [P0]
> As a 운영사
> I want to 특정 고객사의 계약/사용량/권한/결제/로그/티켓 8개 탭
> So that 한 화면에서 모든 정보 확인 후 액션

- **Acceptance**:
  - AC-1: 탭 전환 시 URL `?tab=X` 보존
  - AC-2: 회사명 수정 → audit_logs before/after
  - AC-3: 비활성화 → 영향 사용자 활성 세션 즉시 무효화 (Realtime broadcast)
  - AC-4: operator_staff는 "비활성화" 버튼 비활성
- **API**: `GET/PATCH /api/v1/operator/tenants/:id`, `POST .../:id/deactivate`
- **추정**: 8 SP

### ST-009 (OP-02, operator_super) 테넌트 상태 변경 + 감사 [P0]
> As a 운영사 최고관리자
> I want to 활성/비활성/보관 상태 변경 + 사유 기록
> So that 감사 로그 추적 + 권한 차단

- **Acceptance**:
  - AC-1: 사유 필수
  - AC-2: audit_logs INSERT (actor/before/after)
  - AC-3: 비활성/보관 시 해당 테넌트 사용자 세션 무효화
- **추정**: 3 SP

### ST-010 (CM-03, tenant invited admin) 테넌트 관리자 초대 활성화 [P0]
> As a 초대받은 테넌트 관리자 (이대표)
> I want to 메일 링크 클릭 → 활성화 후 회사 첫 로그인
> So that 30분 내 직원 초대 시작 (J1 KPI)

- **Acceptance**:
  - AC-1: 토큰 검증 + 비밀번호 설정 + 2FA
  - AC-2: 활성화 후 TA-01 대시보드 진입
- **추정**: 2 SP

**EP-02 합계**: 5 Story / 31 SP (마지막 3 SP는 EP-01과 중복)

---

## EP-03 운영사 수익 / 청구 / 플랜

### ST-011 (OP-05, operator_super) 요금제 CRUD [P1]
- AC: 생성·수정·복제·비활성화, 사용 중 플랜 가격 변경은 다음 청구일부터
- API: `GET/POST/PATCH/DELETE /api/v1/operator/plans` + `/clone`
- 추정: 5 SP

### ST-012 (OP-06, operator_*) 청구 일괄 발행 (cron) [P1]
- AC: 매월 1일 00:00 — 모든 활성 테넌트 invoices INSERT (인원 × 인당요금 + 기본요금)
- API: `POST /api/v1/operator/invoices/batch-issue` (Edge Function cron)
- 추정: 5 SP

### ST-013 (OP-06, operator_*) 청구 조회·미납 추적·결제완료 처리 [P1]
- AC: KPI 5개 + 11컬럼 테이블 + 필터 + Excel 내보내기 + 수동 결제완료
- API: `GET /api/v1/operator/invoices`, `POST .../:id/mark-paid|refund`
- 추정: 5 SP

### ST-014 (자동 cron) 미납 자동 전환 + 알림 [P1]
- AC: issued 후 15일 경과 → status=overdue + 운영사 + 테넌트 관리자 알림
- 추정: 3 SP

### ST-015 (OP-10, operator_*) 운영 리포트 MVP (KPI + 4 차트) [P1]
- AC: 6 KPI + 매출/가입해지/플랜/기능사용 4 차트, PDF/Excel 내보내기
- AC 인용: `.flowset/prd/domains/operator/OP-10-reports.md#8-수용-기준-gherkin`
- 추정: 3 SP

### ST-070 (OP-01, operator_*) 운영사 대시보드 [P0]
> As a 운영사 (김운영/박오퍼)
> I want to 플랫폼 전체 운영 상태 한눈에 (KPI 7 + 차트 4 + 최근 활동 3섹션)
> So that 매일 아침 5초 안에 신규/해지/미수금/티켓/시스템 상태 파악
- AC 인용: `.flowset/prd/domains/operator/OP-01-dashboard.md#8-수용-기준-gherkin`
- AC-1 (KPI 2초 렌더), AC-2 (기간 필터 → 4 차트 갱신), AC-3 (operator_staff 내보내기 비활성), AC-4 (테넌트 사용자 403)
- API: `GET /api/v1/operator/dashboard/{kpis,charts/*,recent/*}` + `POST .../export`
- 엔티티: Tenant:R, Subscription:R, Invoice:R, Ticket:R, AuditLog:R, Plan:R (matrix.json screens_to_entities_map.OP-01)
- 추정: 5 SP

**EP-03 합계**: 6 Story / 26 SP (ST-070 P0이지만 EP-03 그룹 — 운영사 대시보드 데이터는 청구/플랜/티켓 집계)

---

## EP-04 운영사 기능 권한 / 시스템

### ST-016 (OP-07, operator_super) 기능 플래그 CRUD + 예외 [P1]
- AC: 글로벌/플랜/테넌트 3계층, 변경 이력 추적, 클라이언트 평가 API
- 추정: 8 SP

### ST-017 (OP-11, operator_super) 운영자 계정·보안·메일·알림 설정 [P1]
- AC: 9 탭 (기본/계정/보안/메일/알림/API/데이터/백업/점검) + 테스트 발송
- 추정: 8 SP

### ST-018 (OP-11, operator_super) 점검 모드 즉시·예약 [P1]
- AC: 비-operator 503 응답, 운영사는 정상, 예약 cron 자동 활성
- 추정: 3 SP

### ST-019 (cron) 자동 백업 일 1회 [P1]
- AC: 매주 일 03:00 백업 작업, 성공/실패 알림
- 추정: 2 SP

**EP-04 합계**: 4 Story / 21 SP

---

## EP-05 운영 지원 / 티켓 / 감사

### ST-020 (OP-08, all roles) 티켓 생성·응답·내부메모 [P1]
- AC: 사용자→운영사 흐름, 내부 메모 비공개, 첨부, SLA P0~P3 임박 알림 (KI-001)
- 추정: 8 SP

### ST-021 (OP-08, operator_*) 티켓 담당자 지정·상태·우선순위 변경 [P1]
- AC: 사이드 패널 + 일괄 처리, audit_logs
- 추정: 3 SP

### ST-022 (OP-09, operator_super) 감사 로그 조회·필터·내보내기 [P1]
- AC: 기간/테넌트/이벤트유형/사용자/결과 필터, 상세 diff (before/after), CSV 비동기 export
- 추정: 5 SP

### ST-023 (DB trigger + 애플리케이션) audit_logs 자동 기록 [P1]
- AC: 핵심 테이블 INSERT/UPDATE/DELETE/APPROVE 후 audit_logs (이중 — 트리거 + 애플리케이션)
- 추정: 5 SP

**EP-05 합계**: 4 Story / 21 SP

---

## EP-06 테넌트 직원 / 조직 관리

### ST-024 (TA-02, tenant_hr_admin+) 직원 등록·수정·상태 변경 [P0]
- AC: 단건 등록 + 초대 메일, 상태 변경 사유 필수, 휴직/퇴사 시 세션 종료
- 추정: 8 SP

### ST-025 (TA-02, tenant_hr_admin+) 직원 일괄 업로드 (Excel) [P0]
- AC: 양식 다운로드 → 100행 일괄, 부분 실패 행 다운로드, 재시도
- 추정: 5 SP

### ST-026 (TA-03, tenant_hr_admin+) 직원 상세 9탭 통합 [P0]
- AC: 기본/인사/계약/근태/휴가/급여/문서/결재이력/변경이력 9탭, 권한별 탭 가시성
- 추정: 8 SP

### ST-027 (TA-03, tenant_super) 직원 휴직·퇴사 처리 [P0]
- AC: 상태 변경 + 활성 세션 종료, 퇴직금 정산 안내, 잔여연차 정산
- 추정: 3 SP

### ST-028 (TA-04, tenant_hr_admin+) 조직도 CRUD + 드래그 이동 [P0]
- AC: 트리 표시, 부서 생성·수정·삭제 (자식·직원 0건), parent 이동
- 추정: 5 SP

### ST-029 (TA-04, tenant_hr_admin+) 구성원 다중 선택 이동 [P0]
- AC: 직원 다수 선택 → 부서 변경, 변경 이력 기록
- 추정: 3 SP

### ST-030 (TA-03, employee) 본인 변경 요청 [P0]
- AC: 즉시 수정 가능 필드 + HR 승인 필드 구분, 계좌 변경 시 2FA 재인증
- AC 인용: `.flowset/prd/domains/tenant-admin/TA-03-employee-detail.md#8-수용-기준-gherkin` (manager 일부 탭 + employee 본인 일부 시나리오)
- 추정: 3 SP

### ST-071 (TA-01, tenant_super+) 관리자 대시보드 [P0]
> As a 테넌트 관리자 (이대표/정인사/최팀장)
> I want to 회사 HR 운영 현황 한눈에 (KPI 6 + 차트 4 + 최근 요청·결재·이상자 3섹션)
> So that 매일 아침 5초 안에 오늘 출근율/결재 대기/미열람 급여 파악
- AC 인용: `.flowset/prd/domains/tenant-admin/TA-01-dashboard.md#8-수용-기준-gherkin`
- AC-1 (6 KPI 2초 렌더), AC-2 (manager 자기 팀만 집계), AC-3 (employee → EM-01 리다이렉트), AC-4 (PWA 모바일 KPI 카드 + 결재 직행)
- API: `GET /api/v1/tenant/dashboard/{kpis,charts/*,recent/*,pending/approvals,today/abnormal-attendance}`
- 엔티티: Employee:R, Attendance:R, Leave:R, Approval:R, Notification:R (matrix.json screens_to_entities_map.TA-01)
- 추정: 5 SP

**EP-06 합계**: 8 Story / 40 SP (ST-071 추가)

---

## EP-07 테넌트 근태 관리

### ST-031 (EM-02, employee) 출퇴근 GPS 인증 [P0]
> **PWA 핵심 Story**
- AC: 출근/퇴근/휴게 1탭, GPS 인증, 위치 권한 거부 시 정책별 분기, 오프라인 큐잉
- 추정: 13 SP

### ST-032 (TA-05, tenant_hr_admin+) 회사 근태 모니터링 [P0]
- AC: 기간/부서/직원 필터, KPI 4개, 9컬럼 테이블, 다운로드
- 추정: 5 SP

### ST-033 (TA-05, tenant_hr_admin+) 근태 수동 등록·수정 [P0]
- AC: 사유 필수, audit_logs, work_policy 자동 status 결정
- 추정: 3 SP

### ST-034 (EM-02→TA-06, employee) 근태 수정 요청 흐름 [P0]
- AC: 직원 요청 → 팀장 1차 → HR 최종 승인 → attendances 갱신 (이력 보존)
- 추정: 8 SP

### ST-035 (자동 cron) 23:59 누락 자동 처리 [P0]
- AC: 출근만 있고 퇴근 없는 행 → status=누락 + 직원 알림
- 추정: 3 SP

### ST-036 (자동 분류) 지각/조퇴 자동 status [P0]
- AC: work_policy.standard_in/out 기준, 트리거 또는 INSERT 시점 결정
- 추정: 3 SP

**EP-07 합계**: 6 Story / 35 SP

---

## EP-08 테넌트 휴가 / 결재

### ST-037 (EM-03, employee) 휴가 신청 30초 [P0]
- AC: 유형/시작/종료/사유 입력, 사용일수 자동 계산, 결재라인 자동 적용, 잔여 부족·중복 차단
- 추정: 8 SP

### ST-038 (EM-04, employee) 내 휴가 현황 [P0]
- AC: KPI 4개 + 유형별 차트 + 신청 이력 + 만료 임박 배너
- 추정: 3 SP

### ST-039 (TA-08, tenant_manager+) 휴가 승인 (PWA) [P0]
> **PWA 모바일 결재 핵심**
- AC: 카드 5개 + sticky 액션 버튼, 승인 시 다음 단계, 최종 승인 시 LeaveBalance.used 차감
- 추정: 8 SP

### ST-040 (TA-07, tenant_hr_admin+) 휴가 마스터 (캘린더 + 잔여 + 부여) [P0]
- AC: KPI 5 + 캘린더 (월/주) + 잔여 테이블, 단건/일괄 부여 + 차감/조정 (사유 필수)
- 추정: 8 SP

### ST-041 (TA-09, all approver) 결재 통합 인박스 + 일괄 처리 [P0]
- AC: 받은/보낸/위임받은(v1.1)/완료 탭, 같은 유형 일괄 승인, PWA 스와이프 액션
- 추정: 8 SP

### ST-042 (EM-05, employee) 내 결재 진행현황 [P0]
- AC: 5종 요청 통합 조회 (탭 필터), 단계 진척 표시, 취소·재신청
- 추정: 5 SP

### ST-043 (자동 cron) 휴가 자동 부여·만료 [P0]
- AC: 입사일/회계연도 기준 자동 부여, 만료 30/7일 전 알림, 만료일 자동 차감
- 추정: 5 SP

### ST-044 (TA-09 SLA, KI-003) 결재 SLA 임박 알림 [P0]
- AC: 단계별 SLA (휴가 4h, 근태수정 24h 등 회사 설정), 임박 시 다음 결재자 알림 + 카카오 폴백
- 추정: 5 SP

### ST-045 (요청 취소) Leave/AttendanceMod/Approval 취소 흐름 [P0]
- AC: 승인 전 즉시, 일부 후 사유 + 결재 흐름 또는 관리자 일괄
- 추정: 3 SP

### ST-046 (조건 분기) 결재라인 동적 결정 [P0]
- AC: 휴가 일수 / 부서 / 직급 조건으로 라인 분기 (예: 5일+ = 대표 결재)
- 추정: 5 SP

**EP-08 합계**: 10 Story / 58 SP (round 55 → 58)

---

## EP-09 테넌트 문서 / 급여

### ST-047 (TA-10, tenant_hr_admin+) 급여명세서 일괄 업로드·발송 [P1]
- AC: Excel 양식 → 500명 PDF 생성 ≤ 5분, 일괄 발송, 7일 미열람 재발송 cron
- 추정: 13 SP

### ST-048 (EM-06, employee) 급여명세서 조회·다운로드 [P1]
- AC: 미열람 강조, 상세 모달 진입 시 자동 열람 처리, PDF Signed URL 15분
- 추정: 5 SP

### ST-049 (EM-08, employee) 증명서 요청 → HR 발급 [P1]
- AC: 종류/제출처/매수/수령방식 입력 → HR 결재 → PDF 발급 (워터마크) → EM-07 다운로드
- 추정: 5 SP

### ST-050 (TA-11, tenant_hr_admin+) 계약서 생성·발송 (MVP) [P1]
- AC: 템플릿 변수 자동 채움 (직원 데이터) → PDF → 알림. 전자서명은 v1.2 슬롯
- 추정: 5 SP

### ST-051 (TA-10, tenant_hr_admin+) 인사 문서 / 회사 문서 관리 [P1]
- AC: 단건 업로드, 권한 설정, 발송 모니터링
- 추정: 3 SP

### ST-052 (EM-07, employee) 문서 조회 [P1]
- AC: 내 문서 + 회사 문서 탭, 미리보기/다운로드/열람 확인
- 추정: 3 SP

**EP-09 합계**: 6 Story / 34 SP

---

## EP-10 테넌트 설정 / 외부 연동

### ST-053 (TA-13, tenant_super) 회사 설정 9탭 [P0 일부]
> 회사정보/근무정책/휴가정책은 P0 (신규 테넌트 필수), 나머지는 P2
- AC: 9탭 (회사/근무/휴가/결재라인/역할/알림/문서양식/보안/감사로그), 변경 적용일 선택
- 추정: 13 SP

### ST-054 (TA-13, tenant_super) 결재라인 조건 분기 정의 [P0]
- AC: 휴가 일수 / 부서 / 직급 조건으로 라인 분기 정책
- 추정: 5 SP

### ST-055 (TA-14, tenant_super) 카카오 알림톡 + SMS + 이메일 연동 [P0]
- AC: NHN Cloud 키 등록 + 테스트 발송 + 폴백 활성화
- 추정: 5 SP

### ST-056 (TA-14, tenant_super) API Key 발급·폐기 [P2]
- AC: 발급 시 한 번 표시, 만료일 + 권한 범위, 사용 로그
- 추정: 3 SP

### ST-057 (TA-12, tenant_hr_admin+) 리포트 5종 MVP [P2]
- AC: 인력/근태/휴가/초과근무/부서비교 5종 + KPI 카드 (커스텀은 v1.3)
- 추정: 8 SP

**EP-10 합계**: 5 Story / 34 SP

---

## EP-11 직원 셀프 서비스

### ST-058 (EM-01, employee) 직원 대시보드 [P0]
> **PWA 진입점**
- AC: KPI 5 + 출퇴근 카드 + 휴가 카드 + 알림 3건, 1초 이내 렌더, Realtime 갱신
- 추정: 5 SP

### ST-059 (EM-09, employee) 내 정보·보안 [P0]
- AC: 7탭, 즉시 수정 / HR 승인 필드 구분, 비밀번호 변경, 2FA, 활성 세션 강제 종료
- 추정: 5 SP

### ST-060 (EM-10, employee) 알림함 + Realtime [P0]
- AC: 헤더 배지 즉시 갱신 (≤ 2초), 클릭 → 관련 화면 + 자동 읽음, 전체 읽음
- 추정: 3 SP

### ST-061 (EM-11, employee, △ MVP) 요청 내역 통합 (EM-05와 통합 운영) [P3]
- AC: MVP는 사이드바 비표시 + EM-05로 리다이렉트, v1.1에 별도 화면
- 추정: 2 SP

### ST-062 (자동 알림) 푸시 + 카카오 폴백 체인 [P0]
- AC: 인앱 즉시 → 30분 미열람 → 카카오 알림톡 → 1h 미수신 → SMS → 24h 미열람 → 이메일
- 추정: 5 SP

**EP-11 합계**: 5 Story / 20 SP

---

## EP-12 공통 인프라

### ST-063 (CM-09/10, all roles) 파일 업로드·미리보기 [P0]
- AC: 50MB 단일, MIME 검증, Storage prefix `tenants/{tid}/`, Signed URL 15분
- 추정: 5 SP

### ST-064 (CM-11/12, hr_admin+) Excel 가져오기/내보내기 [P0]
- AC: 표준 SheetJS, 양식 다운로드 + 검증 + 부분 실패 행 다운로드
- 추정: 5 SP

### ST-065 (CM-13, hr_admin+) PDF 생성 [P0]
- AC: 급여명세서/증명서/리포트 일관 인터페이스, 워터마크 (회사 인장)
- 추정: 5 SP

### ST-066 (CM-15, system) 시스템 알림 발송 채널 [P0]
- AC: 인앱 / 푸시 / 카카오 / SMS / 이메일 5채널, 우선순위 폴백 정책
- 추정: 8 SP

### ST-067 (CM-08, all roles, △ MVP) 공통 검색 (v1.1) [P3]
- AC: MVP는 비활성, v1.1에서 직원/문서/공지/티켓 통합 검색
- 추정: 2 SP

### ST-068 (CM-14, system) 감사 로그 기록 + 보관 [P0]
- AC: DB after-trigger + 애플리케이션 레벨, 5년 보관 정책, 인덱스
- 추정: 5 SP

### ST-069 (Realtime 인프라) Supabase Realtime publication [P0]
- AC: notifications / approvals / approval_steps 등 publication, 클라이언트 구독 wrapper
- AC 인용: `.flowset/prd/04-data-model.md#5-알림-흐름`
- 추정: 5 SP

### ST-072 (CM-06, all roles) 오류·점검 화면 (404/500/maintenance) [P0]
> As a 모든 사용자
> I want to 명확한 오류/점검 안내 + 복구 동선
> So that 장애 시 신뢰 유지 + 운영사 우회

- AC 인용: `.flowset/prd/domains/common.md#cm-06-오류점검-화면`
- AC-1 (404/500/503 페이지), AC-2 (운영사 OP-11 점검 토글 → 비-operator_super 503), AC-3 (operator_super는 점검 중에도 정상 접근/우회 — PRD §CM-06 SSOT), AC-4 (Sentry 자동 보고 — 500)
- 엔티티: MaintenanceWindow:R (matrix.json — public_view), SystemSetting:R
- 추정: 3 SP

**EP-12 합계**: 8 Story / 38 SP (ST-072 추가)

---

## 전체 요약

> **SP SSOT**: stories.md 본 표가 단일 진실. epics.md / estimation.md는 본 표를 인용.

| Epic | Story 수 | SP |
|------|--------|----|
| EP-01 | 5 | 21 |
| EP-02 | 5 | 31 |
| EP-03 | 6 | 26 |
| EP-04 | 4 | 21 |
| EP-05 | 4 | 21 |
| EP-06 | 8 | 40 |
| EP-07 | 6 | 35 |
| EP-08 | 10 | 58 |
| EP-09 | 6 | 34 |
| EP-10 | 5 | 34 |
| EP-11 | 5 | 20 |
| EP-12 | 8 | 38 |
| **합계 (Phase 2)** | **72 Story** | **379 SP** |
| EP-01·03·12 (KI-027~030 batch-003) | 8 (ST-073~080) | 36 |
| **합계 (보강 후)** | **80 Story** | **415 SP** |

## MVP 우선순위 그룹 (보강 후, epics.md / estimation.md SSOT 정합)

### P0 그룹 (Sprint 1~6 대상)

- **50 Story / 275 SP**: EP-01 (5 = 21 SP) + ST-078 (CM-21 약관 P0, 1 Story / 8 SP) + EP-02 (5 = 31 SP) + EP-03 ST-070 (1 = 5 SP, 운영사 대시보드) + EP-06 (8 = 40 SP, ST-071 TA-01 포함) + EP-07 (6 = 35 SP) + EP-08 (10 = 58 SP) + EP-11 P0만 (4 = 18 SP, ST-061 P3 분리) + EP-12 P0만 (7 = 36 SP, ST-067 P3 분리) + EP-10 ST-053/054/055 (3 = 23 SP) — 분해 합 5+1+5+1+8+6+10+4+7+3 = 50 ✓

### P1 그룹 (Sprint 7~9 대상)

- **23 Story / 116 SP**: EP-03 ST-011~015 (5 = 21 SP) + EP-04 (4 = 21 SP) + EP-05 (4 = 21 SP) + EP-09 (6 = 34 SP) + ST-073/074/077/080 (4 = 19 SP — 헤더 프로필·알림 종·PWA 설치·OP-12 운영사 프로필)

### P2 그룹 (Sprint 10 대상)

- **4 Story / 19 SP**: EP-10 ST-056/057 (2 = 11 SP) + ST-076 (CM-19 도움말 패널, 3 SP) + ST-079 (CM-22 온보딩 투어, 5 SP)

### P3 그룹 (v1.1+ 백로그 이관)

- **3 Story / 5 SP**: ST-061 (EM-11 통합 △ EM-05로 리다이렉트, 2 SP) + ST-067 (CM-08 공통 검색 △, 2 SP) + ST-075 (CM-18 검색 안내, 1 SP)

**합계 검증**: 50 + 23 + 4 + 3 = **80 Story** | 275 + 116 + 19 + 5 = **415 SP** ↔ L525 `## 전체 요약` SSOT 정확 정합 ✓

---

## EP-01·03·12 보강 — 라우팅·전역 컴포넌트·정적 페이지 (KI-027~030 batch-003)

신규 8 Story. PRD 보강(`prd/09-routing.md`, `prd/domains/common.md`, `prd/domains/operator/OP-12-profile.md`)과 1:1 매핑.

### ST-073 (CM-16, all roles) 헤더 프로필 드롭다운 [P1]
> As a 모든 인증 사용자
> I want to 헤더 우측 아바타 클릭 시 프로필/보안/도움말/로그아웃 메뉴
> So that 자주 쓰는 액션에 1클릭으로 접근

- **Acceptance**: PRD common.md CM-16 §수용 기준 (역할별 메뉴 매트릭스 + 로그아웃 audit)
- **API**: `GET /api/v1/me/profile`, `POST /api/v1/auth/logout`
- **추정**: 3 SP

### ST-074 (CM-17, all roles) 헤더 알림 종 미니 드롭다운 [P1]
> As a 모든 인증 사용자
> I want to 헤더 종 클릭 시 최근 10건 알림 + 미읽음 배지
> So that 알림 도착 시 즉시 인지·이동

- **Acceptance**:
  - AC-1: Realtime 신규 알림 ≤ 2초 배지 갱신
  - AC-2: 항목 클릭 → 관련 화면 + 자동 읽음
  - AC-3: 미읽음 100건 초과 시 "99+"
  - AC-4: "전체 보기" → CM-07
- **API**: `GET /api/v1/me/notifications?limit=10`, `GET /unread-count`, `POST /mark-all-read`
- **추정**: 3 SP

### ST-075 (CM-18, all roles) 헤더 검색 (MVP 안내) [P3]
> As a 모든 인증 사용자
> I want to 헤더 검색바 클릭 시 v1.1 안내 + 화면별 필터 안내
> So that 미래 기능 인지 + 현재 대안 사용

- **Acceptance**:
  - AC-1: 검색바 노출 (≥ 1024px), 모바일은 숨김
  - AC-2: 클릭/포커스 시 "v1.1 출시 예정" 토스트
- **API**: 없음 (MVP)
- **추정**: 1 SP

### ST-076 (CM-19, all roles) 헤더 도움말 패널 [P2]
> As a 모든 인증 사용자
> I want to ? 클릭 시 현재 화면 도움말 + FAQ + 문의 단축
> So that 화면별 가이드와 운영팀 문의 1클릭

- **Acceptance**:
  - AC-1: screen_id 기반 매핑 (TA-09 등)
  - AC-2: "운영팀 문의" → OP-08 신규 티켓 모달
  - AC-3: "투어 다시 보기" → CM-22 재실행
- **API**: `GET /api/v1/help/screen/:id`, `GET /api/v1/help/faq`, `POST /api/v1/help/contact-ticket`
- **추정**: 3 SP

### ST-077 (CM-20, mobile users) PWA 설치 가이드 [P1]
> As a 모바일 사용자 (iOS/Android)
> I want to 첫 진입 시 PWA 설치 가이드 + 디바이스별 안내
> So that 푸시 알림 + 홈 아이콘으로 빠른 접근

- **Acceptance**:
  - AC-1: iOS 16.4+ 분기, 미만 시 안내 + Tauri 다운로드 CTA
  - AC-2: 이미 standalone 모드 → 자동 dismiss
  - AC-3: 닫기 시 30일 재표시 방지
  - AC-4: 설치 이벤트 추적 (08-success-metrics PWA 설치율 ≥ 30%)
- **API**: `POST /api/v1/me/pwa-install-event`
- **추정**: 5 SP

### ST-078 (CM-21, all users + operator_super) 약관/개인정보 + 동의 이력 [P0]
> As a 사용자 (개인정보보호법 준수)
> I want to 약관·개인정보처리방침 조회 + 신규 버전 강제 동의
> So that PIPA §15/§29 컴플라이언스 충족

- **Acceptance**:
  - AC-1: 비로그인도 푸터 링크로 활성 버전 조회 가능
  - AC-2: 신규 버전 게시 시 다음 로그인에서 강제 동의 가드 (`must_accept=true`)
  - AC-3: user_consents INSERT (version + ip + ua + source)
  - AC-4: operator_super가 신규 버전 게시 시 기존 active → false 트랜잭션
  - AC-5: 운영사 감사 화면에서 동의 통계 + 이력 조회
  - AC-6: ko/en 페어 게시 의무 (운영사가 active=true 시 두 언어 모두 존재 검증, 영문은 참고 번역, 법적 효력은 ko) — matrix.json `LegalDocument._comment "i18n MVP ko+en 동시 게시 의무"` 정합
- **API**: `GET /api/v1/legal/documents?language=`, `POST /api/v1/me/consents`, `GET /me/consents/required`, `POST /api/v1/operator/legal/documents` (ko/en 페어 검증 포함)
- **추정**: 8 SP

### ST-079 (CM-22, all roles 첫 로그인) 첫 사용자 온보딩 투어 [P2]
> As a 첫 로그인 사용자
> I want to 역할별 4단계 투어 모달
> So that 핵심 화면을 즉시 학습

- **Acceptance**:
  - AC-1: `first_login_at IS NULL` 시 자동 시작
  - AC-2: 역할별 4단계 (operator/tenant_super/manager/employee 분기)
  - AC-3: 종료 시 `PATCH /me/profile { firstLoginAt }`
  - AC-4: "건너뛰기" → audit_logs (action=onboarding_skipped)
  - AC-5: 다시 보기는 CM-19 도움말 + EM-09/OP-12에서
- **API**: `PATCH /api/v1/me/profile`, `POST /api/v1/me/onboarding/event`
- **추정**: 5 SP

### ST-080 (OP-12, operator_*) 운영사 본인 프로필 + 보안 [P1]
> As a 운영사 사용자
> I want to 본인 프로필·2FA·세션·알림·활동 관리
> So that 직원 EM-09 동등 + 운영사 보안 강화

- **Acceptance**: PRD operator/OP-12-profile.md §8 Gherkin 4 시나리오 인용 (강제 2FA + super가 staff 강제 종료 + 마지막 super 보호 + 활동 다운로드)
- **API**: OP-12 §7의 14 엔드포인트 (PRD `OP-12-profile.md:114-127` 그대로 인용 — operator-prefix 정확): `GET /api/v1/operator/me/profile` + `PATCH /api/v1/operator/me/profile` + `POST /api/v1/operator/me/avatar` + `POST /api/v1/me/security/change-password` + `POST /api/v1/me/security/2fa/enable` + `POST /api/v1/me/security/2fa/verify` + `POST /api/v1/me/security/2fa/regenerate` + `GET /api/v1/me/security/sessions` + `DELETE /api/v1/me/security/sessions/:id` + `POST /api/v1/operator/users/:id/force-logout` (super only) + `GET /api/v1/me/notifications/preferences` + `PATCH /api/v1/me/notifications/preferences` + `GET /api/v1/me/audit-logs?days=30` + `GET /api/v1/me/consents`
- **추정**: 8 SP

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 69 Story / 366 SP | Phase 2 진입 |
| 2026-05-15 | 72 Story / 379 SP (Phase 2 attempt 2 후 정정) | evaluator |
| 2026-05-15 | ST-073~080 추가 (8 Story / 36 SP) — 합계 80 Story / 415 SP | KI-027~030 batch-003 |
| 2026-05-19 | L6-28 인용 표 헤더 80 Story 갱신 + ST-073~080 매핑 5행 추가 + ST-078 AC-6 ko/en 페어 의무 + ST-080 OP-12 14 endpoint 정정 (PRD §7 14개 실측) + L524 라벨 EP-01·03·12 정정 | KI-034 closure + Phase 2 재평가 1차 정정 |
| 2026-05-19 | MVP 그룹 절 (L527~545) 재작성 — P0/P1/P2/P3 4-tier + EP-11/EP-12 P0만 18/36 분리 표기 (ST-061/067 P3 별행) + 합계 검증 50+23+4+3=80 Story / 275+116+19+5=415 SP 정합 + L549 섹션 헤더 EP-01·03·12 동기화 | Phase 2 재평가 2차 정정 (P1-B closure) |
| 2026-05-19 | P0 Story 수 헤더 52→50 정정 (분해 식 실측 5+1+5+1+8+6+10+4+7+3=50) + 합계 검증 등호 정합 + estimation.md L42 P0 50 + L46 MVP P0~P2 77 동기 갱신 | Phase 2 재평가 3차 정정 (P1 5건 mechanical closure) |
