# WI-G2-wireframes-operator-hotfix3 Evaluator 결과

> **작성**: 2026-05-17 (evaluator subagent 통지, Phase 5 v3 5축 doc 모드)
> **agent**: a93ff921a8f24f1ce

## 종합

- **점수**: **7.375 / 10**
- **verdict**: **FAIL** (총점 임계 8.0 미달 + 정합성 축 7.0 < 7.5 임계 미달)
- **Hard gate**: 미발동 (모든 항목 통과)

## 5축 점수표

| 축 | 가중 | 점수 | 임계 | 통과 |
|---|---:|---:|---:|:--:|
| 완성도 | 25% | 7.5 | 7.5 | OK |
| 정합성 | 25% | **7.0** | 7.5 | **FAIL** |
| 구체성 | 20% | 7.5 | 7.5 | OK |
| 실행가능성 | 20% | 7.5 | 7.5 | OK |
| DS 사용 충실도 | 10% | 7.5 | 7.5 | OK |
| **가중 합계** | | **7.375** | **8.0** | **FAIL** |

## HEAL 검증

| # | 항목 | 결과 |
|---|------|:----:|
| P0-A | JS 외부 sprite 재주입 (4 화면) — `#i-eye-off`/`#i-eye` 인라인 reference | ✅ |
| P0-B | Playwright Smoke checkVisibility 가드 (PR #5 CI 9/9 PASS) | ✅ |
| P1 CSS | components.css 9건 .is-active | ✅ |
| P1 CSS | _design-tokens.css 3건 .is-active | ✅ |
| P1 doc | 03-components.md 4건 .is-active | ✅ |
| P1 inline | OP-08/09 inline 4건 .chip.is-active | ✅ |
| P1 markup | 14 화면 HTML markup is-active | ✅ |
| **결손 1** | **_showcase.html 8건 markup .active 잔존** | **FAIL** |
| **결손 2** | **_design-system/_layout-shell.html:111 SSOT 템플릿 잔존** | **FAIL** |
| **결손 3** | **component-usage-matrix.json:15 allowed_classes 잔존** | **FAIL** |
| CI | inline-svg-sprite-check broad화 | ✅ |
| KI | KI-050 / KI-051 P2 등록 | ✅ |

## FAIL 사유 — SSOT 분열 잔존 10건

### Issue 1 (P1) — `_showcase.html` 8건
- L524 `<button class="page-btn active">`
- L539 `<div class="tab active">`
- L550 `<div class="vert-tab active">`
- L560 `<div class="filter-chip active">`
- L668 `<div class="step active">`
- L844 / L860 / L875 `<a class="sidebar-item active">`

codex hotfix2 P1 신규 결함이 본 파일을 명시 지적했으나 hotfix3 변경 파일 목록에서 누락. components.css `.is-active` 변경 후 시연 페이지의 active 상태 스타일링 실종.

### Issue 2 (P1) — `_design-system/_layout-shell.html:111`
- `<a class="sidebar-item active">` SSOT 템플릿("신규 화면 작성 시 그대로 복사" 용도, README.md L45) 자체에 깨진 markup 잔존 → 차기 화면 작성 시 즉시 hotfix 재발.

### Issue 3 (P1) — `component-usage-matrix.json:15`
- `"sidebar-item active"` allowed_classes 등록. 다른 패턴(`tab is-active`, `step is-active`, `period-chip is-active`, `vert-tab is-active`)은 모두 `is-active` 표기 → 매트릭스 SSOT 표기 일관성 깨짐.

### Issue 4 (P2) — `CHANGELOG.md` L57 허위 주장
- "literal `.active` 잔존 0건" 주장이 거짓 (실제 10건). 다음 정정에서 정확한 카운트 기록 의무.

## ANTI_PATTERNS_FOUND

- **[추측성/오인 서술]** CHANGELOG L57 "잔존 0건" — 실제 검증 없이 부분 작업만 보고 완료 주장 (구체성 -0.5)
- **[SSOT 표기 일관성 부재]** components.css / _design-tokens.css / 03-components.md / 14 화면 HTML은 `.is-active`로 통일됐으나 `_showcase.html` / `_layout-shell.html` / `component-usage-matrix.json`은 `.active` 잔존 — 디자인 시스템 SSOT 디렉토리 자체에 분열 (정합성 -1.0)
- **[작업 범위 누락]** codex hotfix2 P1 명시 "components.css / _showcase.html / 03-components.md에 .active와 .is-active 혼재" 지적 중 `_showcase.html`이 hotfix3 변경 파일 목록(git diff --name-only)에 없음 — codex P1을 정면으로 받지 못함

## RECOMMENDATION

**FAIL** — 정합성 축 7.0 < 7.5 임계 미달 + 총점 7.375 < 8.0. SSOT 통일 작업이 design-system 디렉토리 3개 파일에 미반영.

**우선순위 정정 사항 (sed 4파일 + JSON 1줄 + CHANGELOG 1줄 = 10분 작업)**:
1. `_showcase.html` 8건 markup `.active` → `.is-active`
2. `_design-system/_layout-shell.html:111` 1건 markup
3. `component-usage-matrix.json:15` allowed_classes 1건 표기 통일
4. `CHANGELOG.md` L57 정정 — 실제 정정 카운트 정확히 기록

검증: `grep -rn 'class="[^"]*\bactive\b[^"]*"' .flowset/wireframes/ --exclude-dir=_archive*` → 0건

## NEXT_ACTION

본 hotfix3가 3회 hotfix 중 마지막 (review-system §10-6 "3회 연속 재평가 FAIL → 사용자 에스컬레이션"). 정정 후 재평가 PASS → `.pass` 마커 + PR #5 ready → auto-merge → tag wf-v0.2.0.

추가 FAIL 시 사용자 에스컬레이션 의무.
