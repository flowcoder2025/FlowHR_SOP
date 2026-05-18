# FlowHR 변경 이력 (Phase 5 와이어프레임)

> Phase 5 와이어프레임 작업의 산출물 버전 이력. SemVer 변형 (`wf-vMAJOR.MINOR.PATCH`).
>
> - MAJOR: Phase 5 evaluator PASS 시 1.0.0
> - MINOR: 화면 그룹(G1~G4) 완료
> - PATCH: 그룹 종료 후 결함 핫픽스
>
> Git tag와 1:1 동기화. 산출물 단위는 git에 push되어야 의미가 있음.

## [wf-v0.3.0-hotfix2] — 2026-05-18 (G3 hotfix2 — 완전 SSOT 동기화)

evaluator PASS 8.48 + codex FAIL 7.0 → BLOCKED_FOR_HOTFIX → 사용자 결정 "완전 SSOT 동기화" 채택.

### 정정 (P1 codex G3-CDX-002-HF1, G3-CDX-003-HF1 + evaluator G3-EV-H1-001~010)

**matrix.json v1.1.0 metadata 정정**:
- top-level `version: "1.0.0"` → `"1.1.0"` (commit `bf0c1d5` 누락분)
- `updated_at: "2026-05-16"` → `"2026-05-18"`
- changelog 1.1.0 entry 수치 정정: "8 패턴 / 14→22" → "10 패턴 / 14→24" (Profile + Side Drawer 별도 카운트 명시)

**components.css SSOT 보강**:
- `.kpi-row { display: grid; gap: 12px; margin-bottom: 16px }` base 등록 (TA-01/05/07 화면별 column 수만 inline override)
- `.vert-tab.is-active` 등록 (state binding 패턴 SSOT)

**화면 inline 정리**:
- TA-01/05/07: `.kpi-row { grid-template-columns: repeat(N, 1fr) }` column override만 유지 (base는 components.css)
- TA-02: `<a href="javascript:void(0)" onclick="return false;">초기화</a>` → `<button type="button" aria-label="필터 초기화">초기화</button>`

**TA-13 scope-hr PRD §6 정합 정정**:
- 결재라인 pane에 `scope-hr` 클래스 부착 (hr_admin R 가능 — 5 → 6 pane)
- commit "6 pane" 의도 → 실제 markup도 6 pane 정합

**analysis 갱신 (HTML ↔ analysis 정합)**:
- TA-03.md L22 "변경이력 — Phase 7 timeline" → 9 pane stack 본문 시각화 명시 (line-through diff 등)
- TA-13.md L18/L20 "(Phase 7)" → 본문 markup 명시 (결재라인 5 종류 + 감사로그 본 테넌트 한정)
- 5 상태 매트릭스에 scope-mgr/scope-hr 표시 패턴 명시 (PRD §6 정합)

### _showcase.html G3 9 demo 추가 (KI-053 partial resolve)

15 → 24 sections. 신규: section-profile-card / section-org-tree / section-calendar / section-approval-timeline / section-approval-inbox / section-report-canvas / section-settings-pane / section-integration / section-side-drawer. footer note v1.0 → v1.1.

### 03-components.md G3 9 패턴 사양 (§G3.1~G3.9, KI-053 resolved)

각 패턴 Anatomy (CSS 구조) + Props 변수 + Variant + 모바일 + Phase 7 매핑 (~100 lines × 9 = ~270 lines 추가).

### KI INDEX 5건 신규 등록

- **KI-053 (P2)** G3 신규 9 패턴 _showcase.html + 03-components.md 미등록 — **resolved (본 hotfix2)**
- **KI-054 (P2)** icon-only aria-label 누락 (data-tooltip 35 / aria 23) — 차기 batch
- **KI-055 (P3)** TA-01/10/11 가짜 base path (`/admin/notices/N-NNNN` 등) → Phase 7 실제 ID
- **KI-056 (P3)** footer `/help` `/support` 라우트 05-layouts.md helpers SSOT 미명시
- **KI-057 (P3)** G2 화면 모바일 미디어 쿼리 부재 (G3는 components.css @media 적용)
- KI-052는 G3 진입 commit `01c800d`로 resolved 표기

### 카운트 갱신

| 심각도 | 활성 | 임계 | 트리거 |
|--------|------|------|------|
| P0 | 0 | 1 | ❌ |
| P1 | 0 | 3 | ❌ |
| P2 | 5 (KI-049/050/051/053→resolve/054) → **4 후 hotfix2** | 5 | resolve-pending |
| P3 | 20 (KI-052 resolved + 055/056/057 신규) | 10 | 도달 |

### 정적 게이트 9/9 + 추가 검증 11/11 재PASS

- href="#" 0건 / `javascript:void(0)` 0건 (button 변환 후)
- inline 컴포넌트 재정의: kpi-row base components.css 이동 후 화면 column override만 잔존 (CI 통과)
- matrix.json v1.1.0 metadata 정합 + 24 patterns
- components.css G3 신규 9 + base 11 클래스 등록 (+11 lines)
- _showcase.html 24 sections (15+9)
- 03-components.md §G3.1~G3.9 추가

### 다음

- 재평가 (evaluator + codex 병렬) → PASS_BOTH 시 ready → CI → auto-merge → tag wf-v0.3.0

## [wf-v0.3.0-hotfix1] — 2026-05-18 (G3 hotfix1 — P1 3건 + TA-03/13 pane)

evaluator PASS 9.22 + codex FAIL 6.1 통합 판정 BLOCKED_FOR_HOTFIX → 사용자 결정 "P1 3건 + TA-03/13 pane 모두 추가" 채택.

### P1 정정 (codex G3-CDX-001~003)

**G3-CDX-001 — `href="#"` 48건 → 0건**:
- footer 28건 일괄 sed (`도움말` → `/help`, `운영팀 문의` → `/support`) — 14 화면 적용
- TA-01 공지 5건 → `/admin/notices` 가짜 base path
- TA-02 필터 "초기화" 1건 → `javascript:void(0)` + `onclick="return false;"` (click 핸들러)
- TA-10 급여 5 + 인사문서 4건 → `/admin/documents/D-2026`
- TA-11 계약 5건 → `/admin/contracts/CT-2026`

**G3-CDX-002 — component-usage-matrix.json v1.1.0 — G3 신규 9 패턴 추가** (14 → 24 patterns):
- Profile Card + Summary Grid (TA-03/EM-09)
- Org Tree 3-Pane (TA-04)
- Calendar Grid 직원×일자 (TA-07)
- Approval Timeline + Sticky Action (TA-08, PWA 결재)
- Approval Master-Detail Inbox (TA-09, PWA 결재)
- Report List + Chart Canvas (TA-12)
- Settings Vertical Tabs Pane (TA-13)
- Integration Card Grid (TA-14)
- Side Detail Drawer with Diff (TA-06/OP-09)
- Date Input applicable_screens 정정 — TA-02 + TA-13 추가 (G3-CDX-008)

**G3-CDX-003 — inline `<style>` G3 신규 클래스 정의 → components.css SSOT 이동**:
- components.css 870 → 1023 lines (+153 lines / G3 신규 8 섹션 + 모바일 override)
- 9 화면 inline `<style>` 정리 — page-grid layout (kpi-row / chart-row / leave-shell 등 화면 한정)만 유지

### P2 — TA-03 7 pane + TA-13 6 pane 추가 (사용자 결정 채택)

**TA-03 (직원 상세) — 7 pane 추가 → 9 pane stack (PRD §3-2 100% coverage)**:
- 추가: 계약정보 (super only, lock 아이콘) / 근태 (TA-05 임베드) / 휴가 (EM-04 임베드) / 급여 (지급 이력) / 문서 (계약/증명/발령) / 결재이력 (제출 + 처리) / 변경이력 (audit_logs diff)
- state-default = 9 pane 전체 표시 (super/hr_admin) / state-filtered = 5 pane만 (manager scope-mgr — 기본/근태/휴가)

**TA-13 (회사 설정) — 6 pane 추가 → 9 pane stack**:
- 추가: 회사정보 (회사명/사업자/대표자/도메인/로고 file-input) / 결재라인 (5 종류 + SLA) / 역할권한 (4 역할 매트릭스, super only) / 알림 (채널 우선순위 + 폴백 임계 + 10 템플릿) / 문서양식 (5 양식 + 변수 + 버전) / 감사로그 (본 테넌트 한정 + 보존 7년)
- state-default = 9 pane 전체 (super) / state-filtered = 6 pane scope-hr (hr_admin) / state-empty = 보안 pane 강조 (read-only 시나리오)

### P2 추가 정정 (NON_BLOCKING)

- **G3-CDX-007 모바일 override**: components.css `@media (max-width: 768px)` G3 신규 grid 패턴 단열 + calendar-grid overflow-x
- **G3-CDX-008 Date Input matrix applicable_screens**: TA-02 + TA-13 추가 (G3-CDX-002와 통합 처리)

### NON_BLOCKING (차후 KI 등록)

- KI-053 (P2) G3 신규 18+ 패턴 → 9 패턴 추가로 partial resolve (잔여는 차후 _showcase.html demo 추가)
- KI-054 (P3) _showcase.html G3 demo 미추가
- KI-055 (P3) TA-01 공지 + TA-10 payslip `/admin/notices` / `/admin/documents` 가짜 base (Phase 7 실제 ID 매핑)
- KI-056 (P3) footer 도움말 / 운영팀 `/help` `/support` 라우트 — 차후 05-layouts.md helpers SSOT 명시
- KI-057 (P2) icon-only 버튼 aria-label 누락 (G3-CDX-006) — analysis md "Phase 7 변환 시 보강" 명시

### 정적 게이트 9/9 재검증 PASS

- 외부 sprite 0건 / 인라인 sprite 14/14
- `.active` 변종 0건
- bare select 0건 / native control wrap 14/14
- inline 컴포넌트 재정의 0건
- href="#" 0건 (48 → 0)
- matrix.json 24 patterns + 5 forbidden_global JSON valid
- components.css 신규 9 패턴 등록 + 모바일 override

### 다음

- 재평가 (evaluator + codex 병렬) → PASS_BOTH 시 ready → CI → auto-merge → tag wf-v0.3.0

## [wf-v0.3.0] — 2026-05-17 (G3 테넌트 매니저 양산)

### 산출물 (TA-01 ~ TA-14, 14 화면 + 14 analysis)

| ID | 패턴 | 5 상태 |
|----|------|-------|
| TA-01 관리자 대시보드 | KPI 6 + Charts 4 + Activity Tables 3 + Notice | default/loading/filtered(manager 팀뷰)/empty/error |
| TA-02 직원 관리 | List + Side Filter + 10 Cols Table + Bulk Upload (file-input) | default/loading/filtered/empty/error |
| TA-03 직원 상세 | Header Cards 2 + Tabs 9 + Form-section | default(기본)/loading/filtered(인사)/empty(권한)/error |
| TA-04 조직도 / 부서 관리 | 3-Pane (Tree + Detail + Members) | default(읽기)/loading/filtered(편집)/empty/error |
| TA-05 근태 관리 | Filter Chips + KPI 4 + 10 Cols Table | default(오늘)/loading/filtered(팀)/empty/error |
| TA-06 근태 수정 요청 | List + Filter + 10 Cols Table + Side Drawer (diff) | default(목록)/loading/filtered(상세)/empty/error |
| TA-07 휴가 관리 | KPI 5 + Calendar Grid (직원×31일) + List Toggle | default(캘린더)/loading/filtered(목록)/empty/error |
| TA-08 휴가 신청 상세 | Info Cards 5 + Approval Timeline + Sticky Action | default(대기)/loading/filtered(진행중)/empty(취소)/error |
| TA-09 결재 / 승인 | Master-Detail Inbox + Tabs (받은/보낸/위임/완료) | default(받은)/loading/filtered(보낸)/empty/error |
| TA-10 급여 / 문서 관리 | Tabs 5 + Bulk Upload (file-input) + Send Monitoring | default(급여)/loading/filtered(인사문서)/empty/error |
| TA-11 문서함 / 전자계약 | List + Filter (v1.2 lock) + 7 Cols Table + Flow Guide | default(전체)/loading/filtered(v1.2)/empty/error |
| TA-12 리포트 | Left Report List + Right Chart Canvas + 52h Warning | default(인력)/loading/filtered(초과근무)/empty/error |
| TA-13 회사 설정 | Vertical Tabs 9 + Form Pane (work/leave/security) | default(근무)/loading/filtered(휴가)/empty(보안 read-only)/error |
| TA-14 외부 연동 | Integration Card Grid (9) + API Key Table | default(채널)/loading/filtered(API Key)/empty/error |

### 패턴 도입 (G3 신규)

- `.profile-card` + `.profile-avatar-lg` + `.summary-grid` (TA-03 헤더)
- `.org-tree` + `.tree-node.is-active` + `.tree-children` (TA-04 트리)
- `.calendar-grid` (160px name + 31일 minmax + weekend variant) + `.leave-badge.l-full/l-half/l-sick` (TA-07)
- `.timeline-step` + `.timeline-marker.is-done/is-pending` (TA-08 결재 라인)
- `.sticky-actions` (TA-08 PWA 결재 sticky footer)
- `.approval-shell` (380px / 1fr) + `.inbox-tabs.is-active` + `.approval-row.is-active` (TA-09)
- `.report-shell` (260px / 1fr) + `.report-item.is-active/is-disabled` + `.chart-grid` (TA-12)
- `.settings-shell` (220px / 1fr) + `.pane-canvas` (TA-13 vert-tabs 변종)
- `.integration-grid` 3-col + `.int-card.is-coming` + `.seg-btn` (TA-14)

### Tenant 사이드바 (8 메뉴 — 05-layouts.md SSOT)

- 대시보드 / 직원 / 근태 / 휴가 / 결재 / 급여·문서 / 리포트 / 설정
- href 실제 경로 (`/admin/employees`, `/admin/leaves/L-NNNN` 등 — placeholder 0)
- 모든 화면 sidebar-footer "v1.0.0-beta · 테넌트 환경"

### CI / 정책 의무 준수

- 인라인 SVG sprite 14 화면 + 외부 `../_design-system/icons.svg` 참조 0건
- `.is-active` variant SSOT (`.active` 금자 — runtime JS + markup)
- native control DS wrap — `.select-wrap` (TA-02/04/13), `.file-input` (TA-02/10), `.date-input` (TA-02/13)
- 화면 inline `<style>`은 page-grid layout만 (컴포넌트 재정의 0건)
- showcase-coverage — component-usage-matrix.json 14 패턴 매핑 의무 준수

### KI 사전 정정 (G3 첫 commit `01c800d`)

- KI-052 (P3) `_layout-shell.html` 외부 sprite 20건 + `_layout-auth.html` 4건 = 24건 정정 후 진입
- CI `inline-svg-sprite-check` 검사 범위 확장 (_design-system/_layout-*.html)

### 다음

- 평가 (evaluator + codex 병렬) → hotfix 사이클 (최대 3회) → PR 머지 → tag wf-v0.3.0
- G4 테넌트 직원 (EM-01~11, 11 화면, wf-v0.4.0)

## [wf-v0.2.0] — 2026-05-16 (G2 운영 완료 + hotfix 진행 중)

### 산출물 (OP-02 ~ OP-12, 11 화면 + 11 analysis)

| ID | 패턴 | 5 상태 |
|----|------|-------|
| OP-02 테넌트 관리 | List + Side Filter + 10 Cols Table | default/loading/filtered/empty/error |
| OP-03 테넌트 상세 | Detail + 3 Header Cards + 8 Tabs | basic/usage/audit/deactivate/not_found |
| OP-04 신규 등록 | 7-Step Wizard Stepper | step1/step3/step5/step7/invite_failed |
| OP-05 구독/요금제 | Plan List + Top Filter + Create/Edit Modal | default/create/edit/inactive/empty |
| OP-06 청구/정산 | KPI 5 + 11 Cols Table + 일괄/환불 모달 | default/overdue_only/batch/refund/empty |
| OP-07 기능 플래그 | Toggle Table + Add/Override/History 모달 | default/modified/add/override/history |
| OP-08 지원 티켓 | Master-Detail + 응답 스레드 + 내부 메모 | list/detail/reply/internal/closed |
| OP-09 감사 로그 | Filter Panel + 10 Cols + Drawer + CSV | default/filtered/drawer/export/empty |
| OP-10 운영 리포트 | KPI 6 + Charts 4 + Heatmap + 상위 테넌트 | month/quarter/year/custom/empty |
| OP-11 시스템 설정 | Vertical Tabs 9 + Switch | general/maintenance/notifications/security/backup |
| OP-12 본인 프로필 | Detail + Tabs 5 + 운영사 보안 강화 | basic/security/sessions/notifications/force_logout |

### 패턴 도입

- `.session-row` is-current/is-staff/default 3 variant
- `.toggle-pill` on/off/beta + `.switch` (38×22 round)
- `.period-chip` active 색상 분기
- `.vert-tab` border-left-active
- `.drawer` 480px slide-in (감사 로그 상세)
- `.diff-before/after` highlight (감사 before→after)

### Hotfix (WI-KI-batch-006, 진행 중)

KI-046 (DS SSOT, P1 both) + KI-047 (모바일, P1 codex) + KI-048 (라우팅, P1 codex) → trigger 도달. system-v3 (아래) 적용 후 DS 보강 + 19 화면 patch + CI 4 job 진행.

### Hotfix3 (WI-KI-batch-006-fix3, 2026-05-17)

hotfix2 통합 판정: evaluator PASS 8.735 + codex FAIL 6.5 (OR 원칙 → BLOCKED_FOR_HOTFIX_3) + PR #5 Playwright Smoke CI FAIL 종합 정정.

**P0-A — JS 외부참조 재주입 정정**:
- CM-01/CM-02/CM-03/OP-12 4 화면 password-toggle JS의 `setAttribute('href', '../_design-system/icons.svg#...')` → `'#i-...'` 인라인 sprite reference로 치환 (codex hotfix2 P0 잔존)

**P0-B — Playwright Smoke false positive 제거**:
- smoke.mjs `iconCheck` / `nativeCheck` 에 `Element.checkVisibility({ checkVisibilityCSS: true })` 가드 추가 — `.state-only` / data-state 토글로 의도된 hidden state element를 invisible/bare 카운트에서 제외 (PR #5 18/20 FAIL의 진짜 root cause)

**P1 — `.active` → `.is-active` SSOT 통일 (rev1 포함)**:
- components.css 9건 (sidebar-item / page-btn / tab / vert-tab / filter-chip / step×2 / legal-toc a)
- _design-tokens.css 3건 (sidebar-item / filter-chip / tab — 레거시 잔존)
- 03-components.md 코드 예제 4건 (filter-chip / tab / step / period-chip)
- OP-08/09 inline `.chip.active` 4건 (style + markup)
- HTML markup: sidebar-item active 12 + chip active 2 + filter-chip active 1 + legal-toc `<a class="active">` 1 = 16건
- **rev1 추가 (evaluator FAIL 후 정정)**:
  - `_showcase.html` 8건 markup (page-btn / tab / vert-tab / filter-chip / step / sidebar-item×3)
  - `_design-system/_layout-shell.html:111` SSOT 템플릿 sidebar-item 1건
  - `component-usage-matrix.json:15` allowed_classes 표기 통일 1건
- 검증: `grep -rnE 'class="[^"]*\bactive\b[^"]*"' .flowset/wireframes/ --exclude-dir=_archive*` literal `.active` 잔존 0건 (총 32 + 10 = 42건 정정)

**CI 보강**:
- `inline-svg-sprite-check`: 패턴을 `['\"]\.\./_design-system/icons\.svg`로 broad화 — HTML attribute + JS literal 모두 검출 (codex 5항목 §17-7-1 확장)

**KI 신규 등록 (P2, NON_BLOCKING)**:
- KI-050 select-wrap 17건 (다음 batch)
- KI-051 showcase-coverage CI 강화 (다음 batch)

### 다음

G3 테넌트 매니저 (TA-01~14, 14 화면, wf-v0.3.0).

## [system-v3] — 2026-05-16 (평가 시스템 v3 — file:// 호환 + 렌더링 검수 + DS 충실도)

산출물 버전 아님 (시스템 강화). Codex 협의 합의안 반영.

### 배경

G2 운영 후 사용자 검수에서 **검증 누락** 발견:
- file:// 외부 SVG `<use>` 차단으로 아이콘 미표시 (OP-01 제외 19 화면)
- `<select>`, `<input type=file>` 등 native control이 디자인 시스템과 시각 불일치 (22건 / 6 화면)
- showcase가 "보여주기용"으로만, 실제 화면 작성 시 매핑 룰 없음

evaluator(PASS 8.11), codex(WARNING 6.8) 둘 다 못 잡음 — 정적 텍스트 분석 한계.

### 변경 (`review-system.md §17` SSOT)

1. **file:// 호환 산출물 계약** — 외부 SVG `<use>` 금지, 인라인 sprite 의무
2. **native control DS 패턴 명시** — `.select-wrap > select.select` / `.file-input > input.sr-only + label/button + filename` / `.date-input > input.input`
3. **Playwright smoke 즉시 도입** — file:// 렌더링 + console error + svg use bbox + native appearance 검사. pixelmatch는 Phase 7 유보.
4. **showcase 사용 매트릭스** — `_design-system/component-usage-matrix.json` 신설 의무
5. **CI 신규 4 job** — `inline-svg-sprite-check` / `native-element-wrap-check` / `showcase-coverage-check` / `playwright-smoke`
6. **evaluator 5번째 축** — Phase 5 와이어프레임 한정 "DS 사용 충실도 10%" (가중치 재조정: 완성도 30→25 / 구체성 25→20)
7. **Hard gate** — file:// 아이콘 미표시 2화면+ → 최대 4점 + WARNING 강제
8. **codex 프롬프트 5항목 의무 체크리스트** — file:// compat / native compliance / showcase consistency / rendered evidence / cross-screen drift

### 적용 범위

Phase 5 와이어프레임 (G1 hotfix + G2 hotfix + G3/G4 + 전체 evaluator). 다른 Phase는 v2 4축 그대로.

### 후속 작업

- G2 hotfix 확장 (`feature/WI-G2-wireframes-operator`): DS 보강 (.select-wrap / .file-input / 인라인 sprite) + 19 화면 patch + CI 4 job + showcase 매트릭스 → wf-v0.2.0 머지

## [wf-v0.1.1] — 2026-05-16 (G1 hotfix — state 토글 flex-direction)

### Hotfix

사용자 검수 시각 결함 — CM-03 "초대 정보 확인" form-section 안 자식들이 가로 row 배치되어 `.invite-info` 폭이 좁아지면서 라벨/value 텍스트 wrap (예: "소속 회사" → "소속 회/사").

**원인**: form-section.state-X 컨테이너에 `display: flex` 적용 시 `flex-direction` 미지정 → 디폴트 row → 자식(form-section-header / invite-info / button) 가로 배치 + 폭 shrink.

**정정**: CM-02 ~ CM-06 + CM-20/21 7 화면 + CM-04 (이미 단일 클래스 변경분) 모두 `display: flex; flex-direction: column;` 통일.

```css
/* before */
body[data-state="invite"] .state-invite { display: flex; }
/* after */
body[data-state="invite"] .state-invite { display: flex; flex-direction: column; }
```

CM-01은 .state-X가 form-section 안 자식 element (.auth-alert)에 붙어 row 배치가 정상 의도 → 변경 없음.

### 영향 화면

- CM-02 비밀번호 찾기 (5 상태 form-section)
- CM-03 최초 활성화 (5 상태 form-section, **사용자 지적 화면**)
- CM-04 2단계 인증 (otp-form + recovery + done)
- CM-05 권한 없음 (5 차단 auth-hero)
- CM-06 오류/점검 (5 분기 auth-hero)
- CM-20 PWA 설치 (ios_old + already_installed form-section)
- CM-21 약관/개인정보 (5 상태 컨테이너)

## [wf-v0.1.0] — 2026-05-16 (G1 최초 진입점 완료, evaluator PASS 8.86)

### evaluator 결과

| 평가 | 점수 | 결과 |
|------|------|------|
| 1회 (`WI-G1-wireframes-auth.eval.md`) | 7.84/10 | FAIL (실행가능성 7.3 < 7.5) |
| 2회 fix1 (`WI-G1-wireframes-auth-fix1.eval.md`) | **8.86/10** | **PASS** (모든 축 8.7+) |

4축 fix1: 완성도 8.8 / 정합성 8.9 / 구체성 9.0 / 실행가능성 8.7. tag `wf-v0.1.0` 부여 (merge commit 3c2f62c).

### 신규 P3 (NON_BLOCKING)

- KI-042 — 08-i18n.md L58 deprecated `system.error.403.title` 예시 표 잔존
- KI-043 — CM-21 L97 `version-change` i18n 키 누락
- KI-044 — CM-04 state-error-alert ancestor 가시성 의존 (CSS specificity 보강 권장)
- KI-045 — CM-03 운영사 skip 버튼 숨김 분기 명세 필요 (Phase 7)



### 산출물

**디자인 시스템 확장 (비인증 영역)**:
- `_design-system/_layout-auth.html` 신설 (헤더 + 메인 + 푸터, AppShell과 별개)
- `components.css` 추가 — auth-shell / auth-header / auth-main / auth-card (+ narrow/wide) / auth-brand / auth-lang-toggle / password-field / password-toggle / auth-alert (info/warning/error/success) / auth-aux / otp-group / otp-input / auth-hero / legal-shell / legal-toc / legal-body / install-grid / install-card
- `icons.svg` 4종 추가 — i-globe / i-eye-off / i-lock / i-smartphone-share
- tooltip 헤더 내 자동 bottom 표시 (사용자 검수 피드백)

**8 비인증 화면 (각 5 상태)**:
- CM-01 로그인 — default/loading/error/locked/success(2FA)
- CM-02 비밀번호 찾기 — step1(이메일) → sent(발송) → step2(재설정) → expired/done
- CM-03 최초 계정 활성화 — invite(정보) → setup(비밀번호+약관) → two_fa(QR+OTP+복구8) → expired/done
- CM-04 2단계 인증 — input(OTP) → loading → error → recovery(복구) → done
- CM-05 권한 없음 (403) — default / role(역할) / tenant(테넌트) / session(만료) / contact(문의)
- CM-06 오류/점검 — not_found(404) / server(500) / maintenance / service_unavailable(503) / network
- CM-20 PWA 설치 가이드 — ios / android / desktop(Tauri) / ios_old / already_installed
- CM-21 약관/개인정보 — terms_ko / privacy_ko / en_reference / force_consent / new_version

**analysis 8 파일** — PRD 매핑 + 상태 매트릭스 + i18n 키 + API 매핑 + Phase 7 변환 가이드

**자동화 체계 (.claude/rules/project.md §6)**:
- PR 머지 후 표준 정리 시퀀스 명시 (checkout main + pull + fetch --prune + tag + branch -d)
- 다음 브랜치 시작 시 항상 최신 main 기준
- CI fail / admin 우회 / 원격 누락 fallback

### CI 게이트

- 모든 화면 5 게이트 통과 (commit-msg / utf8+lf / html-syntax / design-system-ssot / version-format)

### 다음 단계

- G2 운영 (OP-02~12, 11 화면, OP-01 완료분 활용)

## [wf-v0.0.0] — 2026-05-16 (베이스라인)

### 배경

Phase 5 와이어프레임 본격 시작 직전. 누적 변경 (batch-003 / batch-004 / batch-005 + OP-01 시범) 정리 + 버전 체계 도입.

### 변경

**batch-003 (KI-027~031 P1 5건 해소)** — 2026-05-15
- `prd/09-routing.md` 신규 (호스트·서브도메인 + 라우트 인벤토리 + 진입 분기 + 가드 매트릭스)
- `prd/domains/operator/OP-12-profile.md` 신규 (운영사 본인 프로필)
- `prd/domains/common.md` CM-16~22 추가 (헤더 글로벌 4종 + PWA 설치 + 약관 + 온보딩)
- `prd/04-data-model.md` LegalDocument + UserConsent 엔티티 (37 → 39)
- `prd/06-mvp-scope.md` 화면 카운트 36 → 44 (✓ 37 + △ 7)
- `db/erd.md` + `rls.md` + `indexes.md` + `enums.md` + `migrations.md` 컴플라이언스 도메인 보강
- `api/auth.md` + `common.md` + `schemas.md` 라우팅/약관/동의/온보딩/도움말 엔드포인트
- `backlog/stories.md` ST-073~080 (8 신규 / 합계 80 Story / 415 SP)
- `spec/matrix.json` entities 39 + screens 44
- `.claude/agents/evaluator.md` + `contracts/review-rubric.md` Doc 검증 축 보강

**batch-004 (KI-037 디자인 시스템 SSOT — PASS 8.61)** — 2026-05-16
- `wireframes/_design-system/` 12 파일 신규 (README + 7 spec + tokens.css + components.css + icons.svg + _layout-shell.html)
- `wireframes/_showcase.html` 컴포넌트 시연 (29 섹션)
- 16+ 컴포넌트 Anatomy + Props + Variant matrix
- Variable Notation 정책 + SVG 정렬 의무 + IconButton 배지 좌측 anchor + 인접 gap 16+
- EmptyState descendant 누설 차단 (`> svg.ico-empty` direct child)
- Logo + TenantLogo 컴포넌트 신설

**batch-005 (i18n MVP — ko + en 동시)** — 2026-05-16
- `prd/01-personas.md` P8 외국인 근로자 페르소나
- `prd/03-tech-architecture.md` next-intl (ko/en)
- `prd/06-mvp-scope.md` 영어 MVP 포함
- `prd/04-data-model.md` LegalDocument.language + users.locale
- `prd/domains/common.md` CM-15 알림 채널 locale 분기 + CM-16 "언어/Language" 메뉴 + CM-21 ko/en 페어 게시 + 이메일 템플릿 ko/en 10종
- `db/migrations.md` + `db/indexes.md` i18n 컬럼 + system_settings.brand_logo_url + brand_name
- `api/auth.md` + `common.md` + `schemas.md` + `employee.md` + `operator.md` locale API + 우선순위 결정
- `wireframes/_design-system/08-i18n.md` 신규 (정책 + 키 catalog + 컴포넌트 매핑 + Phase 7 next-intl)
- `_design-system/03-components.md` §2-2 i18n + `07-react-mapping.md` §8 next-intl

**OP-01 시범** — 2026-05-16
- `wireframes/html/OP-01.html` 디자인 시스템 적용 시범 (PASS 8.61)
- `wireframes/analysis/OP-01.md` PRD 매핑 분석
- `eval-results/WI-KI-batch-004-design-system.{eval.md,pass}` 평가 결과

**구조 정리** — 2026-05-16
- 구 OP-02~12 HTML 11개 + 구 analysis 11개 → `wireframes/_archive-pre-design-system/` 이동 (KI-041)
- `VERSION` + `CHANGELOG.md` 신설 (Phase 5 와이어프레임 버전 체계 도입)

### Known Issues 상태

- P0/P1/P2 활성: 0건 ✅
- P3 활성: 14건 (KI-005~007/013/016/017/020/023/025/032~036/038/040/041)

### 평가 점수

| Phase | 초안 | 재평가 (batch-003+005 정합) |
|-------|------|---------------------------|
| 1 PRD | 8.15 | 9.13 |
| 2 백로그 | 8.29 | 8.03 |
| 3 ERD | 8.68 | 8.21 |
| 4 API | 8.78 | 8.40 |
| 디자인 시스템 (KI-037) | — | 8.61 PASS |
