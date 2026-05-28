# FlowHR 핸드오프 — 신규 세션 진입 가이드

> **갱신**: 2026-05-28 (Phase 7 Sprint 1 진행 중 — 모노레포 + 인프라 연동 완료, WI-019 대기)
> **신규 세션 첫 작업**: 본 문서 **§-1 (2026-05-28 진척)** 정독 → **WI-019-feat** (apps/web + packages 7개 스캐폴드 + supabase 인프라, Sprint 1 Day 3~5)
> **이전 핸드오프**: 2026-05-19 Phase 6 종료 + Phase 7 진입 안내

## -1. 2026-05-28 세션 진척 (Phase 7 Sprint 1 진행 중) — **신규 세션 여기부터**

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

### 다음 세션 첫 작업 — WI-019-feat (Sprint 1 Day 3~5)

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

## 1. 현재 상태 요약

### Phase 5/6 완전 종료 + Phase 7 진입 대기

| Phase | 산출물 | 평가 | 머지 | 상태 |
|-------|------|------|------|------|
| 0 셋업 | `.flowset/` 구조 + CLAUDE.md | (생략) | — | ✅ |
| 1 PRD | `.flowset/prd/` 50 파일 | PASS 8.15 → 재평가 9.13 | — | ✅ |
| 2 백로그 | `.flowset/backlog/` 6 파일 (80 Story / 415 SP / 223 Task / 838 MD) | PASS 8.29 → 재평가 8.03 → 4차 재평가 PASS_BOTH 8.475/8.34 | PR #16 | ✅ |
| 3 ERD | `.flowset/db/` 23 파일 (39 entity + 37 테이블 + RLS) | PASS 8.68 → 재평가 8.21 | — | ✅ |
| 4 API | `.flowset/api/` (280 endpoint, Markdown) | PASS 8.78 → 재평가 8.40 | — | ✅ |
| 5 와이어프레임 | 45 화면 HTML + DS SSOT (wf-v1.0.0) | PASS 8.13 / codex 4 그룹 가중 8.73 | wf-v1.0.0 | ✅ |
| 6 스프린트 계획 | `mvp-plan.md` + `sprint-001~010.md` 11 파일 | **PASS_WITH_KI 9.00/8.21** | PR #17 | ✅ |
| **7 개발 착수** | `apps/` + `packages/` + `supabase/` 코드 (sprint-001~010 점진) | — | — | ⏳ **신규 세션** |
| 8 QA | (Phase 7 후 진입) | — | — | ⏳ |
| 9 베타 | (Phase 8 후 진입) | — | — | ⏳ |
| 10 운영 | (Phase 9 후 진입) | — | — | ⏳ |

**현재 브랜치**: `main` (Phase 6 종료 commit: `8ac2d6c`. `git log -1 --format=%h main`으로 최신 확인)

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

## 3. 신규 세션 첫 작업 — Phase 7 Sprint 1 부트스트랩

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
