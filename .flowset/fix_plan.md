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

## Phase 1 — 개발용 PRD 작성 [✓ PASS 8.15/10]

- [x] WI-001-docs 개발용 PRD 초안 작성 (50 파일, ~7000줄)
- [x] WI-002-docs 디바이스 매트릭스 정의 (Web/PWA/Tauri)
- [x] WI-003-docs 비기능 요구사항 (성능/보안/접근성/i18n/감사/백업/확장/모니터링)
- [x] WI-004-docs 데이터 모델 매트릭스 SSOT 생성 (matrix.json, 36 엔티티)

## Phase 2 — 백로그 [✓ PASS 8.29/10]

- [x] WI-005-docs Epic 정의 (12 Epic, 379 SP)
- [x] WI-006-docs User Story 작성 (72 Story, 화면×역할 매트릭스)
- [x] WI-007-docs Task 분해 (EP-01/02/06/07/08 완전 + 7 Epic 패턴 추정, 195 Task / 739 MD)

## Phase 3 — DB ERD [✓ PASS 8.68/10]

- [x] WI-008-docs ERD 다이어그램 (Mermaid, 37 엔티티 통합 + 도메인별 4분할)
- [x] WI-009-docs RLS 정책 설계 (37 테이블 × 6 역할 + Approval polymorphic routing)
- [x] WI-010-docs 인덱스 / 마이그레이션 순서 (23 파일) + enums + seed

## Phase 4 — API 명세 [✓ PASS 8.78/10]

- [x] WI-011-docs OpenAPI 스켈레톤 (conventions + schemas + zod)
- [x] WI-012-docs 도메인별 엔드포인트 명세 (인증/운영사/관리자/직원/공통/cron 약 280)

## Phase 5 — 와이어프레임 [🛑 중단, 정책 변경 2026-05-15]

> **정책 변경**: Codex 이미지 생성 폐기 → HTML 직접 작성 단일 채택. 자세한 사유는 HANDOFF.md.

- [~] ~~WI-013-docs 36개 화면 이미지 프롬프트 작성~~ (폐기, archive 이동)
- [~] ~~WI-014-docs Codex 이미지 생성 (배치)~~ (폐기)
- [ ] WI-013-docs HTML 와이어프레임 36~42 작성 (Tailwind + shadcn 패턴) — WI-KI-batch-003 완료 후
- [ ] WI-014-docs analysis/*.md 컴포넌트 분해 / 인터랙션 / 반응형 / 접근성 정리
- [ ] WI-015-docs Phase 5 evaluator (doc 모드) — 보강 검증 축으로 재호출

## Phase 6 — MVP 스프린트 계획

- [ ] WI-016-docs 스프린트 분해 (2주 단위)
- [ ] WI-017-docs 스프린트별 수용 기준

## Phase 7 — 개발 착수

- [ ] WI-018-feat 모노레포 부트스트랩
- [ ] WI-019-feat Supabase 프로젝트 + 스키마 마이그레이션
- [ ] WI-020-feat 인증 (이메일/2FA)
- [ ] WI-021-feat 디자인 시스템 베이스

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
- [ ] **WI-KI-batch-003 (PRD 누락 결함 P1 5건 보강, HANDOFF 작업 4~7)**: KI-027/028/029/030/031
  - 신규 세션에서 진행. HANDOFF.md 작업 체크리스트 따름.
  - 작업: 09-routing.md 신규 / CM-16~19 추가 / OP-12 추가 / 약관·PWA설치 정적 페이지 추가 / evaluator.md 보강
  - 완료 후: Phase 1~4 retroactive 재평가 (8.0+ 유지) + Phase 5 HTML 와이어프레임 재시작
