# G3 와이어프레임 hotfix1 (commit 91c0a00) Codex 재리뷰 결과

## 1. Codex 호출 메타

- 시각: 2026-05-18 KST
- 모델: GPT-5 Codex (`mcp__codex__codex`, ChatGPT account, default model — `gpt-5-codex` 옵션은 ChatGPT account에서 미지원으로 fallback)
- 모드: full review (hotfix1 — P1 정정 + TA-03/13 pane 추가 사후 검증)
- sandbox: read-only
- approval-policy: never
- thread_id: `019e3988-838a-77c3-9ea8-b253eb5fdf42` (이전 thread `019e3621-fa68-74e3-b84f-8928d67c823e` 권한 거부로 새 thread 시작 — 이전 codex.md 파일을 read하여 컨텍스트 회복)
- 검토 파일: TA-01~TA-14 HTML 14 + analysis 14 + `component-usage-matrix.json` + `components.css` + `VERSION` + `CHANGELOG.md`
- 브랜치/커밋: `feature/WI-G3-wireframes-tenant` @ `91c0a00`
- 호출자: Claude Opus 4.7 (FlowSet 라이트, codex 호출 위탁)
- 비고: 사용자 임무의 검증 경로 `.flowset/wireframes/G3/`는 존재하지 않음. 실제 경로는 `.flowset/wireframes/html/`, `.flowset/wireframes/analysis/`로 codex가 자동 정정 후 검증.

## 2. 5항목 체크리스트 결과

| 항목 | 결과 | 증거 |
|---|---:|---|
| 1. file:// asset compatibility | PASS | TA-01~TA-14 모두 inline sprite 보유 (예 `TA-01.html:50`, `TA-14.html:43`). 외부 sprite `<use href="../...">` 0건. |
| 2. native control visual compliance | PASS | `select-wrap`, `file-input`, `date-input` wrap 유지 (예 `TA-02.html:149`, `TA-13.html:232`). |
| 3. showcase-to-usage consistency | FAIL | matrix `prd_pattern` 24개 등록은 됐으나 최상위 `version` 필드가 여전히 `1.0.0`. Date Input applicable_screens 정정 미완 (사용자 임무 vs commit message 불일치 — §6 참조). |
| 4. rendered evidence requirement | FAIL | inline `<style>`에서 G3 컴포넌트 selector 잔존: `.kpi-row` (TA-01:17, TA-05:16, TA-07:17), `.calendar-grid` (TA-07:19), `.vert-tab` 상태 styling (TA-13:32-34). |
| 5. cross-screen pattern drift | PASS | TA-* 14 화면 `href="#"` 0건 (grep 직접 확인). sidebar 8 메뉴 일관, footer 링크 `/legal/terms`, `/help`, `/support` 등 base path 치환. |

## 3. P1 정정 확인 결과

| P1 | 결과 | 판정 근거 |
|---|---:|---|
| P1-1 G3-CDX-001 `href="#"` 48 → 0 | **PASS** | TA-* 14 화면 grep 결과 `href="#"` 0건. footer 28건 sed로 `/legal/...`, `/help`, `/support` 치환 확인. 화면별 행 링크는 `/admin/employees/E001` 등 fake base path 일관 적용. `TA-02.html:143`의 `javascript:void(0)` reset anchor는 button 치환이 더 적절하나 P1-1 조건 위반은 아님. |
| P1-2 G3-CDX-002 matrix v1.1.0 / 24 patterns | **FAIL** | `prd_pattern` 24개 + 신규 9 패턴 등록은 확인 (line 130~199). 그러나 [component-usage-matrix.json:3](`.flowset/wireframes/_design-system/component-usage-matrix.json`)의 최상위 `"version": "1.0.0"` 그대로. `1.1.0`은 changelog 항목 내부(line 251)에만 존재. Date Input applicable_screens는 `TA-02/TA-05/TA-07/TA-13` 등 모두 포함 (line 117) — commit message는 "TA-02+TA-13 추가, TA-05/TA-07 유지"라 명시되어 사용자 임무문(`TA-05/TA-07 제거 확인`)과 의도가 다름. SSOT 일관성 측면에서 어느 쪽이든 명시 결정 필요. |
| P1-3 G3-CDX-003 inline component definition 0건 | **FAIL** | components.css에 G3 신규 9 클래스 SSOT 이동은 확인. 그러나 inline `<style>` 잔존: `TA-01.html:17` `.kpi-row { grid-template-columns: repeat(6, 1fr); ... }`, `TA-05.html:16` `.kpi-row { repeat(4, 1fr) }`, `TA-07.html:17,19` `.kpi-row { repeat(5,1fr) }` + `.calendar-grid { grid-template-columns: 160px repeat(31, ...) }`, `TA-13.html:32-34` `.vert-tab[data-tab=...] { background: var(--color-accent-bg); ... }`. 이는 단순 page-grid layout 한정이 아닌 component 시각 재정의로 §17 정책 위반. |

## 4. P2 사용자 결정 검증

| 화면 | 9 pane 본문 | 권한 토글 | 판정 |
|---|---:|---:|---|
| TA-03 직원 상세 | PASS | **FAIL/PARTIAL** | 9 pane 본문 markup 모두 존재 (기본/인사/계약/근태/휴가/급여/문서/결재이력/변경이력) — 단순 stub 아님. scope-mgr 클래스는 3 pane만 부착: `TA-03.html:203` (기본), `:248` (근태), `:271` (휴가). 주석 `:199`는 "5 pane (manager — 기본/근태/휴가 + scope-mgr)" 라고 적었으나 실제 클래스 부착은 3개. 사용자 임무 "manager 5탭만"과 불일치. |
| TA-13 회사 설정 | PASS | **FAIL/PARTIAL** | 9 pane 본문 markup 모두 존재 (회사정보~감사로그). scope-hr 클래스는 5 pane만 부착: `TA-13.html:168` (회사), `:195` (근무), `:246` (휴가), `:330` (알림), `:354` (문서양식). 주석 `:163`은 "6 pane (hr_admin scope-hr)" 라고 적었으나 실제 5개. 사용자 임무 "hr_admin 6 pane"과 불일치. |

## 5. PRD 매핑 정합

- TA-03/TA-13 본문 coverage는 크게 개선되어 PRD §3-2의 "9 pane 존재" 기준 충족.
- 신규 G3 pattern class 사용처는 matrix와 대체로 정합: Profile Card (TA-03), Org Tree (TA-04), Side Drawer (TA-06), Calendar (TA-07), Approval Timeline (TA-08), Approval Master-Detail (TA-09), Report Canvas (TA-12), Settings Pane (TA-13), Integration Grid (TA-14).
- matrix 최상위 version 불일치 + Date Input 의도 불일치로 SSOT 판정은 실패.
- analysis 14개 문서는 일부 갱신됐지만 TA-03/TA-13의 새 9 pane stack과 실제 scope 클래스 부착 수까지 정확히 반영 미흡.

## 6. 발견 결함 (hotfix1)

| ID | 등급 | 화면 | 설명 | 위치 |
|----|------|------|------|-----|
| G3-CDX-002-HF1 | **P1** | SSOT | matrix.json 최상위 `version`이 `1.0.0` 유지. CHANGELOG 항목만 1.1.0 반영. SSOT 버전 표기가 changelog와 충돌. Date Input applicable_screens는 commit message가 "TA-05/TA-07 유지"라 했으나 사용자 임무문은 "제거 확인" — 실제 의도 결정 필요. | `component-usage-matrix.json:3`, `:117` |
| G3-CDX-003-HF1 | **P1** | TA-01/05/07/13 | inline `<style>`에서 G3 component selector 잔존. `.kpi-row` grid 재정의 3개 화면 + `.calendar-grid` + `.vert-tab` 상태 styling. components.css SSOT 이동만으로 충분치 않고 inline 0건 조건 미충족. | `TA-01.html:17`, `TA-05.html:16`, `TA-07.html:17,19`, `TA-13.html:32-34` |
| G3-CDX-009 | **P2** | TA-03 | manager scope가 임무/주석상 5 pane이어야 하나 실제 `scope-mgr` 부착은 3 pane. | `TA-03.html:203,248,271`, 주석 `:199` |
| G3-CDX-010 | **P2** | TA-13 | hr_admin scope가 임무/주석상 6 pane이어야 하나 실제 `scope-hr` 부착은 5 pane. | `TA-13.html:168,195,246,330,354`, 주석 `:163` |
| G3-CDX-006 | P2 NON_BLOCKING | 공통 | icon-only button `aria-label` 누락 다수 잔존 — KI-057로 이월 (사용자 결정). | 다수 화면 |
| KI-054 | P3 NON_BLOCKING | _showcase | `_showcase.html`에 G3 신규 9 section anchors 미추가. | `_showcase.html` |
| KI-055 | P3 NON_BLOCKING | TA-* | 일부 fake base path는 Phase 7 실제 ID 매핑 필요. | TA-* |

## 7. 종합 점수 + verdict

- 종합 점수: **7.0 / 10** (이전 6.1 → +0.9)
- VERDICT: **FAIL**
- 사유:
  - hotfix1로 `href="#"` (TA-* 0건) + TA-03/13 본문 9 pane coverage는 정상 개선.
  - P1 2건 직접 재현 — matrix top-level version과 inline style 0건 조건은 본 hotfix의 핵심 정정 범위였으므로 머지 권고 불가.
  - 추가 P2 2건 (TA-03/13 scope 클래스 부착 수가 주석/임무와 불일치) 발견.
  - P0 0건.

## 8. 권고

- **현재 상태로 머지 비권고** (BLOCKED_FOR_HOTFIX 재발동).
- **hotfix2 최소 범위** (P1 잔존 직접 정정):
  1. `component-usage-matrix.json:3` 최상위 `"version": "1.0.0"` → `"version": "1.1.0"` 정정.
  2. Date Input applicable_screens 의도 명시 결정 (사용자) — commit message 따를지 임무문 따를지. 결정 후 line 117 정합.
  3. TA-01:17, TA-05:16, TA-07:17,19, TA-13:32-34의 inline `<style>` 내 G3 component selector를 components.css 또는 page-local rename (예 `.page-ta01-kpi`) 으로 이전.
- **사용자 결정 필요** (P2 — review-system.md §10-3):
  - TA-03 scope-mgr 클래스 부착을 5 pane으로 확대할지 (인사/문서 등 추가) 또는 주석/임무 "5 pane"을 "3 pane"으로 정정할지.
  - TA-13 scope-hr 클래스 부착을 6 pane으로 확대할지 또는 주석/임무 "6 pane"을 "5 pane"으로 정정할지.
- **NON_BLOCKING**: G3-CDX-006, KI-054, KI-055는 별도 KI로 유지, 머지 차단 사유 아님.

## 9. review-system.md §4 통합 판정 입력값

- codex verdict: **FAIL**
- codex 점수: **7.0 / 10**
- codex P0: 0
- codex P1: 2 (G3-CDX-002-HF1, G3-CDX-003-HF1)
- codex P2 blocking: 2 (G3-CDX-009, G3-CDX-010)
- codex P2 non-blocking: 1 (G3-CDX-006)
- codex P3 non-blocking: 2 (KI-054, KI-055)

evaluator hotfix1이 PASS여도 codex FAIL → 통합 판정 **BLOCKED_FOR_HOTFIX** (review-system.md §4 매트릭스).
evaluator도 FAIL이면 통합 판정 **FAIL** (정정 후 재호출, 최대 3회 시도 중 2회차).

---

## 부록. Claude 검증 cross-check (codex 결과 직접 재확인)

| 항목 | Codex 주장 | Claude 직접 확인 | 일치 |
|---|---|---|---|
| TA-* `href="#"` | 0건 | `grep -rn 'href="#"' html/TA-*.html \| wc -l` → 0 | ✓ |
| matrix top-level version | "1.0.0" | line 3: `"version": "1.0.0",` | ✓ |
| Date Input line 117 | TA-05/07 잔존 | line 117 `[..., "TA-05", "TA-07", ...]` 확인 | ✓ |
| TA-01.html `.kpi-row` | line 17 정의 | line 17 `.kpi-row { display: grid; grid-template-columns: repeat(6, 1fr); ... }` | ✓ |
| TA-07.html `.calendar-grid` | line 19 정의 | line 19 `.calendar-grid { grid-template-columns: 160px repeat(31, ...) }` | ✓ |
| TA-13.html `.vert-tab` 상태 | line 32-34 | `body[data-state="..."]  .vert-tab[data-tab="..."]` styling 3줄 | ✓ |
| TA-03 scope-mgr 부착 | 3 pane (203/248/271) | 동일 — 주석 199 "5 pane"과 불일치 | ✓ |
| TA-13 scope-hr 부착 | 5 pane (168/195/246/330/354) | 동일 — 주석 163 "6 pane"과 불일치 | ✓ |

codex 판정 신뢰도: 8/8 사실 일치. 본 결과 그대로 통합 판정 입력값으로 사용 가능.
