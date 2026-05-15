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

## Phase 2 — 백로그

- [ ] WI-005-docs Epic 정의 (도메인별 묶음)
- [ ] WI-006-docs User Story 작성 (역할 × 화면)
- [ ] WI-007-docs Task 분해 (WBS)

## Phase 3 — DB ERD

- [ ] WI-008-docs ERD 다이어그램 (Mermaid)
- [ ] WI-009-docs RLS 정책 설계
- [ ] WI-010-docs 인덱스 / 마이그레이션 순서

## Phase 4 — API 명세

- [ ] WI-011-docs OpenAPI 스켈레톤
- [ ] WI-012-docs 도메인별 엔드포인트 명세

## Phase 5 — 와이어프레임 (Codex 이미지 → 분석)

- [ ] WI-013-docs 36개 화면 이미지 프롬프트 작성
- [ ] WI-014-docs Codex 이미지 생성 (배치)
- [ ] WI-015-docs 와이어프레임 분석 정리 (컴포넌트/필드/액션)

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

- [ ] **WI-KI-batch-001 (P2 트리거 도달, 5건)**: KI-001/KI-002/KI-003/KI-008/KI-009 일괄 처리
  - Phase 2 진입 직후 또는 Phase 2 마무리 시점에 일괄 해소
  - 사용자 승인 후 진행 (P0 아니므로 자동 승인 X)
