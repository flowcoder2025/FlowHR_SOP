# Phase 5 전체 (45 화면) Wireframe Evaluator — Full Review

> **Date**: 2026-05-18
> **Branch**: `fix/WI-Phase5-ds-audit` (PR #13 draft, commit 69743b5 + a630b52)
> **Scope**: 45 화면 (CM 8 + OP 12 + TA 14 + EM 11)
> **모드**: doc (Phase 5 와이어프레임, 5축 v3 with DS 충실도)
> **호출 컨텍스트**: 사용자 9 화면 시각 결함 직접 지적 → 1차 audit fix PR #13 효과 검증 + cross-group sweep

## 1. 채점표 (5축)

| 축 | 가중치 | 점수 | 임계 | 상태 |
|----|--------|------|------|------|
| 완성도 (Completeness) | 25% | **7.4** | 7.5 | **FAIL (임계 미달)** |
| 정합성 (Consistency) | 25% | **7.2** | 7.5 | **FAIL (임계 미달)** |
| 구체성 (Specificity) | 20% | 8.0 | 7.5 | PASS |
| 실행가능성 (Actionability) | 20% | 7.6 | 7.5 | PASS |
| DS 사용 충실도 | 10% | **6.8** | 7.5 | **FAIL (Hard gate 위반)** |

**가중 합 = 7.4×0.25 + 7.2×0.25 + 8.0×0.20 + 7.6×0.20 + 6.8×0.10 = 1.85 + 1.80 + 1.60 + 1.52 + 0.68 = 7.45**

**가중 총점: 7.45 / 10**
**임계 게이트: 가중합 ≥ 8.0 AND 각 축 ≥ 7.5**

### **VERDICT: FAIL (CONDITIONAL → 정정 후 재평가 필수)**

- 가중 총점 7.45 < 8.0
- 3 축 (완성도/정합성/DS 충실도) 임계 미달
- Hard gate 위반 (DS SSOT 신규 컴포넌트 누락 → review-rubric §10-4)
- **wf-v1.0.0 tag 부여 불가** — 정정 후 재평가 필요

## 2. PR #13 1차 audit fix 효과 검증

### 2-1. 사용자 지적 9 화면 결함 해소 매트릭스

| 화면 | 결함 | 1차 정정 (PR #13) | 효과 검증 | 잔존 |
|------|------|-------------------|-----------|------|
| TA-03 | 탭 디자인 시스템 미준수 | components.css L753-756 `.tab` button reset + tabs/tabs-row alias | TA-03.html `<button class="tab">` 9개 — CSS 적용됨 | 0 |
| TA-06 | 상태버튼 미준수 | (정정 안 됨) | TA-06.html: 표준 `.btn-primary/.btn-ghost/.btn-sm` 사용. 페이지네이션 active만 inline override (cross-group 패턴) | **잔존: 페이지네이션 inline DS bypass** |
| TA-07 | 캘린더 정렬 + 반차 잘림 | components.css `.page-action-bar` flex-wrap + `.leave-badge` ellipsis + TA-07.html "½" 텍스트 단축 | components.css L753 + L914 적용 + TA-07.html L245 `<span class="leave-badge l-half" data-tooltip="반차">½</span>` 확인 | 0 |
| TA-09 | 에러 메시지 반응형 | (정정 안 됨) | `.auth-alert.auth-alert-error` 사용 — DS 표준. 모바일 break 미적용 (KI-057 잔존) | **잔존: 768px breakpoint 부재 (HTML 0건 @media)** |
| TA-10 | 탭 디자인 미준수 | tabs-row alias 통합 | TA-10.html L113-117 `<button class="tab">` 5개 — CSS 적용 | 0 |
| TA-13 | 디자인 시스템 미준수 | `button.vert-tab` reset (L409) | TA-13.html L146-151 `<button class="vert-tab">` 6개 UA 시각 제거 | 0 |
| OP-02 | 테이블 정렬 + DS 일부 적용 | (직접 정정 없음, badge variant CSS 효과로 일부 해소) | OP-02.html `<select>` 3건 모두 `.select-wrap` 없음 + 페이지네이션 inline DS bypass | **잔존: bare select 3건 + 페이지네이션** |
| OP-05 | 테이블 정렬 + DS 일부 | badge variant CSS | OP-05.html L156/158/160 bare `<select class="select input-sm">` 3건 | **잔존: bare select 3건** |
| OP-06 | 테이블 정렬 + DS 일부 | `.kpi-meta` selector 통합 (L177) | OP-06.html L148/153 `<div class="kpi-meta">` — CSS 적용 | **잔존: bare select 3건 (L183/185/187)** |
| OP-10 | 디자인 시스템 미준수 | `.kpi-meta` selector 통합 | OP-10.html L175/180/185/190/195/200 kpi-meta + period-chip 표준 | 0 |
| EM-10 | 배지 디자인 | badge variant CSS (288건 색상 적용) | EM-10.html L120/126 `badge badge-info` — CSS 적용 | 0 |

**해소율**: 6/11 완전 해소 (TA-03/TA-07/TA-10/TA-13/OP-10/EM-10), 5/11 부분 또는 미해소 (TA-06/TA-09/OP-02/OP-05/OP-06).

### 2-2. PR #13 commit 효과 점검

#### Commit 69743b5 (1차)

- L184-191 `.badge.success, .badge-success` 양 패턴 selector — **검증 PASS**: 화면 사용 296건 (35 파일) 모두 매치
- L401-402 `.tab` `.tab.is-active` G2 중복 정의 제거 — **검증 PASS**: L754-756 §G3 SSOT 단일 정의

#### Commit a630b52 (2차)

- L177 `.kpi-sub, .kpi-meta` 통합 — **검증 PASS**
- L753 `.tabs, .tabs-row` alias + `.tab` button reset — **검증 PASS**: TA-03 9건 + TA-10 5건 + TA-13 6건
- L409 `button.vert-tab` reset — **검증 PASS**
- L454-456 modal-header/body/footer 중복 제거 + `.modal-title` 신규 — **검증 PASS**: EM-02 L272 + EM-06 L216
- L511 `.step` base 제거 — **검증 PASS**
- L568 `.page-action-bar` flex-wrap + gap 추가 — **검증 PASS**
- L914 `.leave-badge` ellipsis + max-width — **검증 PASS**
- TA-07.html L245 "반차" → "½" — **검증 PASS**

**1차 audit fix는 의도된 효과를 정확히 달성**. 단, **신규/통합 컴포넌트가 _showcase.html / 03-components.md / matrix.json 일부에 미반영** — Hard gate 위반.

## 3. 5축 채점 근거

### 3-1. 완성도 (7.4 / 10) — FAIL

- 45 화면 HTML + 45 analysis 모두 존재 — 기본 매핑 PASS
- 권한 매트릭스 누락 — **16/45 analysis 파일** 부재:
  - CM-01, CM-02, CM-03, CM-04, CM-06, CM-20, CM-21
  - OP-04, OP-05, OP-06, OP-07, OP-08, OP-09, OP-10, OP-11, OP-12
- KI-049 (P2)에서 7 OP 화면 누락 명시했으나 실제 누락은 16 화면 (확대 필요)
- analysis 라인 수 편차:
  - OP-07: 40 / OP-10: 49 / OP-09: 52 (G2 그룹)
  - vs EM-09: 112 / TA-02: 129 / OP-01: 165 (G1/G3/G4 충실)
  - **G2 analysis가 G3/G4 대비 의존성/A11y/Phase 7 변환/변경 이력 섹션 부재**

**감점**: 권한 매트릭스 16건 누락(-1.5), G2 analysis 부족(-0.7), 신규 컴포넌트 SSOT 미동기(-0.4).

### 3-2. 정합성 (7.2 / 10) — FAIL

**신규 audit fix 컴포넌트 SSOT 미동기**:
- `modal-title` (components.css L455-456 신규) — _showcase.html 미등록, 03-components.md 미등록, matrix.json 미등록
- `kpi-meta` (L177 selector 통합) — matrix.json L53/55 등록, 03-components.md 미등록
- `button.vert-tab` reset (L409 신규) — 03-components.md / _showcase.html 미등록
- `button.tab` background:none/border:none reset (L754) — 03-components.md 미등록
- `tabs-row` alias 통합 — matrix.json 등록, 03-components.md L1004 단독 표기 잔존

**components.css 정의 vs 화면 사용 cross-group mismatch**:
- `ticket-status-current` — OP-08 L234 사용 (`<span class="badge ticket-status-current" style="background: var(--color-accent-bg); color: var(--color-accent);">`) — **components.css 미정의** → inline style fallback. DS SSOT 위반.
- `page-btn` / `page-btn.is-active` — components.css L394-399 정의. **45 화면 중 사용 0건** (`grep -c "page-btn"` 결과 0). 11 화면 (OP-02/06/09, TA-02/05/06/07/10/11) `<button class="btn btn-ghost btn-sm" style="background: var(--color-accent); color: white;">1</button>` 형태로 inline override — **DS 컴포넌트 우회 systemic 패턴**.

**HANDOFF.md L26 일관성**:
- "PRD spec 44 화면 + CM-22 PWA install 1" — CM-22.html 미존재 (CM-21에 통합 추정)

**감점**: 신규 컴포넌트 SSOT 4종 미동기(-1.5), components.css 정의 vs 화면 사용 mismatch 2건(-0.8), HANDOFF 일관성 표현 미세 차이(-0.3), audit fix VERSION/CHANGELOG 미반영(-0.2).

### 3-3. 구체성 (8.0 / 10) — PASS

- analysis 파일 PRD 매핑/상태/i18n/API/검증/Phase 7 변환 6 섹션 표준화
- 추측성 표현 0건 ("TBD"/"추후"/"검토"/"아마도" grep 결과 없음)
- audit fix 2 commit message가 영향 범위 매트릭스 + 미정정 사유까지 명시

**감점**: 일부 G2 analysis 권한/의존성 섹션 텅 빔(-1.0), Phase 7 변환 일부 1줄 처리(-0.5), CHANGELOG audit fix 항목 부재(-0.5).

### 3-4. 실행가능성 (7.6 / 10) — PASS

- Phase 7 React 변환 매핑 모든 화면 존재 (shadcn/ui)
- API 엔드포인트 명시 → React Query 키 추출 가능
- Playwright smoke 통과 (PR #13 CI 9/9 PASS)
- KI-054 (52건 icon-btn aria-label 누락) → Phase 7 WCAG AA 컴플라이언스 일괄 정정 필요
- KI-066 (EM-09 vert-tab data-tab 중복) → React key 충돌 잠재

**감점**: 권한 매트릭스 16건 누락이 Phase 7 진입 시 PRD 재인용 필수(-1.0), KI-054 aria-label systemic(-0.8), KI-066 React key 잠재(-0.4), CHANGELOG 미갱신 차기 그룹 SSOT 혼란(-0.2).

### 3-5. DS 사용 충실도 (6.8 / 10) — FAIL (Hard gate 위반)

**채점 표 §10-3 매핑**: 6점 "DS 클래스 대체로 사용, 일부 화면에 bare native control / inline 재정의 / showcase 불일치"

**Hard gate 위반 (review-rubric §10-4)**:
1. **신규 컴포넌트 SSOT 미동기 4종** (modal-title / button.vert-tab reset / button.tab reset / kpi-meta)
2. **bare native control 반복**: 17건 bare `<select>` (KI-050) — 29/46 wrapped, 17/46 bare
3. **DS 컴포넌트 우회 inline**:
   - 11 화면 페이지네이션 inline DS bypass
   - OP-08 L234 `ticket-status-current` inline override

**Hard gate 통과 항목**:
- file:// 아이콘 미표시 → CI inline-svg-sprite-check 9/9 PASS
- 외부 sprite 참조 → 0건
- bare input[type=file/date/datetime] → 0건

**감점**: SSOT 동기화 결함(-1.5), bare select 17건(-1.0), 페이지네이션 inline DS bypass 11 화면(-0.5), `ticket-status-current` 정의 누락(-0.2).

## 4. 잔존 결함 분류 (P0~P3)

### P0 Critical (0건)

(없음)

### P1 High (3건 신규)

| ID | 영역 | 결함 | 권장 조치 |
|----|------|------|---------|
| **NEW-P1-001** | DS SSOT | `modal-title` 신규 등록되었으나 _showcase.html / 03-components.md 미반영 (audit fix 2 systemic) | _showcase.html demo + 03-components.md Anatomy + matrix.json 추가 |
| **NEW-P1-002** | DS SSOT | `ticket-status-current` (OP-08 L234) components.css 미정의 — inline DS bypass | components.css에 `.ticket-status-current { background: var(--color-accent-bg); color: var(--color-accent); }` 등록 + OP-08 inline style 제거 |
| **NEW-P1-003** | DS SSOT | 페이지네이션 active 상태 — 11 화면 inline DS bypass (page-btn.is-active 컴포넌트 우회). cross-group systemic | 11 화면 (OP-02/06/09, TA-02/05/06/07/10/11) 일괄 sed: `<button class="btn btn-ghost btn-sm" style="background:...">1` → `<button class="page-btn is-active">1` |

### P2 Medium (5건 — 기존 + 신규)

| ID | 영역 | 결함 | 권장 조치 |
|----|------|------|---------|
| KI-049 (확대) | analysis | 권한 매트릭스 16 화면 누락 (CM 7 + OP 9) — 기존 P2 (7 OP)에서 확대 | 16 analysis 파일에 권한 섹션 추가 |
| KI-050 | DS | 17건 bare `<select>` (OP-02/05/06/07/11) | `.select-wrap` ancestor wrap 일괄 적용 |
| KI-054 | A11y | 52건 icon-btn `aria-label` 없이 `data-tooltip`만 (WCAG 2.1 AA 결함) | aria-label 일괄 추가 |
| **NEW-P2-001** | 정합성 | `kpi-meta` selector 통합되었으나 03-components.md 미반영 | §G2 또는 §G4 commentary 추가 |
| **NEW-P2-002** | 정합성 | `button.vert-tab` / `button.tab` reset 패턴 03-components.md / _showcase.html 미반영 (audit fix 2) | demo + 사양 추가 |

### P3 Low (28건 기존 + 6 신규)

기존 28건: KI-005~007/013/016/017/020/023/025/032~036/038/040/042~045/055/056/057/062/064/065/066/067 (INDEX.md 참조)

신규 6건:
- NEW-P3-001 — audit fix branch VERSION/CHANGELOG 미갱신 (wf-v0.4.0 유지)
- NEW-P3-002 — matrix.json `modal-title` 미반영
- NEW-P3-003 — G2 analysis 평균 56 lines vs G3/G4 110+ lines (의존성/Phase 7/A11y 섹션 부족)
- NEW-P3-004 — HANDOFF.md L26 "CM-22 PWA install" 화면 미존재 (CM-21 통합 추정)
- NEW-P3-005 — 03-components.md L1004 "tabs-row" 단독 표기 (audit fix 후 alias commentary 필요)
- NEW-P3-006 — TA-14.html L158 `style="background: #FEE500;"` 카카오 브랜드 색 inline (DS 토큰화 또는 chart-specific 허용 commentary)

## 5. Hard Gate 검증 (review-rubric.md §10-4)

| 검증 항목 | 기준 | 결과 |
|----------|------|------|
| file:// 아이콘 미표시 2 화면+ | 5번째 축 최대 4점, verdict WARNING | **PASS** (CI inline-svg-sprite-check 9/9) |
| 외부 sprite 참조 잔존 | P1 | **PASS** (0건) |
| bare input[type=file] | P1 | **PASS** (0건) |
| bare select/date/datetime 반복 | P2 이상 | **PARTIAL** (17건 bare select — KI-050 P2 잔존) |
| 신규 컴포넌트가 SSOT 1개라도 빠짐 | DS SSOT 결함 | **FAIL** (`modal-title`/`button.vert-tab` reset/`button.tab` reset/`kpi-meta` — 4종) |

## 6. 정정 권장 사항

### 차단 (재평가 통과 위해 필수)

1. **신규 컴포넌트 SSOT 동기화** (P1 NEW-001/002 + P2 NEW-001/002):
   - `modal-title` → _showcase.html + 03-components.md + matrix.json
   - `button.vert-tab` reset + `button.tab` reset → 03-components.md commentary
   - `kpi-meta` → 03-components.md commentary
   - `ticket-status-current` → components.css 정식 등록
2. **DS bypass 일괄 정리** (P1 NEW-003):
   - 11 화면 페이지네이션 inline override → `.page-btn.is-active` 사용
3. **권한 매트릭스 일괄 보강** (P2 KI-049 확대):
   - 16 analysis 파일에 권한 섹션 추가

### 권장 (재평가 통과 후 차기 batch)

4. **bare select 17건 .select-wrap 적용** (KI-050)
5. **icon-btn aria-label 52건** (KI-054)
6. **G2 analysis 보강** (NEW-P3-003)
7. **VERSION/CHANGELOG 갱신** (NEW-P3-001)

## 7. wf-v1.0.0 tag 부여 판정

**부여 불가**.

근거:
- 가중 총점 7.45 < 8.0
- Hard gate 1건 위반 (DS SSOT 신규 컴포넌트 미동기 4종)
- 권한 매트릭스 16 화면 누락 (Phase 6/7 진입 시 PRD 재인용 필수)
- P1 신규 3건 (모두 cross-group systemic)

**권장 경로**:
- 옵션 A: PR #13 보완 commit + 차단 4건 정정 → 재평가 → PASS 시 wf-v1.0.0 tag
- 옵션 B: PR #13 현재 머지 + wf-v0.4.1 patch tag + 차단 4건 후속 PR로 분리 → wf-v0.5.0 또는 wf-v1.0.0 진입

## 8. 다음 단계

1. **호출자(Claude 본체) 의무**:
   - 본 평가 결과를 사용자에게 보고
   - 사용자 결정 옵션 A/B 제시 (review-system.md §10 사용자 개입 의무 시점 적용)
2. **마커 생성 금지**: `.flowset/eval-results/phase-5-full.pass` 만들지 않음 (FAIL)
3. **KI 등록 의무**:
   - NEW-P1-001/002/003 (3건)
   - NEW-P2-001/002 (2건)
   - NEW-P3-001~006 (6건)
   - 총 11건 → `.flowset/known-issues/INDEX.md` 추가 + 카운트 갱신
   - P1 누적 3건 도달 시 트리거 발동 (사용자 개입 의무 시점 #2)

## 9. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-18 | 초안 — Phase 5 전체 (45 화면) full review FAIL (7.45/10) | review-rubric.md §10 5축 + Hard gate 위반 1건 + P1 신규 3건 |
