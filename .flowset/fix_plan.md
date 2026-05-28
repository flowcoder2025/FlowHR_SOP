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
- [~] WI-019-feat apps/web + packages 7개 스캐폴드 + Supabase 인프라 (스키마/RLS/audit/Realtime, Sprint 1 Day 3~5·8~10)
  - [x] Day 3~5: apps/web(Next 15.5 + next-intl ko/en) + packages 7개 + supabase init + ERD 39엔티티 스키마 마이그레이션 1~20 원격 staging 적용 + database.ts 생성 (typecheck/build/런타임 스모크 PASS)
  - [ ] Day 8~10: RLS 정책 SQL(ST-005) + audit 트리거(ST-068) + Realtime publication(ST-069) — ST-001 로그인(WI-020) 의존
- [ ] WI-020-feat 인증 (로그인/2FA/활성화/비밀번호 ST-001~004) + 약관/오류 (ST-078/072, Day 6~7·11~12)
- [ ] WI-021-feat zod-to-openapi + CI(phase7-code.yml 4 job) + 디자인 시스템 베이스 (Day 13~14)

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
