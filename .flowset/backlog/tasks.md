# Task WBS

> Story → Task 분해. 유형: **FE** (프론트엔드) / **BE** (백엔드/Edge Function) / **DB** (마이그레이션/RLS) / **QA** (테스트) / **DEVOPS** (인프라/CI).
> Task ID: `TS-NNN-{Story}-{유형}-{seq}`.
> 작성 정책: Epic 단위로 패턴이 반복되므로 **대표 Story의 Task만 완전 분해**, 나머지는 동일 패턴 적용 (Phase 6 스프린트 계획에서 구체화).

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
- **TS-021-005-QA-1**: 권한 매트릭스 자동 테스트 (음성/양성 케이스 — 6 역할 × 36 화면 핵심 엔드포인트) — 8h

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

**EP-06 Task 합계**: 13 Task / ≈ 62 MD

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

## EP-03 / EP-04 / EP-05 / EP-09 / EP-10 / EP-11 / EP-12

(Task 분해 패턴은 위와 동일. 각 Story마다 DB → BE → FE → QA Task 1~3개씩.)

### Task 추정 (Epic 단위 요약)

> **Story 수 SSOT**: stories.md. **Task/MD**: 본 표가 SSOT (분해 추정).

| Epic | Story 수 | Task 수 추정 | MD 추정 |
|------|--------|------------|---------|
| EP-01 | 5 | 21 | 75 |
| EP-02 | 5 | 19 | 70 |
| EP-03 | 6 | 17 | 56 |
| EP-04 | 4 | 14 | 45 |
| EP-05 | 4 | 13 | 45 |
| EP-06 | 8 | 16 | 70 |
| EP-07 | 6 | 14 | 61 |
| EP-08 | 10 | 16 | 77 |
| EP-09 | 6 | 16 | 60 |
| EP-10 | 5 | 15 | 60 |
| EP-11 | 5 | 14 | 50 |
| EP-12 | 8 | 20 | 70 |
| **합계** | **72** | **195 Task** | **739 MD** |

> 1 MD = 1 개발자 작업일 (8h). 739 MD = 풀타임 개발자 2명 × 6개월 (60 MD/월/명).
> Phase 6 스프린트 계획에서 6 스프린트 × 2주 × 2명 = 약 240 MD 분량으로 MVP 압축, 나머지는 v1.1+ 백로그로 이관.

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
