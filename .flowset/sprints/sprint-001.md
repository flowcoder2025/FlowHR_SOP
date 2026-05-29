# Sprint 1 — 모노레포 부트스트랩 + 인증/RLS/audit 인프라

> **주차**: 1~2주 (2 dev × 2주 = 20 MD 순수 / 30 MD 보수)
> **SP**: 42 (ST-001 5 + ST-002 3 + ST-003 3 + ST-004 5 + ST-005 5 + ST-068 5 + ST-069 5 + ST-072 3 + ST-078 8)
> **목표**: Phase 7 모든 코드 작업의 토대. 인증 + RLS + audit + Realtime + 오류 페이지 + PIPA 컴플라이언스(약관) 준비 완료.
> **SSOT**: `.flowset/backlog/tasks.md` TS-001~021 (EP-01) + TS-189~194 + TS-209~213 (ST-068/069/072/078)
> **외부 신청 Sprint 1 day 1 (D+0)**: Supabase Free org + flowhr-staging + Vercel 프로젝트 (무료). **NHN Cloud 알림톡은 DEFER** (테넌트 옵션 기능 — 사용자 결정 2026-05-19, `guardrails.md §10`). 기본 알림은 인앱 + 이메일(Resend).

## Story 목록 (9 Story / 42 SP)

| Story | 화면/도메인 | SP | Acceptance (PRD §8) |
|-------|----------|----|--------------------|
| ST-001 | CM-01 로그인 | 5 | 정상 + 5회 잠금 + 2FA |
| ST-002 | CM-02 비밀번호 찾기 | 3 | 토큰 60분 + 미등록도 동일 응답 |
| ST-003 | CM-03 최초 활성화 | 3 | 7일 토큰 + 1회 + 약관 + 2FA |
| ST-004 | CM-04 2FA | 5 | TOTP + 복구 8개 + 운영사 강제 |
| ST-005 | RLS 골격 | 5 | tenant_id 정책 + operator 우회 |
| ST-068 | CM-14 audit_logs 트리거 | 5 | 21 테이블 AFTER + 5년 보관 |
| ST-069 | Realtime publication | 5 | notifications/approvals + 클라이언트 wrapper |
| ST-072 | CM-06 오류·점검 | 3 | 404/500/503 + Sentry |
| ST-078 | CM-21 약관 + 동의 P0 | 8 | PIPA + ko/en 페어 + 강제 동의 가드 + 운영사 게시 |

## Task 부트스트랩 — dependency-graph.md §Sprint 1 SSOT 순서

> dependency-graph SSOT: ST-001 (없음) → ST-002~004 (← ST-001) + ST-005 (← ST-001, ST-068 동시) + ST-068/069 (← Supabase 인프라) 병렬. ST-072/078은 ST-005/068 의존.

> **WI 번호 매핑 (KI-075, fix_plan.md Phase 7 SSOT)**: WI-018(모노레포 Day1~2) / WI-019(apps/web 스캐폴드 + supabase 인프라 + RLS + audit + Realtime, Day3~5·8~10) / WI-020(인증 ST-001~004 + 약관/오류, Day6~7·11~12) / WI-021(zod-openapi 파이프라인 + CI + 로그인 E2E, Day13~14) + WI-021-1(39 entity zod schema 변환, Sprint 1 잔여 — 2026-05-29 사용자 결정 분할). 이전 `WI-001-feat`/`WI-bootstrap` 표기는 WI-001이 docs 점유라 오용 — 본 매핑으로 정정. Day별 작업은 1 WI 내 여러 commit으로 분할 가능.

### Day 1~2: 모노레포 셋업
```bash
git checkout main && git pull --ff-only origin main
git checkout -b feature/WI-018-feat-monorepo-bootstrap

pnpm init
# pnpm-workspace.yaml: packages: ["apps/*", "packages/*"]
# turbo.json: build/test/lint/typecheck/db:migrate tasks
# tsconfig.base.json + package.json devDeps (turbo, typescript, vitest, @playwright/test)

pnpm add -w -D turbo typescript vitest @playwright/test
git commit -m "WI-018-feat 모노레포 루트 셋업 (pnpm workspaces + Turborepo)"
```

### Day 3~4: apps/web + packages 스캐폴드
```bash
pnpm dlx create-next-app@latest apps/web --ts --tailwind --eslint --app --src-dir --use-pnpm
pnpm add -C apps/web next-pwa @supabase/supabase-js @tanstack/react-query zustand next-intl lucide-react

# packages/* 7개 스캐폴드 (ui/schemas/types/api-client/i18n/platform/config)
mkdir -p packages/{ui,schemas,types,api-client,i18n,platform,config}/src
git commit -m "WI-019-feat apps/web 초기화 + packages 7개 스캐폴드"
```

### Day 5: supabase 인프라 셋업 (RLS 정책 제외, ST-068/069 마이그레이션 기반)
```bash
pnpm add -w -D supabase
pnpm supabase init  # 루트 supabase/ 생성

# .flowset/db/migrations/00000000000010~21.sql → supabase/migrations/ (스키마만, RLS 정책 SQL 제외)
pnpm supabase db reset --local
pnpm supabase gen types typescript --local > packages/types/src/database.ts
git commit -m "WI-019-feat supabase init + 스키마 마이그레이션 12 파일 + types 자동 생성"
```

### Day 6~7: ST-001 로그인 핵심 (Supabase Auth + apps/web)
```bash
git checkout -b feature/WI-020-feat-login-core
# packages/ui/src/components/{Button,Input,Card,Alert}.tsx 4 base
# packages/api-client/src/hooks/auth.ts (signIn)
# apps/web/app/[locale]/(auth)/login/page.tsx (CM-01)
# 5회 실패 잠금 + 역할별 리다이렉트 + audit
git commit -m "WI-020-feat 이메일/비밀번호 로그인 (CM-01) + 5회 실패 잠금 + 역할별 리다이렉트"
```

### Day 8~10: ST-002~004 + ST-005 + ST-068 + ST-069 병렬 (4 그룹 페어 분담 또는 직렬)

**그룹 A — 인증 보조 (ST-002/003/004)**:
```bash
# CM-02 비밀번호 찾기 + CM-03 활성화 + CM-04 2FA (speakeasy TOTP + recovery codes)
git commit -m "WI-020-feat 비밀번호 찾기 + 활성화 + 2FA TOTP (ST-002~004)"
```

**그룹 B — RLS 정책 SQL (ST-005)**:
```bash
# .flowset/db/rls.md 패턴 A/B/C → CREATE POLICY SQL 작성
# supabase/migrations/00000000000022_rls_policies.sql 신규 (KI-017 P3 → Sprint 1 처리)
# 권한 매트릭스 자동 테스트 (6 역할 × 44 화면 핵심 엔드포인트)
git commit -m "WI-019-feat RLS 정책 SQL 37 테이블 + 운영사 우회 + 권한 매트릭스 테스트 (ST-005)"
```

**그룹 C — audit_logs 트리거 (ST-068)**:
```bash
# supabase/migrations/00000000000023_audit_triggers.sql (21 테이블 AFTER INSERT/UPDATE/DELETE/APPROVE)
# 5년 보관 정책 + 파티셔닝 (월 단위)
git commit -m "WI-019-feat audit_logs 트리거 21 테이블 + 5년 보관 + 월 파티셔닝 (ST-068)"
```

**그룹 D — Realtime publication (ST-069)**:
```bash
# supabase/migrations/00000000000024_realtime_publication.sql (notifications/approvals/approval_steps)
# packages/api-client/src/hooks/useRealtime.ts wrapper + 재연결 + 오프라인 fallback
git commit -m "WI-019-feat Realtime publication + 클라이언트 wrapper + 자동 재연결 (ST-069)"
```

### Day 11~12: ST-078 약관 + ST-072 오류 페이지 (ST-005/068 의존)
```bash
# supabase/migrations/00000000000025_legal_documents_and_user_consents.sql
# packages/schemas: LegalDocumentSchema + UserConsentSchema (zod, ko/en 페어 검증)
# apps/web/app/[locale]/(auth)/(legal)/terms/page.tsx (비로그인 푸터 진입)
# apps/web/app/[locale]/(legal)/error/{404,500,503}/page.tsx + Sentry hook
git commit -m "WI-020-feat 약관/동의 (PIPA 컴플라이언스, ko/en 페어) + 오류/점검 페이지 (ST-078/072)"
```

### Day 13~14: zod-to-openapi + 첫 CI 통합 + Sprint 1 회고
```bash
pnpm add -C packages/schemas @asteasolutions/zod-to-openapi
# packages/schemas/scripts/build-openapi.ts → packages/schemas/dist/openapi.yaml
# .github/workflows/phase7-code.yml 신규 (lint/typecheck/unit-test/build 4 job)
# PR template 갱신 (API 변경 시 .flowset/api/*.md + zod schema 동시 갱신 의무)
git commit -m "WI-021-feat zod-to-openapi 자동 생성 + phase7-code.yml CI 4 job + PR template"
```

> **정정 사유 (2026-05-19 codex P1-4 정정)**: 이전 안은 supabase init에 RLS 정책을 묶었으나 dependency-graph.md L57 "ST-005 ← ST-001, ST-068 동시" SSOT 위반. ST-001 (로그인 핵심) → ST-002~004 / ST-005 / ST-068 / ST-069 4 그룹 병렬 순서가 정확. RLS 정책 SQL은 ST-005 그룹 B에서 별도 마이그레이션.

## 의존성 (`dependency-graph.md ## Sprint 1`)

- ST-001 ← (없음)
- ST-002~004 ← ST-001
- ST-005 ← ST-001, ST-068 동시
- ST-068/069 ← Supabase 인프라
- ST-072 ← ST-005 (RLS), ST-068 (audit), Sentry
- ST-078 (P0 신규) ← ST-005 (RLS), ST-068 (audit)

## 외부 신청 (Sprint 1 day 1) — 사용자 결정 2026-05-19, SSOT: `guardrails.md §10`

- **Supabase Free org + flowhr-staging project 생성 (즉시)** — Pro 전환은 5트리거 도달 시 (3사/DB 400MB/Storage 800MB/Connection 위험/SLA·컴플라이언스)
- **Vercel 프로젝트 (무료, 즉시)** — preview 환경변수에 Supabase URL 미주입 (mock UI). staging만 연동. Pro 전환은 서비스 런칭 시 (또는 Cloudflare/Netlify 무료 유지)
- **NHN Cloud 알림톡 → DEFER** (Sprint 1 day 1 의무 아님). 테넌트별 옵션 기능. 첫 옵션 활성 테넌트 또는 고객 계약 조건 시 신청 (심사 60일 보수). 기본 알림은 인앱 + 이메일(Resend 3,000건/월 무료)
- Sentry Free Developer 계정 (S6 진입 전 활성, 무료)

## Definition of Done

- [ ] `apps/web` 빌드 PASS (`pnpm turbo run build`)
- [ ] `packages/ui` base 16 컴포넌트 Storybook 검수 (선택)
- [ ] `supabase/migrations/` 24+ 파일 + RLS 정책 SQL 적용 → `pnpm supabase db reset --local` PASS
- [ ] `packages/types/src/database.ts` 자동 생성 + git 커밋
- [ ] `packages/schemas/dist/openapi.yaml` 생성 + CI에서 검증
- [ ] 6 역할 × 44 화면 핵심 엔드포인트 권한 매트릭스 자동 테스트 (TS-021-005-QA-1)
- [ ] ST-001/002/003/004/078/072 E2E 시나리오 Playwright PASS
- [ ] audit_logs 트리거 21 테이블 INSERT/UPDATE/DELETE/APPROVE 4 이벤트 검증
- [ ] Realtime notifications 클라이언트 wrapper 구독 + 자동 재연결 검증
- [ ] CI 신규 4 job (`phase7-code.yml`) 통과
- [ ] PR template 갱신 (API/스키마 동시 갱신 의무)

## 위험 + 완화

| 위험 | 완화 |
|-----|------|
| RLS 정책 패턴 A/B/C SQL 변환 시 누락 | KI-017 P3 → Sprint 1에 명시 포함. evaluator + codex 1세트 평가로 정합 검증 |
| Phase 5 DS → packages/ui 16 base 컴포넌트 변환 부담 | 도메인 특화는 Sprint 3+ 점진. base만 Sprint 1 |
| zod-to-openapi 첫 변환 (39 entity + ~280 endpoint) | Sprint 1 day 13~14에 최소 39 entity schema만 변환, endpoint schema는 Sprint 2~6 점진 |
| NHN 신청 누락 시 S5 차단 | day 1 신청 의무 + PR template + Sprint 1 DoD에 명시 |
