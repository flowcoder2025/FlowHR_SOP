# G2 Codex hotfix2 재리뷰

> **작성**: 2026-05-16 (codex gpt-5 agent 통지 — read-only sandbox로 agent가 직접 작성 거부, Claude 본체가 통지 요약 저장)
> **agent task-id**: a6a034bac5c26a4dc

## 종합

- **점수**: 6.5 / 10
- **verdict**: **FAIL** → BLOCKED_FOR_HOTFIX (3회 중 1회 남음)

## 직전 9건 HEAL 검증

| # | 결함 | 결과 |
|---|------|------|
| P0-1 | 외부 svg use 306건 | 부분 HEAL — 정적 `<use href="../_design-system/icons.svg#...">` 제거 ✅, **그러나 JS 토글이 외부참조 재주입** (잔존 P0) |
| P1-2 | 9 화면 inline 재정의 | 부분 HEAL — components.css 등록 + inline 제거 일부, drift 잔존 |
| P1-3 | OP-04 bare file input | ✅ 완전 HEAL |
| P1-4 | variant drift | 부분 HEAL — `.on/.off/.beta → .is-*` 적용했으나 `.active` vs `.is-active` 신규 drift 발견 |
| P1-5 | 사이드바 href 97건 | ✅ 완전 HEAL |
| P1-6 | _showcase.html 매핑 | 부분 HEAL — 15 anchor 신설 OK, select-wrap 미적용 등 |
| P1-7 | 03-components.md | 부분 HEAL — 10 섹션 추가 OK, `.is-active` SSOT drift |
| P1-8 | CI inline-svg-sprite-check | 부분 HEAL — 로직 보강은 됐으나 JS 재주입 케이스 미커버 |
| P2-9 | CI design-system-ssot banned | ✅ 완전 HEAL |

## 잔존/신규 결함

### P0 (잔존) — JS password toggle 외부참조 재주입
- 대상: **CM-01 / CM-02 / CM-03 / OP-12** (4 화면)
- 패턴: `.password-toggle` 클릭 핸들러 JS 코드:
  ```js
  use.setAttribute('href', hidden
    ? '../_design-system/icons.svg#i-eye-off'
    : '../_design-system/icons.svg#i-eye');
  ```
- 정적 `<use>`는 hotfix2에서 제거됐으나 JS가 토글 시 외부참조로 setAttribute → file:// 차단 재발
- **정정**: `'../_design-system/icons.svg#i-eye-off'` → `'#i-eye-off'` (4 화면 sed)

### P1 (신규) — `.active` vs `.is-active` SSOT drift
- components.css / _showcase.html / 03-components.md에 `.active`와 `.is-active` 혼재
- variant naming 통일 필요 (v3 정책: `.is-*` 표준)

### P2 (신규)
- `.select-wrap` 미적용 17건 (select은 wrap 없이도 작동하지만 focus/disabled/error 표현 누락)
- CI showcase 정합 false negative — coverage check가 anchor 존재만 보고 컴포넌트 사용 일관성 미검증

### 코드만 검토 (CI 미실행)
- Playwright smoke는 PR CI 결과 별도 확인 필요

## 통합 판정 권고

**BLOCKED_FOR_HOTFIX_3** (3회 중 마지막). 다음 hotfix3에서 처리:
1. **즉시 (P0)**: 4 화면 JS sed — `'../_design-system/icons.svg#` → `'#` (single-quote 보존)
2. **P1**: `.active` → `.is-active` 전역 통일 (components.css / _showcase.html / 03-components.md / 화면 inline)
3. **P2** (NON_BLOCKING): select-wrap 17건 적용 + CI showcase-coverage 강화 — KI 등록 후 다음 batch

## 결론

JS 동적 setAttribute가 정적 분석에서 발견 어려운 결함. CI에 JS source의 외부 sprite reference 검사 추가 권장 (codex 5항목 §17-7-1 확장).

Hotfix3 PASS 시 PR #5 ready → auto-merge → tag wf-v0.2.0.
