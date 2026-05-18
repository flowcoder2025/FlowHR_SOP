# G3 와이어프레임 hotfix2 (commit 5e0b028) Codex 재리뷰 결과

## 1. Codex 호출 메타

- 시각: 2026-05-18 KST
- 모델: GPT-5 Codex (`mcp__codex__codex`, ChatGPT account, default model)
- 모드: full review (hotfix2 — 완전 SSOT 동기화 재검증)
- sandbox: read-only
- approval-policy: never
- thread_id: `019e39d2-0c24-7dd2-8021-78109281271b` (이전 thread `019e3988-838a-77c3-9ea8-b253eb5fdf42` 권한 거부로 새 thread 시작 — codex-hotfix1.md를 read하여 컨텍스트 회복)
- 검토 파일: TA-01~TA-14 HTML 14 + analysis TA-03/TA-13 + `component-usage-matrix.json` + `components.css` + `03-components.md` + `_showcase.html` + `known-issues/INDEX.md` + `prd/domains/tenant-admin/TA-03-employee-detail.md`
- 브랜치/커밋: `feature/WI-G3-wireframes-tenant` @ `5e0b028`
- 호출자: Claude Opus 4.7 (FlowSet 라이트, codex 호출 위탁)
- 비고: 이전 hotfix1 codex 결과 (FAIL 7.0)와 hotfix2 정정 의도를 프롬프트로 회복 후 검증.

## 2. 재검증 결과 (P1/P2 정정)

| 항목 | 결과 | 근거 |
|---|---:|---|
| matrix top-level version | **PASS** | [component-usage-matrix.json:3](`.flowset/wireframes/_design-system/component-usage-matrix.json`) `"version": "1.1.0"`, line 4 `"updated_at": "2026-05-18"`. |
| components.css `.kpi-row` / `.vert-tab.is-active` 등록 | **PASS** | [components.css:881](`.flowset/wireframes/_design-system/components.css`) `.kpi-row { display: grid; gap: 12px; margin-bottom: 16px }`. [line 885](`.flowset/wireframes/_design-system/components.css`) `.vert-tab.is-active { background: ...; color: ...; border-left-color: ...; font-weight: 600 }`. |
| inline base 제거 (column override만 잔존) | **FAIL** | TA-01 `.kpi-row`가 `margin-bottom: 20px` 재정의. TA-13 `.vert-tab` active visual 4속성 중복. |
| TA-03 manager 3 pane = PRD 정합 | **PASS / 주석 P3** | PRD [TA-03-employee-detail.md L23/L127](`.flowset/prd/domains/tenant-admin/TA-03-employee-detail.md`) "tenant_manager R = 기본정보/근태/휴가". HTML scope-mgr 3개. 주석 line 199 "5 pane" stale. |
| TA-13 hr_admin 6 pane | **PASS** | [TA-13.html:282](`.flowset/wireframes/html/TA-13.html`) 결재라인 pane scope-hr 부착 추가. 6 pane = 회사정보(168) / 근무(195) / 휴가(246) / 결재라인(282) / 알림(330) / 문서양식(354). 주석 line 163 "6 pane (hr_admin scope-hr)" 일치. |
| KI-053 _showcase G3 9 anchors | **PASS** | `section-profile-card` ~ `section-side-drawer` 9 anchors 존재. |
| KI-053 03-components.md G3.1~G3.9 | **FAIL/PARTIAL** | 섹션은 9개 모두 존재. 단 §G3.5~G3.9 Props 변수 누락 다수, §G3.6/G3.7/G3.8/G3.9 Phase 7 매핑 누락. Mobile은 line 1270+ 일괄 override로 커버. |

## 3. 발견 결함 (hotfix2)

| ID | 등급 | 화면/영역 | 설명 | 위치 |
|----|------|----------|------|-----|
| **G3-CDX-003-HF2** | **P1** | TA-01 | inline `.kpi-row { ..., margin-bottom: 20px }` — components.css base `margin-bottom: 16px` 재정의. hotfix2 의도 "column override만" 위반. | [TA-01.html:17](`.flowset/wireframes/html/TA-01.html`) |
| **G3-CDX-003-HF2-B** | **P1** | TA-13 | inline `.vert-tab[data-tab]` active visual (background / color / border-left-color / font-weight) 4속성 = [components.css:885](`.flowset/wireframes/_design-system/components.css`) `.vert-tab.is-active` 완전 동일. 기능 충돌 아니나 SSOT 중복 — page-local에 시각 정의 재반복. body[data-state] 패턴 자체는 state→tab 매핑이 page-local 의도라 정당하나, 시각 declaration은 `.is-active` SSOT 위임 또는 변수만 inline override 형태로 정리 필요. | [TA-13.html:32-34](`.flowset/wireframes/html/TA-13.html`) |
| **KI-053-HF2** | **P2** | DS SSOT | 03-components.md G3.1~G3.9 모두 등록은 됐으나 Props/Phase 7 매핑 일관성 부족. §G3.5~G3.9 다수 누락. KI-053 resolve 의도와 실제 완전성 사이 gap. | [03-components.md:1109~1268](`.flowset/wireframes/_design-system/03-components.md`) |
| **KI-053-INDEX** | **P2** | KI 트래커 | commit message "KI-053 hotfix2로 resolve" 의도 ↔ [INDEX.md:72](`.flowset/known-issues/INDEX.md`) 표 행 상태 `open (G3 hotfix2)` 유지. SSOT 불일치. | INDEX.md L72 |
| **G3-CDX-009-HF2** | **P3** | TA-03 | manager scope 3 pane = PRD 정합으로 확정됐으나 [TA-03.html:199](`.flowset/wireframes/html/TA-03.html`) 주석 "5 pane만" stale. analysis 문서와도 미세 불일치. | TA-03.html L199 |
| **G3-CDX-002-HF2-NOTE** | **P3** | matrix | top-level version은 정정됐으나 [component-usage-matrix.json:251](`.flowset/wireframes/_design-system/component-usage-matrix.json`) changelog 1.1.0 entry "G3 신규 10 패턴" 표기 — _showcase.html G3 9 anchors와 카운트 불일치. | matrix.json L251 |
| G3-CDX-006 (잔존) | P2 NON_BLOCKING | 공통 | icon-only `aria-label` 누락 — KI-054로 이월. | 다수 |
| KI-055/056/057 (잔존) | P3 NON_BLOCKING | 공통 | 가짜 base path / footer SSOT / 모바일 미디어쿼리 — 차기 batch 또는 Phase 7. | INDEX.md L74-76 |

## 4. 5항목 체크리스트 (review-system.md §17-3)

| 항목 | 결과 | 근거 |
|---|---:|---|
| 1. file:// asset compatibility | **PASS** | TA-01~TA-14 inline sprite 보유, 외부 `icons.svg` `<use>` 0건 (codex 직접 확인). |
| 2. native control visual compliance | **PASS** | TA 범위 select/file/date `.select-wrap` / `.file-input` / `.date-input` wrap 유지. |
| 3. showcase-to-usage consistency | **PARTIAL** | matrix 24 patterns + _showcase 24 sections 정합. 단 03-components.md G3 완전성 부족 + KI-053 INDEX 상태 open. |
| 4. rendered evidence requirement | **UNVERIFIED** | 본 세션 read-only file inspection만. §17-3/17-7 요구 file:// screenshot 또는 Playwright smoke evidence 미확인. |
| 5. cross-screen pattern drift | **FAIL** | TA-13 vert-tab active visual inline 중복 + TA-01 .kpi-row spacing override 잔존. |

## 5. 종합 점수 + verdict

- 종합 점수: **7.3 / 10** (이전 7.0 → +0.3)
- VERDICT: **FAIL**
- 사유:
  - matrix top-level version / TA-13 scope-hr 6 pane / showcase G3 9 anchors는 실제 정정 확인.
  - P1-3 inline component definition 0건은 **여전히 미충족** — TA-01 spacing override + TA-13 vert-tab visual 중복.
  - KI-053 resolve 의도와 INDEX 상태 불일치 (tracker drift).
  - 03-components.md G3 섹션 9개 등록은 됐으나 Props/Phase 7 일관성 부족 → KI-053 partial.
  - P0 0건.

## 6. 권고

- **현재 상태로 머지 비권고** (BLOCKED_FOR_HOTFIX 재발동).
- **hotfix3 최소 범위** (P1 직접 정정):
  1. TA-01.html:17 `.kpi-row` inline에서 `margin-bottom: 20px` 제거 (components.css base `margin-bottom: 16px` 채택) — 또는 base 자체를 20px로 통일.
  2. TA-13.html:32-34 `body[data-state] .vert-tab[data-tab]` 시각 declaration 4속성 → `.is-active` class 토글로 전환하거나 selector만 유지 + 시각 속성은 `.vert-tab.is-active` SSOT에 위임.
- **hotfix3 동반 권고** (P2/P3 drift 동시 정정):
  3. INDEX.md L72 KI-053 상태 `open (G3 hotfix2)` → `resolved` 또는 `partial (G4)` 명시 (실제 SSOT 동기화 완전성에 맞춰).
  4. 03-components.md §G3.5~G3.9 Props 변수 + Phase 7 매핑 보강 (KI-053 완전 해소).
  5. TA-03.html:199 주석 "5 pane만" → "3 pane (PRD §6 manager R = 기본/근태/휴가)" 정정.
  6. matrix.json:251 changelog 1.1.0 entry "G3 신규 10 패턴" → "G3 신규 9 패턴" 정정 (또는 카운트 실측 재계산).
- **사용자 결정 필요 시점 없음** — 모두 mechanical fix 범위. review-system.md §10 사용자 개입 조건 미충족.
- **NON_BLOCKING**: G3-CDX-006 (KI-054), KI-055/056/057은 별도 KI 유지, 머지 차단 사유 아님.

## 7. review-system.md §4 통합 판정 입력값

- codex verdict: **FAIL**
- codex 점수: **7.3 / 10**
- codex P0: 0
- codex P1: 2 (G3-CDX-003-HF2 TA-01 spacing, G3-CDX-003-HF2-B TA-13 vert-tab 중복)
- codex P2 blocking: 2 (KI-053-HF2 03-components partial, KI-053-INDEX tracker drift)
- codex P2 non-blocking: 1 (G3-CDX-006)
- codex P3 non-blocking: 2 (G3-CDX-009-HF2 주석 stale, G3-CDX-002-HF2-NOTE changelog 카운트)
- evaluator hotfix2 결과는 별도 호출. evaluator도 FAIL일 경우 통합 판정 **FAIL** (정정 후 재호출, 최대 3회 시도 중 **3회차 진입 — 최종 hotfix 기회**).
- evaluator PASS + codex FAIL → 통합 판정 **BLOCKED_FOR_HOTFIX** (review-system.md §4).

## 8. hotfix 횟수 관리

- hotfix1: codex FAIL 7.0
- hotfix2: codex FAIL 7.3 (본 결과)
- **hotfix3 (다음 1회만 가능)** — 4회차 진입 시 review-system.md §10-6 "3회 연속 재평가 FAIL → 스코프 재검토" 사용자 결정 시점.

---

## 부록. Claude 검증 cross-check (codex 결과 직접 재확인)

| 항목 | Codex 주장 | Claude 직접 확인 | 일치 |
|---|---|---|---|
| matrix.json:3 version | "1.1.0" | line 3 `"version": "1.1.0",` | ✓ |
| matrix.json:4 updated_at | "2026-05-18" | line 4 `"updated_at": "2026-05-18",` | ✓ |
| components.css:881 .kpi-row base | margin-bottom: 16px | line 881 `.kpi-row { display: grid; gap: 12px; margin-bottom: 16px; }` | ✓ |
| components.css:885 .vert-tab.is-active | 등록됨 | line 885 정식 등록 (4속성) | ✓ |
| TA-01:17 .kpi-row margin 재정의 | margin-bottom: 20px | line 17 `.kpi-row { grid-template-columns: repeat(6, 1fr); margin-bottom: 20px; }` | ✓ |
| TA-13:32-34 visual 중복 | components.css와 동일 4속성 | line 34 `background: var(--color-accent-bg); color: var(--color-accent); border-left-color: var(--color-accent); font-weight: 600;` ≡ components.css:885 | ✓ |
| TA-13:282 결재라인 scope-hr | 추가됨 | line 282 `pane-approval-line scope-hr` | ✓ |
| TA-03 manager PRD scope | 3 pane (기본/근태/휴가) | PRD L23/L127 "tenant_manager R = 기본정보·근태·휴가" + L127 "보이는 탭 = 기본정보 / 근태 / 휴가 (5개 비공개)" | ✓ |
| TA-03:199 주석 "5 pane" stale | stale | line 199 주석 "5 pane만 (manager — 기본/근태/휴가 + scope-mgr 클래스)" — 본문 3 pane과 표현 불일치 | ✓ |
| INDEX.md:72 KI-053 status | open (G3 hotfix2) | line 72 `open (G3 hotfix2)` 그대로 — commit "resolve" 의도 불일치 | ✓ |
| 03-components G3.5~G3.9 Props/Phase7 | 다수 누락 | §G3.5 Phase 7 ✓ Props ✗ / §G3.6 Phase 7 ✗ Props ✗ / §G3.7 Phase 7 ✗ Props ✗ / §G3.8 Phase 7 ✗ Props ✗ / §G3.9 Phase 7 ✗ Props ✗ | ✓ |
| matrix.json:251 changelog "10 패턴" | _showcase 9 anchors와 불일치 | line 251 changelog entry 표현 확인 | ✓ |

codex 판정 신뢰도: 12/12 사실 일치. 본 결과 그대로 통합 판정 입력값으로 사용 가능.
