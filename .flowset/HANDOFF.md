# FlowHR 핸드오프 — 신규 세션 진입 가이드

> **작성**: 2026-05-16 (Phase 5 디자인 시스템 + i18n MVP 구축 완료, OP-01 시범 통과 후 OP-02~12 진행 직전 컨텍스트 절약 위해 핸드오프).
> **신규 세션 첫 작업**: 본 문서 + `.flowset/PROMPT.md` + `.flowset/guardrails.md` + `.flowset/prd-state.json` + `.flowset/fix_plan.md` + `.flowset/known-issues/INDEX.md` 순서로 정독.
> **이전 핸드오프**: 2026-05-15 PRD 결함 발견 시 → batch-003으로 해소 완료 (본 문서로 갱신).

## 1. 현재 상태 요약

| Phase | 상태 | 점수 | 비고 |
|-------|------|------|------|
| 0 셋업 | ✓ completed | — | FlowSet 라이트 + git remote + evaluator + known-issues |
| 1 PRD | ✓ completed | 8.15 → **9.13** (재평가) | 36→44 화면 / 37→39 엔티티 + i18n batch-005 |
| 2 백로그 | ✓ completed | 8.29 → **8.03** | 72→80 Story / 379→415 SP |
| 3 ERD | ✓ completed | 8.68 → **8.21** | 39 엔티티 + LegalDocument.language + users.locale |
| 4 API | ✓ completed | 8.78 → **8.40** | 약 290 엔드포인트 + i18n locale API |
| **5 와이어프레임** | **🟡 진행 중** | — | **디자인 시스템 + OP-01 완료 (PASS 8.61), OP-02~12 + TA + EM + CM 재작성 대기** |
| 6~10 | pending | — | — |

**Git remote**: https://github.com/flowcoder2025/FlowHR_SOP — main 활성

## 2. 최근 처리 batch (2026-05-15 ~ 2026-05-16)

### batch-003 (KI-027~031 P1 5건) — resolved 2026-05-15
PRD 누락 결함: 09-routing.md 신규 + CM-16~22 + OP-12 + LegalDocument/UserConsent + evaluator.md 보강. archive: `.flowset/known-issues/archive/2026-05-15-batch-003.md`.

### batch-004 (KI-037 P1 1건 — 디자인 시스템 SSOT) — resolved 2026-05-16, PASS 8.61
**원인**: OP-01~12 12개 화면이 각자 글로벌 컴포넌트(헤더/사이드바/푸터/아이콘/CSS) 인라인 복사 → 일관성 결함 누적.
**구축**:
- `wireframes/_design-system/` 12 파일 (README + 7 spec 문서 + tokens.css + components.css + icons.svg + _layout-shell.html)
- `wireframes/_showcase.html` — 컴포넌트 시연 페이지 (29 섹션)
- 03-components.md Anatomy + Props + Variant matrix 16+ 컴포넌트 + Variable Notation 정책
- components.css 자손 셀렉터 + display:block !important + descendant 누설 차단

**사용자 검수 후 수정 (반복 검수)**:
- SVG 정렬 (display:block 강제, width/height attribute 의무)
- icon-btn 배지 (좌측 anchor + gap 16, 99+/3 위치 균형)
- avatar-lg/sm 자체 완성 클래스 (background 누락 fix)
- EmptyState flex column (좌측 치우침 fix)
- descendant 셀렉터 누설 (.empty-state .ico → .empty-state > svg.ico-empty)
- table matrix vertical-align middle + colgroup column 폭 고정
- Tooltip wrapper span (SVG는 pseudo-element 미지원)
- Session row 우측 영역 .session-action 통일

### batch-005 (i18n MVP — ko + en 동시 + Logo 신설) — 2026-05-16
**사용자 결정**: 외국인 근로자 사용성 — 영어 v2.0 → MVP 포함.
**갱신**:
- PRD 06-mvp-scope (영어 MVP) + 03-tech-architecture (next-intl ko/en) + 01-personas (P8 Nguyen 외국인 근로자) + 04-data-model (LegalDocument.language + users.locale)
- common.md CM-15 알림 채널 locale 분기 (en은 카카오 skip → SMS+이메일) + CM-16 "언어/Language" 메뉴 + CM-21 ko/en 페어 게시 + 영문 참고 번역 정책 + 이메일 템플릿 ko/en 10종
- DB: legal_documents.language(ko|en) + users.locale + 인덱스/트리거 갱신 + `system_settings.brand_logo_url(_dark) + brand_name` 추가
- API: auth.md login response.user.locale + locale 결정 우선순위 + common.md /legal/documents?language= + `400 LANGUAGE_PAIR_REQUIRED` + i18n messages API
- 디자인 시스템: 08-i18n.md 신규 (정책 + 키 catalog + 컴포넌트 매핑 + Phase 7 next-intl 매핑) + 03-components §2-2 i18n 정책 + 07-react-mapping §8 next-intl
- Logo 컴포넌트 신설: 운영사 `<Logo>` + 테넌트 `<TenantLogo>` + sm/md/lg + fallback + 사이드바 다크 컨텍스트 + 사용처 매트릭스 7
- _showcase 누락 컴포넌트 12건 추가 (Checkbox/Breadcrumb/Tooltip/Popover/FormRow+Section/Sidebar 미니어처 3 역할/Header AppShell/Footer/MaintenanceBanner/SessionRow/Code/Logo)

## 3. 신규 세션 첫 작업 (우선순위 순)

### 작업 1: 컨텍스트 로드 (필수)
```
1. .flowset/HANDOFF.md (본 문서)
2. .flowset/PROMPT.md
3. .flowset/guardrails.md
4. .flowset/prd-state.json
5. .flowset/fix_plan.md
6. .flowset/known-issues/INDEX.md
7. .flowset/eval-results/WI-KI-batch-004-design-system.eval.md (디자인 시스템 검증)
8. .flowset/wireframes/_design-system/README.md (디자인 시스템 인덱스)
9. .flowset/wireframes/_design-system/03-components.md (컴포넌트 spec)
10. .flowset/wireframes/_design-system/05-layouts.md (AppShell 표준)
11. .flowset/wireframes/_design-system/08-i18n.md (i18n 정책)
12. .flowset/wireframes/html/OP-01.html (시범 — 신규 화면 작성 패턴 참조)
13. .flowset/wireframes/_showcase.html (시각 검수 — 모든 컴포넌트)
```

### 작업 2: OP-02~12 일괄 재작성 (11 화면) — Task #10
**진행 방식 (OP-01 패턴 그대로)**:
1. `_design-system/_layout-shell.html` 복사 → 화면별 변경:
   - `<title>` 변경
   - 사이드바 active 위치 (operator 9 메뉴 중 해당 메뉴)
   - 페이지 타이틀 (.page-title)
   - `<main class="content">` 안만 화면별 콘텐츠로 교체
2. **헤더/사이드바/푸터 절대 변경 금지** (디자인 시스템 SSOT 정책)
3. 모든 svg에 width/height attribute (컴포넌트 강제값과 일치):
   - .btn 내부: 14/16/18 (sm/md/lg)
   - .icon-btn 내부: 18
   - .sidebar-item 내부: 18
   - .profile-trigger chevron: 14
   - .badge 내부: 12
   - .kpi-label/.dropdown-item: 16
4. 디자인 시스템 컴포넌트 클래스만 사용 (인라인 컴포넌트 정의 금지)
5. 페이지 고유 grid layout만 inline `<style>` 허용 (예: `.kpi-row { grid-template-columns: repeat(7, 1fr) }`)
6. 도메인 텍스트는 한글 그대로 (PRD §3 1:1) — Phase 7에서 i18n 키 추출
7. 각 화면 `wireframes/analysis/{ID}.md` 갱신 (PRD 매핑 체크리스트)

**OP-02~12 화면 패턴 (PRD 참조)**:
- OP-02 테넌트 관리 — List + Side Filter
- OP-03 테넌트 상세 — Detail + Tabs (8)
- OP-04 신규 테넌트 등록 — Wizard (Stepper 7)
- OP-05 구독/요금제 — List + Top Filter
- OP-06 청구/정산 — KPI 5 + Table (Master List)
- OP-07 기능 플래그 — Toggle Table
- OP-08 지원 티켓 — Master-Detail
- OP-09 감사 로그 — 강력 Filter Panel + Table
- OP-10 운영 리포트 — KPI 6 + Charts 4
- OP-11 시스템 설정 — Settings (Vert Tabs 9)
- OP-12 운영사 본인 프로필 — Detail + Tabs 5 (보안 강화)

**작업 후 KI 정리**:
- KI-038 (P3): OP-01.html icon-btn/sidebar-item/profile-trigger svg attribute 정정 (이미 완료)
- KI-041 (P3): html/ 구 OP-02~12 + 구 _design-tokens.css/_icons.css/_icons.svg → archive 이동
- KI-040 (P3): wireframes/README.md 구 SSOT 참조 갱신

### 작업 3: TA-01~14 + EM-01~11 + CM-01~22 일괄 재작성
- 동일 패턴 (디자인 시스템 + i18n 키 + 정렬 정책)
- TA: tenant 사이드바 (8 메뉴), EM: employee 사이드바 (8 메뉴)
- CM: 비인증 화면(CM-01~06, CM-20, CM-21)은 별도 layout(_layout-auth.html은 미작성, 작업 시 신설), 인증 후 모달/드롭다운(CM-16~19, CM-22)은 컴포넌트로 처리

### 작업 4: Phase 1/3/4 evaluator 재평가 (batch-005 정합)
batch-005 변경(LegalDocument.language, users.locale, brand_logo_url 등)이 PRD/DB/API 산출물 전체 정합한지 재평가.
호출: general-purpose agent에 evaluator 룰 임베드 (`.claude/agents/evaluator.md` + `.flowset/contracts/review-rubric.md` 룰 참조).

### 작업 5: Phase 5 evaluator (전체)
44 화면 와이어프레임 + analysis + 디자인 시스템 통합 검증.

## 4. Known Issues 현황 (활성)

| KI-ID | 심각도 | 상태 | 처리 시점 |
|-------|--------|------|----------|
| ~~KI-001~~ ~ ~~KI-031~~ | resolved | archive | batch-001/002/003 |
| ~~KI-037~~ | resolved | batch-004 | 디자인 시스템 SSOT 구축 |
| ~~KI-039~~ | resolved | batch-005 | _showcase 누락 12 컴포넌트 추가 |
| KI-005 | P3 scheduled (Phase 2) | EmployeeChangeRequest TA-03 매핑 | Phase 2 carry-over |
| KI-006 | P3 scheduled (Phase 7) | 로깅 도구 미확정 | — |
| KI-007 | P3 scheduled (Phase 8) | 부하 테스트 도구 | — |
| KI-013 | P3 scheduled (Phase 6) | 7 Epic Task 분해 | — |
| KI-016 | P3 scheduled (Phase 9) | NHN Cloud 출처 URL | — |
| KI-017 | P3 scheduled (Phase 7) | rls.md SQL 변환 | — |
| KI-020 | P3 scheduled (Phase 7) | leave_balances 자동 trigger 위치 | — |
| KI-023 | P3 scheduled (v1.2) | Signature zod | — |
| KI-025 | P3 scheduled (Phase 10) | Rate Limiting 차등 | — |
| KI-032 | P3 open | prd/README.md 카운트 갱신 (36→44) | 다음 batch |
| KI-033 | P3 open | prd/03-tech-architecture 디렉토리 트리 OP-12 | 다음 batch |
| KI-034 | P3 open (6 항목 묶음) | backlog stale (tasks/estimation/dependency-graph 등) | Phase 6 KI-013과 함께 |
| KI-035 | P3 open (3 항목) | seed.md legal v1.0.0 + erd 엣지케이스 + indexes 부분중복 | Phase 7 KI-017/020과 함께 |
| KI-036 | P3 open (3 항목) | api/auth cross-operator sessions 응답 + cron jsonb + common KI-026 정합 | Phase 7과 함께 |
| KI-038 | P3 open | OP-01.html svg attribute (이미 처리 완료, archive 처리 필요) | OP-02~12 작업 시 |
| KI-040 | P3 open | wireframes/README.md 구 SSOT 참조 | OP-02~12 작업 시 |
| KI-041 | P3 open | html/ 구 _design-tokens/_icons + OP-02~12 12 HTML | OP-02~12 작업 시 |

**카운트**: P0/P1/P2 = 0건 ✅ Phase 종료 게이트 클린. P3 14건 (활성).

## 5. 핵심 정책 결정 (2026-05-15 ~ 2026-05-16, 변경 금지)

| 결정 | 내용 | 출처 |
|------|------|------|
| 호스트 전략 | 단일 `app.flowhr.kr` + 경로 prefix (`/operator`, `/admin`, `/me`). 테넌트별 슬러그 v1.2 검토 | 09-routing §1 |
| 화면 카운트 | 44 (CM 22 + OP 12 + TA 14 + EM 11) — 36에서 batch-003 보강 | 06-mvp-scope, matrix.json |
| 엔티티 카운트 | 39 (LegalDocument + UserConsent batch-003 + i18n batch-005 language/locale 컬럼만 추가) | 04-data-model, matrix.json |
| 헤더 글로벌 컴포넌트 | CM-16~19 모든 인증 화면 의무 (검색 v1.1 disabled / 도움말 / 알림 종 / 프로필 드롭다운) | 09-routing §6, 05-layouts.md |
| 약관/개인정보 (CM-21) | ko + en 페어 게시 의무. 법적 효력은 ko, en은 참고 번역 banner 표시 | common.md CM-21 |
| 카카오 알림톡 | locale='ko' 사용자만. en 사용자는 SMS + 이메일 폴백 | common.md CM-15, batch-005 |
| 통화/시간대 | KRW 고정 / Asia/Seoul 고정 (한국 사업장). 날짜 형식만 locale-aware | 03-tech, 08-i18n §6 |
| 와이어프레임 정책 | Codex 이미지 폐기. HTML 직접 작성 + 디자인 시스템 SSOT 일관 | wireframes/README.md |
| 디자인 시스템 SSOT | `_design-system/` 단일 source. 화면 HTML은 import만 (인라인 컴포넌트 정의 금지) | _design-system/README.md |
| Variable Notation | _showcase는 `[변수명]` / 화면 HTML은 한글 도메인 텍스트 | 03-components §1-1 |
| SVG 정렬 의무 | width/height attribute 명시 + 컴포넌트 강제값 일치 + 자손 셀렉터 display:block | 03-components §2, components.css 상단 |
| IconButton 배지 | 좌측 anchor 고정 (left:24) + 인접 컴포넌트 gap 16+ 의무 | 03-components IconButton, components.css .header-actions |
| Logo 컴포넌트 | 운영사 `<Logo>` + 테넌트 `<TenantLogo>` 분리. fallback initials 박스 | 03-components Logo, components.css |
| evaluator 검증 축 보강 (KI-031) | 글로벌 컴포넌트 / 라우팅 / 전이 동선 / 정적 페이지 / i18n 키 / 정렬 / 변수화 추가 검증 의무 | evaluator.md L38/L61-64, review-rubric.md L91 |

## 6. 핵심 디렉토리 / 파일 인덱스

```
.flowset/
├── HANDOFF.md (이 문서, 2026-05-16)
├── PROMPT.md
├── requirements.md
├── guardrails.md
├── prd-state.json (current_phase: 5-wireframes)
├── fix_plan.md
├── spec/matrix.json (39 entities, 44 screens)
├── contracts/
├── eval-results/
│   ├── phase-{1,2,3,4}.eval.md + .pass (Phase 1~4 PASS)
│   ├── phase-{1,2,3,4}-batch-003-rerun.eval.md (batch-003 재평가)
│   └── WI-KI-batch-004-design-system.{eval.md,pass} (디자인 시스템 PASS 8.61)
├── known-issues/
│   ├── INDEX.md (활성: P0/P1/P2 = 0, P3 = 14)
│   └── archive/
│       ├── 2026-05-15-batch-{001,002,003}.md
│       └── (batch-004 archive 아직 작성 안 됨 — 작업 권장)
├── prd/
│   ├── 00~09 *.md (9 + 09-routing 신규 batch-003)
│   ├── domains/common.md (CM-01~22, batch-003+005 갱신)
│   ├── domains/operator/OP-01~12-*.md (OP-12 batch-003 신규)
│   ├── domains/tenant-admin/TA-01~14-*.md
│   └── domains/employee/EM-01~11-*.md
├── backlog/ (80 Story / 415 SP, batch-003 보강)
├── db/ (39 entities + i18n batch-005)
├── api/ (약 290 엔드포인트 + i18n batch-005)
└── wireframes/
    ├── README.md (구 SSOT 참조 잔존 — KI-040)
    ├── _archive-codex/ (Codex 폐기 자산)
    ├── _design-refs/ (사용자 디자인 참고 이미지)
    ├── _design-system/                 ← SSOT (batch-004 신설)
    │   ├── README.md
    │   ├── 01-tokens.md / tokens.css
    │   ├── 02-icons.md / icons.svg
    │   ├── 03-components.md / components.css (16+ 컴포넌트 + Logo)
    │   ├── 04-patterns.md
    │   ├── 05-layouts.md (AppShell + 사이드바 역할별 + CM-16 매트릭스)
    │   ├── 06-states.md
    │   ├── 07-react-mapping.md (shadcn/ui + Tailwind + next-intl)
    │   ├── 08-i18n.md (batch-005 신규)
    │   └── _layout-shell.html
    ├── _showcase.html (29 섹션, 사용자 검수 통과)
    ├── html/                            ← 화면 HTML
    │   ├── _design-tokens.css           ← 구 SSOT (KI-041, archive 이동 필요)
    │   ├── _icons.css                   ← 구 (archive)
    │   ├── _icons.svg                   ← 구 (archive)
    │   ├── OP-01.html                   ← 디자인 시스템 적용 완료 (시범)
    │   └── OP-02~12.html                ← 구 패턴, 재작성 필요 (KI-041)
    └── analysis/
        └── OP-01~12.md (구 patterns 일부)

.claude/
├── agents/evaluator.md (KI-031 보강분 포함)
└── rules/project.md
```

## 7. 신규 세션 진입 순서 (요약 체크리스트)

```
[ ] 1. 본 HANDOFF.md 정독 (이 파일)
[ ] 2. PROMPT.md / guardrails.md / prd-state.json / fix_plan.md / known-issues/INDEX.md 정독
[ ] 3. eval-results/WI-KI-batch-004-design-system.eval.md 검증 결과 확인
[ ] 4. _design-system/README.md + 03-components.md + 05-layouts.md + 08-i18n.md 정독
[ ] 5. wireframes/html/OP-01.html (시범) + _showcase.html (시각 검수) 확인
[ ] 6. OP-02~12 일괄 재작성 시작 — _layout-shell.html 복사 패턴 + 11 화면 (Task #10)
[ ] 7. 작업 후 KI-038/040/041 처리 (svg attribute / README 갱신 / 구 파일 archive)
[ ] 8. TA-01~14 + EM-01~11 + CM-01~22 일괄 재작성
[ ] 9. Phase 5 전체 evaluator (doc 모드, 44 화면)
[ ] 10. Phase 1/3/4 evaluator 재평가 (batch-005 i18n 정합)
```

## 8. 사용자와의 합의 사항

- **eval 임계 8.0 / 각 축 7.5 유지** (변경 없음)
- **Known Issue 트리거** P0=1 / P1=3 / P2=5 / P3=10 (변경 없음)
- **능동적 진행 원칙** — 사용자가 명시 거부 안 한 한 자율 결정 + 즉시 처리
- **추측 금지** — 확인 후 사실만 보고
- **시각 검수 의무** — evaluator는 정렬·정합성에 강하나 시각적 결함(배경 누락, 컴포넌트 겹침, baseline 어긋남)은 사용자 직접 검수 의무
- **i18n MVP** — ko + en 동시 (외국인 근로자), 카카오 알림톡은 ko만
- **디자인 시스템 SSOT** — `_design-system/` 단일 source, 화면 HTML은 import + grid layout만
- **변수화 의무** — 텍스트/아이콘/variant/카운트 모두 prop 주입 (별도 컴포넌트 만들기 금지)

## 9. 컨텍스트 압축 시 우선 보존

신규 세션의 컨텍스트가 압축될 경우 다음이 항상 가장 먼저 다시 로드되어야 함:
- **`.flowset/HANDOFF.md` (본 문서)**
- `.flowset/PROMPT.md`
- `.flowset/guardrails.md`
- `.flowset/wireframes/_design-system/README.md` + `03-components.md` + `05-layouts.md`
- `.flowset/wireframes/html/OP-01.html` (신규 화면 작성 패턴 참조)

그 외 prd/db/api/backlog는 화면 단위로 lazy load.

## 10. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — Phase 5 PRD 결함 발견 후 batch-003 진행 가이드 | KI-027~031 |
| 2026-05-16 | 갱신 — batch-003 완료 + 재평가 + batch-004 디자인 시스템 + batch-005 i18n MVP + OP-01 시범 + Logo 신설 + _showcase 누락 12 + 사용자 검수 사이클 후 핸드오프 | 컨텍스트 절약 + 신규 세션 OP-02~12 진입 위해 |
