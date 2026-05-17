# G2 Codex hotfix3 재리뷰

> **작성**: 2026-05-17 (codex gpt-5 agent 통지 — Claude general-purpose subagent 위탁)
> **agent task-id**: 019e321c-f0c5-74f1-8710-ab356ded9ed6

## 종합

- **점수**: 8.0 / 10
- **verdict**: **WARNING**

## 직전 P0/P1 HEAL 검증

| # | 결함 | 결과 |
|---|------|------|
| P0 (hotfix2 잔존) | CM-01/CM-02/CM-03/OP-12 password-toggle JS 외부참조 재주입 | ✅ **HEAL** — `.flowset/wireframes/html/` 내 `../_design-system/icons.svg` 참조 0건, JS도 `#i-eye-off` / `#i-eye` 내부 sprite 참조로 정정 |
| P1 (hotfix2 신규) | `.active` vs `.is-active` SSOT drift | ⚠️ **부분 HEAL / 잔존** — 화면 CSS의 `.active` selector는 사라졌으나 SSOT/런타임 drift 잔존 |

## 잔존 결함

### P1 (잔존) — `.active` SSOT drift

1. **`_showcase.html`** — 여전히 `sidebar-item active` 사용
   - 실제 OP 화면들은 `sidebar-item is-active` 사용 → showcase-to-usage 불일치
   - 위치: `C:/dev/FlowHR_SOP/.flowset/wireframes/_showcase.html:844`

2. **`component-usage-matrix.json`** — `allowed_classes`에 `sidebar-item active` 잔존
   - 실제 사용 클래스와 매핑 불일치
   - 위치: `C:/dev/FlowHR_SOP/.flowset/wireframes/_design-system/component-usage-matrix.json:15`

3. **CM-21 런타임 JS** — `classList.remove('active')` / `add('active')` 사용
   - 초기 마크업은 `is-active` → 클릭 후 상태 클래스 분기
   - 위치: `C:/dev/FlowHR_SOP/.flowset/wireframes/html/CM-21.html:252`

### P2 (NON_BLOCKING)

- **KI-050**: `<select class="select">` 17건은 여전히 `.select-wrap` 없이 사용 (KI 등록 확인됨)
- **KI-051**: `showcase-coverage-check`는 아직 JSON/showcase 존재와 jq parse 중심, 실제 사용 클래스 cross-check 강화 미반영 (KI 등록 확인됨)

## 검증 결과 (5항목)

| # | 항목 | 결과 |
|---|------|------|
| 1 | file:// asset compatibility | ✅ 외부 svg 참조 0건 |
| 2 | native control visual compliance | ✅ `file-input`, `date-input` 적용 / ⚠️ `.select-wrap` HTML 사용 0건 (KI-050) |
| 3 | showcase-to-usage consistency | ⚠️ matrix `sidebar-item active` drift |
| 4 | rendered evidence requirement | ✅ Playwright smoke `iconCheck` / `nativeCheck`에 `checkVisibility({ checkVisibilityCSS: true })` 가드 확인 |
| 5 | cross-screen pattern drift | ⚠️ `_showcase.html` / matrix / CM-21 JS에 `.active` 잔존 |

## PR #5 CI

- PR #5 checks: **9개 모두 pass**

## 다음 단계 권고

**WARNING → P1 drift를 정정하거나 KI로 명시 등록 후 진행**.

PASS ready로 보기에는 `_showcase.html` / matrix / CM-21 JS의 `.active` 잔존이 SSOT drift를 계속 만들 수 있음. 옵션:

1. **즉시 정정 (권장)**: 3건 hotspot sed (`_showcase.html:844` / `component-usage-matrix.json:15` / `CM-21.html:252`) → PR re-evaluation 없이 PASS 전환 가능
2. **KI 등록 후 진행**: KI-052로 `.active` SSOT 잔존 등록 + NON_BLOCKING → ready 전환
