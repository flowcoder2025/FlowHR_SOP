# Phase 5 G4 (wf-v0.4.0) Wireframe Evaluation

## Meta

- 평가일: 2026-05-18
- 평가자: evaluator (Claude Opus 4.7) - 단독 채점, codex 별도 통합 판정용
- 대상: PR #12 (draft) feature/WI-G4-wireframes-employee @ 0a39bf9
- 범위: 신규 11 화면 (EM-01~11) + DS G4 6 신규 컴포넌트 + showcase + matrix.json v1.2.0
- 루브릭: .flowset/contracts/review-rubric.md v3 (Phase 5 와이어프레임 5축, 2026-05-16)

---

## SCORES

### 축 1. 완성도 (Completeness) - 25% - 8.7/10

| 검증 | 결과 | 증거 |
|------|------|------|
| 11/11 HTML 파일 존재 | OK | wireframes/html/EM-01.html~EM-11.html 총 3,062 LOC |
| 11/11 analysis 파일 존재 | OK | wireframes/analysis/EM-01.md~EM-11.md 각 9 섹션 균일 |
| PRD EM-01~11 11 도메인 매핑 | OK | analysis 1 PRD 매핑 표 11/11 작성 |
| G4 6 컴포넌트 4-way 매핑 | OK | css G4.1~G4.6 (L995~1071), md G4.1~G4.6 (L1307~1406), showcase L1124~1159 6 section, matrix.json v1.2.0 30 patterns |
| state-debug 토글 + 5상태 토글 | 11/11 OK | 각 화면 .state-debug-key 5 keys + body[data-state] CSS |
| 사이드바 employee 8 메뉴 | 11/11 OK | 정확히 8 .sidebar-item (대시보드/출퇴근/휴가/결재/급여/문서/알림/내 정보) |
| footer 직원 환경 일관 | 11/11 OK | v1.0.0-beta 직원 환경 11/11 |
| VERSION + CHANGELOG 갱신 | OK | wf-v0.4.0 + CHANGELOG L11~62 신규 항목 |
| 변경 이력 일관 | OK | 03-components.md G4 + CHANGELOG 진술 일치 (988->1086+ LOC, 24->30 patterns) |

감점 사유:
- (P2) EM-02 출퇴근 오프라인 시각 분기 누락: PRD EM-02-attendance.md L73 + Scenario L128-131 + 비기능 L158 모두 오프라인 큐 IndexedDB 명시인데 EM-02.html state-debug에 offline 토글 부재 (default/loading/empty/modal/error 5상태). EM-01에는 offline 토글 있음. PWA 주 사용 환경에서 PRD-구현 정합 약화.
- (P3) EM-11 사이드바 비표시 시각 분기 부재: PRD EM-11.md L97/L103 사이드바 비표시인데 EM-11.html은 동일 8-메뉴 사이드바 표시 (state=mvp에서도).

### 축 2. 정합성 (Consistency) - 25% - 8.6/10

| 검증 | 결과 | 증거 |
|------|------|------|
| 05-layouts.md employee 8 메뉴 일치 | 11/11 OK | layouts.md L67-76 SSOT, EM-01.html L85-92 |
| matrix.json v1.2.0 30 patterns + G4 6 신규 정합 | OK | L206-251 + applicable_screens EM-01~11 확장 |
| 인라인 sprite cross-check (used subset defined) | 11/11 PASS | KI-063 강화 - 0건 missing |
| 화면 inline style 컴포넌트 재정의 | 11/11 0건 | grep 11/11 (no component redefinition) |
| native control wrap (select/file/date) | 11/11 OK | bare select 0건, file/date 모두 wrap |
| G4 6 신규 컴포넌트 SSOT 단일화 | OK | components.css G4 단일 정의 |
| G3 vert-tabs/approval-timeline/stepper 재사용 | OK | EM-09 (vert-tab 7) / EM-05 (timeline) / EM-03,EM-08 (stepper) |
| 03-components.md G4 Anatomy + Props + Phase 7 | 6/6 OK | L1309~L1406 6 컴포넌트 모두 4 섹션 균일 |

감점 사유:
- (P2) 보조 자식 클래스 DS 미정의: .info-row-key, .info-row-val, .empty-state-title, .empty-state-desc, .history-card, .tab-count, .form-help, .file-input-name이 components.css 미정의이나 EM 화면에서 다수 사용 (info-row-key 7 files, empty-state-title 10 files). G2/G3 사용 이력 0 files - G4 신규 자식 클래스 SSOT 등록 누락. matrix.json allowed_classes에도 부재.
- (P3) .calc-val inline styling 우회: EM-03 L176-179 calc-val에 inline style font-size:22px;font-weight:700;color:var(--color-accent). components.css G4.4 .calc-val은 font-weight:600/color:text - emphasis variant 부재로 inline 우회. 03-components.md G4.4 Variants에도 is-emphasis 미정의.
- (P3) EM-09 vert-tab security 중복: L132-133 data-tab=security 2회 - 5상태 시각 분기 의도지만 React 변환 시 key 충돌 가능.

### 축 3. 구체성 (Specificity) - 20% - 9.0/10

| 검증 | 결과 | 증거 |
|------|------|------|
| TBD/추후/검토/필요시 grep | 11/11 0건 | analysis + html 모두 회피 표현 없음 |
| 5상태 토글 모두 5 keys | 11/11 OK | 각 화면 정확히 5 state-debug-key + state-only 분기 |
| i18n 매핑 ko/en 표 | 11/11 OK | analysis 4 평균 10~15 키 (EM-04 10/EM-06 14/EM-08 12) |
| API 매핑 엔드포인트 | 11/11 OK | analysis 5 RESTful path (EM-02 7 엔드포인트 L74-80) |
| 권한 매트릭스 RLS 명시 | 11/11 OK | analysis 6 employee R/Cancel/Resubmit 본인 + 403 음성 케이스 |
| Phase 7 변환 가이드 | 11/11 OK | analysis 8 라이브러리 + Supabase 매핑 |
| 의존성 그래프 | 11/11 OK | analysis 9 선행/연계/PWA/외부/자동 cron |

감점 사유:
- (P3) EM-02 비기능 오프라인 큐 IndexedDB 진술과 화면 시각 분기 부재 (축1과 연결): analysis 8 Phase 7 변환 가이드는 있으나 와이어프레임 시각 검수 차원 부족.


### 축 4. 실행가능성 (Actionability) - 20% - 8.8/10

| 검증 | 결과 | 증거 |
|------|------|------|
| Phase 7 React 변환 가능 | OK | analysis 8 shadcn/ui / recharts / TanStack Query / Realtime 명시 |
| Playwright smoke 통과 가능 (file:// 아이콘) | 11/11 OK | sprite cross-check 11/11 PASS, hard gate 미발동 |
| 한글 라벨 코드 식별자 매핑 | OK | analysis 4 i18n + 3 클래스 매핑 일치 |
| CI 4 job 통과 가능 | OK | inline-svg-sprite-check (강화) / native-element-wrap / showcase-coverage / ds-redefinition |
| matrix.json 매핑 (showcase-coverage-check) | OK | 30 patterns + EM 패턴 매핑 |
| 라우트 명시 (/me/*) | 11/11 OK | analysis 1 PRD 매핑 표에 경로 명시 |
| 모바일 768px override | OK | components.css L1063-1071 + clock-meta 4->2, clock-actions 1, chart 1-col, notif-row wrap |

감점 사유:
- (P2) EM-02 오프라인 미시각화로 Phase 7 진입 시 추가 디자인 결정 필요: 오프라인 banner/상태 UI를 다시 결정해야 함.
- (P3) .info-row-key/val 보조 자식 클래스 DS 미등록으로 Phase 7 React Card 변환 시 자식 className mapping 모호.

### 축 5. DS 사용 충실도 (Design System Fidelity) - 10% - 8.5/10

| 검증 | 결과 | 증거 |
|------|------|------|
| 외부 sprite 참조 (file:// hard gate) | 0건 | grep icons.svg# EM 화면 0건 |
| 인라인 sprite cross-check (KI-063) | 11/11 PASS | used IDs subset defined IDs |
| bare native control | 0건 | bare select 0, file 0, date 0 |
| G4 신규 컴포넌트 4-way | 6/6 OK | clock-card/leave-balance-card/stat-mini-list/calc-summary/chart-placeholder/notif-row |
| 화면 inline style 컴포넌트 재정의 | 0건 | grep 11/11 |
| 모바일 override (768px) | OK | components.css G4 L1063-1071 5 규칙 |
| Hard gate (file:// 아이콘 미표시 2화면+) | 미발동 | 0 화면 |

감점 사유:
- (P2) 보조 자식 클래스 SSOT 미등록 (축2와 중복): info-row-key/val/empty-state-title/desc/history-card/tab-count/form-help/file-input-name 등 components.css 미정의. matrix.json allowed_classes에도 부재.
- (P3) .calc-val is-emphasis variant 부재: G4.4 spec과 inline styling 우회로 시각 일관성 약화.
- (P3) inline style 페이지 한정 grid (.dash-row, .dash-row-3, .att-top, .leave-kpi-row, .leave-chart-row, .cert-grid) 컴포넌트화 후보: G2~G4 반복.

---

## 가중 합계 계산

| 축 | 점수 | 가중치 | 합산 |
|----|-----:|------:|-----:|
| 완성도 | 8.7 | 0.25 | 2.175 |
| 정합성 | 8.6 | 0.25 | 2.150 |
| 구체성 | 9.0 | 0.20 | 1.800 |
| 실행가능성 | 8.8 | 0.20 | 1.760 |
| DS 사용 충실도 | 8.5 | 0.10 | 0.850 |
| 합계 | | 1.00 | 8.74 |

WEIGHTED_TOTAL: 8.74 / 10
THRESHOLD: 8.0 (각 축 7.5 이상)

각 축 최소 8.5 이상으로 임계 통과. Hard gate 미발동 (file:// 아이콘 미표시 0 화면).

---

## VERDICT: PASS

가중 합계 8.74 (>= 8.0), 각 축 8.5 이상 모두 임계 통과. Hard gate (file:// 아이콘 미표시 2화면+) 미발동.

---

## ANTI_PATTERNS_FOUND

- 없음 (Doc 안티패턴 카탈로그 5 기준)
  - TBD/추후/검토/필요시 11/11 0건
  - 화면 ID 표기 불일치 일관 (EM-01~11)
  - 권한 매트릭스 누락 11/11 명시
  - 빈 섹션/placeholder 0건
  - 이전 Phase 산출물 인용 누락 analysis 1 모두 PRD 명시
  - 이전 G2/G3 SSOT 위반 0건

---

## NON_BLOCKING_OBSERVATIONS (PASS 시 KI 등록 후보)

### [P2] EM-02 오프라인 상태 시각 분기 누락
- 위치: wireframes/html/EM-02.html (5상태 default/loading/empty/modal/error)
- PRD 근거: prd/domains/employee/EM-02-attendance.md L73, L128-131, L158
- 영향: PWA 주 사용 환경 오프라인 시 UI 상태 시각 검수 불가. Phase 7 진입 시 디자인 재결정 필요.
- 권장: hotfix1로 EM-02에 state=offline 토글 추가 + clock-card 오프라인 indicator (큐 적재 카운트 배지 + maintenance-banner)
- KI 등급: P2 Medium

### [P2] G4 보조 자식 클래스 DS SSOT 미등록
- 위치: _design-system/components.css (누락), EM-01~11 (사용)
- 누락 클래스: .info-row-key, .info-row-val, .empty-state-title, .empty-state-desc, .history-card, .tab-count, .form-help, .file-input-name
- 사용 빈도: info-row-key 7 files, empty-state-title 10 files, history-card 3 files
- G2/G3 사용 이력: 0 files (G4 신규 도입)
- 영향: DS SSOT 신뢰도 - Phase 7 React 변환 시 className mapping 모호
- 권장: hotfix1로 components.css에 자식 클래스 8종 등록 + matrix.json allowed_classes 갱신
- KI 등급: P2 Medium

### [P3] EM-11 사이드바 비표시 시각 분기 부재
- 위치: wireframes/html/EM-11.html L70~95 사이드바 + state=mvp 분기
- PRD 근거: EM-11.md L97, L103 사이드바 비표시
- 영향: state=mvp 토글 시 사이드바가 그대로 보임 (PRD 의도와 불일치)
- 권장: state=mvp 시 .sidebar 숨김 또는 별도 _layout-redirect.html 사용
- KI 등급: P3 Low

### [P3] EM-03 .calc-val is-emphasis variant 부재
- 위치: wireframes/html/EM-03.html L176-179 inline style
- DS 근거: components.css G4.4 (L1027-1030) - emphasis variant 없음
- 영향: 03-components.md G4.4 spec과 일부 inline 우회
- 권장: components.css에 .calc-val.is-emphasis 추가 + EM-03에서 클래스만 사용
- KI 등급: P3 Low

### [P3] EM-09 vert-tab data-tab=security 중복
- 위치: wireframes/html/EM-09.html L132-133
- 영향: React 변환 시 key 충돌 가능 (의도된 상태 분기지만 단일 식별자 권장)
- 권장: 두 vert-tab에 data-tab-variant 추가로 차별화
- KI 등급: P3 Low

### [P3] 페이지 한정 grid 컴포넌트화 후보
- 위치: dash-row, dash-row-3, att-top, leave-kpi-row, leave-chart-row, cert-grid 등 inline style 페이지 한정 grid 정의 반복
- 영향: G2~G4 모두 page-local grid 패턴 반복 - DS 표준화 후보
- 권장: components.css에 .page-grid-2col / 3col / 1-6fr-1fr 추가 검토
- KI 등급: P3 Low (선택적 리팩토링)

---

## ISSUES

이슈는 모두 NON_BLOCKING 처리 (PASS 임계 충족). PR #12 머지 자체는 가능. 권장 hotfix path는 RECOMMENDATION 참조.

---

## RECOMMENDATION

### PASS 처리 (즉시 PR #12 머지 진입 가능)

- 가중 합계 8.74 / 10 (임계 8.0 통과)
- 각 축 8.5 이상 (임계 7.5 통과)
- Hard gate 미발동
- ANTI_PATTERNS 0건
- 11/11 sprite cross-check PASS

### 단, hotfix1 권장 (codex 통합 판정 후 결정 - review-system.md 4)

우선순위 1 (P2):
1. EM-02 state=offline 토글 추가 - clock-card 오프라인 indicator + offline maintenance-banner
2. components.css에 자식 클래스 8종 등록 - info-row-key/val, empty-state-title/desc, history-card, tab-count, form-help, file-input-name. matrix.json allowed_classes 동기화

우선순위 2 (P3):
3. EM-11 state=mvp 시 사이드바 숨김 또는 PRD 사이드바 비표시 진술 보강
4. components.css .calc-val.is-emphasis variant 추가 + 03-components.md G4.4 Variants 보강
5. EM-09 vert-tab security 중복 정정

### 트리거 평가

- 본 평가 결과 P2 신규 2건, P3 신규 4건 - KI 트리거 임계 추가 누적 점검 필요
- 현재 KI 활성: P2 6건 + P3 24건 - 본 P2 2건 추가 시 8건 (임계 5 초과 유지), P3 4건 추가 시 28건 (임계 10 초과 유지)
- triggers.md 임계 도달 - codex 통합 판정 시 트리거 발동 여부 결정

---

## NEXT_ACTION

- PASS: PR #12 (draft) -> ready -> codex 평가 호출 -> 통합 판정 -> CI gate -> auto-merge -> tag wf-v0.4.0
- evaluator phase-5-g4.pass 마커는 호출자(Claude 본체)가 생성 (evaluator는 마커 생성하지 않음 - rubric 7)
- 본 평가 결과 6 NON_BLOCKING_OBSERVATIONS -> .flowset/known-issues/INDEX.md에 P2 2건 + P3 4건 등록 (호출자 의무)
- codex 평가가 PASS_BOTH 또는 CONDITIONAL일 경우 hotfix는 후속 머지로 처리 가능 (review-system.md 4)
