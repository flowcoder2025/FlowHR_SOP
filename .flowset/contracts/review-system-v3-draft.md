# Review System v3 Draft — Codex 협의 결과

- **작성일**: 2026-05-16
- **작성자**: Claude (Codex gpt-5-codex 응답 통합)
- **트리거**: G2 evaluator PASS 8.11 + Codex WARNING 6.8 둘 다 **file:// 아이콘 미표시 / native `<select>` `<input type=file>` 시각 불일치 / showcase-실사용 분리** 누락
- **목적**: v2 결함 진단 + v3 강화 안 합의 → 사용자 최종 승인 입력
- **상태**: DRAFT (사용자 확정 대기)

## 0. 진단 요약 (Claude 수집)

- `.flowset/wireframes/_design-system/components.css` L302~311 `.input, .select, .textarea` 공통 정의 — `appearance: none` / chevron 보정 없음
- `.flowset/wireframes/html/OP-01.html` 인라인 svg sprite 1회만 보유 (file:// 호환), 나머지 19 화면(CM-01~06, CM-20/21, OP-02~12)은 외부 `../_design-system/icons.svg#...` 참조만 → Chrome/Safari file:// 차단
- `<select>` + `<input type=file|date|datetime>` 22건 / 6 화면 사용, `.file-input` wrapper 컴포넌트 자체가 components.css에 부재
- `_showcase.html` 카탈로그만 존재, "PRD → showcase 컴포넌트" 매핑 룰 없음

근본 원인:
1. 시각 검수 자동화 부재 (모든 검증이 정적 텍스트 기반)
2. 디자인 시스템 미완 (file input / select 보정 / 인라인 sprite 미포함)
3. showcase 사용 의무 룰 없음

---

## Codex (gpt-5-codex) 본문

전제: 이번 답변은 제공된 Claude 진단과 Codex가 확인한 로컬 파일 근거에만 기반합니다. 브라우저 렌더링 검수는 실행하지 않았고, `file://` 차단 사실은 사용자/Claude의 직접 검수 결과를 전제로 합니다.

### 1. 항목별 의견

| 항목 | 의견 | Reasoning |
|---|---|---|
| `.select` `appearance: none` + 커스텀 chevron | 동의, 단 CI 금지 룰과 같이 적용 | 현재 [components.css](C:/dev/FlowHR_SOP/.flowset/wireframes/_design-system/components.css:302)의 `.select`는 `.input`과 공통 스타일만 있고 `appearance`/chevron 보정이 없어 native UI가 노출됩니다. |
| `.file-input` wrapper 신설 | 동의 | 현재 `.file-input` CSS가 없고 `OP-04.html`에 `<input class="input" type="file">` 직접 사용이 확인됩니다. |
| `.date-input` 보정 또는 date picker | 수정 동의 | Phase 5 와이어프레임에서는 실제 date picker까지 만들기보다 `.date-input` wrapper/아이콘/폭/상태 보정을 먼저 표준화하고, Phase 7 React에서 실제 picker로 매핑하는 편이 현재 산출물 범위와 맞습니다. |
| 인라인 sprite 통합 | 동의, "외부 sprite 금지"에 가깝게 강화 | `OP-01.html`만 인라인 `<svg xmlns... style="display:none">`가 있고, 나머지 19개 화면은 `../_design-system/icons.svg#...`를 참조하는 것이 확인됩니다. |
| `_layout-shell.html`, `_layout-auth.html`에 sprite 포함 | 동의 | 반복 화면에서 shell이 source 역할을 하므로 화면별 수동 누락 가능성을 줄입니다. |
| showcase 사용 매트릭스 | 동의, 필수화 필요 | `_showcase.html`은 존재하지만 "PRD 패턴 → 사용할 DS 컴포넌트" 계약이 별도 검증 단위로 연결되어 있지 않습니다. |
| `inline-svg-sprite-check` CI | 동의, 룰 수정 | `외부 svg 참조 시 인라인 sprite 보유`보다 `file:// 검수 대상 HTML에서는 외부 sprite 참조 금지 또는 자동 인라인화`가 더 직접적인 실패 조건입니다. |
| `native-element-wrap-check` CI | 동의, 세분화 필요 | `<select>` 자체를 전면 금지하면 접근성이 나빠질 수 있으므로 "bare/native appearance 금지, DS wrapper/class/chevron 보정 필수"로 정의해야 합니다. |
| `showcase-coverage-check` CI | 동의 | DS 클래스가 실제 화면에서 쓰이면 `_showcase.html` 또는 매핑 파일에 시연/계약이 있어야 showcase-실사용 분리를 막을 수 있습니다. |
| evaluator 5번째 축 10% | 동의, 단 기존 축 가중치 재조정 필요 | 이번 누락은 PRD 정합성보다 렌더링·DS 충실도 결함이므로 별도 축 없이는 PASS가 반복될 수 있습니다. |
| codex 프롬프트에 native/file:// 명시 | 동의 | v2 codex가 정적 구현 리스크를 봤지만 `file:// external <use>`와 native control을 의무 체크하지 않아 결함을 놓쳤습니다. |
| Playwright screenshot 자동화 | 수정 동의 | 지금 즉시 "smoke 수준"은 도입하고, pixelmatch regression은 Phase 7 또는 별도 작업으로 미루는 것이 비용 대비 효과가 맞습니다. |

### 2. 누락된 관점

1. **file:// 전용 산출물 계약**
   - Reasoning: 현재 검수 환경이 실제 `file://`라면 HTTP 서버 기준으로 통과하는 외부 asset 참조는 계약 위반입니다.
   - 제안: `file-compatible-html` 게이트를 추가하고 외부 sprite, 외부 font, 절대 `/route` 링크, fetch 의존을 별도 검사합니다.

2. **rendered DOM 기반 검사**
   - Reasoning: 정적 HTML 검색만으로는 아이콘이 실제 paint 됐는지, select chevron이 겹치는지 확인할 수 없습니다.
   - 제안: Playwright에서 각 화면을 `file://`로 열고 `svg use` bounding box, computed style, console error를 수집합니다.

3. **bare native control 정의**
   - Reasoning: `<select>` 자체를 금지하면 의미론과 접근성을 잃을 수 있으므로 실패 조건은 "브라우저 기본 외관이 노출되는 사용"이어야 합니다.
   - 제안: 허용 패턴을 `.select-wrap > select.select` 또는 `.file-input > input[type=file].sr-only + label/button + filename`처럼 구조로 명시합니다.

4. **showcase 매핑 자동화 단위**
   - Reasoning: `_showcase.html` 존재만으로는 실제 화면이 showcase 컴포넌트를 썼는지 보장하지 않습니다.
   - 제안: `component-usage-matrix.json`을 두고 `prd_pattern`, `component`, `showcase_anchor`, `allowed_classes`, `react_mapping`을 연결합니다.

5. **브라우저별 검수 최소 세트**
   - Reasoning: 이번 결함은 Chrome/Safari `file://` 동작 차원에서 발견됐으므로 단일 정적 검사로 충분하지 않습니다.
   - 제안: 최소 Chrome headless, 가능하면 Safari/WebKit smoke를 추가합니다.

### 3. 19 화면 일괄 patch vs 점진 적용

권장: **G1+G2 19 화면은 일괄 patch**가 맞습니다.

Reasoning: 결함 원인이 화면별 내용 문제가 아니라 공통 생성 패턴, 즉 외부 sprite 참조와 native control 사용이므로 점진 적용하면 같은 유형의 결함이 남은 화면에서 계속 재발합니다.

적용 순서는 다음이 적절합니다.

1. DS 보강: `select`, `file-input`, `date-input`, shell sprite.
2. 19개 HTML 자동/반자동 치환: 외부 `icons.svg#` → 인라인 `#id`, bare file/date/select → DS 패턴.
3. `_showcase.html`와 매핑 문서 갱신.
4. CI 정적 검사 추가.
5. file:// smoke screenshot으로 재검수.

### 4. Playwright 도입 시점

권장: **지금 smoke 도입, Phase 7에 pixelmatch 회귀 도입**.

Reasoning: 이번 누락은 실제 브라우저 렌더링에서만 드러난 결함이므로 smoke를 Phase 7까지 미루면 v3도 같은 유형을 정적으로만 평가하게 됩니다.

지금 필요한 최소 범위:

- 모든 HTML을 `file://`로 open.
- console/pageerror 수집.
- `svg.ico use`가 있는 요소의 bounding box와 computed `display/visibility` 확인.
- `<select>`, `input[type=file|date|datetime-local]`의 wrapper/class/computed style 검사.
- 화면별 screenshot artifact 저장.

Phase 7로 미룰 범위:

- pixelmatch baseline 관리.
- 다중 브라우저 full regression.
- React 컴포넌트 단위 visual diff.

### 5. Codex reviewer 프롬프트 강화안

다음 항목을 Codex 리뷰의 의무 체크리스트로 넣어야 합니다.

1. **file:// asset compatibility**
   - `href="../_design-system/icons.svg#..."`, 외부 font/image/script 등 `file://`에서 차단될 수 있는 참조를 검색한다.
   - 외부 sprite를 발견하면 인라인 sprite 또는 빌드 인라인화 근거가 없는 한 P1로 분류한다.

2. **native control visual compliance**
   - `<select>`, `input[type=file]`, `input[type=date]`, `input[type=datetime-local]`를 전수 검색한다.
   - DS wrapper, custom affordance, focus/disabled/error 상태가 없으면 P1 또는 P2로 분류한다.

3. **showcase-to-usage consistency**
   - 화면에서 새 DS class/pattern이 등장하면 `_showcase.html`, `03-components.md`, `components.css`, React mapping에 모두 있는지 확인한다.
   - showcase에만 있고 실제 화면이 다른 native/direct pattern을 쓰면 결함으로 기록한다.

4. **rendered evidence requirement**
   - 아이콘, form control, modal, dropdown, sidebar, mobile nav는 정적 텍스트 검토만으로 PASS하지 않는다.
   - 최소한 file:// screenshot 또는 Playwright smoke 결과가 없으면 "검증 미완"으로 표시한다.

5. **cross-screen pattern drift**
   - 동일 패턴이 화면별 inline CSS로 재정의되는지 확인한다.
   - DS SSOT 위반과 visual drift는 별도 결함이 아니라 같은 원인의 중복 발생으로 묶어 severity를 올린다.

### 6. Evaluator 5번째 축 정의안

#### 디자인 시스템 사용 충실도, 10%

평가 목적: 화면 HTML이 디자인 시스템을 단순 참조하는 수준을 넘어, 실제 렌더링 결과와 컴포넌트 계약까지 일관되게 따르는지 평가한다.

| 점수 | 기준 |
|---:|---|
| 10 | 모든 화면이 DS token/component/shell을 사용하고, 외부 sprite 없이 `file://`에서 아이콘이 렌더링되며, native control은 DS 패턴으로 감싸지고, showcase·spec·React mapping이 일치한다. |
| 8 | 주요 화면은 일관되며 경미한 showcase 누락이나 보조 상태 누락만 있다. 실제 `file://` 렌더링을 깨는 결함은 없다. |
| 6 | DS 클래스는 대체로 쓰지만 일부 화면에 bare native control, inline 재정의, showcase 불일치가 있다. 사용자는 시각 불일치를 일부 체감할 수 있다. |
| 4 | 공통 컴포넌트가 화면별로 분기되어 있고 native/browser 기본 UI가 반복 노출된다. DS SSOT가 구현 전환 기준으로 신뢰하기 어렵다. |
| 2 | showcase와 실제 화면이 구조적으로 분리되어 있고, 아이콘/입력/상태 컴포넌트가 다수 깨진다. |
| 0 | DS 사용 근거가 없거나 `file://` 검수에서 주요 UI가 렌더링되지 않는다. |

Hard gate 제안:

- `file://`에서 아이콘 미표시가 2개 이상 화면에 재현되면 이 축 최대 4점, 전체 verdict는 최소 WARNING.
- 외부 sprite 참조가 검수 대상 화면에 남아 있으면 P1.
- bare `input[type=file]`는 P1, bare `select/date/datetime-local` 반복 사용은 P2 이상.
- 새 컴포넌트가 `components.css`, `_showcase.html`, `03-components.md` 중 하나라도 빠지면 DS SSOT 결함으로 기록.

---

## 사용자 결정 입력란

- [ ] DS 보강 5건 (select / file-input / date-input / 인라인 sprite / showcase 매트릭스) 승인
- [ ] CI 3룰 (inline-svg-sprite / native-element-wrap / showcase-coverage) 승인
- [ ] evaluator rubric 5번째 축 + 가중치 재조정 승인
- [ ] codex 프롬프트 강화 5항목 승인
- [ ] G1+G2 19 화면 일괄 patch 승인
- [ ] Playwright smoke 즉시 도입 + pixelmatch Phase 7 유보 승인
