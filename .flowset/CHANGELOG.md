# FlowHR 변경 이력 (Phase 5 와이어프레임)

> Phase 5 와이어프레임 작업의 산출물 버전 이력. SemVer 변형 (`wf-vMAJOR.MINOR.PATCH`).
>
> - MAJOR: Phase 5 evaluator PASS 시 1.0.0
> - MINOR: 화면 그룹(G1~G4) 완료
> - PATCH: 그룹 종료 후 결함 핫픽스
>
> Git tag와 1:1 동기화. 산출물 단위는 git에 push되어야 의미가 있음.

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
