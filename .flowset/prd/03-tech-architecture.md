# 03. 기술 아키텍처

## 1. 스택 확정 (prd-state.json 참조)

| 영역 | 선택 | 버전 | 비고 |
|------|------|------|------|
| Web 프레임워크 | Next.js | 15.x (App Router, RSC) | Server Components 기본, 클라이언트 컴포넌트는 인터랙션만 |
| 언어 | TypeScript | 5.x | `strict: true`, `noUncheckedIndexedAccess: true` |
| 스타일 | Tailwind CSS | 3.x | + `tailwind-merge` + `clsx` |
| UI 키트 | shadcn/ui | latest | 컴포넌트는 `packages/ui`에 ejected |
| 아이콘 | Lucide React | latest | 16/20/24px |
| 폰트 | Pretendard | 1.x | 한글 우선. 영문은 Inter 폴백 |
| 상태관리 (서버) | TanStack Query | 5.x | `staleTime: 5min`, mutation 후 invalidate |
| 상태관리 (클라이언트) | Zustand | 4.x | 글로벌 UI 상태(사이드바, 모달) |
| 폼 | React Hook Form | 7.x | + zod 스키마 |
| 검증 | Zod | 3.x | 클라이언트·서버 공통 |
| 백엔드 | Supabase | latest | Postgres 15 + Auth + Storage + Realtime + Edge Functions |
| ORM / 쿼리 | Supabase JS SDK | 2.x | 직접 호출 + `database.ts` 자동 생성 타입 |
| Migration | Supabase CLI | 2.x | `supabase/migrations/*.sql` |
| Realtime | Supabase Realtime | latest | 알림 / 결재 진행 |
| 인증 | Supabase Auth | latest | 이메일/비밀번호 + TOTP 2FA + 매직링크 |
| 파일 저장 | Supabase Storage | latest | 테넌트별 prefix `tenants/{tenantId}/` |
| i18n | next-intl | 3.x | **ko + en 동시 MVP** (외국인 근로자 사용성 — 사용자 결정 2026-05-16). 우선순위: profile.locale → Accept-Language → ko (default). 통화 KRW / 시간대 Asia/Seoul 고정 (한국 사업장), 날짜 형식만 locale-aware |
| 데스크톱 앱 | Tauri | 2.x | Rust 1.78+, WebView |
| 모노레포 | pnpm workspaces + Turborepo | 8.x / 2.x | 캐시 + 병렬 |
| 테스트 (단위) | Vitest | 1.x | + Testing Library |
| 테스트 (E2E) | Playwright | 1.x | Chrome / Safari / Tauri WebView |
| 코드 품질 | ESLint + Prettier | 9.x / 3.x | + `@typescript-eslint` |
| Git Hooks | husky + lint-staged | 9.x / 15.x | pre-commit lint·format |
| CI/CD | GitHub Actions | — | lint → typecheck → test → build → deploy |
| 배포 (Web/PWA) | Vercel | — | preview deployment per PR |
| 배포 (Desktop) | Tauri Build + GitHub Releases | — | 자동 업데이트 `tauri-updater` |
| 외부 알림 | 카카오 알림톡 / SMS (NHN Cloud) | — | MVP에 통합 |
| 모니터링 | Sentry | — | 에러 / 성능 |
| 로깅 | Axiom 또는 Supabase 자체 | — | 결정은 Phase 7 |

## 2. 모노레포 구조

```
FlowHR_SOP/
├── apps/
│   ├── web/                    # Next.js 15 — Web + PWA (단일 빌드)
│   │   ├── app/
│   │   │   ├── (auth)/         # 로그인 / 가입 / 2FA
│   │   │   ├── (operator)/     # OP-01 ~ OP-11
│   │   │   ├── (tenant)/       # TA-01 ~ TA-14
│   │   │   ├── (employee)/     # EM-01 ~ EM-11
│   │   │   ├── api/            # Route Handlers (필요한 곳만)
│   │   │   ├── manifest.json   # PWA manifest
│   │   │   └── sw.js           # Service Worker (next-pwa 생성)
│   │   ├── public/
│   │   └── next.config.ts
│   └── desktop/                # Tauri 2.x
│       ├── src-tauri/
│       │   ├── src/main.rs
│       │   ├── tauri.conf.json
│       │   └── Cargo.toml
│       └── README.md
├── packages/
│   ├── ui/                     # shadcn/ui 기반 공용 컴포넌트
│   ├── platform/               # 디바이스 분기 추상화 (web/pwa/tauri)
│   ├── api-client/             # Supabase SDK wrapper + 타입
│   ├── schemas/                # zod 스키마 (공유)
│   ├── types/                  # DB 생성 타입 (Supabase) + 도메인 타입
│   ├── i18n/                   # next-intl ko/en namespace SSOT (날짜/숫자/한글 포맷 흡수)
│   └── config/                 # ESLint / TS / Tailwind 공유 설정
├── supabase/
│   ├── migrations/             # SQL 마이그레이션
│   ├── functions/              # Edge Functions
│   └── seed.sql                # 시드 데이터
├── .flowset/                   # FlowSet 라이트
├── .claude/                    # Claude 에이전트 / 룰
├── docs/                       # 원본 명세 + 추가 문서
├── .github/workflows/          # CI/CD
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── tsconfig.base.json
```

## 3. 데이터 흐름 (data-flow.md 인용)

```
[ Web / PWA / Tauri Desktop ]
         │
         ├── Supabase Auth (이메일+TOTP+세션)
         ├── Supabase JS SDK
         │
         ↓ JWT (tenant_id claim 포함)
         │
[ Postgres (단일 스키마) ]
   ├── RLS 정책 (tenant_id = auth.jwt() ->> 'tenant_id')
   ├── 모든 테이블에 tenant_id (운영사 전용 제외)
   └── Realtime publication (notifications, approvals, ...)
         │
         ↓ broadcast
         │
[ 클라이언트 즉시 갱신 (TanStack Query invalidate) ]
```

## 4. 인증·권한 흐름

```
1. 로그인 (이메일/비밀번호) → Supabase Auth
2. 2FA 활성화 시 TOTP 코드 검증
3. JWT 발급 (custom claims: tenant_id, role, tenant_super 등)
4. 클라이언트는 JWT를 cookie + localStorage 이중 저장
5. 모든 API 호출은 JWT 첨부
6. Postgres RLS가 tenant_id + role 기반으로 접근 제어
7. 추가 비즈니스 권한(예: 결재 단계)은 Edge Function 또는 RPC에서 검증
```

JWT custom claims 예시:
```json
{
  "sub": "user-uuid",
  "tenant_id": "tenant-uuid",
  "role": "tenant_hr_admin",
  "employee_id": "employee-uuid",
  "tenant_super": false,
  "exp": 1234567890
}
```

## 5. 멀티테넌트 격리

| 계층 | 격리 방법 |
|------|---------|
| 데이터 | 단일 스키마 + `tenant_id` 컬럼 + RLS |
| 파일 | Storage prefix `tenants/{tenantId}/...` + RLS |
| 인증 | JWT `tenant_id` claim |
| 캐시 | TanStack Query 키에 `tenant_id` 포함 |
| 실시간 | Realtime 채널명에 `tenant_id` 포함 |
| 운영사 화면 | 별도 화면 그룹 `(operator)`, RLS 우회 권한은 `operator_super` role만 |

## 6. 빌드·배포 파이프라인

### Web/PWA (Vercel)
```
PR 푸시 → GitHub Actions (lint/typecheck/test/build)
       → Vercel preview deployment
       → 자동 PR 코멘트 (preview URL)
       → 머지 → main → Vercel production
```

### Tauri Desktop (GitHub Releases)
```
태그 푸시 (v*.*.*) → GitHub Actions matrix build
       → macOS (.dmg / .app) / Windows (.msi / .exe) / Linux (.AppImage / .deb)
       → GitHub Releases 자동 업로드
       → 기존 사용자에게 tauri-updater 자동 알림
```

### Supabase
```
supabase/migrations/*.sql 변경 → PR → CI에서 ephemeral `supabase start` + `db reset --local` + RLS/audit/Realtime smoke
       → 머지 → CD가 Free staging에 `supabase db push` 실행
       → production은 Pro 전환 후 staging smoke 통과 시 수동 승인 게이트로 적용
```

## 7. 환경 분리

> **인프라 운영 전략 SSOT**: `.flowset/guardrails.md §10` (2026-05-19 사용자 결정 — Free 시작 + Pro 전환 5트리거). 본 표는 환경 매핑만.

| 환경 | 용도 | URL / 백엔드 |
|------|------|-----|
| local | 로컬 개발 | `http://localhost:3000` + Supabase 로컬 (`supabase start`) |
| preview | PR 미리보기 | Vercel preview URL + **Supabase 미연동 (mock UI 빌드 검증)** — schema/RLS/audit/Realtime 검증은 CI ephemeral `supabase start` |
| staging | 데모 / QA | `staging.flowhr.kr` + **Supabase Free staging project** (synthetic 데이터만, 실고객 데이터 금지 — `guardrails.md §10` 트리거 도달 전) |
| production | 실서비스 | `app.flowhr.kr` + Supabase production project (**서비스 런칭 시 Pro 전환**) |

## 8. 비용 추정 (단계별)

> **결정 SSOT**: `.flowset/guardrails.md §10` (2026-05-19 사용자 결정). 모든 외부 비용은 **Free 시작 + 트리거 도달 시 사용자 승인 후 전환**. 외부 비용 항목은 사용자 미승인 상태로 산출물에 의무화하지 않는다 (재발 방지 — `guardrails.md §10` 원칙).

### 8-1. 개발 단계 (Sprint 1~서비스 런칭 전) — 1인 운영 + 2~3사 × 20~50명 컨텍스트

| 항목 | 비용 | 비고 |
|------|----|----|
| Supabase | **Free $0** | 트리거(3사 / DB 400MB / Storage 800MB / Connection 위험 / SLA·컴플라이언스) 도달 시 Pro |
| Vercel | **$0** | Hobby(개발/내부) 또는 Cloudflare Pages/Netlify(상업적 무료). 서비스 런칭 시 결정 |
| Sentry | **Free Developer $0** | 월 5,000 이벤트. 초과 시 Team $26 |
| GitHub Actions | $0 (무료 한도) | private repo 월 2,000분 + CI ephemeral Supabase 검증 |
| 카카오 알림톡 (NHN) | **$0 (DEFER)** | 테넌트별 옵션 기능. 첫 활성 테넌트 발생 시 신청 (60일). 실 사용량 약 750건/월 = 6,600원 |
| 이메일 (Resend) | $0 (3,000건/월 무료) | 기본 알림 채널 |
| 도메인 + SSL | 무료 (Vercel/Cloudflare) | |
| Tauri 코드 서명 | **$0 (자체 인증서)** | 설치 가이드로 OS 경고 회피 안내 |
| **개발 단계 합계** | **약 0원/월** | |

### 8-2. 서비스 런칭/확장 시 전환 비용 (트리거 도달 시 사용자 승인)

| 항목 | 전환 비용 | 트리거 |
|------|--------|------|
| Supabase Pro | $25/월 (+ PITR add-on / branch compute 별도) | 3사 / DB 400MB / Storage 800MB / Connection 위험 / SLA·컴플라이언스 |
| Vercel Pro | $20/월 | 서비스 런칭(상업적 사용 ToS) 시 — 단 Cloudflare/Netlify는 무료 유지 가능 |
| Sentry Team | $26/월 | 월 5,000 이벤트 초과 |
| NHN 카카오 알림톡 | 8.8원/건 (실 750건/월 ≈ 6,600원) | 테넌트 옵션 활성 또는 고객 계약 조건 |
| Tauri 유료 인증서 (선택) | macOS $99/년, Windows OV $90/년 또는 EV $250/년 | 설치 UX 개선 필요 시 (자체 인증서로 0원 운영 가능) |

상세 운영 비용은 `.flowset/ops/cost.md`(Phase 10)에서.

## 9. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 스택 + 모노레포 + 인증 + 배포 | Phase 1 진입 |
| 2026-05-16 | i18n: ko + en MVP 동시 (외국인 근로자) | 사용자 결정 batch-005 |
| 2026-05-19 | §6 Supabase 배포 흐름 (CI ephemeral + staging push) + §7 환경 분리 (preview 미연동 mock / staging Free) + §8 비용 단계별 재구성 (Free 시작 + Pro 전환 5트리거) | WI-InfraPolicy-docs — 사용자 결정 (Free 시작, Phase 1 산입 유료 가정 정정). SSOT: guardrails.md §10 |
