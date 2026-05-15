# 09. 진입점·라우팅·글로벌 컴포넌트

> **출처**: KI-027/028/030 (Phase 5에서 발견된 PRD 결함, 2026-05-15) 보강.
> spec §4 IA가 36 화면 트리만 정의하고 라우팅 매트릭스·전역 컴포넌트·정적 페이지를 누락하여 본 문서로 보강한다.
> 본 문서는 04-data-model.md / 06-mvp-scope.md / 02-device-matrix.md / 03-tech-architecture.md와 정합 유지.

## 1. 호스트·서브도메인 전략

| 환경 | 호스트 | 라우팅 방식 |
|------|--------|------------|
| local | `localhost:3000` | 단일 호스트 + 경로 분리 |
| preview | `pr-{n}.flowhr.vercel.app` | 단일 호스트 + 경로 분리 |
| staging | `staging.flowhr.kr` | 단일 호스트 + 경로 분리 |
| production | `app.flowhr.kr` | 단일 호스트 + 경로 분리 |

**MVP 결정 (2026-05-15)**: 단일 호스트 `app.flowhr.kr` + 경로 prefix(`/operator`, `/admin`, `/me`)로 도메인 분리. 와일드카드 SSL·DNS 설정·공유 쿠키 복잡도 회피. 테넌트별 슬러그(`{slug}.flowhr.kr`)는 v1.2 카카오워크/Slack 수준 IDP 연동 시점에 재검토.

테넌트 식별은 JWT `tenant_id` claim으로 처리. URL에 테넌트 슬러그 노출하지 않음 (운영사 OP-03 같은 cross-tenant 화면은 path param `:tenantId` 사용).

## 2. 라우트 인벤토리

### 2-1. 비로그인 영역 (인증 게이트 통과 전)

| 경로 | 화면 ID | 용도 | 누가 접근 |
|------|---------|------|---------|
| `/` | (랜딩) | 마케팅 랜딩 + 로그인 CTA | 비로그인 |
| `/login` | CM-01 | 로그인 | 비로그인 |
| `/forgot-password` | CM-02 | 비밀번호 찾기 | 비로그인 |
| `/reset-password?token={t}` | CM-02 | 비밀번호 재설정 | 비로그인 (토큰 검증) |
| `/activate?token={t}` | CM-03 | 최초 계정 활성화 | 비로그인 (초대 토큰) |
| `/2fa` | CM-04 | 2FA TOTP 입력 (로그인 도중) | 인증 1단계 통과 |
| `/legal/terms` | CM-21 | 이용약관 (단독 페이지) | 모두 |
| `/legal/privacy` | CM-21 | 개인정보처리방침 (단독 페이지) | 모두 |
| `/install` | CM-20 | PWA 설치 가이드 | 모두 (모바일 우선 노출) |
| `/maintenance` | CM-06 | 점검 모드 안내 | 모두 (점검 활성 시 자동 리다이렉트) |
| `/404` | CM-06 | 페이지 없음 | 모두 |
| `/500` | CM-06 | 서버 오류 | 모두 |

### 2-2. 운영사 영역 (`operator_*` 역할 전용)

| 경로 | 화면 ID | 용도 |
|------|---------|------|
| `/operator` | OP-01 | 운영사 대시보드 (도메인 진입점) |
| `/operator/tenants` | OP-02 | 테넌트 관리 |
| `/operator/tenants/:tenantId` | OP-03 | 테넌트 상세 |
| `/operator/tenants/new` | OP-04 | 신규 테넌트 등록 마법사 |
| `/operator/plans` | OP-05 | 구독/요금제 관리 |
| `/operator/billing` | OP-06 | 청구/정산 |
| `/operator/feature-flags` | OP-07 | 기능 플래그 |
| `/operator/tickets` | OP-08 | 지원 티켓 |
| `/operator/audit-logs` | OP-09 | 감사 로그 |
| `/operator/reports` | OP-10 | 운영 리포트 |
| `/operator/system-settings` | OP-11 | 시스템 설정 |
| `/operator/me/profile` | OP-12 | 운영사 본인 프로필 (보강) |
| `/operator/notifications` | CM-07 | 알림 센터 (운영사 컨텍스트) |

### 2-3. 테넌트 관리자 영역 (`tenant_super` / `tenant_hr_admin` / `tenant_manager`)

| 경로 | 화면 ID | 용도 |
|------|---------|------|
| `/admin` | TA-01 | 관리자 대시보드 (도메인 진입점) |
| `/admin/employees` | TA-02 | 직원 관리 |
| `/admin/employees/:id` | TA-03 | 직원 상세 |
| `/admin/org` | TA-04 | 조직도/부서 |
| `/admin/attendance` | TA-05 | 근태 관리 |
| `/admin/attendance/modifications` | TA-06 | 근태 수정 요청 |
| `/admin/leaves` | TA-07 | 휴가 관리 |
| `/admin/leaves/:id` | TA-08 | 휴가 신청 상세 |
| `/admin/approvals` | TA-09 | 결재/승인 |
| `/admin/payroll` | TA-10 | 급여/문서 관리 |
| `/admin/contracts` | TA-11 | 문서함/전자계약 |
| `/admin/reports` | TA-12 | 리포트 |
| `/admin/settings` | TA-13 | 회사 설정 |
| `/admin/integrations` | TA-14 | 외부 연동 |
| `/admin/notifications` | CM-07 | 알림 센터 (관리자 컨텍스트) |

### 2-4. 직원 영역 (`employee` + 모든 tenant 역할의 본인 화면)

| 경로 | 화면 ID | 용도 |
|------|---------|------|
| `/me` | EM-01 | 내 대시보드 (도메인 진입점) |
| `/me/attendance` | EM-02 | 출퇴근 |
| `/me/leaves/new` | EM-03 | 휴가 신청 |
| `/me/leaves` | EM-04 | 내 휴가 현황 |
| `/me/approvals` | EM-05 | 내 결재/진행현황 |
| `/me/payslips` | EM-06 | 급여명세서 조회 |
| `/me/documents` | EM-07 | 문서 조회 |
| `/me/certificates/new` | EM-08 | 증명서 요청 |
| `/me/profile` | EM-09 | 내 정보/프로필 |
| `/me/notifications` | EM-10 | 알림함 (전체 페이지) |
| `/me/requests` | EM-11 | 요청 내역 |

### 2-5. 권한 거부 / 오류

| 경로 | 화면 ID | 트리거 |
|------|---------|--------|
| `/forbidden` | CM-05 | 사용자가 직접 URL 진입했으나 권한 없음 (RLS 차단 후) |
| `/404` | CM-06 | 존재하지 않는 라우트 |
| `/500` | CM-06 | Edge Function 또는 서버 오류 (Sentry 자동 보고) |
| `/maintenance` | CM-06 | `maintenance_windows.active=true` (operator_super는 우회) |

## 3. 진입 라우팅 매트릭스 (`/` 접근 시 분기)

`/` 진입 시 미들웨어가 다음 순서로 처리:

```text
1. 점검 모드 active? (operator_super 제외)
   ├─ Yes → /maintenance
   └─ No → 2

2. JWT 세션 유효?
   ├─ No → /login (랜딩 표시)
   └─ Yes → 3 (역할 매트릭스)

3. 역할별 분기
   ├─ operator_super | operator_staff → /operator (OP-01)
   ├─ tenant_super | tenant_hr_admin | tenant_manager → /admin (TA-01)
   └─ employee → /me (EM-01)

4. 첫 로그인 (users.first_login_at IS NULL)?
   ├─ Yes → 역할별 대시보드 + CM-22 온보딩 투어 모달 자동 표시
   └─ No → 그대로
```

`/login` 진입 시 이미 인증된 사용자는 위 3단계 매트릭스로 자동 리다이렉트.

## 4. 권한 미일치 처리

사용자가 자신의 역할로 접근 불가능한 경로(예: employee가 `/operator/tenants` 진입)에 도달했을 때:

| 시나리오 | 처리 |
|---------|------|
| URL 직접 입력 (북마크 등) | RLS 또는 미들웨어가 차단 → `/forbidden` (CM-05) 표시 |
| 외부 링크 클릭 (이메일/메신저) | 동일 — `/forbidden` |
| 클라이언트 네비게이션 버그 (잘못된 a 태그) | 클라이언트가 차단 + `/forbidden` |
| 권한 매트릭스 변경으로 갑자기 차단 | 다음 페이지 로드 시 `/forbidden` + "역할 변경 안내" 메시지 |
| 자기 역할 대시보드로 가야 정상인 경우 | `/forbidden` §"내 대시보드로 이동" 버튼이 §3 매트릭스 호출 |

`/forbidden` 화면(CM-05)은 다음 정보 표시:
- 접근 시도 경로
- 현재 역할
- 시도 시각 + 감사 로그 ID (audit_logs.action='access_denied')
- 액션: "이전 화면", "내 대시보드로", "운영팀 문의 (티켓 생성)"

## 5. 세션 만료 처리

Supabase JWT 만료 + refresh 실패 시:

```text
1. 클라이언트 SDK가 401 응답 감지
2. 5분 idle 경고 모달 (만료 5분 전, TanStack Query 비활성 감지) — 옵션 토글로 운영
3. 만료 시점 → 모든 진행 중 mutation 큐에 보존
4. /login?return_url={현재경로} 리다이렉트 + 토스트 "세션이 만료되었습니다"
5. 재로그인 성공 → return_url로 자동 복귀
6. 보존된 mutation은 사용자 확인 후 재시도 (예: "작성 중인 결재 요청을 다시 제출하시겠습니까?")
```

세션 만료 임계:
- access_token 1시간
- refresh_token 30일 (sliding)
- "로그인 유지" 미체크 시 refresh_token 12시간

## 6. 글로벌 컴포넌트

모든 인증 영역 화면(`/operator`, `/admin`, `/me`)에 자동 적용되는 컴포넌트.

### 6-1. 글로벌 헤더 (모든 도메인 공통)

| 위치 | 컴포넌트 | 화면 ID | 핸들러 |
|------|---------|---------|--------|
| 좌측 | 로고 → `/{도메인 진입점}` | — | 도메인별 대시보드로 이동 |
| 좌측 | 햄버거 (모바일 only) | — | 사이드바 토글 |
| 중앙 (≥1024px) | 검색바 | CM-18 | 클릭 시 명령 팔레트 (MVP는 v1.1 안내) |
| 우측 | 도움말 ?  | CM-19 | 클릭 시 도움말 패널 |
| 우측 | 알림 종 🔔 + 배지 | CM-17 | 클릭 시 알림 미니 드롭다운 |
| 우측 | 프로필 아바타 | CM-16 | 클릭 시 프로필 드롭다운 |

각 드롭다운(CM-16/17/18/19)의 상세 명세는 `domains/common.md`.

### 6-2. 글로벌 사이드바 (역할별)

운영사 사이드바 (`/operator/*`):

| 메뉴 | 활성 라우트 | 권한 |
|------|------------|------|
| 대시보드 | `/operator` | operator_* |
| 테넌트 | `/operator/tenants*`, `/operator/tenants/new` | operator_* |
| 구독·요금제 | `/operator/plans` | operator_* |
| 청구·정산 | `/operator/billing` | operator_* |
| 기능 플래그 | `/operator/feature-flags` | operator_super (operator_staff R) |
| 지원 티켓 | `/operator/tickets` | operator_* |
| 감사 로그 | `/operator/audit-logs` | operator_* |
| 리포트 | `/operator/reports` | operator_* |
| 시스템 설정 | `/operator/system-settings` | operator_super |

테넌트 관리자 사이드바 (`/admin/*`):

| 메뉴 | 활성 라우트 | 권한 |
|------|------------|------|
| 대시보드 | `/admin` | tenant_* |
| 직원 | `/admin/employees*`, `/admin/employees/:id`, `/admin/org` | tenant_super, tenant_hr_admin |
| 근태 | `/admin/attendance*`, `/admin/attendance/modifications` | tenant_*, manager (own_team) |
| 휴가 | `/admin/leaves*`, `/admin/leaves/:id` | tenant_*, manager (own_team) |
| 결재 | `/admin/approvals` | 모두 (assigned 한정) |
| 급여·문서 | `/admin/payroll`, `/admin/contracts` | tenant_super, tenant_hr_admin |
| 리포트 | `/admin/reports` | tenant_super, tenant_hr_admin |
| 설정 | `/admin/settings`, `/admin/integrations` | tenant_super (HR partial) |

직원 사이드바 (`/me/*`):

| 메뉴 | 활성 라우트 |
|------|------------|
| 대시보드 | `/me` |
| 출퇴근 | `/me/attendance` |
| 휴가 | `/me/leaves`, `/me/leaves/new` |
| 결재 | `/me/approvals`, `/me/requests` |
| 급여 | `/me/payslips` |
| 문서 | `/me/documents`, `/me/certificates/new` |
| 알림 | `/me/notifications` |
| 내 정보 | `/me/profile` |

### 6-3. 글로벌 푸터

| 위치 | 항목 |
|------|------|
| 좌측 | © 2026 FlowHR |
| 중앙 | 이용약관(`/legal/terms`) · 개인정보처리방침(`/legal/privacy`) · 도움말(CM-19) · 문의(OP-08 또는 외부 메일) |
| 우측 | 버전 표시 (`v0.1.0-beta`) + 마지막 업데이트 시각 |

PWA·Tauri에서는 푸터 숨김 옵션 (모바일 화면 공간 확보).

### 6-4. 점검 사전 공지 배너

`maintenance_windows`에 미래 시작 점검이 등록되면 시작 시각 N분 전부터 모든 화면 상단에 노란 배너 표시:

```text
[점검 안내] 2026-05-20 22:00 ~ 23:00 시스템 점검이 예정되어 있습니다. 미리 작업을 저장해 주세요.
```

배너 표시 정책:
- N = `maintenance_windows.notice_minutes_before` (기본 60분)
- 사용자가 X로 닫으면 localStorage에 저장 → 해당 점검 ID는 재표시 안 함
- 점검 시작 5분 전부터는 닫아도 다시 표시 (긴급)
- 점검 시작 시 → `/maintenance` 자동 리다이렉트

### 6-5. 첫 사용자 온보딩 투어

화면 ID: CM-22. `users.first_login_at IS NULL` 조건이면 역할별 대시보드 진입 직후 모달 오버레이로 자동 시작.

| 역할 | 단계 (4-step Tour) |
|------|------------------|
| operator | 1) 사이드바 소개 → 2) 테넌트 관리 → 3) 티켓 응대 → 4) 시스템 설정 |
| tenant_super / tenant_hr_admin | 1) 사이드바 → 2) 직원 등록 → 3) 결재라인 설정 → 4) 출시 가이드 |
| tenant_manager | 1) 결재 인박스 → 2) 팀 근태 → 3) 휴가 승인 → 4) 알림 |
| employee | 1) 출퇴근 → 2) 휴가 신청 → 3) 급여명세서 → 4) 알림 설정 |

투어 종료 시 `users.first_login_at = now()` 기록. "건너뛰기" 가능. 다시 보기는 `/me/profile > 도움말 > 투어 다시 보기`.

## 7. 화면 전이 동선 (주요 흐름)

각 화면 PRD §9 의존성 섹션에 들어갈 보강 정보. 본 표는 진입·퇴장 동선의 중요 케이스만 정리.

### 7-1. 운영사 신규 가입 처리 흐름

```text
OP-01 대시보드 [신규 가입 카드]
  → OP-04 신규 테넌트 마법사
  → 완료 시 OP-03 테넌트 상세 (등록된 테넌트)
  → 자동 발송: CM-03 활성화 메일 → 고객이 클릭 → CM-03 활성화 → /admin (TA-01)
```

### 7-2. 직원 휴가 신청 → 결재 흐름

```text
EM-01 대시보드 [잔여 휴가 카드]
  → EM-03 휴가 신청
  → 제출 → EM-05 내 결재 (pending) + 결재자에게 알림 (CM-15)
  → 결재자 화면: TA-09 결재함 [신규 알림]
  → TA-09 → TA-08 휴가 신청 상세 → 승인/반려
  → EM-05 자동 갱신 (Realtime) + EM-10 알림 도착
```

### 7-3. 출퇴근 흐름 (PWA 모바일)

```text
첫 진입 → /install (CM-20 PWA 설치 가이드, iOS는 홈 추가 필수 안내)
  → 설치 후 홈 아이콘 → /login (CM-01) → /me (EM-01)
  → EM-01 [출근 버튼] → EM-02 출퇴근 → 클릭 시 GPS 권한 + 출근 기록
  → 결과 알림 (배지 갱신)
```

### 7-4. 권한 미일치 동선

```text
employee가 /operator/tenants URL 직접 진입
  → 미들웨어 차단 → /forbidden (CM-05)
  → "내 대시보드로" 클릭 → §3 라우팅 매트릭스 → /me (EM-01)
```

### 7-5. 세션 만료 동선

```text
임의 화면 (예: TA-09 결재 작업 중)
  → 401 감지 → /login?return_url=/admin/approvals
  → 재로그인 + 2FA → /admin/approvals 자동 복귀
  → 작성 중 입력값은 sessionStorage 보존 → "이어서 작성" 안내
```

### 7-6. 첫 로그인 동선

```text
CM-03 활성화 → /me (EM-01) 진입 직후
  → CM-22 온보딩 투어 모달 자동 시작
  → 4단계 진행 또는 건너뛰기
  → users.first_login_at = now()
```

## 8. 미들웨어 / 가드 매트릭스

Next.js `middleware.ts`에서 처리하는 가드:

| 가드 | 적용 라우트 | 차단 시 |
|------|------------|---------|
| 점검 모드 가드 | `/*` (operator_super 제외) | → `/maintenance` |
| 인증 가드 | `/operator/*`, `/admin/*`, `/me/*` | → `/login?return_url=...` |
| 역할 가드 (operator) | `/operator/*` | → `/forbidden` |
| 역할 가드 (tenant) | `/admin/*` | → `/forbidden` |
| 역할 가드 (employee 본인) | `/me/*` | tenant 역할도 통과 (모두 본인 화면 접근) |
| 2FA 가드 | `/operator/*` (operator_super 강제) | 2FA 미설정 시 → `/me/profile?tab=security&forced=2fa` |
| 약관 동의 가드 | 모든 인증 영역 | 신규 약관 게시 시 → `/legal/terms?must_accept=true` |
| 첫 로그인 투어 가드 | `/{도메인 진입점}` | first_login_at IS NULL → CM-22 모달 오버레이 |

## 9. 신규 화면 ID 인덱스 (KI-027/028/029/030)

| ID | 이름 | 영역 | MVP | 라우트 | 사유 |
|----|------|------|:---:|--------|------|
| CM-16 | 헤더 프로필 드롭다운 | 글로벌 헤더 | ✓ | (전역) | KI-028 |
| CM-17 | 헤더 알림 종 드롭다운 | 글로벌 헤더 | ✓ | (전역) | KI-028 |
| CM-18 | 헤더 검색 | 글로벌 헤더 | △ | (전역) | KI-028 (v1.1 활성, MVP는 안내만) |
| CM-19 | 헤더 도움말 | 글로벌 헤더 | ✓ | (전역) | KI-028 |
| CM-20 | PWA 설치 가이드 | 정적 페이지 | ✓ | `/install` | KI-030 + 02-device-matrix L81 |
| CM-21 | 약관/개인정보처리방침 | 정적 페이지 | ✓ | `/legal/terms`, `/legal/privacy` | KI-030 + 06-mvp L111 |
| CM-22 | 첫 사용자 온보딩 투어 | 모달 오버레이 | ✓ | (모든 도메인 진입점) | KI-030 |
| OP-12 | 운영사 본인 프로필 | 운영사 | ✓ | `/operator/me/profile` | KI-029 |

상세 명세는:
- CM-16~22 → `domains/common.md` 보강 섹션
- OP-12 → `domains/operator/OP-12-profile.md` 신규 파일

## 10. 카운트 업데이트

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| screens_total | 36 | 44 |
| screens_mvp_full (✓) | 30 | 37 |
| screens_mvp_partial (△) | 6 | 7 |
| screens_mvp_total | 36 | 44 |
| common 화면 수 | 15 (CM-01~15) | 22 (CM-01~22) |
| operator 화면 수 | 11 | 12 (OP-01~12) |

`spec/matrix.json` 카운트는 본 문서 기준으로 동기화한다.

## 11. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 라우팅·전역 컴포넌트·신규 화면 8건 보강 | KI-027~030 batch-003 |
