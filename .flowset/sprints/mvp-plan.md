# FlowHR — MVP 스프린트 계획 (Phase 6)

> **작성**: 2026-05-19 (Phase 6 진입, Phase 2 백로그 4차 PASS_BOTH 8.475/8.34 후)
> **SSOT 인용**: `.flowset/backlog/stories.md ## 전체 요약` (80 Story / 415 SP) + `.flowset/backlog/estimation.md ## MVP P0~P3` (P0 275 / P1 116 / P2 19 / P3 5)
> **WI**: WI-016-docs Phase 6 MVP 스프린트 계획
> **codex 협의**: 2026-05-19 단일 권고안 채택 (디렉토리 구조 + i18n + entity + OpenAPI + CI + packages/platform + packages/config 7건)

## 0. 본 문서의 역할

Phase 6 산출물 인덱스. Phase 7 (개발 착수)이 본 문서를 그대로 입력으로 받아 Sprint 1 부트스트랩을 시작한다. Sprint 상세는 `sprint-001.md` ~ `sprint-010.md`에 분리 작성.

| 항목 | 위치 |
|------|------|
| 모노레포 디렉토리 구조 SSOT | 본 문서 §1 |
| 패키지별 책임 + 매니페스트 | 본 문서 §2 |
| SSOT 변환 정책 (Phase 5 DS → packages/ui, Phase 3 migrations → supabase/migrations, Phase 4 API → app/api/v1) | 본 문서 §3 |
| Sprint 1~10 일정 + Story 배치 | 본 문서 §4 + `sprint-NNN.md` |
| 외부 의존 + 블로커 | 본 문서 §5 |
| Phase 7 CI 추가 정책 | 본 문서 §6 |
| 리스크 + 트레이드오프 | 본 문서 §7 |

## 1. 모노레포 디렉토리 구조 SSOT

> codex 단일 권고안 (2026-05-19 7건 채택). 본 절은 Phase 7+ 모든 코드 작업의 위치 SSOT.
>
> **코드 영역** (Phase 7+ 코드 작업): `apps/` + `packages/` + `supabase/`
> **메타 영역** (Phase 1~10 산출물 + CI + 원본 명세 + 모노레포 설정): `.flowset/` + `.github/` + `docs/` + 루트 설정 파일들 (`pnpm-workspace.yaml` / `turbo.json` / `tsconfig.base.json` / `package.json` / `CLAUDE.md`)

```text
FlowHR_SOP/
├── apps/
│   ├── web/                              # Next.js 15 App Router + PWA (next-pwa)
│   │   ├── app/
│   │   │   ├── [locale]/                 # ko/en 라우팅
│   │   │   │   ├── (auth)/               # CM-01~05 + CM-21 + ST-078
│   │   │   │   ├── (operator)/           # OP-01~12
│   │   │   │   ├── (tenant)/             # TA-01~14
│   │   │   │   └── (employee)/           # EM-01~11
│   │   │   ├── api/v1/                   # Route Handlers (CRUD/auth/realtime)
│   │   │   └── layout.tsx
│   │   ├── components/                   # apps/web 전용 컴포넌트 (페이지 구성)
│   │   ├── lib/                          # apps/web 전용 helpers
│   │   ├── messages/                     # next-intl ko.json / en.json (배포 빌드용)
│   │   ├── public/
│   │   │   ├── manifest.json             # PWA manifest
│   │   │   └── sw.js                     # next-pwa Service Worker
│   │   ├── next.config.ts
│   │   └── package.json                  # @flowhr/web
│   └── desktop/                          # Tauri 2.x sibling 앱 (apps/web 빌드 임베드)
│       ├── src-tauri/
│       │   ├── src/main.rs
│       │   ├── tauri.conf.json
│       │   └── Cargo.toml
│       └── package.json                  # @flowhr/desktop
├── packages/
│   ├── ui/                               # shadcn/ui ejected + Phase 5 DS React 변환
│   ├── schemas/                          # zod schemas (zod-to-openapi 변환 대상)
│   ├── types/                            # DB/domain TypeScript types (Supabase generated)
│   ├── api-client/                       # Supabase wrapper + TanStack Query hooks
│   ├── i18n/                             # next-intl ko/en namespace SSOT
│   ├── platform/                         # web/pwa/tauri device 분기 + iOS 제약
│   └── config/                           # ESLint / TS / Tailwind 공유 설정
├── supabase/                             # 루트 (Supabase CLI 기본 + 03-tech-architecture.md:67-70 SSOT)
│   ├── migrations/                       # Phase 3 ERD 마이그레이션 변환 대상 (KI-017 SQL 작성 Sprint 1)
│   ├── functions/                        # Edge Functions (cron + 외부 콜백 + long-running batch)
│   ├── seed.sql                          # Phase 3 seed.md → SQL
│   └── config.toml
├── .github/
│   └── workflows/
│       ├── pr-checks.yml                 # Phase 5 9 job 현행 (commit-msg + encoding + version 3 공통 유지 + html-syntax + DS-SSOT + svg-sprite + native-wrap + showcase + playwright 6 wireframe path-scope)
│       └── phase7-code.yml               # Phase 7 진입 시 신규 (lint + typecheck + unit-test + build)
├── .flowset/                             # Phase 1~10 산출물 SSOT (변경 안 함)
├── docs/                                 # 원본 명세 (FlowHR_screen_spec_v_1.md)
├── pnpm-workspace.yaml                   # packages: ["apps/*", "packages/*"]
├── turbo.json                            # tasks: build / test / lint / typecheck / db:migrate
├── tsconfig.base.json
├── package.json                          # 루트 (devDeps: turbo / typescript / vitest / @playwright/test)
└── CLAUDE.md
```

### 1-1. codex 7건 결정 한 줄 요약 (mvp-plan SSOT)

> 본 7건은 Phase 7+ 작업의 위치/도구/SSOT 결정의 단일 진실. 변경 시 본 문서 + `.claude/rules/project.md` 동시 갱신 의무.

1. **supabase 위치**: 루트 `supabase/`. Supabase CLI 기본 + 기존 SSOT (`.flowset/prd/03-tech-architecture.md:19,67` + `db/migrations.md:3,8`) 정합.
2. **i18n MVP scope**: ko + en 동시. `.flowset/prd/06-mvp-scope.md:75,96-101` + `01-personas.md:90-101` (P8 외국인 근로자) + WI-KI-batch-005 (2026-05-16 사용자 결정) SSOT.
3. **entity 카운트**: 39 entity / 44 screen. matrix.json + erd.md + 04-data-model.md 모두 39. "44 entity"는 진단 오류 (44 = screen 수).
4. **OpenAPI 변환**: `zod-to-openapi` 도구, Sprint 1 중 변환. `.flowset/api/README.md:21` + `api/schemas.md:3` 명시.
5. **CI job**: 현행 9 job (3 공통 + 6 wireframe path-scope) + Phase 7에 4 추가 (lint / typecheck / unit-test / build).
6. **packages/platform 채택**: web/pwa/tauri 3 플랫폼 분기 + iOS 제약 (포그라운드 GPS / 16.4+ 푸시) 중앙화.
7. **packages/config 채택**: Turborepo 표준 공유 설정 (ESLint + TS + Tailwind).

### 1-2. 본 결정에 따른 SSOT 정합화 의무 (KI-071 + 추가 stale)

본 PR에서 일괄 정정:

| 파일:라인 | 현재 (stale) | 정정 후 |
|---------|------------|--------|
| `.flowset/prd-state.json:61` | `next-intl (ko 기본, en 추후)` | `next-intl (ko + en MVP)` |
| `.flowset/api/README.md:3` | `37 엔티티 + 36 화면` | `39 엔티티 + 44 화면` |
| `CLAUDE.md §6-1` (또는 `.claude/rules/project.md §6-1`) | `CI 게이트: 5 job` | `CI 게이트: 9 job (3 공통 + 6 wireframe path-scope) + Phase 7 4 job 추가` |
| `.flowset/backlog/epics.md:39/56/109/128/148/204/222` | Epic 단위 SP 인용 7곳 stale | stories.md L505 SSOT 인용 SP로 정합 (EP-02 31 / EP-03 26 / EP-06 40 / EP-07 35 / EP-08 58 / EP-11 20 / EP-12 38) |
| `.flowset/backlog/estimation.md:66` | `실제 379 SP는 일부 Sprint 33~36 SP로...` | `실제 415 SP는 일부 Sprint 33~36 SP로...` |
| `.flowset/backlog/estimation.md:71-73` | `200 MD / 739 MD × 700,000원` | `218 MD / 838 MD × 700,000원` |
| `.flowset/backlog/estimation.md:92` | `MVP 380~390 SP / 210 MD / 5.5개월` | `MVP 415 SP / 218 MD / 7개월` |
| `.flowset/backlog/estimation.md:47` | `전체 415 SP / 209 MD` | `전체 415 SP / 209 MD (1 SP × 0.5 MD = 207.5 → 209 보수적 round-up)` 산출 근거 명시 |
| `.flowset/backlog/stories.md:646` ST-080 API | OP-12 endpoint 14개 shorthand 경로 | PRD `OP-12-profile.md:114-127` operator-prefix 정확 인용 |

→ **KI-071 묶음 처리 (resolved)**: 본 PR이 KI-071 본체 12곳 + 추가 stale 3건 (`prd-state.json:61` i18n / `api/README.md:3` entity 카운트 / `.claude/rules/project.md:57` CI job 카운트)을 하위 항목으로 통합 처리. INDEX.md 등록은 단일 KI-071 묶음으로 추적 (개별 KI-072~074 분리 등록 안 함 — 묶음 closure 시 동시 resolved).

## 2. 패키지별 책임 + 매니페스트

### 2-1. apps/web — `@flowhr/web`

- **책임**: Web/PWA 단일 Next.js 앱 (Route Handler + manifest + Service Worker). 44 화면 라우트.
- **deps (런타임)**: `next` 15, `react` 19, `typescript` 5, `tailwindcss` 4, `next-pwa`, `@supabase/supabase-js`, `@tanstack/react-query`, `zustand`, `next-intl`, `lucide-react`, `@flowhr/ui`, `@flowhr/schemas`, `@flowhr/types`, `@flowhr/api-client`, `@flowhr/i18n`, `@flowhr/platform`
- **deps (개발)**: `@flowhr/config`, `vitest`, `@testing-library/react`
- **빌드 출력**: `apps/web/.next/` + `apps/web/out/` (Tauri 임베드용 static export 옵션)

### 2-2. apps/desktop — `@flowhr/desktop`

- **책임**: Tauri 2.x Rust core + WebView. `apps/web` 빌드 산출물(`out/`) 래핑.
- **deps (Rust)**: `tauri` 2.x, `tauri-plugin-updater`, `tauri-plugin-deep-link`
- **deps (JS)**: `@tauri-apps/cli`, `@flowhr/platform`
- **빌드 출력**: `apps/desktop/src-tauri/target/release/` (Windows .exe + macOS .dmg + Linux .AppImage)
- **배포**: GitHub Releases (tauri-updater 자동 업데이트)

### 2-3. supabase/ — `@flowhr/supabase` (workspace package 또는 standalone)

- **책임**: Supabase migrations + Edge Functions + seed. CLI 명령은 Turborepo task로 실행 (`turbo run db:migrate`).
- **CLI**: `pnpm supabase init` → 루트 `supabase/` 생성 후 사용
- **deps**: `supabase` CLI (devDep)
- **마이그레이션 변환 출처**: `.flowset/db/migrations.md`의 24 파일 (Sprint 1 ST-005 작업)

### 2-4. packages/ui — `@flowhr/ui`

- **책임**: shadcn/ui ejected + Phase 5 DS (`_design-system/`) React 변환 컴포넌트. 40+ 컴포넌트 1:1 매핑.
- **deps**: `react`, `tailwindcss`, `lucide-react`, `clsx`, `tailwind-merge`, `@radix-ui/*` (shadcn 의존)
- **devDeps**: `@flowhr/config`, `vitest`, `@storybook/*` (선택)
- **Phase 5 DS → React 매핑**: 본 문서 §3-1 + Phase 7 Sprint 1~6 점진 변환

### 2-5. packages/schemas — `@flowhr/schemas`

- **책임**: zod schemas (모든 entity 39 + API request/response). `zod-to-openapi`로 OpenAPI 3.1 YAML 자동 생성.
- **deps**: `zod`, `@asteasolutions/zod-to-openapi`
- **출력**: `packages/schemas/dist/openapi.yaml` (CI에서 자동 생성)
- **Sprint 1 부트스트랩**: 39 entity zod schema + `.flowset/api/schemas.md` 변환
  - **WI 분할 (사용자 결정 2026-05-29)**: WI-021 = zod-to-openapi **파이프라인 + CI(phase7-code.yml) + 로그인 E2E**, WI-021-1 = **39 entity zod schema 변환**. 둘 다 Sprint 1 — 연기 아님 (CI 토대 먼저 머지 후 entity 집중). endpoint(~280) schema는 sprint-001 §위험대로 Sprint 2~6 점진.

### 2-6. packages/types — `@flowhr/types`

- **책임**: DB/domain TypeScript types. Supabase generated types (`supabase gen types typescript`) + 도메인 type alias.
- **deps**: 없음 (type-only package)
- **빌드**: `pnpm supabase gen types typescript --local > packages/types/src/database.ts`

### 2-7. packages/api-client — `@flowhr/api-client`

- **책임**: Supabase browser/server client + Route Handler fetcher + TanStack Query hooks (도메인별 namespace: `auth` / `operator` / `tenant` / `employee` / `common`).
- **deps**: `@supabase/supabase-js`, `@tanstack/react-query`, `@flowhr/schemas`, `@flowhr/types`

### 2-8. packages/i18n — `@flowhr/i18n`

- **책임**: next-intl namespace SSOT (ko/en MVP). `apps/web/messages/`로 빌드 시 복사.
- **deps**: `next-intl`
- **출처**: `.flowset/wireframes/_design-system/08-i18n.md`의 키 catalog

### 2-9. packages/platform — `@flowhr/platform`

- **책임**: web/pwa/tauri device capability 분기. iOS 16.4+ 푸시 / 포그라운드 GPS / install prompt / Web Push vs Tauri Push 분기 hook.
- **deps**: `@flowhr/types`
- **API 예시**: `usePlatform()`, `useGeolocation({ foregroundOnly: true })`, `usePush()`, `useInstallPrompt()`

### 2-10. packages/config — `@flowhr/config`

- **책임**: ESLint / TypeScript / Tailwind 공유 설정.
- **deps**: `eslint`, `typescript`, `tailwindcss` (peer)
- **export 경로**: `@flowhr/config/eslint-base`, `@flowhr/config/tsconfig-base`, `@flowhr/config/tailwind-base`

## 3. SSOT 변환 정책

### 3-1. Phase 5 wireframes (`.flowset/wireframes/_design-system/`) → packages/ui

| 변환 단위 | Phase 5 산출물 | packages/ui 위치 | Sprint |
|----------|--------------|-----------------|--------|
| Design tokens | `_design-system/tokens.css` | `packages/ui/src/styles/tokens.css` | Sprint 1 |
| Base components (~16) | `_design-system/components.css` §1 base 클래스 | `packages/ui/src/components/{Button,Input,Select,Card,Badge,...}.tsx` | Sprint 1~2 |
| Layout (`.app-shell`, `.header`, `.sidebar`) | `_design-system/_layout-shell.html` | `packages/ui/src/layouts/{AppShell,AppHeader,Sidebar}.tsx` | Sprint 1 |
| Auth shell (`.auth-shell`) | `_design-system/_layout-auth.html` | `packages/ui/src/layouts/AuthShell.tsx` | Sprint 1 |
| Operator/Tenant/Employee 특화 (Group G2/G3/G4) | `_design-system/components.css` §G2/G3/G4 | `packages/ui/src/components/domain/` (40+) | Sprint 3~6 |
| 아이콘 sprite | `_design-system/icons.svg` | `packages/ui/src/icons/inline-sprite.tsx` (인라인) + `lucide-react` (개별 import) | Sprint 1 |
| _showcase | `_showcase.html` | `packages/ui/src/stories/` (Storybook, 선택) | Sprint 6 후 |

매핑 표 (40+ 컴포넌트, codex 답에서 추출):

| CSS 클래스 | React 컴포넌트 | Sprint |
|----------|--------------|--------|
| `.btn` + variants | `Button` | 1 |
| `.icon-btn` | `IconButton` | 1 |
| `.input`, `.input-sm`, `.input-help`, `.input-error`, `.input-success` | `Input` | 1 |
| `.select`, `.select-wrap` | `Select` | 1 |
| `.textarea` | `Textarea` | 1 |
| `.checkbox` | `Checkbox` | 1 |
| `.toggle`, `.switch` | `Switch` | 1 |
| `.domain-prefix`, `.domain-suffix` | `DomainPrefixInput` | 2 (OP-04 마법사) |
| `.card`, `.card-flat`, `.history-card` | `Card` | 1 |
| `.kpi-card` | `KpiCard` | 3 |
| `.table`, `.row-link`, `.row-highlight-*` | `DataTable` | 2 |
| `.pagination`, `.page-btn` | `Pagination` | 2 |
| `.badge`, `.module-badge`, `.status-dot` | `Badge` | 1 |
| `.logo`, `.tenant-logo`, `.avatar` | `Logo`, `TenantLogo`, `Avatar` | 1 |
| `.tabs`, `.vert-tabs` | `Tabs`, `VerticalTabs` | 1 |
| `.breadcrumb` | `Breadcrumb` | 1 |
| `.filter-bar`, `.filter-panel`, `.filter-chip` | `FilterBar`, `FilterPanel` | 2 |
| `.dropdown` | `DropdownMenu` | 1 |
| `.modal-*` | `Dialog` | 1 |
| `.drawer` | `Drawer` | 2 |
| `.toast` | `Toast` | 1 |
| `.banner` | `Alert` | 1 |
| `.empty-state` | `EmptyState` | 1 |
| `.stepper`, `.step` | `Stepper` | 2 (OP-04) |
| `.chart-*` | `Chart` | 3 |
| `.form-row`, `.form-section` | `FormRow`, `FormSection` | 1 |
| `.file-input` | `FileInput` | 2 |
| `.date-input` | `DateInput` | 1 |
| `.header`, `.sidebar`, `.app-shell` | `AppHeader`, `Sidebar`, `AppShell` | 1 |
| `.org-tree` | `OrgTreePane` | 3 |
| `.calendar-grid`, `.leave-badge` | `CalendarGrid` | 5 |
| `.approval-shell`, `.inbox-tabs` | `ApprovalInbox` | 6 |
| `.report-shell`, `.chart-grid` | `ReportCanvas` | 8 |
| `.settings-shell`, `.pane-canvas` | `SettingsPane` | 2 (TA-13) |
| `.clock-card`, `.clock-display` | `ClockCard` | 4 (EM-02 PWA) |
| `.leave-balance-card` | `LeaveBalanceCard` | 5 |
| `.calc-summary` | `CalcSummary` | 5 (EM-03 휴가 신청) |
| `.notif-card`, `.notif-row` | `NotificationRow` | 6 (EM-10) |

### 3-2. Phase 3 DB ERD (`.flowset/db/migrations.md` 24 파일) → supabase/migrations/

| 변환 정책 | 비고 |
|----------|------|
| 파일명 유지 (`00000000000010_extensions.sql` 등) | 24 파일 + 신규 RLS SQL 변환 (KI-017) |
| `pnpm supabase migration new` 명령으로 신규 마이그레이션 추가 | Sprint 1 ST-005 |
| RLS 정책 SQL 변환 (KI-017 P3 → Sprint 1 처리) | `.flowset/db/rls.md` "패턴 A/B/C" → CREATE POLICY |
| seed (`.flowset/db/seed.md`) | `supabase/seed.sql` 단일 파일 |

### 3-3. Phase 4 API (`.flowset/api/*.md` 280 endpoint) → apps/web/app/api/v1/ + supabase/functions/

| 카테고리 | 위치 | 변환 도구 |
|---------|-----|---------|
| CRUD / Auth / Realtime | `apps/web/app/api/v1/{auth,operator,tenant,employee,common}/route.ts` | Markdown 명세 → 수동 구현 + `@flowhr/schemas` zod 검증 |
| Cron (월 청구 / 휴가 부여 / SLA 알림) | `supabase/functions/cron-*` Edge Functions | `.flowset/api/cron.md` 변환 |
| 외부 콜백 (NHN 알림톡 결과) | `supabase/functions/callback-nhn/` | Sprint 1 셋업 |
| Long-running batch (급여명세서 PDF 500명) | `supabase/functions/batch-payslip-pdf/` | Sprint 7 |

OpenAPI YAML 자동 생성: `packages/schemas/`에서 `zod-to-openapi`로 `packages/schemas/dist/openapi.yaml` 빌드. Sprint 1 중 변환 완료 (codex 권고).

## 4. Sprint 1~10 일정 + Story 배치

> SSOT: `.flowset/backlog/estimation.md ## Sprint 용량 계획` + `dependency-graph.md ## 진입 순서 권장`

| Sprint | 주차 | 주 영역 | Story (P0 우선) | SP | MD (보수) | 외부 의존 | 상세 |
|--------|------|--------|--------------|-----|---------|---------|------|
| **S1** | 1~2 | 모노레포 부트스트랩 + 인증 + RLS + audit | ST-001~005 + ST-068/069 + ST-072 + ST-078 | 21+5+5+3+8 = 42 | 30 | Supabase Free + Vercel 가입 (NHN DEFER — `guardrails.md §10`) | [sprint-001.md](sprint-001.md) |
| **S2** | 3~4 | 테넌트 라이프사이클 + 회사 설정 P0 | ST-006~010 + ST-053/054 | 31+18 = 49 | 35 | — (알림 인앱+이메일 기본) | [sprint-002.md](sprint-002.md) |
| **S3** | 5~6 | 직원/조직 마스터 + 관리자 대시보드 + Excel/PDF/파일 인프라 | ST-024~030 + ST-071 + ST-063/064/065 | 35+5+15 = 55 | 38 | — | [sprint-003.md](sprint-003.md) |
| **S4** | 7~8 | 근태 PWA + 회사 모니터링 + PWA 설치 | ST-031~036 + ST-077 (P1 — PWA 묶음 진입) | 35+5 = 40 | 30 | — (NHN DEFER, 카카오 옵션 테넌트 발생 시 신청) | [sprint-004.md](sprint-004.md) |
| **S5** | 9~10 | 휴가 본류 + 결재라인 조건 분기 | ST-037~040, ST-046 | ST-037(8)+ST-038(3)+ST-039(8)+ST-040(8)+ST-046(5) = 32 | 22 | — | [sprint-005.md](sprint-005.md) |
| **S6** | 11~12 | 결재 인박스 + 직원 셀프 + 알림 채널 + 운영사 대시보드 | ST-041~045 (26) + ST-058~060 (13) + ST-062 (5) + ST-066 (8) + ST-070 (5, placeholder) | 26+13+5+8+5 = **57** | 40 (3 페어 병렬) | Sentry 진입 권장 | [sprint-006.md](sprint-006.md) |
| | | | **→ MVP P0 출시 (베타 후보 1차)** | **P0 275 SP / 138 MD 순수** | | | |
| **S7** | 13~14 | 문서/급여 + 헤더 컴포넌트 묶음 | ST-047~052 + ST-073/074 | 34+6 = 40 | 28 | — | [sprint-007.md](sprint-007.md) |
| **S8** | 15~16 | 수익/청구/리포트 + 운영사 프로필 | ST-011~015 + ST-080 | 21+8 = 29 | 20 | — | [sprint-008.md](sprint-008.md) |
| **S9** | 17~18 | 기능권한/시스템 + 지원/감사 + 도움말 + 온보딩 | ST-016~023 + ST-076 + ST-079 | 21+21+8 = 50 | 35 | — | [sprint-009.md](sprint-009.md) |
| **S10** | 19~20 | 외부 연동/리포트 + P3 폴리싱 | ST-055~057 + ST-061/067/075 (P3 △) | 16+5 = 21 | 15 | NHN 운영 → KakaoBiz 채널 안정화 | [sprint-010.md](sprint-010.md) |
| | | | **→ MVP 완전체 출시** | **415 SP / 218 MD 순수 / 838 MD 보수** | | | |

### 4-1. Sprint 용량 검증

- 1 SP × 0.5 MD = 0.5 MD/SP (순수 개발)
- 1 Sprint = 2주 × 2 dev × 5일 = 20 MD 순수 + PR 리뷰/대기 보수배수 = 32~40 MD 보수
- **10 Sprint 합계 = 218 MD 순수 / 838 MD 보수 (tasks.md L466 SSOT)** — 본 §4 표의 MD 열은 sprint별 **보수 기준** (PR 리뷰/대기/통합 테스트 포함).
- **218 MD 순수 산출 근거**: `estimation.md L17-30 Epic별 MD 합산 (200 MD 초안 + 18 MD ST-073~080 보강 = 218 MD)`. 단순 환산 415 SP × 0.5 = 207.5 MD와 약 10.5 MD 차이는 Epic별 round-up 보수 마진.
- **§4 표 MD 열 합계** = 30+35+38+30+22+40+28+20+35+15 = **293 MD 보수** (sprint별 표기). 838 MD (tasks.md L466 합계)와 차이 545 MD는 **(a) sprint 내 페어 병렬 흡수 (MD 열은 2 dev × 2주 = 20 MD 기준 + 마진)** vs **(b) tasks.md 838 MD는 1 Task = 1 MD 직렬 가산 + 종속/대기/PR 리뷰** 두 산식의 단위 차이. §4 표 MD 열은 실제 calendar 일정 기준이라 sprint별 max 20 MD에 마진 더한 30~40 MD.
- **P0 / 전체 SP 비율 = 275 / 415 = 66.3%** (P0가 전체의 약 2/3). 보수 838 MD × 0.663 ≈ **555 MD**가 P0 보수 환산 (tasks.md L470 산식 정합 ✓).
- **순수/보수 비율 = 218 / 838 = 26%** (별도 산식 — MD 단위 환산 비율, SP 비율과 무관).
- Phase 7 진입 후 첫 Sprint 실측으로 보수배수 재조정 (R-1 위험)
- **Sprint 1~10 SP 분배 검증** (stories.md L505 SSOT 415 SP 정합):

| Sprint | SP | 누적 |
|--------|----|----|
| S1 | 42 | 42 |
| S2 | 49 | 91 |
| S3 | 55 | 146 |
| S4 | 40 | 186 |
| S5 | 32 | 218 |
| S6 | **57** | 275 (P0 종료 = 275 SP ✓) |
| S7 | 40 | 315 |
| S8 | 29 | 344 |
| S9 | 50 | 394 |
| S10 | 21 | **415 ✓** |

→ 415 SP / stories.md SSOT 정확 정합. P0=275 / P1=116 / P2=19 / P3=5 (Sprint 분배 시 P3 ST-061/067은 S10에 흡수).

### 4-2. P1/P2/P3 Sprint 배치 사유

- **P1 → Sprint 7~9**: 운영사 도메인 (EP-03/04/05) + 문서/급여 (EP-09)은 P0 완료 후 베타 운영 안정화 단계 진입.
- **P2 → Sprint 9~10**: 도움말 + 온보딩 (ST-076/079)은 베타 사용성 향상용. API Key/리포트 (ST-056/057)는 운영 안정화 후.
- **P3 → Sprint 10**: ST-061 (EM-11 통합) / ST-067 (공통 검색) / ST-075 (검색 안내) — v1.1+ 이관 권장. MVP는 사이드바 placeholder 또는 비활성 토스트로 충분.

## 5. 외부 의존 + 블로커

> SSOT: `.flowset/backlog/dependency-graph.md ## 외부 의존` + **`.flowset/guardrails.md §10` (인프라 결정, 사용자 2026-05-19 — Free 시작 + Pro 전환 5트리거 + NHN DEFER + Tauri 자체 인증서)**

| 외부 | 영향 Sprint | 진입 권장 시점 | 보수적 일정 |
|------|-----------|-------------|----------|
| **Supabase Free org + flowhr-staging** | S1+ | S1 day 1 (Free) | 즉시. Pro 전환은 5트리거 도달 시 |
| **Vercel 프로젝트 (무료)** | S1+ | S1 day 1 (Hobby/Cloudflare/Netlify) | 즉시. Pro 전환은 서비스 런칭 시 |
| **NHN Cloud 알림톡 → DEFER** | (옵션 활성 테넌트 발생 시) | 첫 옵션 활성 또는 고객 계약 조건 | 60일 (신청 시점부터) |
| Sentry 프로젝트 (Free Developer) | S6+ | S6 말 신청 (무료) | 1일 |
| Tauri 코드 서명 (자체 인증서) | S9~ (데스크톱 배포) | S9 (자체 인증서 0원) | 즉시 |
| 사업자등록 + 정보통신 신고 | S7 (Phase 9 베타 진입 전) | S7 day 1 | 1~2주 |

블로커 영향 분석 (NHN DEFER 반영):
- **NHN DEFER**: S1 day 1 신청 의무 폐기. 기본 알림 채널은 인앱 + 이메일(Resend 3,000건/월 무료)로 S6 ST-066 충족. 카카오 알림톡은 테넌트별 옵션 기능으로 첫 활성 시 신청 (60일). 따라서 NHN 60일 심사가 Sprint 일정 블로커 아님.
- S5/S6 알림 기능: 인앱 + 이메일 폴백으로 구현 (NHN 미연동 전제). 카카오 알림톡 코드는 옵션 토글 기반으로 작성 (활성 테넌트만 발송).
- Tauri 자체 인증서는 S9 데스크톱 배포 시 즉시 적용 (비용 0, 설치 가이드로 OS 경고 안내).
- Supabase Pro 전환 시점은 5트리거 도달 시 사용자 승인 (`guardrails.md §10`).

## 6. Phase 7 CI 추가 정책

> codex 권고 5번 채택. 현행 9 job 중 6개 wireframe job은 path-scope 제한.

### 6-1. 현행 9 job 분류 (PR #16 머지 시점 기준)

| Job | 분류 | Phase 7 적용 |
|-----|------|----|
| `commit-msg-format` | 공통 | 모든 PR 유지 |
| `encoding-check` | 공통 | 모든 PR 유지 |
| `version-format` | 공통 | 모든 PR 유지 |
| `html-syntax` | wireframe | `.flowset/wireframes/**` path-scope (Phase 7+ 코드 변경 시 skip) |
| `design-system-ssot` | wireframe | `.flowset/wireframes/**` path-scope |
| `inline-svg-sprite-check` | wireframe | `.flowset/wireframes/**` path-scope |
| `native-element-wrap-check` | wireframe | `.flowset/wireframes/**` path-scope |
| `showcase-coverage-check` | wireframe | `.flowset/wireframes/**` path-scope |
| `playwright-smoke` | wireframe | `.flowset/wireframes/**` path-scope (Phase 7 React E2E는 별도) |

### 6-2. Phase 7 신규 4 job (`phase7-code.yml` 신규)

| Job | 도구 | path-scope |
|-----|-----|----------|
| `lint` | ESLint (`@flowhr/config/eslint-base`) | `apps/**`, `packages/**` |
| `typecheck` | `tsc --noEmit` (per workspace) | `apps/**`, `packages/**` |
| `unit-test` | Vitest | `apps/**`, `packages/**` |
| `build` | `turbo run build --filter=...` (변경 영향 패키지만) | `apps/**`, `packages/**` |

### 6-3. CI 게이트 통합

PR이 `apps/**` 또는 `packages/**` 변경 시 Phase 7 4 job 의무. 와이어프레임 변경만 있으면 wireframe 6 job 유지.

## 7. 리스크 + 트레이드오프

| 리스크 | 영향 | 완화 |
|-------|----|------|
| **R-NHN 알림톡 채널 심사 60일** | S5 진입 차단 가능 | S1 day 1 신청 의무 + 폴백 SMS+이메일 코드 먼저 |
| **R-Phase 5 DS → React 변환 40+ 컴포넌트** | Sprint 1 부담 과중 | Sprint 1은 base 16개만 (Button/Input/Card/Table/...), 도메인 특화는 Sprint 3~6 점진 |
| **R-Tauri 코드 서명 + iOS PWA 푸시 제약** | 데스크톱/iOS 사용자 경험 | S9 진입 전 Tauri 서명 + iOS PWA는 16.4+ 명시 + 카카오 폴백 |
| **R-zod-to-openapi 변환 정합** | OpenAPI YAML과 실 구현 drift | CI에서 `pnpm openapi:validate` job 추가 (Sprint 1 중) |
| **R-Phase 4 API Markdown 명세 → 코드 drift** | 실제 endpoint 변경 시 SSOT 미동기 | PR template에 "API 변경 시 `.flowset/api/*.md` 동시 갱신 + zod schema 갱신" 의무 |
| **R-1 SP × 0.5 MD 환산** | 실측과 차이 가능 | Sprint 1 실측 후 보수배수 재조정 (현재 838/207.5 = 4.03배) |

## 8. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-19 | 초안 — 디렉토리 구조 SSOT (codex 7건 권고) + Sprint 1~10 + KI-071 정합화 동반 | Phase 6 진입 (Phase 2 백로그 4차 PASS_BOTH 후) |
| 2026-05-19 | Phase 6 evaluator PASS 8.40 + codex FAIL 7.4 통합 hotfix — Sprint 6 SP "64→57" + 11 Story 정합 + §4-1 SP 누적 검증 표 + 218/838=26% 비율 명시 + NHN 60일 정밀 계산 (D+71 ST-066 활성) + Sprint 1 작업 순서 4 그룹 병렬 (dependency-graph SSOT 정합) + dependency-graph §Sprint 6 ST-070 placeholder 추가 + sprint-006 NHN "S2→S1 day 1 신청" 정정 + sprint-007 S6 spill 시나리오 명시 + PRD 03-tech-architecture L65 packages/utils→packages/i18n 정정 + §1 코드 vs 메타 영역 구분 추가 | Phase 6 재평가 통합 정정 (codex P1×4 + P2×4 + P3×3 mechanical closure) |
| 2026-05-19 | 2차 재평가 통합 hotfix — evaluator 2차 PASS 9.00 + codex 2차 CONDITIONAL 7.88 신규 결함 정정: (a) §4-1 MD 합계 stale "200/320~400" → "218/838" 정정 (b) dependency-graph §진입 순서 표 Sprint 1/3/4/6 mvp-plan SSOT 정합 (c) §5 S4 행 NHN "활성화 완료" → "체크포인트 / S6 D+71 활성 보장" (d) sprint-003 헤더 "12 Story" → "11" (e) sprint-001 NHN D-1 → "Sprint 1 day 1 (D+0)" 통일 (f) §1-2 KI-072~074 신규 등록 → KI-071 묶음 하위 처리 통합 | Phase 6 2차 재평가 P1×2 + P2×3 + P3×2 mechanical closure |
| 2026-05-19 | §5 외부 의존 표 재정의 — Supabase Free/Vercel 무료 시작 + NHN DEFER (테넌트 옵션 기능, S1 day 1 의무 폐기) + Tauri 자체 인증서 + 블로커 분석에서 NHN 60일 블로커 제거 (인앱+Resend 이메일로 S6 충족) | WI-InfraPolicy-docs — 사용자 결정 Free 시작 (Phase 1~6 산입 유료 가정 정정). SSOT: guardrails.md §10 |
