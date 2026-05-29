# FlowHR 핸드오프 — 신규 세션 진입 가이드

> **갱신**: 2026-05-29 batch F (Phase 7 Sprint 1 — WI-020-2 ST-078 약관/동의 PIPA 완료). 듀얼검증 PASS_BOTH 후 머지(PR #38, `84a1853`).
> **신규 세션 첫 작업**: 본 문서 **§-0 (2026-05-29 batch F)** 정독 → **WI-020-3 ST-072 오류/점검(CM-06 404/500/503 + 점검모드 maintenance_windows + Sentry 추상화훅, codex 협의 A안)** 또는 **WI-020 인증보조(ST-002~004)**. ⚠️ **모든 코드 머지는 듀얼검증 게이트(evaluator+codex PASS_BOTH + `<WI>.pass` 마커) 통과 필수** — `project.md §1-1`.
> **이전 핸드오프**: 2026-05-29 batch E (WI-021 사이클 CI/OpenAPI/39 entity zod, §-0e) / batch D (WI-019 Day8~10, §-0d) / batch C (WI-020 ST-001 로그인, §-0b) / batch B (듀얼검증 게이트 + WI-019 Day3~5, §-1) / batch A (모노레포+인프라, §-2)

## -0. 2026-05-29 batch F 세션 진척 — **신규 세션 여기부터**

### 완료 — WI-020-2-feat ST-078 약관/동의 (CM-21, PIPA 컴플라이언스)

codex 협의(Sentry 추상화훅 A / 분할 B = ST-078 먼저 / 게시 API+seed A) 채택. ST-072 오류·점검은 **WI-020-3 으로 분리**. PR #38 머지(`84a1853`). 듀얼검증 **PASS_BOTH**.

| 영역 | 산출물 |
|------|--------|
| DB (mig 34) | `legal_documents_ensure_single_active` + `user_consents_block_modify` 트리거(rls.md §6-1 SSOT, search_path 고정 + RPC revoke) + 게시 RLS `is_operator()`→**`is_operator_super()`** 교체(R1, AC-4). staging 적용 + 트리거 2종 실증(단일active 전환 / 불변 차단) |
| seed | `supabase/seed.sql` — terms/privacy × ko/en **active 1쌍**(placeholder 본문, 운영사 게시로 교체) + staging 주입 |
| schemas | `consentInput`/`legalDocumentPublish`(**ko·en 페어 스키마 강제**)/`requiredConsent` zod DTO(camelCase API 계약) + openapi **48 components** + 단위테스트(31) |
| server lib | `apps/web/lib/legal/{queries,actions,guard}` — 조회(요청언어 우선 ko fallback) / 필수동의 판정 / `recordConsent`(ip·ua·source 서버결정 + **agree 서버검증** + 멱등 upsert) / `publishLegalDocuments`(operator_super **세션 client** — RLS 실효 + ko/en 트랜잭션) |
| CM-21 | `(legal)/legal/[type]` 페이지(react-markdown 5상태, en 참고번역 banner) + 강제동의 폼 + **가드(로그인 직후 redirect AC-2 + 보호 레이아웃 employee/operator/tenant 3종 R4, 미들웨어 미사용)** |
| i18n / 정합 | `legal.*` ko/en + `safeInternalPath` 공용 추출(login actions 정합) + schemas.md DTO 노트 |

### 듀얼검증 (codex 실결함 검출 — 게이트 모범 사례)

| 라운드 | evaluator | codex | 정정 |
|------|------|------|------|
| 1차 | PASS 8.45 | **BLOCKED_FOR_HOTFIX** P1×1+P2×2 | — |
| hotfix (`f1ac057`) | (유지) | **PASS_VERIFIED** | P1 agree 서버검증 / P2 게시 service_role→세션client(RLS 실효) / P2 IP `node:net isIP` / P3 dead i18n key·`drop policy if exists` |
| → **PASS_BOTH** | | | `.flowset/eval-results/WI-020-2-feat.pass` |

### 신규 KI (batch F)

| KI | 등급 | 내용 |
|----|----|----|
| KI-091 | P3 | 강제동의 "동의-클릭→복귀" + operator 게시 트랜잭션 자동 E2E 미검증 — user_consents 불변 트리거로 멱등 cleanup 불가(시드 setup/teardown 필요). 비로그인 조회 E2E 5/5 + 가드/트리거/recordConsent staging DB 실증으로 핵심 커버. KI-089 동반 |
| KI-092 | P2 | ST-078 **AC-5 운영사 감사 화면**(동의 통계/이력, `GET /operator/legal/consents`) 미구현 — RLS plumbing 존재. OP-09 audit(EP-05) 별도 sprint deferral |

### staging 상태 (batch F)

- `nwcttwuvdnelfbpjeqzr`: 마이그레이션 **34 적용**(legal 트리거 2 + 게시 super 게이트). seed 약관 **4행**(terms/privacy × ko/en v1.0.0 active). **test-employee 동의 시드 2행**(terms-ko/privacy-ko, source=activate — 기존 login E2E 회귀 보존용).
- ⚠️ test-employee 미동의면 로그인 후 `/legal/terms?must_accept` redirect(강제동의 가드 정상 동작). E2E 회귀 위해 동의 시드 유지.

### 검증 (batch F)

- typecheck/lint/test/build **19/19** + 비로그인 약관 조회 E2E **5/5**(ko/en banner/privacy/404/언어전환) + 기존 login E2E **9 회귀 무손상** + 강제동의 트리거/recordConsent/required 판정 **staging DB 실증**.

### 다음 세션 첫 작업 후보

1. **WI-020-3-feat ST-072 오류/점검 (codex 협의 A안)**: CM-06 404/500/503 + 점검모드(`maintenance_windows` status=active 미들웨어 — 비-operator 503 / operator_super 우회) + **Sentry 추상화훅**(`captureServerError()` + DSN env 미설정 시 no-op, @sentry/nextjs 미설치 — 실제 연동/계정은 S6). `not-found.tsx`/`error.tsx` 신규. CM-05 forbidden(KI-080) 인접.
2. **WI-020 인증보조 (ST-002~004)**: 비번찾기/활성화(약관 동의 흐름 — ST-078 `recordConsent(source='activate')` 재사용)/2FA(custom TOTP=speakeasy+challengeToken+복구코드8, speakeasy 미설치).

## -0e. 2026-05-29 batch E 세션 진척

### 완료 — WI-021 사이클 (CI 토대 + OpenAPI 파이프라인 + 39 entity zod schema)

codex 우선순위 협의(WI-021 → WI-020 약관/오류 → WI-020 인증보조)로 진행. WI-021 계열 3건 머지(PR #34/#35/#36):

| WI | PR | 내용 | 듀얼검증 |
|----|----|----|------|
| WI-021-feat | #34 | `phase7-code.yml` CI 4 job(lint/typecheck/unit-test/build, `apps`·`packages` path-scope) + zod-to-openapi 파이프라인(`packages/schemas/scripts/build-openapi.ts`→`dist/openapi.yaml`) + OpenAPI diff 게이트 + 로그인 E2E job(KI-082, secrets 조건부) + PR template 코드 게이트 + turbo typecheck→build 선행 | PASS_BOTH (evaluator 8.40 / codex 5건 정정) |
| WI-021-2-ci | #35 | required 게이트 함정 해소 — `phase7-code.yml` **changes-gate 패턴**(on.paths 제거 → changes job + 각 job `if: code` → 비코드 PR skip=required 통과) + phase7 4 job **branch protection 필수체크 등록**(contexts 6→10) | (CI 보정, dual-gate skip) |
| WI-021-1-feat | #36 | ERD **39 entity zod schema** (`packages/schemas/src/entities/` 8파일, DB **snake_case 1:1**, database.ts Row 정합) + `openapi.yaml` **45 components** + `entities.test.ts` 23 + api/schemas.md SSOT 정합 노트 | PASS_BOTH (evaluator 8.75 / codex 4라운드 PASS) |

### 핵심 결정/정합 (batch E)

- **casing SSOT**: entity zod = **DB snake_case 1:1**(database.ts Row). API DTO camelCase는 Phase 4 초안 → `api/schemas.md`에 정합 노트. **실 SSOT = `packages/schemas/src/entities/*` + `dist/openapi.yaml`** (codex 협의, supabase 직결 + 변환 레이어 미사용)
- **DB text 컬럼 주의**: `employees.role`/`users.role`/`user_consents.document_type`/`audit_logs.request_id` 는 DB text → `z.string()`(enum/uuid 강제 금지). `user_consents.ip_address` 는 nullable inet → `z.string().nullable()`. **`operator_users.role` 만 실 DB enum**(operatorRoleEnum). 6역할 `appRoleEnum`은 입력/권한 검증용(entity 미적용)
- **날짜**: staging `information_schema` 실측 — `_date`/`joined_at`/`left_at`/`birth_date`/`contract_*`/`issued_at`(invoices)/`paid_at`/`period_*` 등은 `z.string().date()`, `_at`(timestamptz)은 `isoTimestampSchema`, time/inet은 `z.string()`. **`certificate_requests.issued_at` 는 timestamptz**(invoices.issued_at=date와 구분)
- **phase7-code.yml**: changes-gate(모든 PR 트리거). 필수체크 10개 = commit-msg/encoding/html-syntax/ds-ssot/version/dual-gate + Lint/Type Check/Unit Test/Build
- **OpenAPI 파이프라인**: zod→`dist/openapi.yaml`(gitignore 예외 추적, build job `git ls-files`+diff 게이트). endpoint req/res schema는 Sprint 2~6 점진

### 신규 KI (batch E)

| KI | 등급 | 내용 |
|----|----|----|
| KI-082 | P3 | 로그인 E2E CI 자동화 — 인프라 구축 완료, **repo secrets 5종 주입 시 자동 활성** |
| KI-088 | P3 | CI typecheck/build 중복(turbo cache key sha 고정) |
| KI-089 | P3 | e2e job staging 시드 setup/teardown 부재 |
| KI-090 | P3 | entity 테스트 39중 11 직접 + work_policies time/user_consents inet refine 부재 |

### 미해결/주의 (다음 세션 인지)

- **KI-082 secrets (사용자 외부 설정)**: GitHub repo secrets에 `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` 주입 시 로그인 E2E 자동 회귀 활성(시드 `test-employee@flowhr.test`)
- **Vercel preview fail**: 기존(WI-019부터) — `Output Directory "public"` 설정 누락(monorepo). **비필수체크**(branch protection 10개에 미포함). Vercel project root/output 설정은 별도 인프라 작업
- **Node 20 deprecation**: CI actions(checkout@v4/setup-node@v4/cache@v4/pnpm-action-setup@v4) **2026-06-02부터 Node 24 강제** — actions 버전 점검 chore 필요
- **prd-state.json**: 코드 WI PR에 상태 갱신 포함(main 직접 push 금지)

### 다음 세션 첫 작업 후보 (codex 재협의 순서)

1. **WI-020 약관/오류 (2순위)**: ST-078 약관·동의(CM-21 PIPA + ko/en 페어 + 강제동의 가드 + 운영사 게시, 8SP P0) + ST-072 오류·점검(CM-06 404/500/503 + Sentry). RLS/audit/legal_documents 의존 충족. **ST-078이 ST-003 활성화 약관 흐름 선행**(codex 근거). legal_documents/user_consents zod schema 이미 WI-021-1에 존재
2. **WI-020 인증보조 (3순위)**: ST-002 비번찾기(CM-02 토큰60분+미등록 동일응답) + ST-003 활성화(CM-03 7일토큰+1회+약관+2FA) + ST-004 2FA(CM-04 **custom TOTP=speakeasy+challengeToken+복구코드8**, speakeasy 미설치→설치 필요). users 테이블에 totp_enabled/totp_secret_encrypted/recovery_codes_hash 이미 존재

## -0d. 2026-05-29 batch D 세션 진척

### 완료 — WI-019 Day8~10 (RLS + audit + Realtime + composite FK)

`feature/WI-019-feat-rls-audit-realtime` → PR #32 머지(`07d18d5`). 듀얼검증 PASS_BOTH(evaluator 8.62 + codex 3차 PASS).

| 영역 | 산출물 |
|------|--------|
| ST-005 RLS | 마이그레이션 `27` — 39테이블 ENABLE RLS + 94정책(패턴 A/B/C/D) + 헬퍼 6종 **SECURITY DEFINER public.users 조회 기반**(JWT 클레임 부재 + hosted hook MCP 불가 → codex 협의, KI-084로 표준화 후속) + my_team_employee_ids + 운영사 우회 + 컴플라이언스 불변성 |
| KI-077 composite FK | 마이그레이션 `28`+`32` — employees/leave_types/approvals 부모 UNIQUE(tenant_id,id) + 자식 **19 FK**(28: 15건 employees 12/leave_types 2/approval_steps 1, 32: 폴리모픽 approval_id 4)를 (tenant_id,ref)→(tenant_id,id) 전환. **KI-077 resolved** |
| ST-068 audit | 마이그레이션 `29` — 범용 `audit_row_change()` SECURITY DEFINER + 21테이블 AFTER INSERT/UPDATE/DELETE + APPROVE 특례 + `prune_audit_logs()` 5년 보관(pg_cron 조건부). KI-026: 폴리모픽 자식 3개 제외. 월 파티셔닝 KI-085 유보 |
| ST-069 Realtime | 마이그레이션 `30` — supabase_realtime publication(notifications/approvals/approval_steps) + REPLICA IDENTITY FULL. 클라이언트 `packages/api-client/src/realtime.ts` (`useRealtimeSubscription` + 비종속 매니저, 자동 재연결 백오프 + 오프라인 fallback, `@flowhr/api-client/react` 서브패스) |
| 하드닝 | 마이그레이션 `31` — 술어헬퍼 search_path 고정 + audit_row_change/prune_audit_logs/record_login_failure RPC 노출 차단 |
| 인가 정정(codex 듀얼검증) | 마이그레이션 `32`/`33` — INSERT tenant 오귀속 차단(tickets/ticket_messages/user_consents) + 직원·admin status 자기승인 차단(leaves/attmod approved·rejected→service_role 매개) + approvals/approval_steps 라우팅 컬럼 불변 트리거 + requester self-routing 차단 + SET NULL composite FK 9건 `set null (<col>)` 컬럼지정(PG17, tenant_id NOT NULL 보존) |
| 검증 | RLS 매트릭스 **T1~T13** staging 실증 PASS(`supabase/tests/rls_matrix_check.sql`) + 로그인 무손상 + typecheck 7/7 + lint 8/8 + test 13 + build(/ko·/en) + security advisor 잔여 수용 |

### 듀얼검증 경과 (codex가 실제 결함 2라운드 검출 — 게이트 모범 사례)

| 라운드 | evaluator | codex | 정정 |
|------|------|------|------|
| 1차 | PASS 8.80 | FAIL P1 4 | mig32 (INSERT tenant 가드 + 자기승인 차단 + approval_id composite) |
| 2차 | PASS 8.80 | FAIL P1 2+P2 1 | mig33 (SET NULL 9건 컬럼지정[부모삭제 깨짐] + self-routing/admin self-approve 차단) |
| 3차 | PASS 8.62 | **PASS** | → **PASS_BOTH** |

### 신규 KI (batch D)

| KI | 등급 | 내용 |
|----|----|----|
| KI-084 | P3 | RLS 헬퍼 Custom Access Token Hook 표준화 (현 SECURITY DEFINER public.users 조회 → JWT 클레임. dashboard 활성화 필요) |
| KI-085 | P3 | audit_logs 월 파티셔닝 (현 비파티션 + 트리거/보관함수 제공. 스케일 시 전환) |
| KI-086 | P3 | Auth leaked-password protection dashboard 활성 |
| KI-087 | P3 | 결재 워크플로 SoD/상태전이 정식 가드 + leaves 미러 service_role RPC (Sprint 6 결재 처리 WI) |

### 인프라/환경 상태 (batch D)

- staging `nwcttwuvdnelfbpjeqzr`: **39테이블 RLS 활성 + 94정책** (마이그레이션 27) + composite FK(28/32/33) + audit 트리거 21(29) + Realtime publication 3(30) + 하드닝/인가정정(31/32/33). 마이그레이션 원격 적용 완료(1~20, 25~33).
- **RLS 헬퍼 클레임 소스**: `auth.uid()` → `public.users` 조회(SECURITY DEFINER, search_path 고정). JWT 커스텀 클레임 미사용 — KI-084로 표준화 예정. rls.md §1/§4에 구현 정합 노트 반영.
- **승인/반려 전이**: leaves/attendance_modifications의 status=approved/rejected는 PostgREST 직접 UPDATE 차단 → service_role 결재 RPC 매개(정식 RPC는 Sprint 6 KI-087). approval_steps INSERT는 관리자/service_role 전용.
- 테스트 유저 시드(`test-employee@flowhr.test`) + audit_logs 기존 row 유지. RLS 매트릭스 테스트는 BEGIN..ROLLBACK으로 비영속.

### 다음 세션 첫 작업 후보

1. **WI-020 잔여**: ST-002 비번찾기(CM-02) + ST-003 활성화(CM-03) + ST-004 2FA(CM-04, **custom TOTP=speakeasy+challengeToken+복구코드8 결정됨**) + ST-078 약관(CM-21) + ST-072 오류(CM-06). ST-072/078은 RLS+audit 의존(이제 충족).
2. **WI-021**: zod-to-openapi + `phase7-code.yml` CI 4 job (build→typecheck 순서 주의 — `.next/types` include). KI-082 로그인 E2E CI 자동화 포함.

---

## -0b. 2026-05-29 batch C 세션 진척 (WI-020 ST-001 로그인)

### 완료 — WI-020 ST-001 로그인 핵심 (Sprint 1 Day 6~7)

`feature/WI-020-feat-login-core` (커밋 fcf6542 base UI 5종 + d6582ca 로그인 핵심 + c40454f 듀얼검증 정정), auto-merge PR.

| 영역 | 산출물 |
|------|--------|
| 인증 | `@supabase/ssr` 서버/서비스롤 클라이언트(`packages/api-client/src/{server,service-role}.ts`, `/server` 서브패스 server-only) + 미들웨어 세션갱신·인증가드(`apps/web/middleware.ts` + `lib/supabase/middleware.ts`) |
| CM-01 | `app/[locale]/(auth)/login/{page,login-form,actions}.tsx` + `(auth)/layout.tsx` — 서버액션 + useActionState, ko/en i18n, 비밀번호 토글, return_url 소비(오픈리다이렉트 방지) |
| 5회 잠금 | `supabase/migrations/26_login_attempts.sql` (login_attempts RLS+정책0 + `record_login_failure` RPC SECURITY DEFINER, service_role 단독 grant, (email,ip) 5회→5분, 15분 윈도우) |
| 역할 리다이렉트 | `roleToRedirectPath`/`canAccessPath`(api-client) + 최소 랜딩 placeholder 3종 `(operator)/(tenant)/(employee)` (후속 OP-01/TA-01/EM-01 대체) |
| audit | `auth.login`/`login_failed`/`locked` (service_role, best-effort) |
| 검증 | typecheck 7/7 + lint 8/8 + 단위 12 + next build + **Playwright E2E 9/9 (실 로그인→/ko/me, 5회 잠금, return_url 보안, audit staging 실증)** |

### 듀얼검증 (PASS_WITH_KI)

- evaluator PASS 8.38/10 (4축 ≥7.5) / codex CONDITIONAL → **정정 2건**(service_role server-only 경계 + return_url 소비) + **KI 6건 등록** → `.flowset/eval-results/WI-020-feat.{eval,codex,pass}.md`.
- **사용자 승인 deferral (2026-05-29)**: codex P1(분산 무차별대입 하드닝)을 KI-078로 등록 후 머지 (CAPTCHA+per-IP 429+TOCTOU는 명세가 후속으로 미뤄둔 항목).

### 신규 KI (batch C)

| KI | 등급 | 내용 |
|----|----|----|
| KI-078 | P1 | 분산/멀티-IP 무차별대입 하드닝 (CAPTCHA + per-IP 429 rate-limit + TOCTOU 사전예약) — 인증 하드닝 WI |
| KI-079 | P2 | rememberMe 세션 TTL(30d/12h) 미반영 — 세션관리 ST-005 |
| KI-080 | P3 | 역할불일치 /forbidden(CM-05) 미적용 + /me 폴백 |
| KI-081 | P3 | 잠금 윈도우 경계 문서화/단위 |
| KI-082 | P3 | 핵심 로그인 E2E CI 자동화 (WI-021 phase7-code.yml) |
| KI-083 | P3 | audit best-effort 실패 알림 보강 |

### 인프라/환경 상태 (batch C)

- staging `nwcttwuvdnelfbpjeqzr`: public **40 테이블** (39 + login_attempts) + `record_login_failure` 함수. RLS는 login_attempts만 활성(정책0/service_role 전용) — **나머지 39 테이블 RLS 미적용, Day8 ST-005 예정**.
- **테스트 사용자 시드** (staging): `test-employee@flowhr.test` / `Test1234!@` (role=employee). E2E 재현용 — 유지. (auth.users 직접 INSERT + 토큰컬럼 '' 보정, public.users role 매핑)
- **`SUPABASE_SERVICE_ROLE_KEY`**: 로컬 `apps/web/.env.local`에만 입력됨(gitignore). **Vercel staging/preview엔 미배포** — staging 배포 시 주입 필요. preview는 mock(미연동) 전략 유지.
- E2E 실행: `cd apps/web && E2E_TEST_EMAIL=test-employee@flowhr.test E2E_TEST_PASSWORD='Test1234!@' pnpm exec playwright test` (DASHBOARD env는 MSYS 경로변환 주의 — 미설정 시 기본 /me).

### 다음 세션 첫 작업 후보

1. **WI-020 잔여**: ST-002 비번찾기(CM-02) + ST-003 활성화(CM-03) + ST-004 2FA(CM-04) + ST-078 약관(CM-21) + ST-072 오류(CM-06). 2FA는 Supabase MFA(AAL) 또는 auth.md custom 플로우 결정 필요.
2. **WI-019 Day8~10**: ST-005 RLS 정책 SQL(39테이블, KI-077 composite FK 결정) + ST-068 audit 트리거(21테이블) + ST-069 Realtime publication.
3. **WI-021**: zod-to-openapi + `phase7-code.yml` CI 4 job (KI-082 E2E 자동화 포함).

---

## -1. 2026-05-28 batch B 세션 진척 — **신규 세션 여기부터**

### 완료 (PR #26~28, main `5e7d451` 기준 — `git log`로 최신 확인)

| PR | WI | 내용 |
|----|----|----|
| #26 | WI-019-feat | apps/web 스캐폴드(Next 15.5 + Tailwind v4 + next-intl `[locale]` ko/en) + packages 7개 + supabase init + ERD 39엔티티 스키마 마이그레이션 1~20 원격 staging 적용 + `packages/types/database.ts` 생성 (Day 3~5) |
| #27 | WI-DualGate-chore | **듀얼검증 머지 게이트 구축** — CI `dual-verification-gate`(branch protection 필수체크) + `project.md §1-1` 신설 + KI-077 등록 |
| #28 | WI-019-1-fix | WI-019 듀얼검증 정정 — approval_id UNIQUE 4테이블 + users.employee_id UNIQUE (마이그레이션 25) + packages 7개 lint 커버리지 |

### 이번 세션 핵심 — 듀얼검증 게이트 (절대 스킵 금지)

- **코드 WI(`apps`/`packages`/`supabase`)는 머지 전 evaluator + codex 한 세트 PASS_BOTH + `.flowset/eval-results/<WI>.pass` 마커 필수.** CI `dual-verification-gate`(pr-checks.yml, branch protection 필수체크)가 마커 부재/stale 시 **기계적으로 머지 차단**. PR #28에서 실전 통과 입증.
- WI-019 듀얼검증: evaluator PASS 8.35 / codex CONDITIONAL → 정정(PR #28, evaluator 8.85 / codex 결함0 → PASS_BOTH).
- **교훈(사용자 지적)**: 듀얼검증은 "Sprint 종료 시"가 아니라 **WI별 머지 전** 의무. 메모가 아닌 CI 게이트로 강제함. **핸드오프 갱신도 검증 대상**.

### 인프라/스키마 상태

- 원격 staging `nwcttwuvdnelfbpjeqzr`: public **39 테이블** + UNIQUE 보강 (마이그레이션 1~20 + 25) 적용됨. **RLS 전 테이블 미적용 — Day 8 ST-005 예정 (staging 비어있는 비프로덕션)**.
- **Docker 미설치** → 마이그레이션/타입은 **supabase MCP(원격)** 경로. `supabase db reset --local` 불가. (`project_supabase-local-workflow` 메모)
- `apps/web/.env.example`만 커밋(키 없음). 로컬 `.env.local` 미생성.
- 디렉토리 구조 SSOT = `mvp-plan.md §1` (현 코드 정합). WI-020 로그인은 `app/[locale]/(auth)/login/`.

### 다음 세션 첫 작업 — WI-020-feat 로그인 핵심 (Sprint 1 Day 6~7)

- `feature/WI-020-feat-login-core` 브랜치(base UI 컴포넌트 5종 Button/Input/Label/Card/Alert 커밋 보존, 미머지) → **최신 main rebase 후** 진행.
- ST-001: Supabase Auth(@supabase/ssr) 로그인 + CM-01 페이지 + 5회 실패 잠금 + 역할별 리다이렉트 + audit. (Task #5/#6)
- ⚠️ **5회 잠금**: 현 `users` 스키마에 `failed_login_count`/`locked_until` 없음 → `api/auth.md` 설계 확인 후 마이그레이션 필요 가능성.
- 머지 시 **듀얼검증 게이트 통과 필수** (`<WI>.pass` 마커가 마지막 코드 커밋의 후손이어야 함).

### KI 현황 (2026-05-28 batch B)

| 등급 | 활성 | 비고 |
|------|----|----|
| P0 | 0 | — |
| P1 | 1 | **KI-077** (WI-019 교차테넌트 FK, Day8 ST-005 일괄 결정 — 사용자 defer) |
| P2 | 2 | KI-054/061 (Phase 7 React 변환 scheduled) |
| P3 | 22 | Phase 7~10 scheduled |

### 환경 (실측)

**실측 설치 버전** (package.json은 semver 범위, 예: turbo `^2.3.0` / typescript `^5.7.0` / next-intl `^3.26.3` / tailwindcss `^4` / node `>=20.0.0`): pnpm 9.15.0 / turbo 2.9.14 / typescript 5.9.3 / next 15.5.18 / react 19.1.0 / next-intl 3.26.5 / supabase CLI 2.101.0 / tailwind 4.3.0 / node 24.12.0 / supabase MCP 인증됨. (세션 시작 시 재측정 권장)

---

## -2. 2026-05-28 batch A 세션 진척 (모노레포 + 인프라 연동) — 완료

### 완료 (PR #20~24, main `baba6da` 기준 — `git log`로 최신 확인)

| PR | WI | 내용 |
|----|----|----|
| #20 | WI-018-feat | 모노레포 루트 셋업 (pnpm@9.15.0 workspaces + Turborepo 2.9.14 + tsconfig.base + devDeps 5종) |
| #21 | WI-InfraPolicy-docs | **유료 가정 정정** — Phase 1~6 무단 산입 유료 기능(Supabase Pro/Vercel Pro/Sentry/NHN/Tauri 인증서) → Free 시작 + Pro 전환 5트리거. `guardrails.md §9(산입 금지 원칙)/§10(인프라 정책 SSOT)` 신설 |
| #22 | WI-KI-batch-007-docs | 문서 정합 9건 (KI-032/033/040/042/056/062/074/075 resolved + KI-016 NHN DEFER) |
| #23 | WI-KI-batch-008-wf | 와이어프레임 정정 5건 (권한매트릭스 15화면 역할\|권한 2열 + TA-13/CM-04/CM-21) + Phase 7 재분류 8건. **wf-v1.0.1** tag |
| #24 | WI-env-chore | **Supabase ↔ Vercel 연동** + supabase MCP/skills 셋업 |

### 인프라 연동 완료 (SSOT: `guardrails.md §10` + `prd-state.json infra_connection`)

- **Supabase** `nwcttwuvdnelfbpjeqzr` (Free) ↔ **Vercel** `flowhr-sop` (yh-devs-projects/kryou2922, 나중 flowcoder25 이전)
- production env: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`(legacy JWT). **service_role은 WI-020 시점**.
- **프로젝트 supabase MCP** (`.mcp.json`, project_ref 직결, OAuth 인증 완료) — 마이그레이션/스키마 직접 조작 가능
- **supabase agent skills** 설치 (`.agents/skills/{supabase,supabase-postgres-best-practices}`) — Phase 7 DB 작업 시 모범사례
- 운영 전략 (codex 역제안): preview = Supabase 미연동 mock / PR 검증 = CI ephemeral `supabase start` / staging = Free 1개
- ⚠️ **기존 yh-devs/flowhr(별개 payroll 프로젝트)는 무관 — 건드리지 말 것**

### 핵심 정책 (이번 세션 확립)

- **외부 비용/유료 기능은 사용자 명시 승인 전 산출물 의무화 금지** (`guardrails.md §9`). 협업: 사용자=기획/결정, AI=개발/유지보수.
- **Pro 전환 5트리거**: 3사 입점 / DB 400MB / Storage 800MB / Connection 60 위험 / SLA·컴플라이언스 요구.

### (batch A 당시) 다음 작업이었던 WI-019 — ✅ **완료** (PR #26 Day3~5 + PR #28 정정, batch B에서 처리). Day 8~10(RLS/audit/Realtime)은 WI-020 후 잔여.

`sprint-001.md` Day 3~5 (WI 매핑 주석 참조 — WI-018 모노레포 / **WI-019 인프라(apps/web 스캐폴드 + supabase init + RLS + audit + Realtime)** / WI-020 인증+약관 / WI-021 zod-openapi+CI):
1. `pnpm dlx create-next-app apps/web` (Next.js 15 + Tailwind + App Router + `[locale]` i18n)
2. `packages/{ui,schemas,types,api-client,i18n,platform,config}` 7개 스캐폴드
3. `supabase init` (루트) + Phase 3 마이그레이션 변환 + `packages/types/database.ts` 생성 (supabase MCP 활용)
4. `.env.local` 동기화 (`vercel env pull --environment=production` 또는 로컬 supabase)

### KI 현황 (2026-05-28)

| 등급 | 활성 | 비고 |
|------|----|----|
| P0/P1 | 0 | — |
| P2 | 2 | KI-054/061 (Phase 7 React 변환 scheduled) |
| P3 | 22 | 전부 Phase 7~10 코드/단계 의존 scheduled — 지금 docs/wf batch로 처리 가능한 KI는 소진 |

### 환경 (실측)

pnpm 9.15.0 (corepack) / turbo 2.9.14 / typescript 5.9.3 / vitest 2.1.9 / @playwright/test 1.60.0 / node 24.12.0 / Vercel CLI 50.1.6 (kryou2922-4113 로그인) / supabase MCP 인증됨

> ⚠️ **§0 이하는 2026-05-19 Phase 6 종료 시점 스냅샷** — 브랜치/카운트/PR/테이블 수 등은 그 시점 기준이며, **현재 상태는 위 §-1(batch B)이 최신·정확**. 신규 세션은 §-1만 따르면 충분(§0 이하는 이력 참고).

## 0. Phase 6 종료 사이클 (2026-05-19)

신규 세션 진입 후 사용자 명령 "핸드오프 읽고 작업 진행해"로 시작:

1. **Phase 2 재평가 (KI-013/034 closure, PR #16)** — Phase 6 진입 전 의무 2건 처리
   - KI-013: EP-03/04/05/09/10/11/12 7 Epic + ST-073~080 + ST-071 Task 137건 신규 분해 → 80 Story / 223 Task / 838 MD
   - KI-034: 5 파일 합계/의존/카운트 stale 정합화
   - 평가 4 사이클: 1차 FAIL 6.90 → 2차 FAIL 7.625 → 3차 FAIL 7.625 → **4차 PASS 8.475 (evaluator) + 8.34 (codex gpt-5.5)**
   - PASS_BOTH 통합 판정 → main 머지 (commit `d6aaa95`)

2. **사용자 지적**: "디렉토리 구조 명확히 잡고 가" → codex 협의 7건 결정 채택

3. **Phase 6 mvp-plan + sprint-001~010 (PR #17)** — 11 파일 신규 작성
   - 디렉토리 구조 SSOT (codex 7건 결정): `apps/{web,desktop}` + `packages/{ui,schemas,types,api-client,i18n,platform,config}` + 루트 `supabase/`
   - KI-071 묶음 closure (15곳: epics SP 7곳 + estimation 4곳 + stories L646 + prd-state.json:61 i18n + api/README.md:3 entity + .claude/rules/project.md:57 CI 카운트)
   - 평가 사이클: evaluator 1차 PASS 8.40 → 2차 PASS 9.00 / codex 1차 FAIL 7.4 → 2차 CONDITIONAL 7.88 → 3차 CONDITIONAL 7.81 → 4차 CONDITIONAL 8.21 (mechanical fix 22건 누적 closure + false alarm 2건)
   - PASS_WITH_KI 통합 판정 → main 머지 (commit `8ac2d6c`)

**교훈 (CLAUDE.md 규칙 강화 의무)**:
- review-system.md §7-1 evaluator + codex 한 세트 의무 (Phase 6 1차 codex 호출 누락 사용자 지적 후 정정)
- codex 호출 표준 절차: `Agent subagent_type=codex:codex-rescue` + 모델 unset (gpt-5.5 기본) + `--read-only` for 검증
- codex 검토 범위 한계 인지 (4차 P1 잔존이 사실 false alarm — L282 산식 누락 검출). 산수 정밀도 결함은 mechanical fix이지만 closure 검증 시 라인 범위 명시
- 사용자가 옵션 결정 떠넘기지 말고 codex와 follow-up으로 단일 최적안 도출 후 보고

## 1. 상태 요약 (2026-05-19 Phase 6 종료 스냅샷 — 현재는 §-1)

### Phase 5/6 완전 종료 + Phase 7 진입 대기

| Phase | 산출물 | 평가 | 머지 | 상태 |
|-------|------|------|------|------|
| 0 셋업 | `.flowset/` 구조 + CLAUDE.md | (생략) | — | ✅ |
| 1 PRD | `.flowset/prd/` 50 파일 | PASS 8.15 → 재평가 9.13 | — | ✅ |
| 2 백로그 | `.flowset/backlog/` 6 파일 (80 Story / 415 SP / 223 Task / 838 MD) | PASS 8.29 → 재평가 8.03 → 4차 재평가 PASS_BOTH 8.475/8.34 | PR #16 | ✅ |
| 3 ERD | `.flowset/db/` 23 파일 (39 entity + 39 테이블 + RLS) | PASS 8.68 → 재평가 8.21 | — | ✅ |
| 4 API | `.flowset/api/` (280 endpoint, Markdown) | PASS 8.78 → 재평가 8.40 | — | ✅ |
| 5 와이어프레임 | 45 화면 HTML + DS SSOT (wf-v1.0.0) | PASS 8.13 / codex 4 그룹 가중 8.73 | wf-v1.0.0 | ✅ |
| 6 스프린트 계획 | `mvp-plan.md` + `sprint-001~010.md` 11 파일 | **PASS_WITH_KI 9.00/8.21** | PR #17 | ✅ |
| **7 개발 착수** | `apps/` + `packages/` + `supabase/` 코드 (sprint-001~010 점진) | — | — | ⏳ **신규 세션** |
| 8 QA | (Phase 7 후 진입) | — | — | ⏳ |
| 9 베타 | (Phase 8 후 진입) | — | — | ⏳ |
| 10 운영 | (Phase 9 후 진입) | — | — | ⏳ |

**브랜치 (2026-05-19 시점)**: `main` (Phase 6 종료 commit `8ac2d6c`). **현재 main HEAD는 §-1 참조(`5e7d451`)** — `git log -1 --format=%h main`으로 최신 확인.

**전체 MVP 합계 (보강 후)**: 80 Story / 415 SP / 223 Task / 218 MD 순수 / 838 MD 보수 / 10 Sprint × 2주 = **19~20주 (약 4.6개월)** — mvp-plan §4-1 정밀 계산 (415 SP × 0.5 / 20 MD/sprint = 약 10.4 sprint, 9.5~10 sprint 흡수)

## 2. 모노레포 디렉토리 구조 SSOT (codex 7건 결정 채택, 2026-05-19)

> **SSOT 위치**: `.flowset/sprints/mvp-plan.md §1`. 본 절은 짧은 요약만.

```
FlowHR_SOP/
├── apps/
│   ├── web/                  # Next.js 15 App Router + PWA (manifest.json + sw.js)
│   │   └── app/[locale]/{(auth),(operator),(tenant),(employee)}/  # 44 화면 라우트
│   └── desktop/              # Tauri 2.x (src-tauri/)
├── packages/
│   ├── ui/                   # shadcn + Phase 5 DS 40+ React 변환
│   ├── schemas/              # zod schemas (zod-to-openapi 변환 대상)
│   ├── types/                # DB/domain TypeScript types
│   ├── api-client/           # Supabase wrapper + TanStack Query hooks
│   ├── i18n/                 # next-intl ko + en MVP
│   ├── platform/             # web/pwa/tauri 분기 + iOS 제약
│   └── config/               # ESLint/TS/Tailwind 공유
├── supabase/                 # 루트 (CLI 기본 + 03-tech-architecture.md SSOT)
│   ├── migrations/           # Phase 3 ERD 변환 (24 파일 + RLS 정책 SQL)
│   ├── functions/            # Edge Functions (cron + 외부 콜백)
│   └── seed.sql
├── .github/workflows/
│   ├── pr-checks.yml         # 현행 9 job (3 공통 + 6 wireframe path-scope)
│   └── phase7-code.yml       # 신규 4 job (lint + typecheck + unit-test + build, Sprint 1 day 13~14 작성)
├── .flowset/                 # Phase 1~10 산출물 SSOT (변경 안 함)
├── docs/                     # 원본 명세
└── pnpm-workspace.yaml + turbo.json + tsconfig.base.json + package.json + CLAUDE.md
```

### codex 7건 결정 요약 (mvp-plan.md §1-1)

1. **supabase 위치**: 루트 `supabase/` (Supabase CLI 기본 + 03-tech SSOT)
2. **i18n MVP**: ko + en 동시 (WI-KI-batch-005 사용자 결정 2026-05-16)
3. **entity 카운트**: 39 entity / 44 screen (matrix.json SSOT)
4. **OpenAPI 변환**: `zod-to-openapi`, Sprint 1 day 13~14
5. **CI job**: 현행 9 + Phase 7 신규 4
6. **packages/platform 채택**: web/pwa/tauri 분기 + iOS 제약 중앙화
7. **packages/config 채택**: Turborepo 표준 공유 설정

## 3. (2026-05-19 작성) Phase 7 Sprint 1 부트스트랩 시퀀스 — 참고용. **실제 진입점은 §-1**

### 작업 1 — Sprint 1 Day 1~14 시퀀스 (`sprint-001.md` SSOT)

42 SP / 30 MD 보수. 9 Story 분해: ST-001 (5) + ST-002 (3) + ST-003 (3) + ST-004 (5) + ST-005 (5) + ST-068 (5) + ST-069 (5) + ST-072 (3) + ST-078 (8) = 42 SP (sprint-001.md L4 SSOT 정합).

| Day | 작업 | 산출물 | 의존 |
|-----|-----|------|------|
| 1~2 | 모노레포 셋업 | `pnpm-workspace.yaml` + `turbo.json` + `tsconfig.base.json` + 루트 devDeps | (없음) |
| 3~4 | apps/web + packages 7개 스캐폴드 | `apps/web/`, `packages/{ui,schemas,types,api-client,i18n,platform,config}/` | Day 1~2 |
| 5 | supabase 인프라 (RLS 정책 제외) | `supabase/migrations/` 12 파일 + `packages/types/src/database.ts` | Day 3~4 |
| 6~7 | ST-001 로그인 핵심 (Supabase Auth + CM-01) | `apps/web/app/[locale]/(auth)/login/page.tsx` + 5회 잠금 + 역할별 리다이렉트 | Day 5 |
| 8~10 | **4 그룹 병렬** — ST-002~004 (인증 보조) + ST-005 (RLS) + ST-068 (audit) + ST-069 (Realtime) | 4 마이그레이션 + 권한 매트릭스 테스트 + Realtime wrapper | Day 6~7 |
| 11~12 | ST-078 약관 (PIPA + ko/en 페어) + ST-072 오류/점검 | `legal_documents + user_consents` 마이그레이션 + CM-21/CM-06 페이지 | Day 8~10 |
| 13~14 | zod-to-openapi + `phase7-code.yml` CI 4 job | `packages/schemas/dist/openapi.yaml` + 신규 CI workflow | Day 11~12 |

### 작업 2 — Sprint 1 Day 1 의무 (외부 신청)

> **인프라 결정 SSOT**: `.flowset/guardrails.md §10` (사용자 2026-05-19 — Free 시작 + Pro 전환 5트리거 + NHN DEFER + Tauri 자체 인증서).

- **D+0 즉시 (무료)**:
  - **Supabase Free org + flowhr-staging project 생성** (Pro 전환은 5트리거 도달 시)
  - **Vercel 프로젝트 (무료)** — preview는 Supabase 미연동 mock UI, staging만 연동 (Pro 전환은 서비스 런칭 시)
- **DEFER**:
  - **NHN Cloud 알림톡** → 테넌트별 옵션 기능. 첫 옵션 활성 또는 고객 계약 조건 시 신청 (60일). 기본 알림은 인앱 + 이메일(Resend)
- **S6 직전 (무료)**:
  - Sentry Free Developer 계정 (S6 진입 전 활성)

### 작업 3 — Sprint 1 DoD 검증 (`sprint-001.md` L138~)

- [ ] `apps/web` 빌드 PASS (`pnpm turbo run build`)
- [ ] `packages/ui` base 16 컴포넌트 (Button/Input/Card/Alert/Stepper 등)
- [ ] `supabase/migrations/` 24+ 파일 + RLS 정책 SQL → `pnpm supabase db reset --local` PASS
- [ ] `packages/types/src/database.ts` 자동 생성 + git 커밋
- [ ] `packages/schemas/dist/openapi.yaml` 생성 + CI 검증
- [ ] 6 역할 × 44 화면 권한 매트릭스 자동 테스트 (TS-021-005-QA-1)
- [ ] ST-001~004 + ST-072 + ST-078 E2E Playwright PASS
- [ ] audit_logs 트리거 21 테이블 INSERT/UPDATE/DELETE/APPROVE 4 이벤트 검증
- [ ] Realtime notifications 클라이언트 wrapper 구독 + 자동 재연결 검증
- [ ] CI 신규 4 job (`phase7-code.yml`) 통과
- [ ] PR template 갱신 (API/스키마 동시 갱신 의무)

### 작업 4 — 코드 WI별 머지 게이트 (의무, 절대 스킵 금지)

> **정정 (2026-05-28)**: 듀얼검증은 "Sprint 종료 시"가 아니라 **각 코드 WI 머지 전** 의무다 (`.claude/rules/project.md §1-1` SSOT). CI `dual-verification-gate`가 기계적으로 강제. 이전 "Sprint 1 종료 시" 표기로 WI-019를 검증 없이 머지한 사고 재발 방지.

- 코드 WI(`apps/**`/`packages/**`/`supabase/**`) 머지 전 evaluator + codex 한 세트 호출 (Phase 7 mode: **code**, 첫 WI는 review-system.md §7-1 full review)
- `.flowset/eval-results/WI-XXX.{eval,codex,pass}.md` 저장
- KI-072/073/074 점검 (Phase 7 Sprint 1 실측 후 처리 예정 P3 3건)
- prd-state.json `7-dev-kickoff` status 갱신 (`in_progress` → 부분 진행 / `completed` → Sprint 1 종료)

## 4. Known Issues 현황 (Phase 6 종료 시점)

| 심각도 | 활성 | 임계 | 트리거 |
|--------|------|------|--------|
| P0 | 0 | 1 | ❌ |
| P1 | 0 | 3 | ❌ |
| P2 | 4 (KI-049/054/060/061) | 5 | ❌ 임계 미달 (KI-071 묶음 resolved 후) |
| P3 | 32 | 10 | ✅ 도달 (KI-072/073/074 신규 추가) |

**Phase 6 사이클 resolved**: KI-013 + KI-034 (Phase 2 closure) + KI-071 묶음 (15곳)
**Phase 6 사이클 신규 등록**: KI-072 (P3, sprint-007 S6 spill 결합), KI-073 (P3, MD 보수배수 임계), KI-074 (P3, mvp-plan §4 S5 가독성)

**P3 32건 트리거 도달 — 차기 docs batch 또는 Phase 7 Sprint 1 회고 시 처리 결정**

## 5. 핵심 정책 결정 (변경 금지)

| 결정 | 출처 | 일자 |
|------|------|----|
| 모노레포 디렉토리 구조 SSOT (codex 7건 권고) | mvp-plan.md §1 | 2026-05-19 |
| i18n MVP ko + en 동시 | WI-KI-batch-005 + mvp-plan §1-1 | 2026-05-16/19 |
| OpenAPI 변환 `zod-to-openapi`, Sprint 1 day 13~14 | mvp-plan §1-1, §3-3 | 2026-05-19 |
| Sprint 1 day 1 NHN 알림톡 신청 의무 (D+0) | sprint-001.md + mvp-plan §5 | 2026-05-19 |
| Phase 7 CI 신규 4 job (`phase7-code.yml`) | mvp-plan §6, sprint-001.md Day 13~14 | 2026-05-19 |
| 평가 시스템 v3 (5축, Phase 5만 / Phase 6+ 4축) | review-system.md §17 / review-rubric.md §10 | 2026-05-16 |
| KI 트리거 (P0=1, P1=3, P2=5, P3=10) | triggers.md §2 | 기존 |
| PR auto-merge --squash --delete-branch | project.md §6 | 2026-05-16 |
| **codex 호출 표준**: `Agent subagent_type=codex:codex-rescue` + 모델 unset (gpt-5.5 기본) + `--read-only` for 검증 | codex-cli-runtime skill + 2026-05-19 사용자 지적 | 2026-05-19 |
| **review-system.md §7-1 의무**: evaluator + codex 한 세트 호출 (단독 호출 금지) | 2026-05-19 사용자 지적 | 2026-05-19 |
| **codex 검토 범위 한계 인지**: codex가 라인 범위 한정 검토하므로 산수/정합 결함이 false alarm일 수 있음 (Phase 6 4차 codex P1 L282 산식 누락 검출 사례). 재평가 시 의문 결함은 grep으로 실제 확인 의무 + closure 검증 시 라인 범위 명시 | Phase 6 4차 사이클 교훈 | 2026-05-19 |

## 6. PR 현황

| PR | 제목 | 머지 commit | 상태 |
|----|------|----|----|
| #1~#15 | Phase 5 G0~G4 + system v2/v3 + audit hotfix 1~3 | (15개) | ✅ MERGED |
| #16 | WI-Phase6prep-docs Phase 6 진입 전 의무 closure (KI-013 + KI-034) | `d6aaa95` | ✅ MERGED |
| **#17** | **WI-016-docs Phase 6 MVP 스프린트 계획 (mvp-plan + sprint-001~010)** | **`8ac2d6c`** | ✅ **MERGED 2026-05-18T17:50:16Z** |
| #(미생성) | Phase 7 Sprint 1 부트스트랩 (모노레포 + 인증 + RLS + audit + Realtime + 약관 + 오류 + CI) | — | ⏳ 신규 세션 |

## 7. Task 상태

| 영역 | 상태 |
|------|------|
| Phase 5 G0~G4 양산 + 평가 | ✅ completed |
| Phase 5 audit fix 1/2/3 + wf-v1.0.0 재부여 | ✅ completed |
| Phase 2 재평가 (KI-013/034 closure) | ✅ PASS_BOTH (PR #16) |
| **Phase 6 mvp-plan + sprint-001~010** | ✅ **PASS_WITH_KI (PR #17)** |
| **Phase 7 Sprint 1 부트스트랩** | ⏳ **신규 세션** |

## 8. 컨텍스트 압축 시 우선 보존 + 신규 세션 읽기 순서

### 신규 세션 진입 시 읽기 순서 (의무)

1. **본 HANDOFF.md** (첫 작업) — Phase 6 종결 + Phase 7 진입 안내
2. `.flowset/sprints/mvp-plan.md` — Phase 7+ SSOT (디렉토리 + 변환 정책 + Sprint 1~10)
3. `.flowset/sprints/sprint-001.md` — Sprint 1 Day 1~14 부트스트랩 시퀀스
4. `.flowset/backlog/stories.md` — 80 Story / 415 SP SSOT (P0~P3 그룹)
5. `.flowset/backlog/tasks.md` — 223 Task / 838 MD (TS-001~223 분해)
6. `.flowset/backlog/dependency-graph.md` — Sprint 1~10 의존 + 외부 의존
7. `.flowset/backlog/estimation.md` — MD 환산 + 비용 + Sprint 용량
8. `.flowset/backlog/epics.md` — 12 Epic 마스터
9. `.flowset/known-issues/INDEX.md` — 활성 KI (P3 32건 트리거 도달 점검)
10. `.flowset/prd-state.json` — current_phase: 7-dev-kickoff
11. (필요 시) `.flowset/prd/03-tech-architecture.md` — 기술 스택 SSOT
12. (필요 시) `.flowset/wireframes/_design-system/{tokens.css,components.css,03-components.md}` — Phase 5 DS → packages/ui 변환 원천
13. (필요 시) `.flowset/contracts/review-system.md §7-1` — evaluator + codex 한 세트 의무

### 컨텍스트 압축 시 보존 우선순위

- L1 (필수): 본 HANDOFF + mvp-plan + sprint-001
- L2 (강): backlog/{stories,tasks,dependency-graph} + INDEX + prd-state
- L3 (참조): backlog/{estimation,epics} + prd/03-tech + wireframes/_design-system + contracts/review-system

## 9. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — Phase 5 PRD 결함 발견 | KI-027~031 |
| 2026-05-16~18 | Phase 5 G0~G4 + audit hotfix 1~3 + wf-v1.0.0 재부여 | 와이어프레임 양산 |
| 2026-05-18 | Phase 5 정식 종료 + Phase 6 진입 안내 | audit 사이클 종결 |
| **2026-05-19** | **Phase 6 정식 종료 — PR #16 (KI-013/034 closure PASS_BOTH 8.475/8.34) + PR #17 (mvp-plan + sprint-001~010 PASS_WITH_KI 9.00/8.21) 머지 + Phase 7 진입 안내** | **Phase 6 mvp-plan + sprint 작성 + codex 7건 디렉토리 SSOT 채택 + KI-071 묶음 + 신규 KI-072~074 등록** |
