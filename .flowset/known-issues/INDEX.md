# Known Issues — Registry (SSOT)

> 모든 미해결 알려진 이슈의 단일 진실 출처. 발견 시 즉시 등록, 해결 시 `archive/`로 이동 후 본 표에서 제거.

## 카운트 요약

| 심각도 | 활성 건수 | 트리거 임계 | 트리거 도달 |
|--------|----------|------------|-----------|
| P0 Critical | 0 | 1 | ❌ |
| **P1 High** | **3** | 3 | ✅ **트리거 도달** — G2 통합 평가 결함 3건 (KI-046 DS SSOT both / KI-047 모바일 codex / KI-048 라우팅 codex) → WI-KI-batch-006 G2 hotfix 발동 |
| P2 Medium | 1 | 5 | ❌ — KI-049 analysis 권한 매트릭스 7화면 누락 (evaluator) |
| P3 Low | **17** | 10 | ✅ 트리거 도달 — 17건 활성 (기존 14 + KI-042/043/044 G1 fix1 NON_BLOCKING 3건) |

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
| KI-015 | P3 | 2 | Backlog | estimation.md 200 MD vs tasks.md 739 MD 환산 차이는 명시되어 있으나 외부 견적 시 어느 기준 사용할지 정책 명확화 권장 | evaluator Phase 2 attempt 1 | 2026-05-15 | resolved (estimation.md L60-63에 정책 명시) |
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
| KI-041 | P3 | 5 | Wireframe | html/ 디렉토리 구 _design-tokens.css/_icons.css/_icons.svg + OP-02~12 12 HTML 잔존 — 차기 batch에서 신 SSOT 적용 후 archive 이동 | evaluator batch-004 | 2026-05-16 | open (resolved at G0 baseline — archive 처리 완료) |
| KI-042 | P3 | 5 | Wireframe | 08-i18n.md L58 §2 키 컨벤션 예시 표에 `system.error.403.title` deprecated 키 한 줄 잔존 — §4 catalog L157 정식 키 + §9 deprecation note와 미세 불일치. 예시 표 성격으로 차단 사유 아님 | evaluator G1-fix1 | 2026-05-16 | open (wf-v0.1.1 또는 G2 작업 시) |
| KI-043 | P3 | 5 | Wireframe | CM-21.html L97 `<span class="version-change">하이라이트</span>` i18n 매핑 누락 — `legal.terms.version_change_label` 키 추가 권장 | evaluator G1-fix1 | 2026-05-16 | open (wf-v0.1.1 hotfix) |
| KI-044 | P3 | 5 | Wireframe | CM-04.html .state-error-alert / .state-loading-spinner 가 .state-otp-form 자손 → 부모 hidden 시 ancestor 가시성에 의존. CSS selector 명시성 보강 권장 (`body[data-state="error"] .state-otp-form .state-error-alert`) | evaluator G1-fix1 | 2026-05-16 | open (wf-v0.1.1) |
| KI-045 | P3 | 5 | Wireframe | CM-03.html 운영사 계정 활성화 시 "건너뛰기 (직원)" 버튼 숨김 처리 미명시 — 와이어프레임에서는 두 버튼 항상 표시. Phase 7 React 변환 시 `users.role === 'operator_*'` 조건 분기 명세 | evaluator G1 | 2026-05-16 | open (Phase 7) |
| **KI-046** | **P1** | 5 | Wireframe | **DS SSOT 위반 — 컴포넌트 components.css 미등록 + 화면별 인라인 재정의**: `.modal-overlay`/`.modal-box` (OP-03/05/06/07/09/12 6화면), `.stepper`/`.step` (OP-04), `.switch` (OP-11/OP-12 비일관 정의), `.toggle-pill` (OP-07), `.period-chip` (OP-10), `.drawer` (OP-09), `.diff-before`/`.diff-after` (OP-09). CHANGELOG wf-v0.2.0 "패턴 도입" 약속 5종 미등록 (병합). G1 KI-037 전례 P1. Phase 7 React 전환 비용 큼. | **both** (evaluator P2 + codex P1, 상위 채택) | 2026-05-16 | **batch-006 hotfix 진행 중** |
| **KI-047** | **P1** | 5 | Wireframe | **모바일 반응형 부재** — OP-02~OP-12 11 화면에 `@media (max-width: 768px)` 없음. 10~11컬럼 테이블 / 240px 사이드 필터 / 220px vert-tabs / 360px master-list 등 고정 grid가 모바일에서 깨질 가능성. PWA 명세 단계 핵심 전환 리스크. | codex | 2026-05-16 | **batch-006 hotfix 진행 중** |
| **KI-048** | **P1** | 5 | Wireframe | **라우팅 href placeholder / cross-link 부재** — 사이드바·테넌트명 클릭·신규 등록 CTA가 실제 `href` 없이 placeholder. KI-027 routing matrix 누락 전례 P1. 다음 Phase 구현자가 화면간 흐름 확정 불가. | codex | 2026-05-16 | **batch-006 hotfix 진행 중** |
| KI-049 | P2 | 5 | Wireframe | analysis 권한 매트릭스 11화면 중 7화면 누락 (OP-04/05/06/08/10/11/12) — PRD엔 있으나 analysis 재인용 부재. wf-v0.2.0 hotfix 또는 G3 진행 시 일괄 보강. | evaluator | 2026-05-16 | open (batch-006 hotfix 포함) |

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
