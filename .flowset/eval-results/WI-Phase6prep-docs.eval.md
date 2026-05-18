# Phase 2 백로그 재평가 (KI-013 + KI-034 closure) — evaluator 4차

> **작성**: 2026-05-19
> **WI**: WI-Phase6prep-docs
> **재평가 사이클**: 4차 (1차 FAIL 6.90 → 2차 FAIL 7.625 → 3차 FAIL 7.625 → 4차 **PASS 8.475**)
> **모델**: evaluator (project agent, claude-sonnet 기본)

## 평가 컨텍스트

- KI-013 (P3 / Backlog) — EP-03/04/05/09/10/11/12 7 Epic Task 분해 미완 → 137 Task 신규 추가
- KI-034 (P3 / Backlog) — 5 파일 stale (합계/의존/카운트) → 정합화
- Phase 6 진입 전 의무 (project.md §1) closure

## 5축 점수

| 축 | 가중 | 점수 | 비고 |
|----|-----|-----|------|
| 정합성 (SSOT 정합) | 25% | 8.0 | 3차 7.0 → 4차 +1.0. mechanical fix 6건 반영 |
| 완전성 (Task 분해) | 30% | 8.5 | 80 Story / 223 Task / 838 MD 완전 분해 |
| 추적성 (Story↔PRD §8) | 25% | 8.5 | 80 Story 일괄 매핑 + 218↔838 MD 이원 |
| 의존성 (Sprint 진입) | 20% | 9.0 | Mermaid + Sprint 1~10 + ST-073~080 의존 |
| **가중 총점** | | **8.475 / 10** | 임계 8.0 ✓ + 각 축 7.5 ✓ |

## 판정

**PASS** — Phase 6 진입 승인.

## 4차 mechanical fix 6건 closure 확인

1. ✅ stories.md:531 P0 그룹 헤더 "52 Story" → "50 Story" (분해 합 5+1+5+1+8+6+10+4+7+3=50 명시)
2. ✅ stories.md:545 합계 검증 "52+23+4+3" → "50+23+4+3=80" 등호 정합
3. ✅ estimation.md:42 P0 행 Story 수 "52" → "50"
4. ✅ estimation.md:46 MVP P0~P2 "79" → "77" (50+23+4)
5. ✅ stories.md:656 변경 이력 "405 SP" → "415 SP" 오타 정정
6. ✅ tasks.md:470 산식 "838 × 64% = 538 MD" → "838 × (275/415=66.3%) ≈ 555 MD"

## NON_BLOCKING_OBSERVATIONS (P2 5건)

epics.md SP 인용 7곳 + estimation.md 비용 환산 4곳 = 11개 위치 stale. Phase 6 sprint planning이 stories.md/estimation.md L42-47 SSOT 직접 참조하므로 차단 요소 아님.

- [P2] `.flowset/backlog/epics.md:39/56/109/128/148/204/222` — Epic 추정 SP 인용 7건 stale (EP-02 34/31, EP-03 21/26, EP-06 34/40, EP-07 34/35, EP-08 55/58, EP-11 21/20, EP-12 34/38)
- [P2] `.flowset/backlog/estimation.md:66` — "실제 379 SP" → 415 SP
- [P2] `.flowset/backlog/estimation.md:71-72` — "200 MD / 739 MD × 700,000원" → 218 MD / 838 MD
- [P2] `.flowset/backlog/estimation.md:92` — "MVP 380~390 SP / 210 MD / 5.5개월" → 415 SP / 218 MD / 7개월
- [P3] `.flowset/backlog/estimation.md:30` 소계 행 MD 200 stale 비용 산정 사슬 출발점

## 권장 다음 조치

1. `.flowset/eval-results/WI-Phase6prep-docs.pass` 마커 생성 (본 평가 PASS)
2. `.flowset/known-issues/INDEX.md`에 KI-NEW 등록 (P2 11곳 stale + P3 1건) — 해결 발동: Phase 6 sprint-001 작성 시 또는 P2 누적 5건 threshold 도달 시 batch
3. Phase 6 진입 시 `.flowset/sprints/mvp-plan.md`는 **stories.md L505 SSOT 표 + estimation.md L42-47 MVP 그룹 표** 직접 인용 (epics.md 인용 SP는 stale이므로 미사용)

## 재평가 회복 추이

| 사이클 | 가중 총점 | 정합성 | 비고 |
|--------|---------|-------|------|
| 1차 | 6.90 | 6.5 | ST-071 Task 분해 누락 + 합계 표 본문 자기모순 (P1×3 + P2×3 + P3×3) |
| 2차 | 7.625 | 6.5 | estimation L42 P0 분해 합 ≠ 표기 (4 SP 차이) + stories.md MVP 절 stale (P1×2 + P2 + P3×2) |
| 3차 | 7.625 | 7.0 | Story 수 헤더 52 vs 분해 합 50 등호 불성립 + 변경 이력 405 SP 오타 (P1×5) |
| **4차** | **8.475** | **8.0** | **PASS** (P0/P1 0 + P2 5건 NON_BLOCKING) |
