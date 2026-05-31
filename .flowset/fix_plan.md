# FlowHR — Work Item 진행 트래킹

> WI(Work Item) 형식: `WI-NNN-[type] 한글 작업명`
> type: feat, fix, docs, style, refactor, test, chore, perf, ci, revert
> NNN: 영숫자 ID (001, 015, A2a, C3code, E1, 001-1)
>
> **각 Phase 종료 시 evaluator 호출 의무** — PASS 마커(`.flowset/eval-results/phase-{n}.pass`)가 있어야 다음 Phase 진입.

## Phase 0 — 셋업

- [x] WI-chore FlowSet 라이트 셋업 (디렉토리/계약/규칙)
- [x] WI-chore 기술 스택 확정 (Next.js + Supabase + Tauri Desktop + PWA)
- [x] WI-chore Git 저장소 초기화 + 원격 연결 + 첫 푸시
- [x] WI-chore evaluator 라이트 셋업 (agent + rubric + eval-results/ + 게이트 룰)
- [x] WI-chore Known Issue Registry 셋업 + eval 임계 8.0 상향 + P0~P3 트리거

## Phase 1 — 개발용 PRD 작성 [✓ PASS 8.15 → 재평가 9.13/10 (KI-027~031 보강 후)]

- [x] WI-001-docs 개발용 PRD 초안 작성 (50 파일, ~7000줄)
- [x] WI-002-docs 디바이스 매트릭스 정의 (Web/PWA/Tauri)
- [x] WI-003-docs 비기능 요구사항 (성능/보안/접근성/i18n/감사/백업/확장/모니터링)
- [x] WI-004-docs 데이터 모델 매트릭스 SSOT 생성 (matrix.json, 36 엔티티)

## Phase 2 — 백로그 [✓ PASS 8.29 → 재평가 8.03/10 (ST-073~080 추가)]

- [x] WI-005-docs Epic 정의 (12 Epic, 379 SP)
- [x] WI-006-docs User Story 작성 (72 Story, 화면×역할 매트릭스)
- [x] WI-007-docs Task 분해 (EP-01/02/06/07/08 완전 + 7 Epic 패턴 추정, 195 Task / 739 MD)

## Phase 3 — DB ERD [✓ PASS 8.68 → 재평가 8.21/10, P2 4건 즉시 처리 후 클린]

- [x] WI-008-docs ERD 다이어그램 (Mermaid, 37 엔티티 통합 + 도메인별 4분할)
- [x] WI-009-docs RLS 정책 설계 (37 테이블 × 6 역할 + Approval polymorphic routing)
- [x] WI-010-docs 인덱스 / 마이그레이션 순서 (23 파일) + enums + seed

## Phase 4 — API 명세 [✓ PASS 8.78 → 재평가 8.40/10, P1+P2 즉시 처리 후 클린]

- [x] WI-011-docs OpenAPI 스켈레톤 (conventions + schemas + zod)
- [x] WI-012-docs 도메인별 엔드포인트 명세 (인증/운영사/관리자/직원/공통/cron 약 280)

## Phase 5 — 와이어프레임 [🛑 중단, 정책 변경 2026-05-15]

> **정책 변경**: Codex 이미지 생성 폐기 → HTML 직접 작성 단일 채택. 자세한 사유는 HANDOFF.md.

- [~] ~~WI-013-docs 36개 화면 이미지 프롬프트 작성~~ (폐기, archive 이동)
- [~] ~~WI-014-docs Codex 이미지 생성 (배치)~~ (폐기)
- [ ] WI-013-docs HTML 와이어프레임 36~42 작성 (Tailwind + shadcn 패턴) — WI-KI-batch-003 완료 후
- [ ] WI-014-docs analysis/*.md 컴포넌트 분해 / 인터랙션 / 반응형 / 접근성 정리
- [ ] WI-015-docs Phase 5 evaluator (doc 모드) — 보강 검증 축으로 재호출

## Phase 6 — MVP 스프린트 계획 [✓ PASS 9.00 / codex 8.21 PASS_WITH_KI (2026-05-19)]

- [x] WI-016-docs Phase 6 MVP 스프린트 계획 — mvp-plan.md (디렉토리 구조 SSOT codex 7건 권고 채택) + sprint-001~010.md
- [x] WI-017-docs 스프린트별 수용 기준 — sprint-001~010.md 각각 DoD + 위험 명시 (WI-016 통합 처리)

## Phase 7 — 개발 착수

- [x] WI-018-feat 모노레포 부트스트랩 (pnpm@9.15.0 + Turborepo 2.9.14 + tsconfig.base + 루트 devDeps 5종, Sprint 1 Day 1~2)
- [x] WI-InfraPolicy-docs 인프라 유료 가정 정정 (Free 시작 + Pro 전환 5트리거 + NHN DEFER + Tauri 자체 인증서 + guardrails §9/§10 규칙 보강, 사용자 결정 2026-05-19 + codex 3차 협의)
- [x] WI-KI-batch-007-docs 차기 docs batch 문서 정합 9건 (KI-032/033/040/042/056/062/074/075 resolved + KI-016 NHN DEFER 시점 갱신)
- [x] WI-KI-batch-008-wf 와이어프레임 정정 5건 resolved (KI-043 CM-21 i18n + KI-044 CM-04 selector + KI-049/069 권한매트릭스 15화면 역할\|권한 2열 + KI-060 TA-13 font-weight) + Phase 7 재분류 8건 (KI-038/054/057/061/064/065/068/070 — React 변환 시 해소, 이중작업 회피)
- [x] WI-019-feat apps/web + packages 7개 스캐폴드 + Supabase 인프라 (스키마/RLS/audit/Realtime, Sprint 1 Day 3~5·8~10)
  - [x] Day 3~5: apps/web(Next 15.5 + next-intl ko/en) + packages 7개 + supabase init + ERD 39엔티티 스키마 마이그레이션 1~20 원격 staging 적용 + database.ts 생성 (typecheck/build/런타임 스모크 PASS)
  - [x] Day 8~10: RLS 정책 SQL 39테이블(ST-005, 마이그레이션 27, 94정책, 헬퍼 SECURITY DEFINER) + KI-077 composite FK(28) + audit 트리거 21테이블(ST-068, 29) + Realtime publication(ST-069, 30) + 하드닝(31) + useRealtime wrapper. staging 적용 + RLS 매트릭스 T1~T6 PASS + 로그인 무손상 + typecheck/lint/test/build PASS. KI-077 resolved, KI-084~086 등록.
- [~] WI-020-feat 인증 (로그인/2FA/활성화/비밀번호 ST-001~004) + 약관/오류 (ST-078/072, Day 6~7·11~12)
  - [x] ST-001 로그인 핵심 (Supabase Auth SSR + CM-01 + 5회 잠금 + 역할 리다이렉트 + audit + return_url) — login_attempts 마이그레이션 26 + record_login_failure RPC + 미들웨어 인증가드 + 랜딩 placeholder 3종. 듀얼검증 PASS_WITH_KI(evaluator 8.38 / codex CONDITIONAL→정정), E2E 9/9 staging 실증. KI-078~083 등록.
  - [x] ST-002 비밀번호 찾기/재설정 (CM-02, WI-020-4-feat) — token_hash+verifyOtp(/auth/confirm 콜백, cross-device 지원) + forgot-password(미등록 동일 sent + obscureTiming, 계정열거 방지) + reset-password(recovery 세션 → updateUser → signOut global 전세션 무효화 → /login?reset=success) + 점검 면제 /forgot-password·/reset-password + middleware /auth 제외 + 비번정책 스키마(≥10 대소문자/숫자/특수, 실시간 체크리스트) + config.toml recovery 템플릿. 듀얼검증 **PASS_BOTH**(evaluator 8.15 / codex 3라운드 CONDITIONAL→PASS_VERIFIED — P1-1 복구 게이트 HMAC 서명 마커/P1-2 signOut error·audit 순서/P2 i18n 키·policy_title 정정). typecheck/lint/build 17/17 + unit(schemas 41/web 24: recovery-marker 8+maintenance 14+i18n 2) + E2E 24/24. codex 협의(메커니즘 token_hash 단일안). KI-097(실메일·cross-device E2E)·098(대시보드 템플릿 수동설정) 등록. ⚠️ codex 협의로 ST-002→ST-004→ST-003 순서(ST-003 선택2FA가 ST-004 의존).
  - [x] ST-004 2FA (CM-04, WI-020-5-feat) — 격리 클라이언트 비번검증 후 totp_enabled 시 세션토큰 AES-256-GCM 봉인(fh-2fa-challenge) → /two-factor TOTP(speakeasy)/복구코드 검증 후 setSession + 약관가드 재적용. /me/security enable(QR+복구코드 8 scrypt 1회표시)·disable(비번+코드, operator 차단). operator 강제 2FA(로그인 직후 + operator 레이아웃, require_operator_2fa). OTP 잠금 login_attempts (email,ip) 재사용, 점검 면제 /two-factor·/me/security, 전용 env 2키 fail-closed, audit 5종. 듀얼검증 **PASS_BOTH**(evaluator 8.93 / codex FAIL P1+P2×3 → 정정 5f981dc[프로필 fail-open·operator/disable fail-closed·복구코드 .contains CAS 원자소비] → PASS_VERIFIED, jti 재생은 KI-101 deferral). turbo 20/20 + 단위(crypto 9+recovery 10+totp 5+schemas 7) + E2E 29/29 직렬 staging 실증. KI-099~102 등재.
  - [x] ST-003 활성화 (CM-03, WI-020-6-feat) — **create-at-activate** 설계(codex 수렴): auth.users 를 활성화 시점에 생성(초대 시점엔 invitations 행만) → 활성화 전 계정 부재로 forgot-password 우회 구조적 차단(로그인 경로 무수정). 마이그레이션 35(invitations 테이블 + invitation_status enum + RLS 6 operator/tenant_admin + SECURITY DEFINER 함수 2: get_invitation_by_token_hash 비인증검증 / accept_invitation 원자전환 SELECT FOR UPDATE→users INSERT→claim). 토큰 32바이트 CSPRNG→sha256 저장(새 env 불요). /activate 토큰검증→비번설정(passwordSchema 재사용)+필수약관동의→admin.createUser→accept_invitation rpc(실패 시 auth 보상삭제)→recordActivationConsents(source='activate', service_role 세션비의존)→세션수립→operator 강제 2FA(/me/security)/역할 대시보드. 점검 면제 /activate, audit user.activated, i18n ko/en. 듀얼검증 **PASS_BOTH**(evaluator 8.28 / codex FAIL P1×3+P2 → 정정 cafff5d/61bed1b[FK순서·단일rpc orphan제거·consent 세션비의존·enum] → PASS_VERIFIED, evaluator 추가 P2 inet clientIp+P3 audit중복 머지전 정정 754898d). turbo 20/20 + 단위(schemas 51/api-client 13/web 52: 토큰4+activate4) + E2E 34/34. 마이그레이션 35 staging 적용 + source='activate' consent 실증. KI-103(이메일발송)/104(orphan 스캐너)/105(in-flow 직원 2FA) 등재.
  - [x] ST-078 약관/동의 (CM-21, WI-020-2-feat) — legal 트리거(mig 34: ensure_single_active + block_modify) + 게시 RLS super 게이트 + zod DTO 3종(consent/publish ko·en 페어/required) + server lib(조회/동의/필수동의/operator 게시) + CM-21 페이지([type] terms·privacy, 5상태, react-markdown) + 강제동의 가드(로그인 직후 redirect + 보호 레이아웃 3종) + i18n legal.* ko/en + seed 약관 ko·en active 1쌍 + 비로그인 조회 E2E 5/5 + 강제동의 트리거/recordConsent staging DB 실증. 듀얼검증 PASS_BOTH(evaluator 8.45 / codex hotfix 3건 정정 후). KI-091·092 등록(AC-5 운영사 감사는 OP-09 deferral).
  - [x] ST-072 오류·점검 (CM-06, WI-020-3-feat) — 404 not-found.tsx + [...rest] catch-all + error.tsx/global-error.tsx(500 boundary, digest 참조번호) + Sentry 추상화훅(lib/observability/sentry.ts + instrumentation onRequestError, @sentry/nextjs 미설치 S6 연동) + 점검모드(maintenance_windows status=active 미들웨어 503 rewrite + Retry-After, operator_super 우회, /login·/maintenance exact 예외) + maintenance/page.tsx + countdown + i18n system.error.* + components/error-state.tsx. 듀얼검증 PASS_BOTH(evaluator 8.40 / codex CONDITIONAL→hotfix→PASS_VERIFIED — 면제 exact match P1 정정). vitest 14 + E2E 19/19 + staging 점검 활성/복귀 실증. KI-093~096 등록(P2 트리거 5건 도달).
- [~] WI-021-feat CI(phase7-code.yml 4 job) + zod-to-openapi 파이프라인 + 로그인 E2E 자동화 (Day 13~14)
  - [x] phase7-code.yml 4 job(lint/typecheck/unit-test/build, apps·packages path-scope) + OpenAPI diff 게이트(ls-files+diff) + KI-082 로그인 E2E job(secrets 5종 묶음 조건부) + build-openapi.ts(zod→OpenAPI 3.1 파이프라인) + dist/openapi.yaml(gitignore 예외 추적) + turbo typecheck→build 선행 + PR template 코드 PR 게이트. 로컬 19 task/18 unit/E2E 9/9/openapi 결정성 PASS. 듀얼검증: evaluator 1차 FAIL(39 entity 분리 결정) → codex 1차 CONDITIONAL(P2 2건 정정) → 재평가.
- [x] WI-021-1-feat 39 entity zod schema 변환 — packages/schemas/src/entities/{enums,operator,hr,settings,attendance,leave,approval,compliance}.ts (DB snake_case 1:1, database.ts Row 정합) + openapi.yaml 45 components + entities.test.ts 23 + api/schemas.md SSOT 정합 노트. 듀얼검증 PASS_BOTH(evaluator 1차 FAIL 8.25→재평가 8.75 / codex 4라운드 PASS — role/document_type/request_id DB text + ip_address nullable inet 정정, false alarm 5건 입증). KI-090 등록. Sprint 1 잔여(WI-021 분할, 사용자 결정 2026-05-29).
- [x] WI-VercelDeploy-fix Vercel 모노레포 배포 설정 수정 (batch K, 2026-06-01) — `rootDirectory=apps/web` + `framework=nextjs` (Vercel REST API `PATCH /v9/projects`). WI-019부터 누적된 production 배포 실패(`No Output Directory named "public"`) 해소: 프로젝트 설정 전부 null → 모노레포 루트를 일반 프로젝트로 인식 → Next.js 미감지 → 루트 `public/` 탐색. **빌드 자체는 항상 성공(26 페이지), output 위치만 문제**. workspace 패키지 전부 `exports ./src/index.ts` 소스 직접참조 + apps/web `transpilePackages`라 `next build` 단독 컴파일, 커스텀 buildCommand 불요. production redeploy 성공 + 사이트 `/`·`/ko`·`/ko/login` HTTP 200 + GitHub commit status failure→success (https://flowhr-sop.vercel.app). 프로젝트 설정이라 이후 자동배포 영속 적용. production env 미설정(service_role/2FA 키 — KI-099/098/086/103)은 사용자 조치 대기. 코드(apps/packages/supabase) 미변경 → 듀얼검증 게이트 비대상.

### Sprint 2 — 테넌트 라이프사이클 + 회사 설정 P0 (codex 단일안 채택 2026-06-01, WI-030~038)

> **진입 순서**(codex 협의): packages/ui 도메인 토대 → DB 보강 → TA-13(설정 API/UI) → OP-04(등록 API/마법사) → OP-02/03(목록/상세). 의존: ST-007~010←ST-006, ST-053/054←ST-005(완료).
> **WI 번호**: Phase 8~10 예약(WI-022~029) 회피 → Sprint 2 dev는 **WI-030~038** (사용자 결정 2026-06-01).
> **codex 정정(검증완료)**: sprint-002.md "마이그레이션 신규 생성"은 Phase 6 표현 — 9개 테이블 전부 mig 4/5/7/11에 이미 존재(Sprint 1 ERD 부트스트랩). Sprint 2 DB는 **delta/hardening/seed/scheduler 보강**. `tenant_settings` 겹침은 WI-031이 단독 소유로 해소.
> **게이트**: 각 WI 독립 PR + 듀얼검증 PASS_BOTH + `.flowset/eval-results/<WI>.pass` 마커 의무(project.md §1-1).

- [~] WI-030-feat packages/ui 도메인 primitive 5종 (Stepper/DataTable+RowLink/FilterBar+FilterChip+FilterPanel/DomainPrefixInput/SettingsPane+VerticalTabs) — Phase 5 `_design-system/components.css` SSOT React 변환, 비즈니스 로직 없는 reusable primitive. KI-061(Stepper 컴포넌트화 — G3 list SSOT 채택, G2 dead code 미사용) 자연 해소. 검증 인프라(vitest node + react-dom/server renderToStaticMarkup, jsdom 불요) 신규 + 단위 24. turbo lint/typecheck/test/build 21/21. 듀얼검증 대기.
- [ ] WI-031-feat Sprint 2 DB foundation (마이그레이션 36~38: lifecycle/settings 보강 + draft partial unique + 검색 인덱스 + 예약 적용 큐 + plan/roles seed) — ⚠️ **DB schema 사용자 승인 필요**(§5/§7-2)
- [ ] WI-032-feat TA-13 회사설정 API (GET/PATCH /tenant/settings/* 9탭 + 적용일 즉시/예약 cron) [ST-053]
- [ ] WI-033-feat TA-13 회사설정 UI (SettingsPane 9탭 shell + 회사정보/근무/휴가/결재라인 4탭 폼 + E2E) [ST-053]
- [ ] WI-034-feat 결재라인 조건 분기 (approval_lines.conditions jsonb 평가엔진 + 조건트리 UI + E2E) [ST-054]
- [ ] WI-035-feat OP-04 등록 API (check-domain/business-number 검증 + drafts upsert + 최종 등록 트랜잭션 + 관리자 초대) [ST-006]
- [ ] WI-036-feat OP-04 7단계 마법사 UI (Stepper + 실시간검증 + 임시저장 재진입 + 초기데이터) + 관리자 활성화 [ST-006/010]
- [ ] WI-037-feat OP-02 테넌트 목록 (DataTable/FilterBar + 검색/필터/sort/페이지/Excel) + 상태변경 audit [ST-007/009]
- [ ] WI-038-feat OP-03 테넌트 상세 8탭 (URL 동기화 + 비활성화 Realtime broadcast) [ST-008]

## Phase 8 — QA 시나리오

- [ ] WI-022-test Gherkin 시나리오 (골든 패스)
- [ ] WI-023-test 권한 매트릭스 음성/양성 케이스
- [ ] WI-024-test E2E 테스트 스펙

## Phase 9 — 베타 온보딩

- [ ] WI-025-docs 베타 모집 + 온보딩 체크리스트
- [ ] WI-026-docs 피드백 채널 + 트리아지 SOP

## Phase 10 — 운영/유지보수

- [ ] WI-027-docs SLA + 장애 대응
- [ ] WI-028-docs 백업/복구 절차
- [ ] WI-029-docs 모니터링 / 알림

## Known Issue Batch WI

- [x] **WI-KI-batch-001 (PRD 정합 정리, 5건 해소)**: KI-008/009/010/011/012 일괄 처리 완료 (2026-05-15)
  - 아카이브: `.flowset/known-issues/archive/2026-05-15-batch-001.md`
- [x] **WI-KI-batch-002 (Phase 4 정합 정리, 4건 해소)**: KI-021/022/024/026 (2026-05-15)
  - KI-023(v1.2)/KI-025(Phase 10) deferred 등록
  - 아카이브: `.flowset/known-issues/archive/2026-05-15-batch-002.md`
- [x] **WI-KI-batch-005 (i18n MVP — ko + en 동시)**: 사용자 결정 (2026-05-16, 외국인 근로자 사용성)
  - PRD: 06-mvp-scope (영어 v2.0 → MVP) + 03-tech (next-intl 정책) + 01-personas (P8 외국인 근로자) + 04-data-model (legal_documents.language + users.locale)
  - common.md: CM-15 알림 채널 locale 분기 (en은 카카오 skip → SMS+이메일) + CM-16 "언어/Language" 메뉴 + CM-21 ko/en 페어 게시 + 영문 참고 번역 정책 + 이메일 템플릿 ko/en 10종
  - DB: erd legal_documents.language(ko|en) + users.locale + 인덱스 + 트리거 language 차원 갱신 + ko/en 동시 게시 의무
  - API: auth.md login response.user.locale + locale 결정 우선순위 + PATCH locale + common.md /legal/documents?language= + ko/en 페어 POST 의무 + i18n messages API
  - matrix.json: LegalDocument endpoints + comment 갱신
  - 디자인 시스템: 08-i18n.md 신규 (정책 + 키 catalog + 컴포넌트 매핑 + 차트 포맷 + 검증) + 03-components.md §2-2 i18n 정책 + 07-react-mapping.md §8 next-intl 매핑 + README 인덱스 갱신
- [x] **WI-KI-batch-004 (디자인 시스템 SSOT 구축, P1 1건 해소)**: KI-037 (2026-05-16, evaluator PASS 8.61/10)
  - `_design-system/` 12 파일 신설 (README + 7 spec + tokens.css + components.css + icons.svg + _layout-shell.html)
  - `_showcase.html` 컴포넌트 시연 + 변수 표기 정책 + 정렬 검수 ruler
  - OP-01.html 디자인 시스템 적용 재작성 (sprite 인라인 + 모든 svg width/height attribute + 글로벌 컴포넌트 _layout-shell 표준)
  - 03-components.md Anatomy + Props + Variant matrix 16+ 컴포넌트 + Variable Notation §1-1 + 텍스트 가변성 §2-1
  - components.css 자손 셀렉터 + display:block !important + descendant 누설 차단(empty-state) + icon-btn 배지 위치 -2/-2 + EmptyState `.ico-empty` 명시
  - 평가 후 P2 2건 즉시 처리 (정책 표기 통일 + _layout-shell svg attribute 추가) + P3 4건 KI-038~041 등록
  - 아카이브 예정: `.flowset/known-issues/archive/2026-05-16-batch-004.md`
- [x] **WI-KI-batch-003 (PRD 누락 결함 P1 5건 보강)**: KI-027/028/029/030/031 일괄 처리 완료 (2026-05-15)
  - 09-routing.md 신규 + common.md CM-16~22 + OP-12 신규 + 04-data-model 39 엔티티 + matrix.json 44 화면
  - db/erd §5 컴플라이언스 + db/rls §6-1 + db/indexes 6개 + db/enums 2 + db/migrations 24개
  - api/common 헤더·약관·온보딩 + api/auth 세션·강제종료·약관가드 + api/schemas zod
  - backlog/stories ST-073~080 (8 Story / 36 SP) + epics 표 갱신
  - evaluator.md L38/L61-64 + review-rubric.md L91 보강 (사전 완료, KI-031)
  - 아카이브: `.flowset/known-issues/archive/2026-05-15-batch-003.md`
  - 후속: Phase 1~4 retroactive 재평가 + Phase 5 HTML 와이어프레임 재시작
