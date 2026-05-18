# Epic 마스터 (12개)

> Epic = 도메인 × 기능 클러스터. 각 Epic은 여러 화면 + 엔티티를 묶음.

---

## EP-01 인프라 / 인증 / 권한 베이스

- **목표**: 모든 도메인의 기반인 인증/세션/권한/RLS/모노레포 셋업. 다른 Epic의 선행 조건.
- **화면**: CM-01 로그인, CM-02 비밀번호 찾기, CM-03 최초 계정 활성화, CM-04 2FA, CM-05 권한 없음
- **엔티티**: User, Role (기본 6 역할 시드)
- **의존**: 없음 (최선행)
- **수용 기준**:
  - 모든 역할(6개)로 로그인 가능
  - Supabase Auth + TOTP 2FA 동작
  - 비밀번호 정책(10자+) 강제
  - 5회 실패 → 5분 잠금
  - RLS 정책 골격 (`tenant_id` 클레임 검증) 모든 테이블 적용
  - 운영사 우회 정책 (`operator_*` 역할) 적용
- **MVP 우선순위**: P0 (Sprint 1)
- **추정**: 21 SP (스토리포인트)

---

## EP-02 운영사 테넌트 라이프사이클

- **목표**: 운영사가 신규 고객사를 만들고 관리·비활성화하는 전체 흐름.
- **화면**: OP-02 테넌트 관리, OP-03 테넌트 상세, OP-04 신규 등록 (7단계 마법사)
- **엔티티**: Tenant, TenantDraft, Subscription, Plan, FeatureFlag, TenantSetting, Department, WorkPolicy, LeaveType, ApprovalLine, DocumentTemplate, User, AuditLog
- **의존**: EP-01
- **수용 기준**:
  - 7단계 마법사 정상 완료 + 임시저장/재진입
  - 사업자번호/도메인/이메일 중복 실시간 검증
  - 트랜잭션: tenants + subscriptions + tenant_settings + admin user 동시 INSERT
  - 관리자 초대 메일 발송 (실패 시 재시도)
  - 상태 변경 (활성/비활성/만료/보관) 감사 로그
  - 운영사 1회 작업 ≤ 2시간 (J1 여정 KPI)
- **MVP 우선순위**: P0
- **추정**: 34 SP

---

## EP-03 운영사 수익 / 청구 / 플랜

- **목표**: 요금제 마스터 + 월 청구 + 미수금 모니터링.
- **화면**: OP-05 구독/요금제, OP-06 청구/정산 (△), OP-10 운영 리포트 (△)
- **엔티티**: Plan, Subscription, Invoice
- **의존**: EP-01, EP-02
- **수용 기준**:
  - 요금제 CRUD + 사용 중 플랜 가격 변경 시 다음 청구일부터 적용
  - 월 1일 일괄 청구 발행 (cron)
  - 수동 결제완료 처리 + 환불 (super만)
  - 15일 결제 미완료 → 자동 overdue 전환 + 알림
  - 리포트 6 KPI + 4 차트 (MVP 단순화)
- **MVP 우선순위**: P1 (OP-06/OP-10 △ 단순화)
- **추정**: 21 SP

---

## EP-04 운영사 기능 권한 / 시스템

- **목표**: 글로벌/플랜/테넌트 기능 플래그 + 운영사 시스템 설정.
- **화면**: OP-07 기능 플래그, OP-11 시스템 설정
- **엔티티**: FeatureFlag, FeatureFlagOverride, SystemSetting, OperatorUser, MaintenanceWindow, BackupJob, ApiKey
- **의존**: EP-01, EP-02
- **수용 기준**:
  - 기능 플래그 CRUD + 글로벌/플랜/예외 3계층 머지
  - 클라이언트 평가 API 응답 시간 ≤ 100ms
  - 점검 모드 토글 (즉시/예약) + 비-operator 사용자 503 응답
  - 자동 백업 (일 1회) + 수동 트리거
  - 운영자 초대 + 2FA 강제 (`require_operator_2fa`)
- **MVP 우선순위**: P1
- **추정**: 21 SP

---

## EP-05 운영 지원 / 티켓 / 감사

- **목표**: 고객 문의 응대 + 플랫폼 전체 감사 로그.
- **화면**: OP-08 지원 티켓, OP-09 감사 로그
- **엔티티**: Ticket, TicketMessage, AuditLog
- **의존**: EP-01
- **수용 기준**:
  - 운영사/테넌트 양방향 티켓 생성/응답
  - 내부 메모 (사용자 비공개)
  - SLA (P0=30분, P1=2h, P2=24h, P3=72h) 임박 알림 (KI-001 처리)
  - 감사 로그 모든 핵심 액션 기록 + 5년 보관
  - 운영사 cross-tenant 감사 조회 + CSV 내보내기
- **MVP 우선순위**: P1
- **추정**: 21 SP

---

## EP-06 테넌트 직원 / 조직 관리

- **목표**: 회사의 직원 마스터 + 조직 트리.
- **화면**: TA-02 직원 관리, TA-03 직원 상세, TA-04 조직도
- **엔티티**: Employee, User, Department, Role, EmployeeChangeRequest, AuditLog
- **의존**: EP-01, EP-02 (테넌트 존재)
- **수용 기준**:
  - 직원 CRUD (status: invited/probation/active/on_leave/resigned/inactive)
  - 일괄 업로드 Excel (검증 + 오류 행 다운로드)
  - 직원 초대 메일 발송 + 7일 만료 토큰
  - 조직 트리 드래그앤드롭 이동 (parent 변경 시 자식 경로 재계산)
  - 직원 변경 요청 (계좌·가족정보 등) HR 승인 흐름
  - 휴직/퇴사 처리 시 활성 세션 강제 종료
  - 매니저는 자기 팀만 조회 (RLS + role 검증)
- **MVP 우선순위**: P0
- **추정**: 34 SP

---

## EP-07 테넌트 근태 관리

- **목표**: 직원 출퇴근 기록 + HR/팀장 모니터링 + 수정 요청 흐름.
- **화면**: EM-02 출퇴근 (PWA 핵심), TA-05 근태 관리, TA-06 근태 수정 요청
- **엔티티**: Attendance, AttendanceModification, WorkPolicy, Approval, ApprovalStep
- **의존**: EP-01, EP-06 (직원 존재), EP-10 (work_policy 정의)
- **수용 기준**:
  - 직원 PWA 출근/퇴근/휴게 1탭 (≤ 800ms 응답)
  - GPS 위치 인증 (포그라운드 클릭 시점, 반경 정책)
  - 오프라인 큐잉 (IndexedDB) + 복귀 시 자동 동기화
  - 지각/조퇴/결근 자동 분류 (work_policy 기준)
  - 23:59 cron — 퇴근 누락 자동 감지 + 알림
  - 수정 요청 결재 (직원 → 팀장 → HR)
  - 승인 시 원본 attendances 갱신 + 이력 보존
- **MVP 우선순위**: P0
- **추정**: 34 SP

---

## EP-08 테넌트 휴가 / 결재

- **목표**: 휴가 신청·승인 + 결재 통합 인박스.
- **화면**: EM-03 휴가 신청, EM-04 내 휴가 현황, EM-05 내 결재, TA-07 휴가 관리, TA-08 휴가 신청 상세, TA-09 결재/승인
- **엔티티**: Leave, LeaveBalance, LeaveType, Approval, ApprovalStep, ApprovalLine, CertificateRequest, EmployeeChangeRequest
- **의존**: EP-01, EP-06, EP-10 (결재라인 정의)
- **수용 기준**:
  - 휴가 신청 30초 내 (입력 + 잔여 검증 + 결재라인 자동 적용)
  - 잔여 부족 / 중복 신청 차단
  - 결재라인 조건 분기 (5일 이상 = 대표 결재)
  - 다단계 결재 (단계별 상태)
  - 최종 승인 시 LeaveBalance.used 차감
  - 결재 통합 인박스 (휴가/근태/증명서/정보변경 4유형)
  - PWA 모바일 결재 평균 ≤ 4시간 (J2 여정 KPI)
  - 결재 SLA 임박 알림 (KI-003 처리)
- **MVP 우선순위**: P0
- **추정**: 55 SP

---

## EP-09 테넌트 문서 / 급여

- **목표**: 급여명세서 배포 + 인사 문서 + 증명서 발급.
- **화면**: TA-10 급여/문서 관리, TA-11 문서함/전자계약 (△), EM-06 급여명세서, EM-07 문서 조회, EM-08 증명서 요청
- **엔티티**: Document, DocumentTemplate, CertificateRequest, Signature (v1.2 슬롯)
- **의존**: EP-01, EP-06, EP-10 (양식 등록)
- **수용 기준**:
  - 급여명세서 Excel 일괄 업로드 → PDF 자동 생성 (500명 ≤ 5분)
  - 일괄 발송 + 알림 (인앱 + 카카오 + SMS 폴백)
  - 7일 미열람 자동 재발송 cron
  - 직원 모달 진입 시 자동 열람 처리
  - 증명서 요청 → HR 처리 → 발급 PDF 다운로드 (워터마크)
  - 계약서 템플릿 변수 자동 채움 + PDF 생성 (전자서명 v1.2 슬롯)
  - 본인/팀/HR 권한 매트릭스 RLS
- **MVP 우선순위**: P1
- **추정**: 34 SP

---

## EP-10 테넌트 설정 / 외부 연동

- **목표**: 회사 정책 마스터 + 카카오/SMS/이메일 연동.
- **화면**: TA-13 회사 설정, TA-14 외부 연동 (△), TA-12 리포트 (△)
- **엔티티**: TenantSetting, WorkPolicy, LeaveType, ApprovalLine, DocumentTemplate, Role, Integration, IntegrationLog, ApiKey, AuditLog
- **의존**: EP-01, EP-02 (테넌트 존재)
- **수용 기준**:
  - 9개 설정 탭 (회사정보/근무/휴가/결재라인/역할/알림/문서양식/보안/감사로그)
  - 변경 시 적용일 선택 (즉시 / 예약)
  - 카카오 알림톡 연결 + 테스트 발송 + 폴백 활성화
  - 결재라인 조건 분기 (일수 / 부서 / 직급)
  - API Key 발급 (super만, 만료일 + 권한 범위)
  - 리포트 5종 (인력/근태/휴가/초과근무/부서비교) MVP 단순화
- **MVP 우선순위**: P2 (단, TA-13 회사 설정은 P0 — 신규 테넌트 운영 필수)
- **추정**: 34 SP

---

## EP-11 직원 셀프 서비스

- **목표**: 직원의 일상 진입점 — 대시보드/프로필/알림.
- **화면**: EM-01 내 대시보드, EM-09 내 정보, EM-10 알림함, EM-11 요청 내역 (△ EM-05 통합)
- **엔티티**: Employee, User, Notification, EmployeeChangeRequest
- **의존**: EP-01, EP-06, EP-07, EP-08, EP-09 (대시보드가 모두 집계)
- **수용 기준**:
  - EM-01 진입 ≤ 1초 (PWA)
  - 출퇴근 카드 1탭 (≤ 800ms)
  - KPI 5개 + 출퇴근/휴가 카드 + 최근 알림 3건
  - 알림 Realtime broadcast (≤ 2초 헤더 배지 갱신)
  - PWA 푸시 (iOS 16.4+) + 카카오 폴백 (30분 미열람)
  - 내 정보 변경 요청 흐름 (계좌 변경 2FA 재인증)
  - 활성 세션 강제 종료
- **MVP 우선순위**: P0
- **추정**: 21 SP

---

## EP-12 공통 인프라 (알림 / 파일 / 감사)

- **목표**: 모든 도메인이 공유하는 공통 시스템.
- **화면**: CM-07 알림 센터, CM-09 파일 업로드, CM-10 미리보기, CM-11~13 Excel/PDF, CM-14 감사 로그 기록, CM-15 시스템 알림 발송
- **엔티티**: Notification, AuditLog (애플리케이션 레벨 + DB after-trigger), File metadata
- **의존**: EP-01
- **수용 기준**:
  - Supabase Realtime broadcast (≤ 2초)
  - Storage prefix `tenants/{tenantId}/{domain}/{yyyy-mm}/`
  - Signed URL 15분 만료
  - PDF (Puppeteer 또는 React-PDF) + Excel (SheetJS) 일관 인터페이스
  - 카카오 알림톡 → SMS → 이메일 폴백 체인 (CM-15)
  - audit_logs 트리거 모든 핵심 테이블 적용
- **MVP 우선순위**: P0 (모든 Epic의 인프라)
- **추정**: 34 SP

---

## 총 추정

> **SSOT**: stories.md `## 전체 요약` 표. 본 표는 그 인용.

| Epic | Story 수 | SP |
|------|--------|----|
| EP-01 | 5 (+ ST-078 약관) | 21 (+ 8) |
| EP-02 | 5 | 31 |
| EP-03 | 6 (+ ST-080 OP-12) | 26 (+ 8) |
| EP-04 | 4 | 21 |
| EP-05 | 4 | 21 |
| EP-06 | 8 | 40 |
| EP-07 | 6 | 35 |
| EP-08 | 10 | 58 |
| EP-09 | 6 | 34 |
| EP-10 | 5 | 34 |
| EP-11 | 5 | 20 |
| EP-12 | 8 base + 6 boost (ST-073/074/075/076/077/079 헤더 컴포넌트 4 + PWA 설치 + 온보딩 투어) | 38 (+ 20) |
| **합계 (Phase 2)** | **72** | **379 SP** |
| **합계 (보강 후)** | **80** | **415 SP** |

> 환산: 1 SP ≈ 0.5 MD (개발자 1인 작업일) 가정 시 보강 후 **약 218 MD**. 풀타임 개발자 2명 × 약 7개월 (60 MD/월/명, PR 리뷰/대기 보수적 환산은 838 MD — `tasks.md` L466 합계 행 참조).

## MVP 우선순위 그룹

- **P0 (Sprint 1~6)**: EP-01 (+ ST-078 약관·동의 PIPA 컴플라이언스), EP-02, EP-06, EP-07, EP-08, EP-11 (ST-061 제외), EP-12 (ST-067 제외) + EP-03 ST-070(운영사 대시보드) + EP-10 ST-053/054/055(회사설정/결재라인/카카오 알림톡)
- **P1 (Sprint 7~9)**: EP-03 (ST-011~015), EP-04, EP-05, EP-09 + ST-073/074/077/080 (헤더 프로필·알림 종·PWA 설치·OP-12 운영사 프로필)
- **P2 (Sprint 10+)**: EP-10 나머지 (ST-056/057) + ST-076/079 (헤더 도움말·온보딩 투어)
- **P3 (v1.1+ 백로그)**: ST-061 (EM-11 통합), ST-067 (공통 검색), ST-075 (검색 안내)

> **EP-10 분류 명확화**: TA-13 회사 설정(ST-053/054)은 신규 테넌트 운영 필수로 P0. TA-14 카카오 알림톡(ST-055)도 NHN Cloud 채널 인증 30~60일 소요라 Sprint 1 진입 시 신청하고 Sprint 2~3 통합 위해 P0. TA-14 API Key(ST-056)와 TA-12 리포트(ST-057)는 운영 안정화 후 P2.
> **ST-078 P0 분류 사유**: PIPA §15/§29 컴플라이언스 의무로 베타 1호 고객 진입 전 필수. user_consents INSERT는 RLS(ST-005) + audit_logs(ST-068) 의존이라 Sprint 1에서 EP-01과 동시 진행.

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 12 Epic + 364 SP | Phase 2 진입 |
| 2026-05-15 | EP-01/03/12 보강 (+8 Story / +36 SP, ST-073~080) | KI-027~030 batch-003 |
| 2026-05-19 | L247 환산 갱신 (190 MD/5개월 → 218 MD/7개월, 838 MD 보수 참조) + MVP 우선순위 그룹 보강 (ST-078 P0 / ST-073/074/077/080 P1 / ST-076/079 P2 / ST-061/067/075 P3 — stories.md SSOT 정합) | Phase 2 재평가 1차 정정 |
| 2026-05-19 | L243 EP-12 boost 표기 명확화 (8 base + 6 boost ID 명시) + L247 tasks.md 인용 L459 → L466 합계 행 정정 | Phase 2 재평가 2차 정정 (P3 closure) |
