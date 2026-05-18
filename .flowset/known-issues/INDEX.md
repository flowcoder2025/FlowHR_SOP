# Known Issues — Registry (SSOT)

> 모든 미해결 알려진 이슈의 단일 진실 출처. 발견 시 즉시 등록, 해결 시 `archive/`로 이동 후 본 표에서 제거.

## 카운트 요약

| 심각도 | 활성 건수 | 트리거 임계 | 트리거 도달 |
|--------|----------|------------|-----------|
| P0 Critical | 0 | 1 | ❌ |
| P1 High | 0 | 3 | ❌ (KI-046/047/048 batch-006-fix3-rev1로 resolved 2026-05-17, wf-v0.2.0 머지) |
| P2 Medium | **5** | 5 | ✅ 트리거 도달 — KI-049/051/054/060/061. KI-053/058 G3 hotfix2~3 resolved + KI-063 WI-G4prep-ci resolved + **KI-050 audit hotfix2 resolved 2026-05-18 (17건 bare select → .select-wrap, 45/45 native-element-wrap-check PASS)**. |
| P3 Low | **31** | 10 | ✅ 트리거 도달 — KI-052 G3 resolved + KI-055~057/062 G3 hotfix + KI-064~067 G4 evaluator + KI-068/069 audit hotfix1 codex/evaluator + **KI-070 audit hotfix2 codex G1 (2026-05-18)** + ~~KI-015~~ resolved + ~~KI-041~~ resolved |

**카운트 갱신 규칙**: 이슈 등록/해결 시 즉시 본 표 재계산. P0 1건 이상이면 즉시 트리거. 누적 건수가 임계 도달 시 `triggers.md §3` 절차 발동.

## 활성 이슈

| KI-ID | 심각도 | 발견 Phase | 영역 | 제목 | 출처 | 등록일 | 상태 |
|-------|--------|-----------|------|------|------|--------|------|
| ~~KI-001~~ | P2 | 1 | API | ~~OP-08 Ticket SLA 알림 트리거~~ | — | — | **resolved (Phase 4 cron.md §2)** |
| ~~KI-002~~ | P2 | 1 | ERD | ~~tenant_drafts 정식 엔티티화 + ERD 스키마~~ | — | — | **resolved (Phase 3 erd.md L114-121)** |
| ~~KI-003~~ | P2 | 1 | API | ~~TA-08 결재 SLA 단계별 트리거~~ | — | — | **resolved (Phase 4 cron.md §2)** |
| ~~KI-004~~ | P3 | 1 | ERD | ~~Attendance.status enum 영문 통일~~ | — | — | **resolved (Phase 3 enums.md + erd.md L334 동기화)** |
| KI-005 | P3 | 1 | Cross-cutting | EmployeeChangeRequest TA-03 변경이력 탭 매핑 보강 검토 (screens_to_entities_map TA-03에 추가됨) — Phase 2 백로그 작성 시 의존성 그래프 확인 | evaluator | 2026-05-15 | scheduled (Phase 2) |
| KI-006 | P3 | 1 | Tech | 로깅 도구 미확정 (Axiom vs Supabase Logs) — Phase 7 진입 전 결정 | 07-risks D-01 | 2026-05-15 | scheduled (Phase 7) |
| KI-007 | P3 | 1 | Tech | 부하 테스트 도구 미확정 (k6 vs Artillery) — Phase 8 진입 전 결정 | 07-risks D-02 | 2026-05-15 | scheduled (Phase 8) |
| ~~KI-008~~ | P2 | 1 | PRD | ~~06-mvp-scope.md TA 섹션 분류 차이~~ | — | — | **resolved (batch-001)** |
| ~~KI-009~~ | P2 | 1 | PRD | ~~OP-11 frontmatter entities 누락~~ | — | — | **resolved (batch-001)** |
| ~~KI-010~~ | P3 | 1 | API | ~~matrix.json TenantDraft.endpoints U 누락~~ | — | — | **resolved (batch-001)** |
| ~~KI-011~~ | P3 | 1 | PRD | ~~04-data-model.md 변경 이력 "26 엔티티" 잔존~~ | — | — | **resolved (batch-001)** |
| ~~KI-012~~ | P3 | 1 | PRD | ~~03-tech-architecture.md i18n "en 추후"~~ | — | — | **resolved (batch-001)** |
| KI-013 | P3 | 2 | Backlog | EP-03/04/05/09/10/11/12 7 Epic Task 분해 미완 — Phase 6 스프린트 계획 진입 전에 완전 분해 필요 | evaluator Phase 2 attempt 1 | 2026-05-15 | scheduled (Phase 6) |
| ~~KI-014~~ | P3 | 2 | Backlog | ~~EP-08 AttendanceModification routing~~ | — | — | **resolved (Phase 3 rls.md §4 Approval polymorphic)** |
| ~~KI-015~~ | P3 | 2 | Backlog | ~~estimation.md 200 MD vs tasks.md 739 MD 환산 차이~~ | evaluator Phase 2 attempt 1 | 2026-05-15 | **resolved (estimation.md L60-63에 정책 명시)** |
| KI-016 | P3 | 2 | Backlog | dependency-graph.md NHN Cloud 30~60일 출처 URL/발행일 부재 — 운영사가 실제 신청 시 NHN Cloud 공식 가이드 URL 인용 보강 | evaluator Phase 2 attempt 2 | 2026-05-15 | scheduled (Phase 9 베타 진입 전 NHN Cloud 신청 시점) |
| KI-017 | P3 | 3 | DB | rls.md §3 37 테이블 정책 표가 "패턴 A/B/C + 자연어" 형식 — 일부 항목 실제 CREATE POLICY SQL 코드 미작성. Phase 7 마이그레이션 00000000000020_rls_policies.sql 작성 시 패턴 변형 SQL 생성 작업 필요 | evaluator Phase 3 | 2026-05-15 | scheduled (Phase 7 마이그레이션 변환) |
| ~~KI-018~~ | P3 | 3 | DB | ~~clock_in_location postgis vs jsonb~~ | — | — | **resolved (Phase 4 schemas.md LocationSchema jsonb)** |
| ~~KI-019~~ | P3 | 3 | DB | ~~approval_lines.conditions zod~~ | — | — | **resolved (Phase 4 schemas.md ConditionRule)** |
| KI-020 | P3 | 3 | DB | 신규 직원 leave_balances 자동 INSERT 트리거 위치 결정 (애플리케이션 vs DB after-trigger) — Phase 7 결정 | evaluator Phase 3 | 2026-05-15 | scheduled (Phase 7) |
| ~~KI-021~~ | P3 | 4 | API | ~~EM-02 PRD §7 body 형식 KI-018 결과 동기화~~ | — | — | **resolved (batch-002)** |
| ~~KI-022~~ | P3 | 4 | API | ~~Common API 카운트 차이~~ | — | — | **resolved (batch-002)** |
| KI-023 | P3 | 4 | API | Signature 엔티티 zod 스키마 — TA-11 v1.2 전자서명 도입 시 작성 | evaluator Phase 4 | 2026-05-15 | scheduled (v1.2) |
| ~~KI-024~~ | P3 | 4 | API | ~~/api-keys owner 파라미터 컨벤션~~ | — | — | **resolved (batch-002)** |
| KI-025 | P3 | 4 | API | Rate Limiting 엔드포인트별 차등 — 운영 시점 실측 후 결정 | evaluator Phase 4 | 2026-05-15 | scheduled (Phase 10) |
| ~~KI-026~~ | P3 | 4 | API | ~~결재 폴리모픽 자식 audit_logs 정책~~ | — | — | **resolved (batch-002)** |
| ~~KI-027~~ | P1 | 5 | PRD | ~~진입점·라우팅 매트릭스 누락~~ | user@Phase5 | 2026-05-15 | **resolved (prd/09-routing.md 신규, batch-003)** |
| ~~KI-028~~ | P1 | 5 | PRD | ~~글로벌 헤더 컴포넌트 명세 누락~~ | user@Phase5 | 2026-05-15 | **resolved (common.md CM-16~19, batch-003)** |
| ~~KI-029~~ | P1 | 5 | PRD | ~~OP-12 운영사 본인 프로필 화면 누락~~ | user@Phase5 | 2026-05-15 | **resolved (operator/OP-12-profile.md, batch-003)** |
| ~~KI-030~~ | P1 | 5 | PRD | ~~시스템/정적 페이지 명세 누락~~ | user@Phase5 | 2026-05-15 | **resolved (CM-20~22 + LegalDocument/UserConsent + 이메일 템플릿, batch-003)** |
| ~~KI-031~~ | P1 | 5 | Process | ~~evaluator 검증 축 부족~~ | user@Phase5 | 2026-05-15 | **resolved (evaluator.md L38/L61-64 + review-rubric.md L91, batch-003)** |
| KI-032 | P3 | 1 (재평가) | PRD | prd/README.md L26/L29/L33 카운트 미갱신 (36→44, 15→22, 11→12) | evaluator Phase 1 rerun | 2026-05-15 | open (1줄 수정, 다음 batch-004) |
| KI-033 | P3 | 1 (재평가) | PRD | prd/03-tech-architecture.md L46 디렉토리 트리 OP-12 + 정적 페이지 라우트 누락 | evaluator Phase 1 rerun | 2026-05-15 | open (1줄 수정, 다음 batch-004) |
| KI-034 | P3 | 2 (재평가) | Backlog | tasks.md L182 / estimation.md L30 합계 stale + dependency-graph.md 신규 8 Story 미반영 + stories.md L6-28 인용 표 헤더 stale + ST-073~080 의존 필드 누락 + README.md L98 표현 stale (6 항목 묶음) | evaluator Phase 2 rerun | 2026-05-15 | open (Phase 6 KI-013과 함께 처리) |
| KI-035 | P3 | 3 (재평가) | DB | seed.md legal v1.0.0 INSERT 누락 + erd.md L692 user_consents tenant_id NULL 엣지케이스 + indexes.md L132 부분 중복 (3 항목 묶음) | evaluator Phase 3 rerun | 2026-05-15 | open (Phase 7 KI-017/020과 함께 처리) |
| KI-036 | P3 | 4 (재평가) | API | auth.md L230 cross-operator sessions 응답 본문 미정의 + cron.md L65-83 tenant_settings.value jsonb 경로 정합 미확인 + common.md L111 KI-026 정책 정합 Phase 7 재검증 (3 항목 묶음) | evaluator Phase 4 rerun | 2026-05-15 | open (Phase 7과 함께 처리) |
| ~~KI-037~~ | P1 | 5 | Wireframe | ~~디자인 시스템 SSOT 부재~~ | 사용자 지적 | 2026-05-16 | **resolved (batch-004 evaluator PASS 8.61, archive 예정)** |
| KI-038 | P3 | 5 | Wireframe | OP-01.html icon-btn/sidebar-item/profile-trigger svg attribute가 컴포넌트 강제 사이즈와 불일치 — _layout-shell 갱신 따라 화면별 attribute 일치 필요 (차기 batch-005에서 OP-02~12 + TA + EM + CM 일괄) | evaluator batch-004 | 2026-05-16 | open (batch-005) |
| ~~KI-039~~ | P3 | 5 | Wireframe | ~~_showcase.html 누락 컴포넌트~~ | evaluator batch-004 | 2026-05-16 | **resolved (12 컴포넌트 시연 추가: Checkbox/Breadcrumb/Tooltip/Popover/FormRow+FormSection+InfoRow/Sidebar 미니어처 3 역할/Header AppShell/Footer/MaintenanceBanner/SessionRow/Code, 사용자 우려 후 추가 4 = batch-005-i18n과 함께 처리 2026-05-16)** |
| KI-040 | P3 | 5 | Wireframe | wireframes/README.md L19~L21/L37/L64 구 SSOT(`_design-tokens.css`/`_icons.css`/`_icons.svg`) 참조 잔존 — `_design-system/` 신 SSOT로 갱신 필요 | evaluator batch-004 | 2026-05-16 | open (batch-005) |
| ~~KI-041~~ | P3 | 5 | Wireframe | ~~html/ 디렉토리 구 _design-tokens.css/_icons.css/_icons.svg + OP-02~12 12 HTML 잔존~~ | evaluator batch-004 | 2026-05-16 | **resolved (G0 baseline — archive 처리 완료)** |
| KI-042 | P3 | 5 | Wireframe | 08-i18n.md L58 §2 키 컨벤션 예시 표에 `system.error.403.title` deprecated 키 한 줄 잔존 — §4 catalog L157 정식 키 + §9 deprecation note와 미세 불일치. 예시 표 성격으로 차단 사유 아님 | evaluator G1-fix1 | 2026-05-16 | open (wf-v0.1.1 또는 G2 작업 시) |
| KI-043 | P3 | 5 | Wireframe | CM-21.html L97 `<span class="version-change">하이라이트</span>` i18n 매핑 누락 — `legal.terms.version_change_label` 키 추가 권장 | evaluator G1-fix1 | 2026-05-16 | open (wf-v0.1.1 hotfix) |
| KI-044 | P3 | 5 | Wireframe | CM-04.html .state-error-alert / .state-loading-spinner 가 .state-otp-form 자손 → 부모 hidden 시 ancestor 가시성에 의존. CSS selector 명시성 보강 권장 (`body[data-state="error"] .state-otp-form .state-error-alert`) | evaluator G1-fix1 | 2026-05-16 | open (wf-v0.1.1) |
| KI-045 | P3 | 5 | Wireframe | CM-03.html 운영사 계정 활성화 시 "건너뛰기 (직원)" 버튼 숨김 처리 미명시 — 와이어프레임에서는 두 버튼 항상 표시. Phase 7 React 변환 시 `users.role === 'operator_*'` 조건 분기 명세 | evaluator G1 | 2026-05-16 | open (Phase 7) |
| ~~KI-046~~ | P1 | 5 | Wireframe | ~~DS SSOT 위반 — components.css 미등록 + 화면별 인라인 재정의~~ | both | 2026-05-16 | **resolved (batch-006-fix3-rev1 / wf-v0.2.0 / 2026-05-17, components.css 11 컴포넌트 정식 등록 + inline 재정의 0건)** |
| ~~KI-047~~ | P1 | 5 | Wireframe | ~~모바일 반응형 부재 (@media 768px 없음)~~ | codex | 2026-05-16 | **resolved (batch-006-fix / wf-v0.2.0 / 2026-05-17, components.css @media 768px 추가)** |
| ~~KI-048~~ | P1 | 5 | Wireframe | ~~라우팅 href placeholder / cross-link 부재~~ | codex | 2026-05-16 | **resolved (batch-006-fix / wf-v0.2.0 / 2026-05-17, href 159건 추가 — 사이드바 97 + dropdown 5 + row 5 + footer 24 + other 28)** |
| KI-049 | P2 | 5 | Wireframe | analysis 권한 매트릭스 11화면 중 7화면 누락 (OP-04/05/06/08/10/11/12) — PRD엔 있으나 analysis 재인용 부재. wf-v0.2.0 hotfix 또는 G3 진행 시 일괄 보강. | evaluator | 2026-05-16 | open (G3 batch 또는 차기 batch) |
| ~~KI-050~~ | P2 | 5 | Wireframe | ~~`.select-wrap` 미적용 17건~~ | codex hotfix2 §17-7-2 | 2026-05-17 | **resolved (audit hotfix2 2026-05-18 — 17건 모두 `.select-wrap` 적용 + select-sm variant, OP-02/05/06/07/11 정정)** |
| KI-051 | P2 | 5 | Process | CI `showcase-coverage-check` job이 anchor 존재만 보고 컴포넌트 사용 일관성을 검증하지 못함 — false negative. 화면이 실제 사용하는 DS 클래스가 component-usage-matrix.json의 patterns에 매핑되어 있는지 cross-check 필요. | codex hotfix2 §17-7-4 | 2026-05-17 | open (다음 batch) |
| ~~KI-052~~ | P3 | 5 | Wireframe | ~~`_design-system/_layout-shell.html` 외부 sprite 참조 20건 잔존~~ | evaluator hotfix3-rev1 | 2026-05-17 | **resolved (G3 진입 commit 01c800d / 2026-05-17, _layout-shell + _layout-auth 24건 인라인 sprite reference 정정 + CI 검사 범위 확장)** |
| ~~KI-053~~ | P2 | 5 | Wireframe | ~~G3 신규 9 패턴 _showcase.html demo + 03-components.md 사양 미등록~~ | evaluator G3 hotfix1 | 2026-05-18 | **resolved (G3 hotfix2 commit 5e0b028 / 2026-05-18 — _showcase.html 9/9 + 03-components.md §G3.1~G3.9 9/9 등록 완료)** |
| KI-054 | P2 | 5 | Wireframe | icon-only 버튼 다수가 `aria-label` 없이 `data-tooltip`만 사용 — WCAG 2.1 AA 결함. 화면 일괄 sed 또는 components.css icon-btn 등록 시 aria-label 의무 패턴 명시. | codex G3-CDX-006 | 2026-05-18 | open (차기 batch) |
| KI-055 | P3 | 5 | Wireframe | TA-01 공지 5건 → `/admin/notices` 가짜 base + TA-10 급여/인사문서 9건 → `/admin/documents/D-2026` + TA-11 계약 5건 → `/admin/contracts/CT-2026` 가짜 base path. Phase 7 실제 ID 매핑 필요. | claude G3 hotfix1 | 2026-05-18 | scheduled (Phase 7) |
| KI-056 | P3 | 5 | Wireframe | footer 도움말 `/help` + 운영팀 문의 `/support` 라우트 — 14 화면 footer 28건 일괄 추가했으나 05-layouts.md helpers SSOT 미명시. | claude G3 hotfix1 | 2026-05-18 | open (차기 docs batch) |
| KI-057 | P3 | 5 | Wireframe | G2 화면 OP-02~12의 모바일 미디어 쿼리 부재 (G3 패턴만 components.css `@media (max-width: 768px)` 단열). G4 또는 Phase 5 전체에서 일괄 보강. | claude G3 hotfix1 partial resolve | 2026-05-18 | open (G4 또는 Phase 5 전체) |
| ~~KI-058~~ | P2 | 5 | Wireframe | ~~`--color-accent-bg` 토큰 미정의 — components.css 8 클래스 참조 fallback 없음 (.vert-tab.is-active / .approval-row.is-active / .report-item.is-active / .step.is-active / .master-item.is-active / .auth-alert-info / .install-card.is-active / .config-card.is-active)~~ | evaluator G3 hotfix2 | 2026-05-18 | **resolved (G3 hotfix3 — tokens.css L14 `--color-accent-bg: #EFF6FF;` 1줄 추가)** |
| ~~KI-059~~ | P3 | 5 | Wireframe | ~~`.vert-tab.is-active` 중복 정의 (components.css L408 light vs L885 bg) — cascade 충돌~~ | evaluator G3 hotfix2 | 2026-05-18 | **resolved (G3 hotfix3 — L408 기존 정의 제거, L885 §G3 SSOT 유지)** |
| KI-060 | P2 | 5 | Wireframe | TA-13.html:40 font-weight: 600 vs components.css L766 `.vert-tab.is-active { font-weight: 700 }` declaration drift. TA-13 L31 주석 "components.css에 등록된 .is-active 4 속성을 그대로 합성" 단언이 1 속성 (font-weight) 불일치. 정정: TA-13 L40 700 통일 또는 declaration 자체 제거 + body[data-state] selector + .is-active class 토글. | evaluator G3 hotfix3 + codex (CONDITIONAL) | 2026-05-18 | open (차기 docs batch) |
| KI-061 | P2 | 5 | Wireframe | components.css L399~L510 vs L683~L770 — 7 base 셀렉터 (.tab/.vert-tab/.vert-tabs/.modal-header/.modal-footer/.step/.stepper) 중복 정의 systemic 잔존. `.tab.is-active` L402(600+primary) vs L754(700+accent) 명확한 4 속성 충돌. cascade로 G3 후자 승리하나 SSOT 위반. KI-059는 `.vert-tab.is-active` 변종만 해소. | evaluator G3 hotfix3 + codex (P2 격상) | 2026-05-18 | open (G4 또는 차기 docs batch) |
| KI-062 | P3 | 5 | Wireframe | .pass marker 0 bytes (의도된 빈 마커이나 codex 지적) + Playwright 렌더 증거는 CI playwright-smoke 결과 (PR merge 시점 자동 생성)로 충족 — analysis md에 "Playwright smoke 결과 의무" 명시 권장. | codex G3 hotfix3 | 2026-05-18 | open (차기 docs batch) |
| ~~KI-063~~ | P2 | 5 | Process | ~~CI `inline-svg-sprite-check`가 sprite block 존재만 검사하고 사용된 use href ↔ 정의된 symbol id cross-check 미실시~~ | G3 PR #9/#10 사고 교훈 | 2026-05-18 | **resolved (WI-G4prep-ci 2026-05-18 — pr-checks.yml `inline-svg-sprite-check` §3 cross-check 추가, 로컬 34/34 화면 PASS)** |
| KI-064 | P3 | 5 | Wireframe | EM-11 사이드바 비표시 (PRD `mvp: partial` 정합) 시각 분기 부재 — 화면은 active=결재로 시연하나 MVP에서는 EM-11 사이드바 항목 자체 비표시 (현재 active=결재만으로 약함). 사이드바에 EM-11 항목을 v1.1 placeholder로 추가 + state=mvp 시 hidden 변형 권장. | evaluator G4 | 2026-05-18 | open (차기 docs batch) |
| KI-065 | P3 | 5 | Wireframe | EM-03 `.calc-val is-emphasis` variant 부재 — calc-summary "사용일수" row의 큰 강조 (22px+ accent)가 inline `style="font-size:22px..."` 우회 처리. components.css §G4.4에 `.calc-val.is-emphasis { font-size: 22px; font-weight: 700; color: var(--color-accent); }` variant 추가 권장. | evaluator G4 | 2026-05-18 | open (차기 docs batch) |
| KI-066 | P3 | 5 | Wireframe | EM-09 `vert-tab data-tab="security"` 중복 — state 분기 시각화 위해 2개 정의 (1개는 state-only.state-security, 1개는 state-default/pending/error). Phase 7 React 변환 시 key 충돌 — 단일 element + state 토글 또는 data-tab 다른 식별자 사용 권장. | evaluator G4 | 2026-05-18 | open (Phase 7) |
| KI-067 | P3 | 5 | Wireframe | 페이지 한정 grid 컴포넌트화 후보 — `dash-row`/`dash-row-3`/`att-top`/`leave-grid`/`leave-kpi-row`/`leave-chart-row`/`cert-grid`/`profile-grid` 등 8개 grid layout이 G2~G4 반복. G5 또는 Phase 7 컴포넌트화 검토 (예: `.grid-2col` `.grid-3col` 패턴 토큰). | evaluator G4 | 2026-05-18 | open (G5 또는 Phase 7) |
| KI-068 | P3 | 5 | Wireframe | OP 모달 title `<h2>` inline-styled (G2 leftover) — `.modal-title` SSOT 미적용. G2 OP 화면 일부 모달이 `<div class="modal-header"><h2 style="...">제목</h2>` 패턴 유지. audit hotfix2 또는 Phase 7 React 변환 시 일괄 정정. | codex SAMP-P3-001 audit hotfix1 | 2026-05-18 | open (차기 docs batch) |
| KI-069 | P3 | 5 | Wireframe | KI-049 audit hotfix1 보강 일부 backtick 텍스트 손상 — 16 화면 권한 매트릭스 § 텍스트 정정 필요 (CM-01만 audit hotfix2 정정 완료, 나머지 15건 잔존). | evaluator audit hotfix1 NON_BLOCKING | 2026-05-18 | open (차기 docs batch) |
| KI-070 | P3 | 5 | Wireframe | inline svg width/height attribute 누락 — `<svg class="ico">` 패턴 (CSS `.ico { width: 16; height: 16 }`로 시각 보정되나 file:// fallback 계약 불일치). 다수 화면 광범위 영향. | codex G1-PHASE5-CDX-004 audit hotfix2 | 2026-05-18 | open (차기 docs batch) |

## 등록 형식

이슈를 추가할 때 위 표에 한 행 추가 + 본 파일 하단에 상세 블록을 작성:

```markdown
### KI-NNN — {제목}

- **심각도**: P0 | P1 | P2 | P3
- **발견 Phase**: 0~10 또는 "operations"
- **영역**: PRD / Backlog / ERD / API / Wireframe / Sprint / Code / QA / Beta / Ops / Cross-cutting
- **출처**: evaluator (eval-results/phase-N.eval.md) / 사용자 / 베타 / 운영 / Claude 발견
- **등록일**: YYYY-MM-DD
- **상태**: open | scheduled | in_progress
- **영향**: {영향받는 기능/모듈/사용자}
- **근거**: {파일:줄번호 또는 인용}
- **권장 조치**: {구체적 수정 방향}
- **batch 후보**: WI-KI-batch-NNN (트리거 도달 시 할당)
```

## 해결 흐름

1. 트리거 도달 (P0 즉시 / P1 3건 / P2 5건 / P3 10건 / Phase 종료 / 사용자 명시)
2. `WI-KI-batch-NNN` 생성하여 fix_plan.md에 추가
3. 묶음 수정 진행 (코드 / 문서 영역별로)
4. 해결된 이슈를 `archive/YYYY-MM-DD-batch-NNN.md`로 이동
5. 본 INDEX.md 활성 표에서 제거, 카운트 표 갱신
6. 해당 영역 evaluator 재호출하여 PASS 재확인
7. `.flowset/eval-results/phase-N.pass` 마커 갱신 (필요 시)

## 카운트 자동 검사 (수동 절차, 라이트)

매 작업 종료 시 Claude가:
1. 본 표의 활성 건수 재계산
2. 트리거 임계 도달 여부 확인
3. 도달 시 사용자에게 "트리거 도달 — batch 진행 권장" 보고
