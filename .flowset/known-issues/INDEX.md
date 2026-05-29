# Known Issues — Registry (SSOT)

> 모든 미해결 알려진 이슈의 단일 진실 출처. 발견 시 즉시 등록, 해결 시 `archive/`로 이동 후 본 표에서 제거.

## 카운트 요약

| 심각도 | 활성 건수 | 트리거 임계 | 트리거 도달 |
|--------|----------|------------|-----------|
| P0 Critical | 0 | 1 | ❌ |
| P1 High | **1** | 3 | ❌ 임계 미달 — 활성: **KI-078** (WI-020 분산 무차별대입 하드닝 — CAPTCHA+per-IP 429+TOCTOU, 인증 하드닝 WI, 사용자 defer 2026-05-29). **WI-019 Day8~10 resolved: ~~KI-077~~ (composite FK 핵심부 적용 + staging T5 실증)**. |
| P2 Medium | **5** | 5 | ✅ 트리거 도달 — 활성: KI-054 / KI-061 (둘 다 **Phase 7 React 변환 scheduled** — IconButton aria-label / Stepper 컴포넌트화) + **KI-079** (WI-020 rememberMe 세션 TTL 미반영, 세션관리 ST-005) + **KI-092** (WI-020-2 ST-078 AC-5 운영사 감사 미구현, OP-09 audit WI) + **KI-094** (WI-020-3 maintenance message_en 컬럼 부재 — 운영사 점검 본문 ko 단일, 글로벌 출시 전). **WI-KI-batch-008-wf resolved: ~~KI-049~~ (권한매트릭스 15화면) + ~~KI-060~~ (TA-13 font-weight)**. (이전 resolved: ~~KI-050/051/053/058/063/071/076~~) |
| P3 Low | **37** | 10 | ✅ 트리거 도달 — 활성: KI-005/006/007/016/017/020/023/025/035/036/045/055/066/067/072/073 + **WI-020: KI-080/081/082/083** + **WI-019 Day8~10: KI-084/085/086/087** + **WI-021: KI-088/089** + **WI-021-1: KI-090** + **WI-020-2: KI-091** + **WI-020-3: KI-093/095/096** + **Phase 7 scheduled 재분류 6건 (batch-008): KI-038/054(P2)/057/061(P2)/064/065/068/070 svg·aria·모달·stepper·반응형 — React 변환 시 해소**. **WI-KI-batch-008-wf resolved: ~~KI-043~~(CM-21 i18n) + ~~KI-044~~(CM-04 selector) + ~~KI-069~~(권한매트릭스 표 구조 15화면)**. (batch-007 resolved 8건 + 이전 분) |

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
| ~~KI-013~~ | P3 | 2 | Backlog | ~~EP-03/04/05/09/10/11/12 7 Epic Task 분해 미완 — Phase 6 스프린트 계획 진입 전에 완전 분해 필요~~ | evaluator Phase 2 attempt 1 | 2026-05-15 | **resolved (Phase 6 진입 전 의무, 2026-05-19 — tasks.md TS-084~220 신규 137 Task 분해 + ST-073~080 26 Task 보강 → 합계 80 Story / 223 Task / 838 MD)** |
| ~~KI-014~~ | P3 | 2 | Backlog | ~~EP-08 AttendanceModification routing~~ | — | — | **resolved (Phase 3 rls.md §4 Approval polymorphic)** |
| ~~KI-015~~ | P3 | 2 | Backlog | ~~estimation.md 200 MD vs tasks.md 739 MD 환산 차이~~ | evaluator Phase 2 attempt 1 | 2026-05-15 | **resolved (estimation.md L60-63에 정책 명시)** |
| KI-016 | P3 | 2 | Backlog | dependency-graph.md NHN Cloud 30~60일 출처 URL/발행일 부재 — 운영사가 실제 신청 시 NHN Cloud 공식 가이드 URL 인용 보강 | evaluator Phase 2 attempt 2 | 2026-05-15 | scheduled (**NHN DEFER — 옵션 활성 테넌트 발생 또는 고객 계약 조건 시 신청, `guardrails.md §10`**. 신청 시점에 NHN 공식 가이드 URL 인용 보강) |
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
| ~~KI-032~~ | P3 | 1 (재평가) | PRD | ~~prd/README.md L26/L29/L33 카운트 미갱신 (36→44, 15→22, 11→12)~~ | evaluator Phase 1 rerun | 2026-05-15 | **resolved (WI-KI-batch-007-docs — README.md 44화면 / 22종 / 12개 정정)** |
| ~~KI-033~~ | P3 | 1 (재평가) | PRD | ~~prd/03-tech-architecture.md L46 디렉토리 트리 OP-12 + 정적 페이지 라우트 누락~~ | evaluator Phase 1 rerun | 2026-05-15 | **resolved (WI-KI-batch-007-docs — (auth)/(legal)/(operator OP-01~12) 정정)** |
| ~~KI-034~~ | P3 | 2 (재평가) | Backlog | ~~tasks.md L182 / estimation.md L30 합계 stale + dependency-graph.md 신규 8 Story 미반영 + stories.md L6-28 인용 표 헤더 stale + ST-073~080 의존 필드 누락 + README.md L98 표현 stale (6 항목 묶음)~~ | evaluator Phase 2 rerun | 2026-05-15 | **resolved (Phase 6 진입 전 의무, 2026-05-19 — 5 파일 정정: tasks.md 223 Task/838 MD + estimation.md 415 SP/218 MD + dependency-graph.md ST-073~080 의존 절 + stories.md 80 Story 헤더/인용 표 + backlog/README.md 45 화면)** |
| KI-035 | P3 | 3 (재평가) | DB | seed.md legal v1.0.0 INSERT 누락 + erd.md L692 user_consents tenant_id NULL 엣지케이스 + indexes.md L132 부분 중복 (3 항목 묶음) | evaluator Phase 3 rerun | 2026-05-15 | open (Phase 7 KI-017/020과 함께 처리) |
| KI-036 | P3 | 4 (재평가) | API | auth.md L230 cross-operator sessions 응답 본문 미정의 + cron.md L65-83 tenant_settings.value jsonb 경로 정합 미확인 + common.md L111 KI-026 정책 정합 Phase 7 재검증 (3 항목 묶음) | evaluator Phase 4 rerun | 2026-05-15 | open (Phase 7과 함께 처리) |
| ~~KI-037~~ | P1 | 5 | Wireframe | ~~디자인 시스템 SSOT 부재~~ | 사용자 지적 | 2026-05-16 | **resolved (batch-004 evaluator PASS 8.61, archive 예정)** |
| KI-038 | P3 | 5 | Wireframe | icon-btn/sidebar-item/profile-trigger svg attribute가 컴포넌트 강제 사이즈와 불일치 — 화면별 attribute 일치 필요 (OP-02~12 + TA + EM + CM 일괄, 전화면) | evaluator batch-004 | 2026-05-16 | scheduled (**Phase 7 React 변환 — KI-070과 동일 전화면 svg attribute 문제. Icon/IconButton 컴포넌트화로 일괄 해소. batch-008 초기 분류 정정: 전화면이라 이중작업 회피 위해 Phase 7 이관**) |
| ~~KI-039~~ | P3 | 5 | Wireframe | ~~_showcase.html 누락 컴포넌트~~ | evaluator batch-004 | 2026-05-16 | **resolved (12 컴포넌트 시연 추가: Checkbox/Breadcrumb/Tooltip/Popover/FormRow+FormSection+InfoRow/Sidebar 미니어처 3 역할/Header AppShell/Footer/MaintenanceBanner/SessionRow/Code, 사용자 우려 후 추가 4 = batch-005-i18n과 함께 처리 2026-05-16)** |
| ~~KI-040~~ | P3 | 5 | Wireframe | ~~wireframes/README.md L19~L21/L37/L64 구 SSOT(`_design-tokens.css`/`_icons.css`/`_icons.svg`) 참조 잔존~~ | evaluator batch-004 | 2026-05-16 | **resolved (WI-KI-batch-007-docs — `_design-system/` 신 SSOT로 디렉토리 트리/§2/§5.0 정정)** |
| ~~KI-041~~ | P3 | 5 | Wireframe | ~~html/ 디렉토리 구 _design-tokens.css/_icons.css/_icons.svg + OP-02~12 12 HTML 잔존~~ | evaluator batch-004 | 2026-05-16 | **resolved (G0 baseline — archive 처리 완료)** |
| ~~KI-042~~ | P3 | 5 | Wireframe | ~~08-i18n.md L58 `system.error.403.title` deprecated 키 한 줄 잔존~~ | evaluator G1-fix1 | 2026-05-16 | **resolved (WI-KI-batch-007-docs — `system.error.forbidden.title` 정식 키로 정정, §9 deprecation 정합)** |
| ~~KI-043~~ | P3 | 5 | Wireframe | ~~CM-21.html version-change span i18n 매핑 누락~~ | evaluator G1-fix1 | 2026-05-16 | **resolved (WI-KI-batch-008-wf — 08-i18n.md catalog에 `legal.terms.version_change_label` 키 등록 + CM-21 매핑)** |
| ~~KI-044~~ | P3 | 5 | Wireframe | ~~CM-04.html .state-error-alert / .state-loading-spinner CSS selector 명시성 (.state-otp-form ancestor)~~ | evaluator G1-fix1 | 2026-05-16 | **resolved (WI-KI-batch-008-wf — `body[data-state="error"] .state-otp-form .state-error-alert` 명시성 보강)** |
| KI-045 | P3 | 5 | Wireframe | CM-03.html 운영사 계정 활성화 시 "건너뛰기 (직원)" 버튼 숨김 처리 미명시 — 와이어프레임에서는 두 버튼 항상 표시. Phase 7 React 변환 시 `users.role === 'operator_*'` 조건 분기 명세 | evaluator G1 | 2026-05-16 | open (Phase 7) |
| ~~KI-046~~ | P1 | 5 | Wireframe | ~~DS SSOT 위반 — components.css 미등록 + 화면별 인라인 재정의~~ | both | 2026-05-16 | **resolved (batch-006-fix3-rev1 / wf-v0.2.0 / 2026-05-17, components.css 11 컴포넌트 정식 등록 + inline 재정의 0건)** |
| ~~KI-047~~ | P1 | 5 | Wireframe | ~~모바일 반응형 부재 (@media 768px 없음)~~ | codex | 2026-05-16 | **resolved (batch-006-fix / wf-v0.2.0 / 2026-05-17, components.css @media 768px 추가)** |
| ~~KI-048~~ | P1 | 5 | Wireframe | ~~라우팅 href placeholder / cross-link 부재~~ | codex | 2026-05-16 | **resolved (batch-006-fix / wf-v0.2.0 / 2026-05-17, href 159건 추가 — 사이드바 97 + dropdown 5 + row 5 + footer 24 + other 28)** |
| ~~KI-049~~ | P2 | 5 | Wireframe | ~~analysis 권한 매트릭스 7화면 누락 (OP-04/05/06/08/10/11/12)~~ | evaluator | 2026-05-16 | **resolved (WI-KI-batch-008-wf — 7화면 + CM-02~21 합계 15화면 권한 매트릭스 역할\|권한 2열 구조로 작성. KI-069와 동시 해소)** |
| ~~KI-050~~ | P2 | 5 | Wireframe | ~~`.select-wrap` 미적용 17건 (실측 16건 + OP-04 누락 1건 + _showcase 본체 4건 = 총 21건)~~ | codex hotfix2 §17-7-2 + audit hotfix2 G2 재검수 + evaluator audit hotfix2 P0/P1 | 2026-05-17 | **resolved (audit hotfix3 2026-05-18 — 21건 모두 `.select-wrap` 적용: hotfix2 16건 OP-02/05/06/07/11 + hotfix3 OP-04:179 1건 + hotfix3 _showcase L386/529/618/809 4건. CI 강화 PASS)** |
| ~~KI-051~~ | P2 | 5 | Process | ~~CI `showcase-coverage-check` anchor만 검사 — false negative (KI-050 OP-04 미검출 증명)~~ | codex hotfix2 §17-7-4 + evaluator audit hotfix2 P2 | 2026-05-17 | **resolved (audit hotfix3 2026-05-18 — `.github/workflows/pr-checks.yml` native-element-wrap-check job에 `.select-wrap` parent 검증 추가, awk 직전 5줄 검사. OP-04 같은 누락 향후 차단)** |
| ~~KI-052~~ | P3 | 5 | Wireframe | ~~`_design-system/_layout-shell.html` 외부 sprite 참조 20건 잔존~~ | evaluator hotfix3-rev1 | 2026-05-17 | **resolved (G3 진입 commit 01c800d / 2026-05-17, _layout-shell + _layout-auth 24건 인라인 sprite reference 정정 + CI 검사 범위 확장)** |
| ~~KI-053~~ | P2 | 5 | Wireframe | ~~G3 신규 9 패턴 _showcase.html demo + 03-components.md 사양 미등록~~ | evaluator G3 hotfix1 | 2026-05-18 | **resolved (G3 hotfix2 commit 5e0b028 / 2026-05-18 — _showcase.html 9/9 + 03-components.md §G3.1~G3.9 9/9 등록 완료)** |
| KI-054 | P2 | 5 | Wireframe | icon-only 버튼 다수가 `aria-label` 없이 `data-tooltip`만 사용 — WCAG 2.1 AA 결함. | codex G3-CDX-006 | 2026-05-18 | scheduled (**Phase 7 React 변환 — `packages/ui` IconButton 컴포넌트에 aria-label 필수 prop 패턴. 와이어프레임 HTML 일괄 수정 시 React 재작성으로 폐기되므로 이중작업 회피, 사용자 결정 2026-05-19**) |
| KI-055 | P3 | 5 | Wireframe | TA-01 공지 5건 → `/admin/notices` 가짜 base + TA-10 급여/인사문서 9건 → `/admin/documents/D-2026` + TA-11 계약 5건 → `/admin/contracts/CT-2026` 가짜 base path. Phase 7 실제 ID 매핑 필요. | claude G3 hotfix1 | 2026-05-18 | scheduled (Phase 7) |
| ~~KI-056~~ | P3 | 5 | Wireframe | ~~footer 도움말 `/help` + 운영팀 문의 `/support` 라우트 — 05-layouts.md helpers SSOT 미명시~~ | claude G3 hotfix1 | 2026-05-18 | **resolved (WI-KI-batch-007-docs — 05-layouts.md footer helpers 라우트 SSOT 명시: /legal/terms·/legal/privacy·/help·/support)** |
| KI-057 | P3 | 5 | Wireframe | G2 화면 OP-02~12의 모바일 미디어 쿼리 부재 (G3 패턴만 components.css `@media (max-width: 768px)`). | claude G3 hotfix1 partial resolve | 2026-05-18 | scheduled (**Phase 7 React 변환 — 반응형은 packages/ui 컴포넌트 + Tailwind breakpoint로 재작성. 와이어프레임 @media 지금 추가해도 React 재작성 시 폐기, 이중작업 회피, 사용자 결정 2026-05-19**) |
| ~~KI-058~~ | P2 | 5 | Wireframe | ~~`--color-accent-bg` 토큰 미정의 — components.css 8 클래스 참조 fallback 없음 (.vert-tab.is-active / .approval-row.is-active / .report-item.is-active / .step.is-active / .master-item.is-active / .auth-alert-info / .install-card.is-active / .config-card.is-active)~~ | evaluator G3 hotfix2 | 2026-05-18 | **resolved (G3 hotfix3 — tokens.css L14 `--color-accent-bg: #EFF6FF;` 1줄 추가)** |
| ~~KI-059~~ | P3 | 5 | Wireframe | ~~`.vert-tab.is-active` 중복 정의 (components.css L408 light vs L885 bg) — cascade 충돌~~ | evaluator G3 hotfix2 | 2026-05-18 | **resolved (G3 hotfix3 — L408 기존 정의 제거, L885 §G3 SSOT 유지)** |
| ~~KI-060~~ | P2 | 5 | Wireframe | ~~TA-13.html:40 font-weight 600 vs components.css `.vert-tab.is-active` 700 drift~~ | evaluator G3 hotfix3 + codex (CONDITIONAL) | 2026-05-18 | **resolved (WI-KI-batch-008-wf — TA-13 L40 font-weight 600→700, components.css SSOT 4속성 일치)** |
| KI-061 | P2 | 5 | Wireframe | components.css stepper/step 중복 + **batch-008 추가 발견: EM-03/EM-08 stepper가 미정의 클래스 `.step-body`/`.step-title`/`.step-sub` 사용 (components.css 정의 0건) → 미스타일 렌더**. `.tab.is-active`/`.modal-header`/`.vert-tab` 중복은 이전 hotfix 해소 확인. 잔존: `.step`/`.stepper` G2 dead code(L509-522) + 미정의 step 자식 클래스. | evaluator G3 hotfix3 + codex + batch-008 검증 | 2026-05-18 | scheduled (**Phase 7 React 변환 — packages/ui Stepper 컴포넌트화 시 G2 dead code 제거 + step 자식 구조 정합 일괄 해소. 와이어프레임 CSS 대수술 후 React 재작성 시 폐기, 이중작업 회피, 사용자 결정 2026-05-19**) |
| ~~KI-062~~ | P3 | 5 | Wireframe | ~~.pass marker 0 bytes + Playwright 렌더 증거 analysis md 명시 권장~~ | codex G3 hotfix3 | 2026-05-18 | **resolved (WI-KI-batch-007-docs — wireframes/README.md §렌더 증거 정책 추가: CI playwright-smoke artifact = 렌더 검증 + 빈 .pass 마커 의도 명시)** |
| ~~KI-063~~ | P2 | 5 | Process | ~~CI `inline-svg-sprite-check`가 sprite block 존재만 검사하고 사용된 use href ↔ 정의된 symbol id cross-check 미실시~~ | G3 PR #9/#10 사고 교훈 | 2026-05-18 | **resolved (WI-G4prep-ci 2026-05-18 — pr-checks.yml `inline-svg-sprite-check` §3 cross-check 추가, 로컬 34/34 화면 PASS)** |
| KI-064 | P3 | 5 | Wireframe | EM-11 사이드바 비표시 (PRD `mvp: partial`) 시각 분기 부재 — 사이드바 EM-11 항목 v1.1 placeholder + state=mvp hidden 변형 권장. | evaluator G4 | 2026-05-18 | scheduled (**Phase 7 React 변환 — Sidebar 컴포넌트 role/mvp 조건 분기. 이중작업 회피, 사용자 결정 2026-05-19**) |
| KI-065 | P3 | 5 | Wireframe | EM-03 `.calc-val.is-emphasis` variant 부재 — calc-summary "사용일수" 큰 강조가 inline style 우회. | evaluator G4 | 2026-05-18 | scheduled (**Phase 7 React 변환 — CalcSummary 컴포넌트 emphasis variant prop. 이중작업 회피, 사용자 결정 2026-05-19**) |
| KI-066 | P3 | 5 | Wireframe | EM-09 `vert-tab data-tab="security"` 중복 — state 분기 시각화 위해 2개 정의 (1개는 state-only.state-security, 1개는 state-default/pending/error). Phase 7 React 변환 시 key 충돌 — 단일 element + state 토글 또는 data-tab 다른 식별자 사용 권장. | evaluator G4 | 2026-05-18 | open (Phase 7) |
| KI-067 | P3 | 5 | Wireframe | 페이지 한정 grid 컴포넌트화 후보 — `dash-row`/`dash-row-3`/`att-top`/`leave-grid`/`leave-kpi-row`/`leave-chart-row`/`cert-grid`/`profile-grid` 등 8개 grid layout이 G2~G4 반복. G5 또는 Phase 7 컴포넌트화 검토 (예: `.grid-2col` `.grid-3col` 패턴 토큰). | evaluator G4 | 2026-05-18 | open (G5 또는 Phase 7) |
| KI-068 | P3 | 5 | Wireframe | OP 모달 title `<h2>` inline-styled (G2 leftover) — `.modal-title` SSOT 미적용. | codex SAMP-P3-001 audit hotfix1 | 2026-05-18 | scheduled (**Phase 7 React 변환 — Dialog 컴포넌트 title prop으로 일괄 해소. 이중작업 회피, 사용자 결정 2026-05-19**) |
| ~~KI-069~~ | P3 | 5 | Wireframe | ~~권한 매트릭스 § 표 구조 손상 15화면 (역할+권한 한 셀 뭉개짐, 권한 열 "—")~~ | evaluator audit hotfix1 NON_BLOCKING | 2026-05-18 | **resolved (WI-KI-batch-008-wf — 15화면 역할\|권한 2열 복원 + CM-06 오정보(자기 세션→오류페이지) 정정. KI-049와 동시 해소)** |
| KI-070 | P3 | 5 | Wireframe | inline svg width/height attribute 누락 — `<svg class="ico">` 패턴 (CSS 보정되나 file:// fallback 계약 불일치). 다수 화면 광범위. | codex G1-PHASE5-CDX-004 audit hotfix2 | 2026-05-18 | scheduled (**Phase 7 React 변환 — Icon 컴포넌트에 width/height 필수 attribute. 전화면 HTML 수정 시 React 재작성으로 폐기되므로 이중작업 회피, 사용자 결정 2026-05-19**) |
| ~~KI-071~~ | P2 | 2 (4차 재평가) | Backlog | ~~Phase 2 backlog 잔존 stale 12곳: (a) epics.md L39/56/109/128/148/204/222 7건 Epic 단위 SP 인용 stale (b) estimation.md L66/L71-72/L92 4건 비용 환산 stale (c) estimation.md L47 209 MD 반올림 근거 미명시 (d) stories.md L646 OP-12 14 endpoint shorthand~~ | evaluator 4차 + codex 4차 NON_BLOCKING_OBSERVATIONS | 2026-05-19 | **resolved (Phase 6 KI 정합화, 2026-05-19 — 12곳 모두 정정 + 추가 stale 3건 (prd-state.json:61 i18n / api/README.md:3 entity 카운트 / .claude/rules/project.md L57 CI job 카운트) 동시 처리)** |
| KI-072 | P3 | 6 | Sprint | sprint-007.md S6 spill 시나리오 (ST-043/044/045/070 spill 옵션)에서 ST-070을 S8 흡수 시 sprint-008.md 헤더 (29 SP → 34 SP) 갱신 의무 미명시 — spill 발동 시점에 sprint-008 hotfix 동반 의무. Phase 7 Sprint 1 실측 후 보수배수 4배+ 확인 시 spill 발동 시점 처리 | evaluator Phase 6 2차 NON_BLOCKING | 2026-05-19 | scheduled (Phase 7 Sprint 1 실측 후) |
| KI-073 | P3 | 6 | Sprint | mvp-plan §7 R-1 위험 "1 SP × 0.5 MD 환산 — Sprint 1 실측 후 보수배수 재조정" 정책 명시되어 있으나 재조정 발동 임계 (예: "실측 4.5배+ 시") 미명시 | evaluator Phase 6 2차 NON_BLOCKING | 2026-05-19 | scheduled (Phase 7 Sprint 1 회고 시 결정) |
| ~~KI-077~~ | P1 | 7 | DB | ~~tenant-scoped 자식 테이블 독립 FK로 "동일 테넌트 부모" 미강제 → 교차 테넌트 UUID 조합 가능~~ | codex WI-019 듀얼검증 | 2026-05-28 | **resolved (WI-019 Day8~10 2026-05-29 — codex 협의 채택: composite FK 핵심부 한정. employees/leave_types/approvals 부모 UNIQUE(tenant_id,id) + 자식 13 FK를 (tenant_id,ref)→(tenant_id,id) 전환. 마이그레이션 28. staging RLS 매트릭스 T5로 교차테넌트 참조 거부 실증)** |
| KI-084 | P3 | 7 | DB | RLS 헬퍼(current_tenant_id/role/employee_id)가 JWT 커스텀 클레임 대신 SECURITY DEFINER public.users 조회 기반(WI-020 클레임 미주입 + hosted hook MCP 불가 대응). 정상 동작하나 RLS 검사마다 인덱스 lookup. Custom Access Token Hook(`public.custom_access_token_hook`)으로 표준화 시 JWT read로 전환 + rls.md SSOT 정합 — dashboard/Mgmt API 활성화 필요 | codex WI-019 협의 | 2026-05-29 | scheduled (인증 하드닝/성능 WI — dashboard hook 활성화 동반) |
| KI-085 | P3 | 7 | DB | audit_logs 월 파티셔닝 미적용 — 비파티션 기존 테이블 + staging 기존 audit row 존재로 재생성 invasive. 트리거 21테이블 + prune_audit_logs() 5년 보관 함수는 제공(pg_cron 존재 시 주간 스케줄 자동 등록, 미설치 시 스킵). 스케일 도달 시 파티셔닝 전환 + cron 보관 | claude WI-019 | 2026-05-29 | scheduled (스케일/운영 Phase 10 인접) |
| KI-086 | P3 | 7 | Code | Supabase Auth leaked-password protection(HaveIBeenPwned) 비활성 — security advisor WARN. dashboard auth config 토글 필요(코드/MCP 범위 외) | supabase advisor | 2026-05-29 | scheduled (베타 진입 전 dashboard 활성) |
| KI-087 | P3 | 7 | DB | 결재 워크플로 SoD/상태전이 가드 — 현 RLS는 자기승인 직접경로(직원/admin status=approved, requester self-routing)를 차단하나, 승인/반려 전이는 service_role RPC 매개로 위임됨. 정식 상태머신(허용 전이 검증) + approval_lines가 요청자를 결재자로 라우팅하지 않도록 검증 + admin 본인 건 SoD는 결재 처리 WI(Sprint 6)에서 RPC/트리거로 구현 | codex+evaluator WI-019 듀얼검증 | 2026-05-29 | scheduled (결재 처리 WI Sprint 6) |
| KI-088 | P3 | 7 | Process | phase7-code.yml typecheck job이 web build를 재실행(build job과 중복) + turbo cache key가 commit sha 고정이라 커밋 간 정확 적중 불가(restore-keys 부분매칭 의존) — CI 효율 손실, 정확성 무해. job dependency/artifact 공유 또는 turbo remote cache로 완화 | both (codex P3-2 + evaluator P3, WI-021 듀얼검증) | 2026-05-29 | scheduled (CI 최적화 — 빌드 시간 체감 시) |
| KI-089 | P3 | 7 | Code | CI e2e job(phase7-code.yml)이 staging 시드 계정 자동 프로비저닝/정리 없이 사전 생성 계정에 의존 + login.spec.ts `locktest_*@flowhr.test` 잠금 레코드를 staging에 누적(cleanup 부재) → secrets 활성 시 staging 누적 오염 | evaluator WI-021 듀얼검증 | 2026-05-29 | scheduled (KI-082 secrets 활성 WI에서 시드 setup/teardown 또는 mock 백엔드 동반) |
| KI-090 | P3 | 7 | Code | WI-021-1 entity 단위 테스트가 39 중 11개만 직접(미검증 28은 동일 빌더 패턴) + work_policies time(standard_clock_in 등)/user_consents inet(ip_address) 형식 refine 부재 — 임의 string 통과(DB 저장 시 거부되므로 무결성 위험 낮음). 후속 schema 보강 시 미검증 entity smoke + time/inet regex refine | evaluator WI-021-1 듀얼검증 | 2026-05-29 | scheduled (후속 schema 보강 WI) |
| KI-091 | P3 | 7 | Code | 강제 동의 "동의-클릭→복귀" 전체 흐름 + operator 게시(publishLegalDocuments)가 자동 E2E 미검증 — user_consents 불변 트리거로 멱등 cleanup 불가(미동의/operator_super 시드 유저 setup/teardown 필요). 비로그인 약관 조회 E2E 5/5 + 강제 동의 가드 redirect·recordConsent·단일active/불변 트리거·super 게이트는 staging DB 실증으로 핵심 검증. 동의-클릭 후 복귀/게시 트랜잭션 E2E 는 시드 인프라 필요 | claude WI-020-2 (ST-078) | 2026-05-29 | scheduled (KI-089 e2e 시드 setup/teardown 동반) |
| KI-092 | P2 | 7 | Code | ST-078 AC-5(운영사 감사 화면 — 동의 통계 + 이력 조회, `GET /api/v1/operator/legal/consents`, api/common.md L248) endpoint/UI 미구현. RLS `consents_read` operator 분기로 데이터 plumbing 은 존재(WI-020-2 는 조회/동의/강제동의 가드/게시까지). ST-078 6 AC 중 1개 미충족 — OP-09 운영사 감사(EP-05)는 별도 sprint deliverable | evaluator WI-020-2 듀얼검증 | 2026-05-29 | scheduled (OP-09 운영사 감사 WI 에서 AC-5 충족 확인) |
| KI-078 | P1 | 7 | Code | 로그인 잠금이 `(email,ip)` 페어 기준이라 분산/멀티-IP 무차별 대입을 막지 못함 + check-then-act TOCTOU로 버스트 시 5회 초과 시도 가능. 명세가 후속으로 미뤄둔 CAPTCHA(5회 후, CM-01 §9)와 per-IP 429 rate-limit(api/conventions §8)이 미구현. (Vercel 엣지 x-forwarded-for 정규화로 헤더위조는 false alarm) | codex WI-020 듀얼검증 | 2026-05-29 | scheduled (인증 하드닝 WI — CAPTCHA + 엣지 per-IP rate-limit + 잠금 사전예약. 사용자 defer 결정 2026-05-29) |
| KI-093 | P3 | 7 | Code | 점검 active 503 경로(rewrite status/Retry-After) + operator_super 라이브 우회가 자동 E2E 미검증 — staging 점검 토글 seed setup/teardown fixture 필요(KI-089/091 동류). 비활성 경로 E2E 5/5 + 구성함수 unit 13 + staging 수동 실증(anon 503·예외 200·제거 후 307)으로 핵심 커버. staging 에 operator_super 계정 부재로 우회는 unit(getUserRole/bypass 조건)으로 검증 | evaluator+codex WI-020-3 듀얼검증 | 2026-05-29 | scheduled (KI-089 e2e 시드 인프라 동반) |
| KI-094 | P2 | 7 | Code | `maintenance_windows` 에 `message_en` 컬럼 부재 — 운영사 점검 커스텀 본문이 `message_ko` 단일. 제목/기본안내는 i18n locale 분기이나, 운영사 작성 점검 메시지는 영문 사용자에게도 ko 노출(현재 "운영사 안내" 블록). ko-first MVP(i18n batch-005, en=참고)라 영향 제한적이나 글로벌 출시 전 `message_en` 컬럼 + ko fallback 권장 | evaluator WI-020-3 듀얼검증 | 2026-05-29 | scheduled (글로벌 출시/운영사 점검 UI(OP-11) WI) |
| KI-095 | P3 | 7 | Code | 점검 상태 미들웨어 조회가 모듈스코프 TTL 15s 캐시(Edge 인스턴스별 best-effort) — 점검 토글 반영 최대 15s 지연 + 인스턴스 간 불일치 가능. 운영 수용 가능(저트래픽 MVP)하나 Realtime `realtime:maintenance` 무효화 또는 edge-config 캐시로 강화 권장 | evaluator+codex WI-020-3 듀얼검증 | 2026-05-29 | scheduled (점검 운영 강화 WI) |
| KI-096 | P3 | 7 | DB | `maintenance_windows` RLS `using(true)`(mig 27, 기존)로 anon 이 Supabase Data API 직접 조회 시 `created_by`(operator uuid) 등 내부 컬럼 접근 가능. 미들웨어/페이지는 안전 컬럼만 select 하므로 본 WI 경로 직접 위험 없음. REST 직접 호출 잔여 노출 — column-level grants 또는 public_view(status/message/scheduled_*만) 권장 | codex WI-020-3 듀얼검증 | 2026-05-29 | scheduled (RLS 하드닝 — KI-084 RLS 표준화 인접) |
| KI-079 | P2 | 7 | Code | CM-01 rememberMe가 schema/form/action에서 파싱·전달되나 Supabase 세션 쿠키 TTL(09-routing §5: 미체크 12h / 체크 30d)에 미반영 — @supabase/ssr 쿠키 maxAge 분기 필요 | evaluator+codex WI-020 듀얼검증 | 2026-05-29 | scheduled (세션관리 ST-005 인접 WI) |
| KI-080 | P3 | 7 | Code | 역할 불일치 라우팅이 09-routing §8 `/forbidden`(CM-05) 대신 역할 대시보드로 폴백 + roleToRedirectPath unknown/null role → /me 폴백. CM-05(/forbidden) 화면 생성 후 §8 적용 + 무자격 역할 /forbidden 폴백 검토 | codex+evaluator WI-020 | 2026-05-29 | scheduled (CM-05 생성 후) |
| KI-081 | P3 | 7 | Code | 로그인 잠금 윈도우 경계(잠금 5분 만료 후 윈도우 15분 미경과 시 1회 실패→즉시 재잠금) 동작이 명세 미문서화 + record_login_failure 윈도우/경계 단위 테스트 부재 | evaluator WI-020 | 2026-05-29 | scheduled (인증 하드닝 WI 또는 문서 batch) |
| KI-082 | P3 | 7 | Code | 핵심 로그인 E2E(잘못된자격/5회잠금/실로그인/return_url)가 E2E_TEST_EMAIL gate로 CI 기본 skip — staging 수동 실증은 했으나 자동 회귀 보호 부재. CI 시드 계정 secret 주입 또는 mock 백엔드 | evaluator WI-020 | 2026-05-29 | scheduled (phase7-code.yml CI 구축 WI-021 시) |
| KI-083 | P3 | 7 | Code | 인증 감사 쓰기가 best-effort(fail-open) — DB 오류 시 auth.login/login_failed/locked 이벤트 누락 가능. 의도된 설계(api/auth.md §Audit)이나 실패 시 알림/내구성 큐 보강 검토 | codex WI-020 듀얼검증 | 2026-05-29 | scheduled (운영 관측성 Phase 10 인접) |
| ~~KI-074~~ | P3 | 6 | Sprint | ~~mvp-plan §4 S5 행 "8+3+8+8+5 = 32" 합산 표기 시각적 혼동~~ | evaluator Phase 6 2차 NON_BLOCKING | 2026-05-19 | **resolved (WI-KI-batch-007-docs — ST별 라벨 부기: ST-037(8)+ST-038(3)+ST-039(8)+ST-040(8)+ST-046(5)=32)** |
| ~~KI-075~~ | P3 | 7 | Sprint | ~~sprint-001.md commit/branch WI 번호 stale (WI-001 docs 점유 오용 + WI-bootstrap 비표준)~~ | claude Phase 7 진입 | 2026-05-19 | **resolved (WI-KI-batch-007-docs — sprint-001.md 12곳 정정 + WI 매핑 주석: WI-018 모노레포/WI-019 인프라/WI-020 인증/WI-021 CI. sprint-002~010은 stale 없음 grep 확인)** |
| ~~KI-076~~ | P2 | 7 | Process | ~~Phase 1~6 유료 기능 무단 산입 — 사용자 명시 동의 없이 Supabase Pro / Vercel Pro / Sentry Team / NHN 알림톡 / Tauri 코드 서명을 산출물에 "보수적 권고"로 산입 (project.md §5 외부 비용 사용자 확인 필수 + CLAUDE.md 추측성 작업 금지 위반)~~ | claude 발견 + 사용자 지적 | 2026-05-19 | **resolved (WI-InfraPolicy-docs — 10개 파일 정정 + guardrails §9 산입 금지 원칙 + §10 인프라 정책/Pro 전환 5트리거 + §8 실패 패턴 기록. 사용자 결정 Free 시작)** |

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
