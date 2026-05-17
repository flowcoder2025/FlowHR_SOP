# WI-G2-wireframes-operator-hotfix3-rev1 Evaluator 결과

> **작성**: 2026-05-17 (evaluator subagent, Phase 5 v3 5축 doc 모드)
> **모드**: doc (Phase 5 와이어프레임)
> **컨텍스트**: 직전 evaluator hotfix3 FAIL 7.375 (정합성 7.0 < 7.5) 후 사용자 결정 4회째 평가
> **커밋 평가**: `8260b32 WI-KI-batch-006-fix4 G2 hotfix3-rev1 — SSOT drift 11 hotspot 정정`

## 종합

- **점수**: **8.90 / 10**
- **verdict**: **PASS** (총점 ≥ 8.0 AND 각 축 ≥ 7.5 AND Hard gate 미발동)
- **Hard gate**: 미발동
  - file:// 외부 sprite 화면 HTML 0건 (`grep -l "../_design-system/icons.svg#" .flowset/wireframes/html/*.html` → 0)
  - bare native control 0건 (6 화면 `<select>`가 모두 `.select` 클래스 보유)

## 5축 점수표 (Phase 5 v3)

| 축 | 가중 | 점수 | 임계 | 통과 | 근거 |
|---|---:|---:|---:|:--:|---|
| 완성도 | 25% | **9.0** | 7.5 | OK | rev1이 직전 4 FAIL 항목 + codex CM-21 JS 1건 모두 정정 (commit 8260b32 5파일 + CHANGELOG) |
| 정합성 | 25% | **9.0** | 7.5 | OK | SSOT `.active → .is-active` 통일 — components.css / _design-tokens.css / 03-components.md / 14 화면 HTML / _showcase.html / _layout-shell.html / matrix.json / CM-21 런타임 JS 모두 일관 |
| 구체성 | 20% | **9.0** | 7.5 | OK | CHANGELOG L57 "잔존 0건" 허위 주장 제거 + 정확한 카운트 명시 (총 32 + 10 = 42건). TBD/추후/검토 표현 0건 |
| 실행가능성 | 20% | **8.5** | 7.5 | OK | PR #5 auto-merge 진입 가능. (-0.5: `_layout-shell.html` SSOT 외부 sprite 20건은 신규 화면 작성 리스크 — 별도 P3 권고) |
| DS 사용 충실도 | 10% | **9.0** | 7.5 | OK | file:// 호환 (화면 HTML 외부 sprite 0건) + native wrap 100% + showcase/matrix 일관성. Hard gate 미발동 |
| **가중 합계** | | **8.90** | **8.0** | **PASS** | (9.0×0.25)+(9.0×0.25)+(9.0×0.20)+(8.5×0.20)+(9.0×0.10) |

## HEAL 검증 — 직전 evaluator hotfix3 FAIL 사유 4건

| # | 항목 | 검증 결과 |
|---|------|:----:|
| Issue 1 (P1) | `_showcase.html` 8건 markup `.active` → `.is-active` (L524 page-btn / L539 tab / L550 vert-tab / L560 filter-chip / L668 step / L844·L860·L875 sidebar-item) | HEAL |
| Issue 2 (P1) | `_design-system/_layout-shell.html:111` SSOT 템플릿 markup `.active` → `.is-active` | HEAL |
| Issue 3 (P1) | `component-usage-matrix.json:15` allowed_classes `"sidebar-item active"` → `"sidebar-item is-active"` | HEAL |
| Issue 4 (P2) | `CHANGELOG.md` L57 "잔존 0건" 허위 주장 제거 + 정확한 카운트 명시 | HEAL |

### 추가 정정 — codex hotfix3 P1 신규 결함 1건

| # | 항목 | 검증 결과 |
|---|------|:----:|
| codex 추가 | `CM-21.html:252-253` 런타임 JS `classList.add/remove('active')` → `'is-active'` (초기 markup `is-active`와 분기 정합) | HEAL |

### 검증 명령 실행 결과

```bash
# 검증 1: 화면 markup .active 잔존 (archive 제외)
grep -rnE 'class="[^"]*\bactive\b[^"]*"' .flowset/wireframes/ --exclude-dir='_archive*'
# 결과: 32 hits, 모두 `is-active` 형식 — 단독 `active` 0건

# 검증 2: 단독 active 클래스
grep -rnE 'class="[^"]*(^|\s)active(\s|")' .flowset/wireframes/ --exclude-dir='_archive-pre-design-system'
# 결과: 0건

# 검증 3: matrix.json
grep -n '"sidebar-item active"' .flowset/wireframes/_design-system/component-usage-matrix.json
# 결과: 0건

# 검증 4: 런타임 JS
grep -rnE "classList\.(add|remove|toggle)\([\"']active[\"']" .flowset/wireframes/ --exclude-dir='_archive*'
# 결과: 0건
```

## ANTI_PATTERNS_FOUND

- 없음 (직전 evaluator의 3 안티패턴 모두 해소: SSOT 표기 일관성 / 작업 범위 누락 / 허위 주장)

## NON_BLOCKING_OBSERVATIONS — 신규 결함 권고 (KI 등록 권고)

본 hotfix3-rev1 본 평가의 PASS/FAIL과 분리 (사용자 컨텍스트 §의무 절차 4).

### [P3] `_design-system/_layout-shell.html` 외부 sprite 참조 20건 잔존

- **위치**: `.flowset/wireframes/_design-system/_layout-shell.html` L111~L139 (20건 `href="../_design-system/icons.svg#i-..."`)
- **사유**: SSOT 템플릿 ("신규 화면 작성 시 그대로 복사" 용도, README.md §). 차기 화면 작성 시 외부 sprite 참조 패턴 재발 위험.
- **CI 사각**: `inline-svg-sprite-check`가 `.flowset/wireframes/html/*.html`만 검사 → `_design-system/` 디렉토리 검출 못 함.
- **권장 조치**: (1) `_layout-shell.html`을 인라인 sprite + `href="#i-..."` 패턴으로 재작성, (2) CI 검사 범위에 `_design-system/_layout-shell.html` 추가
- **KI 등록 권고**: P3 (Low — 차단 아님, 다음 그룹 hotfix 또는 G3 작업 전 처리)

## RECOMMENDATION

**PASS** — verdict 통과, auto-merge 진입 가능.

### NEXT_ACTION

1. **`.pass` 마커 생성**: `.flowset/eval-results/WI-G2-wireframes-operator-hotfix3-rev1.pass` (Claude 본체)
2. **codex 재호출 불필요**: hotfix3 codex WARNING 4 hotspot 모두 rev1에서 정정 완료 (자체 grep 검증 통과 확인)
3. **PR #5 ready → auto-merge**: branch protection CI 9 job PASS 후 자동 머지 + 로컬+원격 브랜치 삭제 + main 자동 전환
4. **tag wf-v0.2.0**: 머지 직후 (project.md §6-2 표준 시퀀스)
5. **신규 P3 KI 등록**: `_layout-shell.html` 외부 sprite 20건 → `.flowset/known-issues/INDEX.md` P3 추가 (G3 진입 전 또는 차기 hotfix batch에서 처리)

## 메타

- 임계 충족 검증: 가중 합 8.90 ≥ 8.0 ✅, 각 축 (9.0 / 9.0 / 9.0 / 8.5 / 9.0) ≥ 7.5 모두 ✅, Hard gate 미발동 ✅
- 9.0+ 증거: 정합성 / 완성도 / 구체성 / DS 충실도 4개 축에 grep 결과 + 커밋 file diff + CHANGELOG 인용 명시 (review-rubric.md §4 충족)
- 평가 횟수: 4회째 (사용자 §10-6 명시 결정으로 허용, 정상 한도 3회 초과)
