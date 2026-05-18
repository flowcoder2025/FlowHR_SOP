# G3 hotfix1 (wf-v0.3.0) Evaluator 재평가 결과

> 호출자가 sub-agent 결과를 Write로 저장 (sub-agent 시스템 지시로 직접 파일 작성 차단).

## 1. 메타

- 평가일: 2026-05-18
- commit: 91c0a00 (hotfix1)
- mode: doc (Phase 5 와이어프레임)
- 루브릭: review-rubric.md §10 v3 5축 + Hard gate
- 이전 평가: 9.22 (hotfix1 전, NON_BLOCKING P2/P3 6건)

## 2. 정적 검증 11종

| # | 항목 | 결과 |
|---|------|------|
| 1 | 외부 sprite 참조 | PASS 0건 |
| 2 | .active 변종 | PASS 0건 |
| 3 | 인라인 sprite | PASS 14/14 |
| 4 | bare select | PASS 0건 |
| 5 | bare file input | PASS 0건 |
| 6 | bare date input | PASS 0건 |
| 7 | inline `<style>` G3 컴포넌트 재정의 | PASS 0건 (state-toggle / page-grid만 잔존) |
| 8 | href="#" 카운트 | PASS 0건 (이전 48 → 0) |
| 9 | matrix.json patterns 카운트 | 24 (14 → +10) |
| 10 | components.css G3 신규 9 클래스 등록 | PASS 9/9 |
| 11 | 모바일 override @media | PASS (components.css L967-981) |

## 3. 5축 채점

| 축 | 가중 | 점수 | 가중점 | 증거 |
|----|----:|----:|------:|------|
| 완성도 (Completeness) | 25% | 9.0 | 2.25 | 14/14 화면+analysis · 9 pane stack 완비 · G3 신규 9 클래스 components.css 등록 |
| 정합성 (Consistency) | 25% | 7.5 | 1.875 | sidebar/PRD 매핑 유지. **감점**: matrix.json version 1.0.0 잔존 / changelog 수치 오기 / analysis 미갱신 / KI INDEX 누락 |
| 구체성 (Specificity) | 20% | 9.0 | 1.80 | TBD 0건 · pane id 의미 명시 · req_id 풍부 |
| 실행가능성 (Actionability) | 20% | 9.0 | 1.80 | Phase 7 React 라이브러리 명시 · scope-mgr/scope-hr 권한 토글 |
| DS 충실도 (Fidelity) | 10% | 7.5 | 0.75 | 9/9 정적 게이트 + 모바일 override. **감점**: G3 신규 9 패턴 _showcase.html 0/9 + 03-components.md 0/9 (Hard gate DS SSOT 결함 트리거) + aria-label 누락 |

**가중 총점 = 8.48 / 10**

## 4. Hard gate 판정

| Gate | 트리거 |
|------|:-----:|
| file:// 아이콘 미표시 2 화면+ | NOT triggered |
| 외부 sprite 참조 잔존 → P1 | NOT triggered |
| bare input[type=file] → P1 | NOT triggered |
| bare select/date 반복 → P2+ | NOT triggered |
| **신규 컴포넌트 3 SSOT 중 빠짐 → DS SSOT 결함** | **TRIGGERED** (components.css ✅ / _showcase.html ❌ 0/9 / 03-components.md ❌ 0/9) → P2 KI 등록 의무 |

## 5. VERDICT

**PASS (조건부)** — 8.48 ≥ 8.0 임계 충족 + 각 축 ≥ 7.5.

이전 9.22 → 8.48 (-0.74): codex P1 정정 가산 + analysis/matrix metadata 미갱신 + KI 미등록 부수 결함 감점.

## 6. 발견 결함 (P1/P2/P3)

| ID | 등급 | 위치 | 설명 |
|----|-----|------|------|
| G3-EV-H1-001 | P2 | matrix.json:3 | top-level `version: "1.0.0"` 잔존 (사용자/CHANGELOG는 v1.1.0) |
| G3-EV-H1-002 | P2 | matrix.json:4 | `updated_at: "2026-05-16"` 잔존 (hotfix1은 2026-05-18) |
| G3-EV-H1-003 | P2 | TA-03.md:22 | "변경이력 Phase 7 timeline" — 실제 HTML 9 pane stack 완비 |
| G3-EV-H1-004 | P2 | TA-13.md:18 | "결재라인 (Phase 7)" — 실제 HTML pane-approval-line 본문 시각화 |
| G3-EV-H1-005 | P2 | TA-13.md:20 | "감사로그 (Phase 7 OP-09 임베드)" — 실제 HTML pane-audit 본문 |
| G3-EV-H1-006 | P2 | _showcase.html | G3 신규 9 패턴 0/9 demo (Hard gate DS SSOT) |
| G3-EV-H1-007 | P2 | 03-components.md | G3 신규 9 패턴 0/9 등록 (Hard gate DS SSOT) |
| G3-EV-H1-008 | P3 | matrix.json:255-257 | changelog 1.1.0 "8 패턴 / 14→22" 산술 오기 (실제 10 / 14→24) |
| G3-EV-H1-009 | P3 | INDEX.md | CHANGELOG L57-61 KI-053~057 권고 → 실제 등록 0건 |
| G3-EV-H1-010 | P3 | TA-02.html:143 | `href="javascript:void(0)"` 잔존 (button 변경 권장) |

## 7. NON_BLOCKING 권고

PASS 머지 가능. 단 후속 처리 의무:
1. KI INDEX에 5건 신규 등록 (P2 4건 + P3 2건)
2. matrix.json top-level metadata 갱신 (단순 정정, 별도 docs 커밋)
3. analysis TA-03/13 갱신 (G4 진입 전 또는 다음 batch)
4. _showcase.html G3 demo 9개 + 03-components.md G3 9 패턴 등록 (Phase 5 전체 evaluator 전 의무)

## 8. 다음 액션

codex 재평가 결과와 통합 판정 (review-system.md §4):
- codex PASS → ready → CI → auto-merge → tag wf-v0.3.0
- codex CONDITIONAL/FAIL → hotfix2 또는 BACKLOG_AND_MERGE 결정
