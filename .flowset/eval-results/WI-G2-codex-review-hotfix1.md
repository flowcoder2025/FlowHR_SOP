# G2 Codex 재리뷰 (hotfix1)

## 종합 평가
- 점수: 4.0 / 10
- verdict: FAIL
- 검토 일자 / HEAD: 2026-05-16 / cdf45e5 (`feature/WI-G2-wireframes-operator`)

핫픽스는 `components.css` 등록, 모바일 media rule, 인라인 sprite 삽입, matrix/CI 파일 추가까지 일부 진전이 있으나, 직전 P1 3건의 화면 적용이 완료되지 않았다. 특히 화면별 inline CSS 재정의, 사이드바 라우팅 부재, 외부 SVG `<use href="../_design-system/icons.svg#...">` 잔존이 전 화면급으로 남아 phase gate 기준 FAIL이다.

## 직전 P1 3건 정정 검증

### KI-046 DS SSOT — 부분HEAL
- 정정 항목:
  - `components.css`에 `.select` chevron 및 `.select-wrap`가 추가됨: `.flowset/wireframes/_design-system/components.css:310`~`:328`.
  - G2 컴포넌트 등록 자체는 추가됨: modal/drawer/switch/stepper/toggle-pill/period-chip/diff/tabs/vert-tabs/master-detail이 `.flowset/wireframes/_design-system/components.css:665`~`:775`에 존재.
  - `.file-input` / `.date-input` 패턴도 `.flowset/wireframes/_design-system/components.css:812`~`:867`에 존재.
- 잔존 결함:
  - 화면 inline CSS 재정의가 제거되지 않았다. 대표 잔존:
    - `OP-03.html:32`, `:38`~`:39` (`.tabs-row`, `.modal-overlay`, `.modal-box`)
    - `OP-04.html:18` (`.stepper`)
    - `OP-05.html:22`~`:23`, `OP-06.html:23`~`:24`, `OP-07.html:30`~`:31`, `OP-09.html:36`~`:37`, `OP-12.html:39`~`:40` (`.modal-*`, `.modal-box`)
    - `OP-07.html:19`~`:22` (`.toggle-pill` + `.on/.off/.beta`; DS는 `.is-on/.is-off/.is-beta`)
    - `OP-09.html:28`~`:33` (`.drawer`, `.drawer-header`, `.drawer-body`, `.diff-before`, `.diff-after`)
    - `OP-10.html:24` (`.period-chip`)
    - `OP-11.html:18`, `:42`~`:45` (`.vert-tabs`, `.switch` + `.on`; DS는 `.is-on`/`aria-checked`)
    - `OP-12.html:16` (`.tabs-row`)
  - `components.css`에 등록은 됐지만 화면 클래스 variant가 기존 `.on/.off/.beta/.active`와 DS 신규 `.is-*`로 갈라져 cross-screen drift가 지속된다.

### KI-047 모바일 — 잔존
- 정정 항목:
  - `components.css`에 기존 auth/legal/install media rule이 있음: `.flowset/wireframes/_design-system/components.css:651`~`:657`.
  - G2 모바일 rule이 추가됨: `.flowset/wireframes/_design-system/components.css:777`~`:805` (`.modal-box`, `.drawer`, `.master-detail-shell`, `.vert-tabs`, `.stepper`, `.card-flat`, `.period-chip`).
- 잔존 결함:
  - 화면 `<style>`이 DS CSS import 뒤에 위치하고 동일 selector를 재정의하므로, 모바일에서도 DS media rule을 덮을 수 있다. 예: `OP-09.html:28`의 `.drawer { width: 480px; }`는 DS 모바일 `.drawer { width: 100%; }`보다 뒤에서 선언된다.
  - 모달/드로어/stepper/period-chip/vert-tabs/switch 등 주요 모바일 대상이 화면별 inline CSS로 계속 재정의되어 실효성 있는 모바일 HEAL로 보기 어렵다.

### KI-048 라우팅 — 잔존
- placeholder `href="#"`, `href=""`, `javascript:void`는 검색되지 않았지만, sidebar anchor의 `href` 자체가 대부분 누락되어 routing matrix가 여전히 확정되지 않았다.
- OP 화면 sidebar의 실제 href 보유 현황:
  - `OP-01.html`: sidebar 9개 모두 href 없음 (`OP-01.html:112`~`:120`).
  - `OP-02`~`OP-12`: 각 화면 sidebar 9개 중 대시보드 1개만 `href="/operator"` 보유, 나머지 8개는 href 없음. 예: `OP-12.html:128`만 href 보유, `OP-12.html:129`~`:136`은 href 없음.
- 전수 집계: OP-01~12 sidebar item 중 href 없는 anchor 97건, href 있는 sidebar item 11건.

## v3 system 5항목 체크 결과 (§17-7-1 ~ §17-7-5 각각)

### §17-7-1 file:// asset compatibility — FAIL / P1
- 20개 화면 모두 인라인 sprite는 보유한다(`display:none` 포함 파일 20/20).
- 그러나 외부 SVG `<use href="../_design-system/icons.svg#...">`가 19/20 화면에 306건 잔존한다. 대표:
  - `CM-01.html:114`, `CM-02.html:88`, `CM-21.html:101`
  - `OP-02.html:136`, `OP-03.html:133`, `OP-12.html:128`
- `_layout-shell.html`도 `:111`~`:119`, `:135`, `:144`, `:149`, `:157` 등에서 외부 `icons.svg#` 참조가 남아 있다.
- `_layout-auth.html`도 `:77`, `:85`, JS toggle 문자열 `:160`~`:161`에 외부 `icons.svg#` 참조가 남아 있다.
- 결론: "인라인 sprite 삽입"은 되었지만 `<use href="#i-...">`로 전환하지 않아 file:// compatibility 목적은 HEAL되지 않았다.

### §17-7-2 native control visual compliance — 부분HEAL / P2 잔존
- `<select>` 17건은 모두 `class="select"`를 보유한다.
- date/datetime-local 4건은 `.date-input` wrapper 안에 있다:
  - `OP-04.html:205`~`:206`
  - `OP-11.html:203`~`:204`
- `<input type="file">` 1건은 `.file-input` wrapper 없이 bare native input으로 남아 있다:
  - `OP-04.html:191` (`<input class="input" type="file">`)
- 선택 컨트롤은 `.select`는 적용됐지만 화면 사용부 대부분이 `.select-wrap` wrapper를 쓰지 않는다. CI는 `.select`만 검사하므로 wrapper 일관성까지는 보장하지 않는다.

### §17-7-3 showcase-to-usage consistency — FAIL / P1
- `component-usage-matrix.json`은 UTF-8 기준 JSON parse 가능하며 `patterns=15`, `forbidden_global=5`로 생성되어 있다.
- 하지만 matrix의 `showcase_anchor`가 가리키는 15개 anchor(`section-shell`, `section-auth-layout`, `section-list-pattern`, `section-detail-tabs`, `section-wizard`, `section-dashboard`, `section-master-detail`, `section-toggle-table`, `section-audit-pattern`, `section-vert-tabs`, `section-legal`, `section-install`, `section-file-input`, `section-date-input`, `section-select`)가 `_showcase.html`에 존재하지 않는다.
- `_showcase.html`은 `id="section-..."` 앵커 없이 기존 `.showcase-section` 구조만 보유한다(`.flowset/wireframes/_showcase.html:8`~`:24`).
- 결론: matrix 파일은 추가됐지만 showcase-to-usage 링크 검증은 실패한다.

### §17-7-4 rendered evidence requirement — 부분HEAL / P2 잔존
- `.github/workflows/pr-checks.yml`에 신규 정적/렌더링 job이 추가됨:
  - `inline-svg-sprite-check`: `:171`~`:192`
  - `native-element-wrap-check`: `:194`~`:229`
  - `showcase-coverage-check`: `:231`~`:258`
  - `playwright-smoke`: `:259`~`:364`
- 실제 PR CI 실행 결과는 본 세션에서 확인하지 않았다(요청 범위상 코드 리뷰).
- 잔존 리스크:
  - `inline-svg-sprite-check`는 "외부 SVG가 있고 인라인 sprite가 없는 경우"만 실패시킨다(`:185`~`:188`). §17-7-1의 "외부 SVG `<use href="../_design-system/icons.svg#...">` 잔존 금지"를 직접 검사하지 않아 현재 306건 잔존을 통과시킬 수 있다.
  - `design-system-ssot`의 `banned_classes`는 기존 공통 컴포넌트 중심이며, 이번 G2 대상 `.modal-box`, `.drawer`, `.switch`, `.stepper`, `.toggle-pill`, `.period-chip`, `.diff-before`, `.tabs-row`, `.vert-tabs` 등을 포함하지 않는다(`:134`~`:146`). 현재 inline 재정의를 잡지 못한다.
  - `showcase-coverage-check`는 JSON parse와 count 출력만 수행하고 실제 anchor 존재는 강제하지 않는다(`:251`~`:257`).

### §17-7-5 cross-screen pattern drift — FAIL / P1
- 동일 패턴이 DS와 화면 inline에서 병존한다.
- variant drift:
  - DS: `.toggle-pill.is-on/.is-off/.is-beta` (`components.css:731`~`:733`), 화면: `.toggle-pill.on/.off/.beta` (`OP-07.html:20`~`:22`)
  - DS: `.switch.is-on` 또는 `[aria-checked="true"]` (`components.css:701`, `:706`), 화면: `.switch.on` (`OP-11.html:43`, `:45`)
  - DS: `.tab.is-active` (`components.css:751`), 기존 화면 일부는 `.tab.active` 또는 독자 `.tabs-row` 정의를 병행한다.
- modal/drawer/period-chip/diff/tabs/vert-tabs/stepper가 화면별로 계속 local CSS를 유지하므로 cross-screen consistency가 보장되지 않는다.

## 신규 결함 (P0/P1/P2/P3 카테고리별)

### P0
- 없음.

### P1
- 외부 SVG `<use href="../_design-system/icons.svg#...">` 19/20 화면 306건 잔존. 인라인 sprite 보유만으로는 §17-7-1을 만족하지 못함.
- `component-usage-matrix.json`의 `showcase_anchor` 15개가 `_showcase.html`에 존재하지 않아 §17-7-3 consistency 실패.
- 직전 KI-046 DS SSOT 잔존: G2 컴포넌트가 DS에 등록됐지만 화면 inline 재정의가 유지됨.
- 직전 KI-047 모바일 잔존: DS media rule은 추가됐지만 화면 inline selector가 뒤에서 덮어 모바일 패턴 실효성이 낮음.
- 직전 KI-048 라우팅 잔존: OP sidebar href 누락 97건.

### P2
- `OP-04.html:191` bare `<input type="file">`가 `.file-input` wrapper 없이 남아 native control compliance 미충족.
- CI job의 coverage가 현 결함을 막지 못함:
  - 외부 SVG 금지 대신 inline sprite 존재만 확인.
  - G2 inline component 재정의 selector 미포함.
  - matrix anchor 존재 미검증.

### P3
- `component-usage-matrix.json`은 요청의 "신규 14 패턴"보다 15개 패턴을 포함한다. 자체 문제는 아니지만 리뷰/CI 기준 문구와 파일 구조가 불일치한다.
- 파일 일부 출력에서 한글이 깨져 보일 수 있으나 UTF-8로 직접 읽으면 JSON/워크플로 본문은 정상 문자를 포함한다. 다만 저장/검증 도구는 UTF-8 명시가 필요하다.

## 통합 판정 권고 (머지/hotfix/사용자 결정)

- 권고: hotfix 재수행 후 재리뷰. 현재 상태로 머지 비권고.
- 최소 hotfix 범위:
  - 화면 `<use href="../_design-system/icons.svg#...">`를 모두 `<use href="#...">`로 전환하고 `_layout-shell.html` / `_layout-auth.html`도 동일하게 수정.
  - OP sidebar 9개 항목 전체에 실제 route href 부여(`OP-01` 포함).
  - OP-03/04/05/06/07/09/10/11/12 inline component CSS 제거 또는 DS selector/variant로 전환.
  - `OP-04.html:191` file input을 `.file-input` wrapper 패턴으로 전환.
  - `_showcase.html`에 matrix anchor 15개를 실제 `id`로 부여하거나 matrix anchor를 실제 showcase 구조에 맞게 수정.
  - CI 정적 검사에 외부 SVG 금지, G2 inline selector 금지, matrix anchor 존재 검사를 추가.

## 결론 (3~5문장)

hotfix1은 DS 파일과 CI 골격을 추가하는 데는 성공했지만, 실제 20개 화면의 사용부 전환이 완료되지 않았다. 직전 P1 3건은 KI-046 부분HEAL, KI-047 잔존, KI-048 잔존으로 판정한다. 신규 v3 기준에서도 외부 SVG 참조, showcase anchor 불일치, cross-screen drift가 P1로 확인된다. P1이 3건 이상이므로 review-system v3 기준 verdict는 FAIL이다.
