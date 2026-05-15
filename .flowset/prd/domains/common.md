# 공통 시스템 (Common)

> spec §5 인용 + 본 PRD 차원에서 구체화. 22종 공통 기능. 모든 도메인에서 공유.
> CM-16~22는 KI-028/030 보강 (2026-05-15, 09-routing.md 참조).

## 인덱스

| 코드 | 화면/기능 | MVP |
|------|---------|:---:|
| CM-01 | 로그인 | ✓ |
| CM-02 | 비밀번호 찾기 | ✓ |
| CM-03 | 최초 계정 활성화 (초대) | ✓ |
| CM-04 | 2단계 인증 (TOTP) | ✓ |
| CM-05 | 권한 없음 (403) | ✓ |
| CM-06 | 오류/점검 화면 (404/500/maintenance) | ✓ |
| CM-07 | 알림 센터 | ✓ |
| CM-08 | 공통 검색 (전역) | △ MVP 후순위 |
| CM-09 | 파일 업로드 | ✓ |
| CM-10 | 파일 미리보기 | ✓ |
| CM-11 | 엑셀 가져오기 | ✓ |
| CM-12 | 엑셀 내보내기 | ✓ |
| CM-13 | PDF 다운로드 | ✓ |
| CM-14 | 감사 로그 기록 (서버 측) | ✓ |
| CM-15 | 시스템 알림 발송 (카카오 알림톡/SMS) | ✓ |
| CM-16 | 헤더 프로필 드롭다운 (글로벌) | ✓ |
| CM-17 | 헤더 알림 종 드롭다운 (글로벌, CM-07 mini) | ✓ |
| CM-18 | 헤더 검색 (글로벌, MVP는 v1.1 안내) | △ |
| CM-19 | 헤더 도움말 (글로벌) | ✓ |
| CM-20 | PWA 설치 가이드 (`/install`) | ✓ |
| CM-21 | 약관/개인정보처리방침 (`/legal/{terms,privacy}`) | ✓ |
| CM-22 | 첫 사용자 온보딩 투어 (모달) | ✓ |

## CM-01 로그인

- **경로**: `/login` (모든 클라이언트 공통)
- **사용자**: 비로그인 사용자 (모든 역할)
- **입력**: 이메일, 비밀번호, "로그인 유지" 체크, 캡차(5회 실패 후)
- **액션**:
  - 로그인 → 역할 별 대시보드 이동 (operator → OP-01, tenant_super/hr_admin → TA-01, manager/employee → EM-01)
  - 2FA 활성화 시 → CM-04 진입
  - 비밀번호 찾기 → CM-02
- **에러 코드**: `AUTH_INVALID_CREDENTIALS`, `AUTH_LOCKED` (5회 실패), `AUTH_2FA_REQUIRED`
- **검증**: 이메일 형식, 비밀번호 정책(저장 검증은 등록 시점)
- **수용 기준 (Gherkin)**:
  ```gherkin
  Feature: 로그인
    Scenario: 정상 로그인
      Given 비로그인 사용자가 로그인 페이지를 연다
      When 유효한 이메일/비밀번호를 입력하고 로그인 버튼을 누른다
      Then 역할별 대시보드로 이동한다
    Scenario: 5회 실패 후 잠금
      Given 같은 이메일로 4회 연속 실패
      When 5번째 잘못된 비밀번호 입력
      Then "5분 후 다시 시도" 안내가 표시된다
      And 5분 동안 같은 IP에서 동일 이메일 로그인 시도가 차단된다
    Scenario: 2FA 활성화 사용자
      Given 사용자가 2FA를 활성화함
      When 이메일/비밀번호 통과
      Then 6자리 TOTP 입력 화면으로 이동
  ```

## CM-02 비밀번호 찾기

- **경로**: `/forgot-password`
- **흐름**: 이메일 입력 → Supabase Auth `resetPasswordForEmail()` → 이메일 링크 클릭 → `/reset-password?token=...` → 새 비밀번호 입력
- **수용 기준**:
  - 등록되지 않은 이메일에도 동일 메시지 ("이메일을 보냈습니다")로 응답 (계정 존재 여부 노출 방지)
  - 토큰 만료 60분
  - 재설정 후 모든 활성 세션 무효화

## CM-03 최초 계정 활성화

- **경로**: `/activate?token={invitationToken}`
- **흐름**: 초대 토큰 검증 → 비밀번호 설정 → 약관 동의 → 선택적 2FA 설정 → 로그인 완료
- **트리거**: TA-02 직원 초대, OP-04 신규 테넌트 관리자 등록
- **수용 기준**: 토큰 7일 만료, 1회만 사용 가능, 만료 시 재발송 요청 버튼 노출

## CM-04 2단계 인증

- **방식**: TOTP (Google Authenticator 호환)
- **활성화 흐름**: `내 정보 > 보안 > 2FA 활성화` → QR 코드 표시 → 6자리 코드 입력 → 활성화 + 복구 코드 8개 발급 (다운로드 또는 인쇄)
- **로그인 시 흐름**: 이메일/비밀번호 통과 → 6자리 입력 → 통과 시 세션 발급
- **복구 코드**: 한 번 사용 시 무효, 8개 모두 소진 시 운영사 문의
- **운영사 계정 강제**: `operator_*`는 가입 직후 2FA 활성화 강제

## CM-05 권한 없음 (403)

- **경로**: `/forbidden` 또는 인라인 표시
- **표시**: "접근 권한이 없습니다" + 이전 화면 + 홈 버튼
- **트리거**: RLS 차단 (403), 권한 매트릭스 위반
- **감사 로그**: 차단 시 `audit_logs`에 `result = 'denied'` 기록

## CM-06 오류/점검 화면

- **유형**:
  - `/404`: 페이지 없음
  - `/500`: 서버 오류 (Sentry 자동 보고)
  - `/maintenance`: 점검 모드 (관리자 설정 시)
- **점검 모드**: 운영사 OP-11 시스템 설정에서 토글, 표시 메시지 커스텀 가능, `operator_super`는 우회 가능

## CM-07 알림 센터

- **경로**: 헤더 종 아이콘 → 드롭다운 또는 `/notifications` 전체 페이지
- **필터**: 전체 / 읽지 않음 / 유형별 (결재/문서/시스템)
- **액션**: 클릭 시 관련 화면으로 이동 + 자동 읽음 처리, 전체 읽음, 개별 읽음 토글
- **소스**: Supabase Realtime 구독 (`notifications` 테이블)
- **수용 기준**:
  - 새 알림 도착 시 헤더 배지 카운트 즉시 갱신 (≤ 2초)
  - 읽음 처리 시 다른 디바이스에도 반영 (Realtime)

## CM-08 공통 검색 (전역)

- **MVP 후순위** — v1.1 도입
- **계획**: 헤더 검색 → 직원/문서/공지/티켓 통합 검색 → 결과 그룹화 → 클릭 시 해당 화면

## CM-09 파일 업로드

- **방식**: 표준 `<input type="file">` + react-dropzone (드래그앤드롭) + multipart/form-data 또는 Supabase Storage 직접 업로드
- **제약**:
  - 파일 크기: 단일 50MB, 전체 200MB/요청
  - MIME 허용: PDF, 이미지(jpg/png/webp/gif), 엑셀(xlsx/xls), CSV, HWP, DOCX
  - 바이러스 스캔: ClamAV (v1.1) — MVP는 미적용
- **저장**: Supabase Storage prefix `tenants/{tenantId}/{domain}/{yyyy-mm}/`

## CM-10 파일 미리보기

- **지원**: PDF (PDF.js), 이미지 (직접 렌더), 엑셀/CSV (서버 변환 후 HTML 미리보기)
- **다운로드**: Signed URL 15분 만료
- **권한**: 본인 문서 또는 권한 부여된 문서만 (RLS)

## CM-11 엑셀 가져오기

- **사용처**: TA-02 직원 일괄 등록, TA-10 급여명세서 일괄 업로드
- **흐름**: 양식 다운로드 → 데이터 입력 → 업로드 → 서버 검증 → 오류 행 다운로드 → 재시도
- **검증**: 필수 필드, 형식 (이메일/날짜/숫자), 외래키(부서명 존재 여부), 중복
- **결과**: `{ total, success, failed, errors[{row, field, message}] }`

## CM-12 엑셀 내보내기

- **사용처**: 모든 목록 화면 (TA-02 직원, TA-05 근태, OP-02 테넌트, etc.)
- **방식**: 서버에서 SheetJS로 xlsx 생성 → Storage 임시 저장 → Signed URL 응답
- **제약**: 1회 최대 10만 행, 초과 시 페이지네이션 안내

## CM-13 PDF 다운로드

- **사용처**: 급여명세서 (EM-06, TA-10), 증명서 (EM-08), 리포트 (OP-10, TA-12)
- **생성**: 서버에서 Puppeteer 또는 React-PDF로 PDF 생성 → Storage 저장 → Signed URL
- **워터마크**: 발행 일자 + 회사 인장 (테넌트별 설정)

## CM-14 감사 로그 기록

- **방식**: 애플리케이션 레벨 + DB after-trigger (이중)
- **기록 대상**:
  - 핵심 테이블 INSERT/UPDATE/DELETE
  - 모든 APPROVE/REJECT/CANCEL 액션
  - 로그인 / 로그아웃 / 비밀번호 변경 / 2FA 변경
  - 권한 변경
- **필드**: `tenant_id, actor_id, actor_role, action, target_type, target_id, before, after, ip, user_agent, request_id, created_at`
- **조회 화면**: OP-09 (운영사 전체), TA-13 회사 설정 > 감사 로그 (테넌트 자기 자신)

## CM-15 시스템 알림 발송

- **채널**:
  - 인앱 (Realtime broadcast) — 기본
  - 푸시 (PWA Web Push API) — 모바일 진입 시
  - 카카오 알림톡 (NHN Cloud) — 폴백 + 강제 채널
  - SMS — 카카오 미수신자 폴백
  - 이메일 (Supabase SMTP) — 중요 알림 (급여명세서, 계정 변경)
- **템플릿**: 카카오 알림톡 템플릿 사전 승인 필수 (`approval_pending`, `leave_approved`, `payroll_published` 등)
- **우선순위**:
  ```
  1차: 인앱 + 푸시 (즉시) — 인앱 텍스트는 수신자 locale 기준
  2차: 30분 미열람 시 카카오 알림톡 (locale='ko' 사용자만 — 한글 채널 한정)
  3차: 1시간 미열람 + 알림톡 미수신 시 SMS (ko/en 둘 다 — locale별 본문)
  4차: 24시간 미열람 시 이메일 (선택, ko/en 템플릿 5종 분기)
  ```
- **i18n 정책 (2026-05-16)**: locale='en' 사용자는 카카오 알림톡 건너뛰고 SMS + 이메일로 직행 (PRD 06-mvp-scope §4-1, P8 외국인 근로자 페르소나)

## CM-16 헤더 프로필 드롭다운

- **위치**: 글로벌 헤더 우측, 사용자 아바타 클릭
- **노출 범위**: 모든 인증 영역 (`/operator/*`, `/admin/*`, `/me/*`)
- **드롭다운 메뉴 (역할별)**:

  | 항목 | operator | tenant_super/hr/manager | employee | 핸들러 |
  |------|:--------:|:----:|:--------:|--------|
  | 사용자명 + 역할 + 회사명 (헤더 라벨) | ✓ | ✓ | ✓ | (display only) |
  | 내 프로필 | ✓ → OP-12 | ✓ → EM-09 | ✓ → EM-09 | navigate |
  | 보안 설정 (2FA/세션) | ✓ → OP-12?tab=security | ✓ → EM-09?tab=security | ✓ → EM-09?tab=security | navigate |
  | 알림 설정 | ✓ → OP-12?tab=notification | ✓ → EM-09?tab=notification | ✓ → EM-09?tab=notification | navigate |
  | **언어 / Language (한국어 ⇄ English)** | ✓ | ✓ | ✓ | `PATCH /api/v1/me/profile { locale }` → 즉시 UI 전환 + 페이지 새로고침 (i18n MVP, 2026-05-16) |
  | 도움말 | ✓ → CM-19 | ✓ → CM-19 | ✓ → CM-19 | navigate |
  | 회사 전환 (멀티 테넌트 사용자) | — | △ v1.2 | — | (MVP 미사용) |
  | 운영팀 문의 (티켓) | — | ✓ → OP-08 신규 티켓 | ✓ → OP-08 신규 티켓 | modal |
  | 로그아웃 | ✓ | ✓ | ✓ | `POST /api/v1/auth/logout` → `/login` |

- **수용 기준 (Gherkin)**:
  ```gherkin
  Feature: 헤더 프로필 드롭다운
    Scenario: 직원 프로필 드롭다운 메뉴
      Given employee 한직원 로그인 후 /me 진입
      When 헤더 우측 아바타 클릭
      Then 드롭다운에 [한직원 / 직원 / 플로우상사] 라벨 + 6개 메뉴 표시
      When "내 프로필" 클릭
      Then /me/profile (EM-09)로 이동
    Scenario: 로그아웃
      When "로그아웃" 클릭
      Then 세션 무효화 + /login 이동 + 토스트 "로그아웃되었습니다"
      And audit_logs INSERT (action=logout)
  ```
- **연관 API**: `POST /api/v1/auth/logout`, `GET /api/v1/me/profile`

## CM-17 헤더 알림 종 드롭다운

- **위치**: 글로벌 헤더 우측, 종 아이콘 + 미읽음 배지
- **트리거**: Supabase Realtime `notifications` 채널 구독, 신규 도착 시 배지 즉시 갱신 (≤ 2초)
- **드롭다운 표시**:
  - 최근 10건 알림 미리보기 (제목 + 시각 + 미읽음 강조)
  - 클릭 시 → 관련 화면 이동 + 자동 읽음 처리
  - 하단 "전체 보기" → CM-07 (`/me/notifications` 또는 도메인별 컨텍스트)
  - 하단 "전체 읽음" 버튼
- **수용 기준**:
  - 새 알림 도착 → 배지 카운트 ≤ 2초 갱신 (Realtime)
  - 미읽음 0건 → 배지 숨김
  - 미읽음 100건 초과 → "99+" 표시
- **연관 API**: `GET /api/v1/me/notifications?limit=10`, `POST /api/v1/me/notifications/mark-all-read`
- **CM-07과의 관계**: CM-17은 헤더 미니 미리보기, CM-07은 전체 페이지

## CM-18 헤더 검색

- **MVP 정책**: △ (v1.1 출시 예정 — MVP는 검색바 표시 + 클릭 시 안내 토스트)
- **MVP 동작**: 검색바 클릭/포커스 → "공통 검색은 v1.1에서 제공됩니다. 화면별 필터를 사용해 주세요." 토스트 + 사이드바 강조 (현재 화면 검색 위치 안내)
- **v1.1 계획 (CM-08과 통합)**:
  - 명령 팔레트 (Cmd+K / Ctrl+K)
  - 검색 대상: 직원, 문서, 공지, 티켓 (역할별 RLS 적용)
  - 결과 그룹화 + 클릭 시 해당 화면
- **수용 기준 (MVP)**:
  - 검색바 노출 (≥ 1024px) — 모바일은 햄버거 메뉴 안 검색 메뉴로 숨김
  - 클릭 시 안내 토스트 표시
  - 키보드 포커스 시 동일 안내

## CM-19 헤더 도움말

- **위치**: 글로벌 헤더 우측, ? 아이콘
- **클릭 시 슬라이드 패널 (우측)**:
  - 현재 화면 도움말 (화면 ID 기반 매핑 — 예: TA-09에서는 "결재 처리 가이드")
  - 키보드 단축키 목록 (MVP: Cmd+K, Esc, ?, 미래 v1.2)
  - 자주 묻는 질문 (FAQ) 5건
  - 운영팀 문의 (OP-08 신규 티켓)
  - 도움말 센터 외부 링크 (`https://help.flowhr.kr` — Phase 9 베타 진입 시 활성)
- **수용 기준**:
  - 화면별 도움말 매핑은 `screen_id → help_doc_slug` JSON으로 관리 (i18n 대응)
  - MVP는 화면 ID별 1줄 안내 + 외부 링크만, 풀 도움말 센터는 v1.1
- **연관**: CM-22 온보딩 투어 다시 보기 진입점

## CM-20 PWA 설치 가이드

- **경로**: `/install`
- **우선 노출 조건**:
  - 모바일 디바이스 (iOS Safari / Android Chrome) 첫 진입
  - 화면 매트릭스(02-device-matrix.md) PWA 우선 도메인 (직원 EM-01/02/03/04)
  - localStorage `pwa_install_dismissed` 미설정
- **콘텐츠 (디바이스별 분기)**:
  - **iOS Safari (16.4+)**:
    1. 공유 버튼 → "홈 화면에 추가" 캡처 GIF
    2. 푸시 알림 받으려면 홈 화면 추가 필수 안내
    3. 추가 후 홈 아이콘 탭 → 정상 진입
  - **Android Chrome**:
    1. 우측 상단 ⋮ → "앱 설치" 캡처
    2. 또는 자동 표시 배너 클릭
  - **Desktop**: "데스크톱은 [Tauri 앱 다운로드]를 권장합니다" + GitHub Releases 링크
- **수용 기준**:
  - iOS 16.4 미만 → "iOS 16.4 이상 필요" 안내 + Tauri 다운로드 CTA
  - 이미 PWA로 진입 (`window.matchMedia('(display-mode: standalone)')`) → 자동 dismiss
  - 닫기 시 localStorage 저장, 30일 후 재표시
- **연관**: 02-device-matrix.md L81 (iOS 푸시 16.4+ 폴백)

## CM-21 약관/개인정보처리방침

- **경로**: `/legal/terms`, `/legal/privacy` (단일 명세, 라우트 분리)
- **노출 시점**:
  - 비로그인 상태에서도 접근 가능 (푸터 링크)
  - CM-03 활성화 시 동의 단계 (체크박스)
  - 신규 약관 게시 시 인증 사용자에게 강제 동의 (가드 매트릭스 §8)
- **데이터 모델**: `legal_documents` 테이블 (LegalDocument 엔티티 — 04-data-model.md, db/erd.md)
  - 필드: `id, type (terms|privacy), version (semver), language (ko|en), effective_date, content_md, created_at`
  - `(type, version, language)` UNIQUE — 동일 type/version의 ko/en 모두 게시 의무
  - **i18n 정책 (2026-05-16)**: 영문(`en`)은 **참고 번역**. 법적 효력은 한글(`ko`) — 영문 사용자에게 약관 화면 상단 banner로 명시: "This is a reference translation. The Korean version prevails legally."
  - 새 버전 게시 → 모든 사용자 다음 로그인 시 동의 강제 (사용자 locale별로 본인 언어 표시)
- **동의 이력**: `user_consents` (UserConsent 엔티티)
  - 필드: `user_id, document_id, version, consented_at, ip, user_agent`
- **UI 요소**:
  - 좌측: 목차 (h2 자동 추출)
  - 우측: 마크다운 렌더링 (`react-markdown`)
  - 상단: 버전 + 시행일
  - 하단 (강제 동의 시): "동의합니다" 체크박스 + "다음" 버튼
- **수용 기준 (Gherkin)**:
  ```gherkin
  Feature: 약관 동의
    Scenario: 신규 약관 강제 동의
      Given 운영사가 terms v2.0.0 게시 (effective_date=2026-06-01)
      When 사용자가 다음 로그인
      Then /legal/terms?must_accept=true 자동 리다이렉트
      When 동의 체크박스 + "다음" 클릭
      Then user_consents INSERT (version=2.0.0)
      And 원래 가려던 화면(return_url)으로 복귀
    Scenario: 비로그인 사용자
      Given 비로그인 사용자가 /legal/terms 진입
      Then 동의 강제 없이 본문만 표시 + 푸터에 "FlowHR로 돌아가기" 링크
  ```
- **연관 API**:
  - `GET /api/v1/legal/documents?type=terms&latest=true`
  - `POST /api/v1/me/consents` (body: `{ document_id, version }`)
  - 운영사 관리: `POST /api/v1/operator/legal/documents` (CRUD)

## CM-22 첫 사용자 온보딩 투어

- **트리거**: `users.first_login_at IS NULL` AND 인증 영역 진입점(`/operator`, `/admin`, `/me`) 진입
- **방식**: 모달 오버레이 + 단계별 하이라이트 (Reactour 또는 react-joyride)
- **단계 (역할별 4-step)**: 09-routing.md §6-5 참조
  - operator: 사이드바 → 테넌트 관리 → 티켓 응대 → 시스템 설정
  - tenant_super/hr_admin: 사이드바 → 직원 등록 → 결재라인 설정 → 출시 가이드
  - tenant_manager: 결재 인박스 → 팀 근태 → 휴가 승인 → 알림
  - employee: 출퇴근 → 휴가 신청 → 급여명세서 → 알림 설정
- **액션**:
  - "다음" / "이전" / "건너뛰기" / "다시 보지 않기"
  - 종료 시 `PATCH /api/v1/me/profile { first_login_at: now() }`
- **다시 보기 진입점**: CM-19 도움말 패널 + EM-09/OP-12 §"투어 다시 보기"
- **수용 기준**:
  - 4단계 중 어느 단계에서 종료해도 first_login_at 기록 (재표시 방지)
  - "건너뛰기" 클릭 시 audit_logs (action=onboarding_skipped) 기록
  - 모바일/데스크톱 반응형 (모달 크기 조정)
- **연관 API**: `PATCH /api/v1/me/profile`, `GET /api/v1/me/profile` (first_login_at 확인)

## 환영 메일 / 이메일 템플릿 명세

CM-15 시스템 알림 발송의 이메일 채널이 사용하는 템플릿 5종 (MVP 필수). **각 템플릿은 ko + en 동시 작성** (수신자 `users.locale` 기준 분기, 2026-05-16 i18n MVP).

### 한글 (locale = 'ko')

| 템플릿 ID | 트리거 | 제목 | 본문 핵심 내용 |
|----------|--------|------|--------------|
| `welcome_invite.ko` | TA-02 직원 초대 / OP-04 테넌트 등록 | "[FlowHR] {회사명} 초대장" | 활성화 링크 + 7일 만료 + CM-21 약관 안내 |
| `password_reset.ko` | CM-02 비밀번호 찾기 | "[FlowHR] 비밀번호 재설정" | 재설정 링크 + 60분 만료 + 보안 안내 |
| `leave_approved.ko` | TA-08 휴가 승인 | "[FlowHR] {휴가종류} 결재 승인" | 휴가 정보 + 잔여 일수 + EM-04 링크 |
| `payroll_published.ko` | TA-10 급여명세서 발행 | "[FlowHR] {YYYY년 M월} 급여명세서" | 발행 안내 + EM-06 로그인 링크 (직접 첨부 X — 보안) |
| `approval_pending_24h.ko` | 결재 24시간 미처리 | "[FlowHR] 결재 대기 알림" | 미처리 결재 N건 + TA-09/EM-05 링크 |

### 영어 (locale = 'en')

| 템플릿 ID | 트리거 | 제목 | 본문 핵심 내용 |
|----------|--------|------|--------------|
| `welcome_invite.en` | (동일) | "[FlowHR] You're invited to {company}" | Activation link + 7-day expiry + Terms notice |
| `password_reset.en` | (동일) | "[FlowHR] Password reset" | Reset link + 60-min expiry + security notice |
| `leave_approved.en` | (동일) | "[FlowHR] Your {leave type} request approved" | Leave info + remaining days + EM-04 link |
| `payroll_published.en` | (동일) | "[FlowHR] Payslip for {YYYY-MM}" | Publication notice + EM-06 login link (no attachment — security) |
| `approval_pending_24h.en` | (동일) | "[FlowHR] Approvals pending" | N pending approvals + TA-09/EM-05 link |

템플릿 저장: `apps/web/lib/email/templates/{template_id}.{locale}.tsx` (React Email 형식 + locale suffix). 발송 시 수신자 `users.locale` 기준 자동 선택. 카카오 알림톡 템플릿은 한글만 별도(`apps/web/lib/notification/kakao-templates.json`) — 영문 사용자는 SMS + 이메일 폴백 (PRD 06-mvp-scope §4-1).

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 15 공통 기능 명세 | Phase 1 진입 |
| 2026-05-15 | CM-16~22 추가 (헤더 드롭다운 4종 + PWA 설치 + 약관 + 온보딩 투어) + 이메일 템플릿 5종 명세 | KI-028/030 batch-003 |
| 2026-05-16 | i18n MVP: CM-16 "언어/Language" 메뉴 / CM-15 알림 채널 locale 분기 (en은 카카오 skip) / CM-21 약관 ko+en 게시 + 영문 참고 번역 정책 / 이메일 템플릿 ko+en 10종 | 사용자 결정 batch-005 |
