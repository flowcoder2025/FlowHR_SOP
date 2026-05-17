# WI-G2-wireframes-operator-hotfix2 — Evaluator Report (v3 5축)

> 평가일: 2026-05-16
> 평가자: evaluator (Claude Opus 4.7, .claude/agents/evaluator.md)
> 대상 브랜치: feature/WI-G2-wireframes-operator (HEAD 931539d)
> 모드: doc (Phase 5 v3 5축, review-rubric.md §10)
> WI: WI-G2-wireframes-operator-hotfix2 (직전 hotfix1 FAIL 5.29 정정)

## 0. 평가 대상

- 직전 평가: WI-G2-codex-review-hotfix1.md (FAIL 5.29, 9 P0/P1 결함 + 2 P2)
- 정정 커밋: 931539d WI-KI-batch-006-fix2 G2 hotfix2
- ARTIFACT 범위:
  - .flowset/wireframes/html/OP-01~12.html (12) + CM-01~06+20+21.html (8) = 20 화면
  - .flowset/wireframes/_design-system/components.css
  - .flowset/wireframes/_design-system/03-components.md
  - .flowset/wireframes/_showcase.html
  - .flowset/wireframes/_design-system/component-usage-matrix.json
  - .github/workflows/pr-checks.yml (CI 2 job)

## 1. 9 P0/P1 결함 HEAL 검증

| # | 결함 | 검증 결과 | HEAL |
|---|------|---------|:----:|
| P0-1 | 외부 svg use 306건 | 20/20 화면 외부 use 0건 (grep 검증), 인라인 sprite 27 symbols/화면 보유 | PASS |
| P1-2 | 9 화면 inline 컴포넌트 재정의 | banned 9 클래스(modal/drawer/stepper/switch/toggle-pill/period-chip/diff 등) inline 정의 0건 | PASS |
| P1-3 | OP-04 bare file input | OP-04.html L182 .file-input wrapper + sr-only + use=#i-upload 적용 | PASS |
| P1-4 | variant drift .on/.off/.beta 32건 | 모든 toggle-pill/switch/step variant가 .is-* 통일 (잔존 0건) | PASS |
| P1-5 | href 97건 누락 | <a [space] regex 정확 검증 → 20/20 화면 무 href 0건 | PASS |
| P1-6 | _showcase.html 매핑 부재 | 15 section anchor (section-shell ~ section-date-input) 모두 component-usage-matrix.json showcase_anchor와 100% 매칭 | PASS |
| P1-7 | 03-components.md 8 컴포넌트 미문서화 | 10 신규 섹션 추가 (Modal Dialog Overlay L796, Switch Toggle L837, Stepper Wizard L856, Toggle Pill L892, Period Chip L914, Drawer L929, Diff L952, File Input L971, Date Input L996, Select Wrap L1013) — 단 기존 Modal/Switch/Stepper와 중복 → P3 잔존 | PASS (P3 잔존) |
| P1-8 | CI inline-svg-sprite-check 로직 부족 | pr-checks.yml L189-203 외부 use 1건이라도 fail로 변경 + 시뮬레이션 20/20 PASS | PASS |
| P2-9 | CI design-system-ssot banned 부족 | pr-checks.yml L142-143 banned regex에 9 컴포넌트 추가 + line-start regex 보강 + 시뮬 20/20 PASS | PASS |

부가: OP-12 .session-row → .session-card rename + role="switch"/aria-checked 5건 적용.

**HEAL Score: 9/9 (P0-1, P1-2~8, P2-9 모두 정정 확인)**

## 2. 5축 채점 (review-rubric.md §10 v3)

### 2-1. 완성도 (25%, 임계 7.5) — 8.5/10

근거:
- 20/20 화면 _design-system/{tokens,components}.css 참조 (CI 시뮬 PASS)
- 20/20 화면 인라인 sprite (symbols 27/화면) 보유 → file:// 호환
- 20/20 analysis/*.md 작성 (OP-04 샘플 PRD 매핑·5 상태 매트릭스·DS 사용·i18n 매핑 완비)
- 신규 9 컴포넌트 components.css + 03-components.md 등록 (10/10)
- component-usage-matrix.json 15 패턴 매핑 완료

감점:
- _showcase.html 신규 9 컴포넌트(.modal-overlay/.drawer/.switch.is-on/.toggle-pill.is-on/.period-chip.is-active/.diff-before|.diff-after) 라이브 markup 시연 부재 — paragraph 설명 문구만 존재 (review-rubric §10-4 Hard gate 해당)
- .session-card (OP-12 inline L30-32 신규 정의)가 components.css에 정식 등록되지 않음 → SSOT 부분 위반

### 2-2. 정합성 (25%, 임계 7.5) — 9.0/10

근거:
- component-usage-matrix.json 15 anchor vs _showcase.html section ID 100% 매칭
- HANDOFF/PRD common.md 글로벌 컴포넌트(헤더·사이드바·푸터) vs 화면 inline sprite 정합
- variant 표기 100% .is-* 통일 (toggle-pill/switch/step 32건 모두 정정)
- 외부 sprite 0건 / 인라인 sprite 100% 모순 없음

감점:
- 03-components.md Modal/Switch/Stepper 기존(L605/L226/L673) + 신규(L796/L837/L856) 중복 섹션 존재 → SSOT 모호 (P3)
- _showcase.html #modals 섹션은 .modal 사용 / 신규 SSOT는 .modal-overlay+.modal-box 분리 → showcase markup이 신규 SSOT와 불일치

### 2-3. 구체성 (20%, 임계 7.5) — 8.8/10

근거:
- 20 화면 5 상태 매트릭스 모두 명시 (data-state 토글 가능)
- 모든 컴포넌트 토큰(var(--color-*), --r-*, --shadow-*) 사용 — 매직값 없음
- 신규 컴포넌트 padding/border-radius/색상 모두 변수화 (components.css L325-743)
- OP-12 modal-force state binding 명시 (body[data-state="force_logout"] .modal-overlay.modal-force)

감점:
- 일부 화면 inline style="padding: 0; border: 0;" 토큰 미사용 (OP-04 L179-197 다발) (P3)

### 2-4. 실행가능성 (20%, 임계 7.5) — 9.0/10

근거:
- CI 2 job 시뮬 결과 20/20 화면 PASS → gh pr create 시 머지 가능
- file:// 더블클릭 렌더링 가능 (외부 svg 0건 + 인라인 100%)
- analysis/*.md 20개 + PRD 도메인 매핑 Phase 6 sprint 진입 가능
- 신규 컴포넌트 9종 components.css + 03-components.md 등록 → Phase 7 React 변환 즉시 가능

감점:
- _showcase.html 라이브 markup 부재 → Phase 7 React 변환 시 일부 패턴은 화면 HTML에서 역참조 필요 (P3)

### 2-5. DS 사용 충실도 (10%, 임계 7.5) — 8.0/10 (v3 신설)

근거 positive:
- 외부 sprite 잔존 0건 → Hard gate P1 회피
- bare input[type=file] 0건 → Hard gate P1 회피
- bare input[type=date/datetime-local] 0건 → Hard gate P2 회피
- file:// 호환 20/20 화면 → Hard gate 회피
- bare select 0건 — 모두 .select DS 클래스 적용

감점:
- 신규 9 컴포넌트 _showcase.html 라이브 markup 부재 → Hard gate §10-4 위반 (P2, -1.5)
- .session-card components.css 미등록 → SSOT 부분 위반 (P3, -0.5)
- .select 단독 사용 (12 위치) — .select-wrap > .select 패턴 미적용 (03-components.md L1013 신규 정의에 따르면 의무) → 화면 markup vs 03-components.md 불일치 (P3)

## 3. 가중 합산

| 축 | 점수 | 가중 | 가중점수 |
|---|---:|---:|---:|
| 완성도 | 8.5 | 25% | 2.125 |
| 정합성 | 9.0 | 25% | 2.250 |
| 구체성 | 8.8 | 20% | 1.760 |
| 실행가능성 | 9.0 | 20% | 1.800 |
| DS 사용 충실도 | 8.0 | 10% | 0.800 |
| 합계 | — | 100% | 8.735 |

WEIGHTED_TOTAL: 8.735 / 10
THRESHOLD: 8.0 (각 축 ≥ 7.5)
축별 최소: 8.0 (DS 사용 충실도) ≥ 7.5 — 통과
VERDICT: PASS

## 4. 잔존/신규 결함

### P1 — 없음

### P2 — 1건

- [P2] .flowset/wireframes/_showcase.html L985-1056 — 신규 9 컴포넌트 라이브 markup 시연 부재
  - anchor + paragraph 설명만 존재 (실제 인스턴스 markup 없음)
  - review-rubric.md §10-4 Hard gate 해당
  - 권장: 9 컴포넌트 각각 살아있는 markup 1건씩 추가 (modal-overlay+modal-box / drawer is-open / switch is-on / toggle-pill is-on/is-off/is-beta / period-chip is-active / diff-before+diff-after)

### P3 — 4건

- [P3] .flowset/wireframes/_design-system/03-components.md — Modal/Switch/Stepper 중복 섹션
  - 기존 L605 (Modal) / L226 (Toggle Switch) / L673 (Stepper) + 신규 L796 (Modal Dialog Overlay) / L837 (Switch Toggle) / L856 (Stepper Wizard)
  - SSOT 명확성 위반
  - 권장: 기존 섹션 @deprecated 주석 또는 통합

- [P3] .flowset/wireframes/html/OP-12.html L30-32 — .session-card inline 정의 (components.css 미등록)
  - hotfix2 rename(session-row → session-card)에서 정식 컴포넌트 승격 누락
  - banned regex 회피 형태 — CI 통과
  - 권장: components.css 정식 등록 + OP-12 inline 정의 제거 + 03-components.md 섹션 추가

- [P3] 20 화면 일부 inline style="padding: 0; border: 0;" 토큰 미사용
  - OP-04 L179-197 다발 (form-row-stacked 격자 보정)
  - 권장: .form-row-stacked.is-grid variant 흡수

- [P3] aria/role 부족 화면 (OP-01, OP-04, OP-08, OP-10, OP-11) aria=0~1 / role=0
  - OP-04 wizard stepper에 role=tablist/tab 없음 + OP-11 vert-tabs 동일
  - 권장: WAI-ARIA Authoring Practices 패턴 적용 (Phase 7 React 변환 시 동시 정정 가능)

### NON_BLOCKING_OBSERVATIONS

- [P2] KI-049 (analysis 권한 매트릭스 7화면 누락) — OP-04~12 9화면 analysis에 권한 매트릭스 섹션 0건. hotfix2 평가범위가 아니지만 known-issues INDEX 잔존 P2. Phase 6 진입 전 별도 WI 필요.
- [P3] .select-wrap 컴포넌트가 03-components.md L1013에 정의되었으나 20 화면 markup에서 0회 사용 — 정책과 markup 불일치

## 5. ANTI_PATTERNS_FOUND

- 컴포넌트 중복 정의 (P3): 03-components.md Modal/Switch/Stepper 기존+신규 섹션 공존
- 부분적 rename 회피 (P3): .session-card (OP-12) banned regex 우회 형태로 inline 정의
- showcase 라이브 markup 누락 + paragraph 설명으로 대체 (P2): _showcase.html L985-1056

## 6. 최종 판정

- WEIGHTED_TOTAL: 8.735 / 10 (임계 8.0 통과)
- 각 축 ≥ 7.5: 완성도 8.5 / 정합성 9.0 / 구체성 8.8 / 실행가능성 9.0 / DS 사용 충실도 8.0 — 모두 통과
- Hard gate 평가:
  - file:// 아이콘 미표시 2화면+ — 회피 (20/20 인라인 sprite)
  - 외부 sprite 잔존 P1 — 회피 (0건)
  - bare native control P1/P2 — 회피 (모두 wrap)
  - 신규 컴포넌트 _showcase.html 빠짐 DS SSOT 결함 — 위반 → P2 1건 (DS 축 -1.5 반영)
- VERDICT: PASS (DS 축 8.0 임계 7.5 충족, 가중 8.735 ≥ 8.0)

RECOMMENDATION:
1. PASS 승인 — .flowset/eval-results/WI-G2-wireframes-operator-hotfix2.pass 마커 생성
2. 후속 (별도 WI): P2 1건 + P3 4건 → KI-050~054 등록 (P3 trigger 임계 도달 시 일괄 처리)
3. 호환성: G1 CM 8 화면 회귀 없음 (재검증 ext=0 / inline=27 / no_href=0)

## 7. NEXT_ACTION

PASS → 호출자가 수행:
1. .flowset/eval-results/WI-G2-wireframes-operator-hotfix2.pass 마커 생성 (evaluator 작성 금지)
2. PR 머지 후 (CI PASS 확인) main 동기화 + wf-v0.2.1 태그 부여
3. P2 1건 + P3 4건을 .flowset/known-issues/INDEX.md에 KI-050~054로 등록
4. Phase 5 Group 3 (TA 14 화면) 진입 — 동일 5축 적용

---

평가 종료 — 2026-05-16
