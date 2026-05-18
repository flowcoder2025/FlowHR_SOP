# Phase 5 G1 그룹 (CM 8 화면) Codex Review

- **그룹**: G1 (CM)
- **모델**: gpt-5.5
- **호출 ID**: 019e3b66-8874-7a51-bd50-195173035dfa
- **일자**: 2026-05-18
- **검토 대상**: CM-01 / CM-02 / CM-03 / CM-04 / CM-05 / CM-06 / CM-20 / CM-21 (8 화면)
- **점수**: 8.1 / 10
- **판정**: CONDITIONAL
- **사용자 결정 필요**: false

## 요약 (한글)

G1 8개 CM 화면은 인라인 sprite 기반 file:// 호환, 외부 icons.svg 참조 0건, native select/file/date 금지 패턴 0건, badge 하이픈 variant SSOT는 통과로 봐도 된다. 다만 DS usage matrix v1.2.2의 showcase 앵커 일부가 실제 showcase와 불일치하고, 8개 화면 공통 도움말 icon-only 링크의 접근성 이름 누락, CM-05/06의 javascript: href, 일부 svg width/height 누락, CM-01 권한 매트릭스 표 손상이 남아 있어 PASS_BOTH보다는 기계적 hotfix 후 통과가 적절하다.

## Findings (5건 — P0 0 / P1 0 / P2 2 / P3 3)

### G1-PHASE5-CDX-001 (P2)

- **카테고리**: DS SSOT / showcase-usage consistency
- **화면**: DS
- **위치**: `.flowset/wireframes/_design-system/component-usage-matrix.json:275`
- **이슈**: G4 Auxiliary Components 패턴의 `showcase_anchor`가 `_showcase.html#section-g4-aux (TBD — 차후 demo 추가)`로 되어 있으나 실제 `.flowset/wireframes/_showcase.html`에 `section-g4-aux`가 없다. 33 patterns 선언과 showcase 실체가 1건 불일치한다.
- **수정**: 실제 `section-g4-aux` showcase 섹션을 추가하거나, 해당 패턴을 기존 존재 앵커로 재매핑하고 TBD 설명은 별도 description/changelog 필드로 분리한다.

### G1-PHASE5-CDX-002 (P2)

- **카테고리**: accessibility / cross-screen drift
- **화면**: CM-01, CM-02, CM-03, CM-04, CM-05, CM-06, CM-20, CM-21 (8 화면 전체)
- **위치**:
  - `.flowset/wireframes/html/CM-01.html:120`
  - `.flowset/wireframes/html/CM-02.html:93`
  - `.flowset/wireframes/html/CM-03.html:93`
  - `.flowset/wireframes/html/CM-04.html:98`
  - `.flowset/wireframes/html/CM-05.html:79`
  - `.flowset/wireframes/html/CM-06.html:82`
  - `.flowset/wireframes/html/CM-20.html:87`
  - `.flowset/wireframes/html/CM-21.html:106`
- **이슈**: 헤더 도움말 링크가 icon-only `<a class="icon-btn">`인데 `aria-label`이 없다. `data-tooltip`은 접근성 이름이 아니므로 스크린리더와 키보드 탐색 맥락에서 목적이 비어 보일 수 있다.
- **수정**: 8개 화면 모두 `<a class="icon-btn" href="/help" data-tooltip="도움말" aria-label="도움말">`로 통일한다.

### G1-PHASE5-CDX-003 (P3)

- **카테고리**: routing / security hygiene
- **화면**: CM-05, CM-06
- **위치**:
  - `.flowset/wireframes/html/CM-05.html:95, 111`
  - `.flowset/wireframes/html/CM-06.html:101, 117, 151, 166`
- **이슈**: `javascript:history.back()` / `javascript:location.reload()`가 `href`에 들어가 있다. CSP 적용 시 깨질 수 있고, 링크 의미와 버튼 액션 의미가 섞인다.
- **수정**: 비이동 액션은 `<button type="button" class="btn ...">`로 바꾸고 click handler에서 `history.back()` 또는 `location.reload()`를 호출한다.

### G1-PHASE5-CDX-004 (P3)

- **카테고리**: file:// asset compatibility
- **화면**: CM-02, CM-04, CM-20
- **위치**:
  - `.flowset/wireframes/html/CM-02.html:166`
  - `.flowset/wireframes/html/CM-04.html:142`
  - `.flowset/wireframes/html/CM-20.html:108`
- **이슈**: 일부 `<svg class="ico">`에 width/height attribute가 없다. CSS로 보정될 가능성은 높지만 DS 주석의 file:// fallback 계약과 일관되지 않는다.
- **수정**: 해당 inline svg에 용도별 `width`/`height`를 명시한다. 예: password policy 아이콘 14x14, spinner 16x16, install-card 헤더 아이콘 20x20.

### G1-PHASE5-CDX-005 (P3)

- **카테고리**: permission matrix / docs
- **화면**: CM-01
- **위치**: `.flowset/wireframes/analysis/CM-01.md:180`
- **이슈**: 권한 매트릭스 표 행이 2컬럼 헤더와 맞지 않게 `| ... | | — |` 형태로 손상되어 있다. KI-069 범주의 backtick/표 손상과 같은 계열이다.
- **수정**: CM 7개 보강 섹션을 같은 2컬럼 표 형식으로 정리하고, role/permission 텍스트의 backtick 손상을 함께 복구한다.

## 원본 JSON

```json
{
  "group": "G1",
  "screens": 8,
  "overall_score": 8.1,
  "verdict": "CONDITIONAL",
  "model": "gpt-5.5",
  "summary": "G1 8개 CM 화면은 인라인 sprite 기반 file:// 호환, 외부 icons.svg 참조 0건, native select/file/date 금지 패턴 0건, badge 하이픈 variant SSOT는 통과로 봐도 된다. 다만 DS usage matrix v1.2.2의 showcase 앵커 일부가 실제 showcase와 불일치하고, 8개 화면 공통 도움말 icon-only 링크의 접근성 이름 누락, CM-05/06의 javascript: href, 일부 svg width/height 누락, CM-01 권한 매트릭스 표 손상이 남아 있어 PASS_BOTH보다는 기계적 hotfix 후 통과가 적절하다.",
  "findings": [
    {
      "id": "G1-PHASE5-CDX-001",
      "severity": "P2",
      "category": "DS SSOT / showcase-usage consistency",
      "screen": "DS",
      "file:line": ".flowset/wireframes/_design-system/component-usage-matrix.json:275",
      "issue": "G4 Auxiliary Components 패턴의 showcase_anchor가 `_showcase.html#section-g4-aux (TBD — 차후 demo 추가)`로 되어 있으나 실제 `.flowset/wireframes/_showcase.html`에 `section-g4-aux`가 없다. 33 patterns 선언과 showcase 실체가 1건 불일치한다.",
      "fix": "실제 `section-g4-aux` showcase 섹션을 추가하거나, 해당 패턴을 기존 존재 앵커로 재매핑하고 TBD 설명은 별도 description/changelog 필드로 분리한다."
    },
    {
      "id": "G1-PHASE5-CDX-002",
      "severity": "P2",
      "category": "accessibility / cross-screen drift",
      "screen": "CM-01, CM-02, CM-03, CM-04, CM-05, CM-06, CM-20, CM-21",
      "file:line": ".flowset/wireframes/html/CM-01.html:120; CM-02.html:93; CM-03.html:93; CM-04.html:98; CM-05.html:79; CM-06.html:82; CM-20.html:87; CM-21.html:106",
      "issue": "헤더 도움말 링크가 icon-only `<a class=\"icon-btn\">`인데 `aria-label`이 없다. `data-tooltip`은 접근성 이름이 아니므로 스크린리더와 키보드 탐색 맥락에서 목적이 비어 보일 수 있다.",
      "fix": "8개 화면 모두 `<a class=\"icon-btn\" href=\"/help\" data-tooltip=\"도움말\" aria-label=\"도움말\">`로 통일한다."
    },
    {
      "id": "G1-PHASE5-CDX-003",
      "severity": "P3",
      "category": "routing / security hygiene",
      "screen": "CM-05, CM-06",
      "file:line": ".flowset/wireframes/html/CM-05.html:95; CM-05.html:111; CM-06.html:101; CM-06.html:117; CM-06.html:151; CM-06.html:166",
      "issue": "`javascript:history.back()` / `javascript:location.reload()`가 href에 들어가 있다. CSP 적용 시 깨질 수 있고, 링크 의미와 버튼 액션 의미가 섞인다.",
      "fix": "비이동 액션은 `<button type=\"button\" class=\"btn ...\">`로 바꾸고 click handler에서 `history.back()` 또는 `location.reload()`를 호출한다."
    },
    {
      "id": "G1-PHASE5-CDX-004",
      "severity": "P3",
      "category": "file:// asset compatibility",
      "screen": "CM-02, CM-04, CM-20",
      "file:line": ".flowset/wireframes/html/CM-02.html:166; CM-04.html:142; CM-20.html:108",
      "issue": "일부 `<svg class=\"ico\">`에 width/height attribute가 없다. CSS로 보정될 가능성은 높지만 DS 주석의 file:// fallback 계약과 일관되지 않는다.",
      "fix": "해당 inline svg에 용도별 `width`/`height`를 명시한다. 예: password policy 아이콘 14x14, spinner 16x16, install-card 헤더 아이콘 20x20."
    },
    {
      "id": "G1-PHASE5-CDX-005",
      "severity": "P3",
      "category": "permission matrix / docs",
      "screen": "CM-01",
      "file:line": ".flowset/wireframes/analysis/CM-01.md:180",
      "issue": "권한 매트릭스 표 행이 2컬럼 헤더와 맞지 않게 `| ... | | — |` 형태로 손상되어 있다. KI-069 범주의 backtick/표 손상과 같은 계열이다.",
      "fix": "CM 7개 보강 섹션을 같은 2컬럼 표 형식으로 정리하고, role/permission 텍스트의 backtick 손상을 함께 복구한다."
    }
  ],
  "user_decision_required": false
}
```
