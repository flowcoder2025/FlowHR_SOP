# FlowHR 핸드오프 — 신규 세션 진입 가이드

> **작성**: 2026-05-17 (G2 wf-v0.2.0 머지 + G3 진입 시점, KI-052 정정 후 TA-01 양산 대기)
> **신규 세션 첫 작업**: 본 문서 §3 정독 → G3 양산 시작 (TA-01부터 또는 묶음 선택)
> **이전 핸드오프**: 2026-05-16 G2 hotfix2 진행 중 (현재 본 문서로 갱신, G2 완료 + G3 진입)

## 1. 현재 상태 요약

### Phase 5 와이어프레임 진행 (wf-v* 버전)

| 버전 | 그룹 | 화면 | 상태 | tag |
|------|------|------|------|-----|
| wf-v0.0.0 | 베이스라인 | (batch-003+004+005 + OP-01) | ✅ 머지 | wf-v0.0.0 |
| wf-v0.1.0 | G1 최초 진입점 | CM-01~06 + CM-20/21 (8) | ✅ 머지 | wf-v0.1.0 |
| wf-v0.1.1 | G1 hotfix | state 토글 flex-direction column 7화면 | ✅ 머지 | wf-v0.1.1 |
| (system-v2) | 평가 시스템 v2 | evaluator + codex 통합 정책 | ✅ 머지 (PR #6) | (tag 없음) |
| (system-v3) | 평가 시스템 v3 | file:// 호환 + 렌더링 + DS 충실도 5축 | ✅ 머지 (PR #7) | (tag 없음) |
| **wf-v0.2.0** | **G2 운영** | **OP-02~12 (11)** + hotfix1/2/3/rev1 | ✅ **머지 (PR #5)** | **wf-v0.2.0** |
| wf-v0.3.0 | G3 테넌트 매니저 | TA-01~14 (14) | 🟡 **진행 중 (KI-052 정정 완료, TA-01 양산 대기)** | — |
| wf-v0.4.0 | G4 테넌트 직원 | EM-01~11 (11) | ⏳ 대기 | — |
| wf-v1.0.0 | Phase 5 전체 | 44 화면 통합 | ⏳ 대기 | — |

**현재 브랜치**: `feature/WI-G3-wireframes-tenant` (HEAD: `01c800d` — KI-052 정정 + CI 검사 확장)

## 2. 최근 진행 (2026-05-17)

### G2 wf-v0.2.0 머지 완료 (PR #5)

- 머지 commit: `c601d037` (2026-05-17T12:17:18Z, auto-merge --squash --delete-branch)
- evaluator hotfix3-rev1 PASS 8.90/10 (5축 모두 7.5+, Hard gate 미발동)
- codex hotfix3 WARNING 8.0 → rev1 4 hotspot 정정 (자체 grep 검증)
- CI 9/9 PASS (Playwright Smoke 40s 포함)
- 산출물: OP-02~12 11 화면 + analysis 11 + DS 패턴 6
- hotfix 누적: P0 5건 + P1 43건 + SSOT 통일 11건

### G2 hotfix 사이클 (3회 한도 사용)

| 차수 | 결과 | 정정 |
|------|------|------|
| hotfix1 | FAIL (evaluator 5.29 + codex 4.0) | 외부 use 잔존 / inline 재정의 / variant / href / showcase / 03-components / CI |
| hotfix2 | evaluator PASS 8.735 + codex FAIL 6.5 (OR → BLOCKED) | 9 P0/P1 정정 (외부 use 0건 / inline 재정의 0건 / 변종 0건 / file input wrap / href 159건 / showcase 15 anchor / 03-components 10 섹션 / CI 보강 / OP-12 session-row→session-card) |
| hotfix3 | evaluator FAIL 7.375 + codex WARNING 8.0 (사용자 결정 → rev1) | P0-A JS 외부참조 / P0-B Playwright Smoke checkVisibility 가드 / P1 .is-active SSOT 32건 / CI broad화 |
| hotfix3-rev1 | **evaluator PASS 8.90** (PASS_BOTH 등가) | _showcase.html 8 + _layout-shell.html 1 + matrix.json 1 + CM-21 runtime JS 2 + CHANGELOG 정정 |

### KI close-out + G3 진입 (main 직접 push)

- KI-046/047/048 (P1) resolved → batch-006-fix3-rev1 / wf-v0.2.0
- KI-052 (P3) 신규 등록 → `_layout-shell.html` 외부 sprite 20건 (evaluator hotfix3-rev1 발견)
- close-out commit: `c098272` (사용자 결정 2026-05-17 — 그룹 머지 직후 KI close-out은 main 직접 push 허용, memory: `feedback_main-direct-push-closeout`)

### G3 진입 + KI-052 정정 (브랜치 첫 commit `01c800d`)

- `_layout-shell.html` 외부 sprite 20건 → 인라인 #i-... reference
- `_layout-auth.html` 추가 4건 (사각 발견, 함께 정정)
- CI `inline-svg-sprite-check` 범위 확장 — `.flowset/wireframes/_design-system/_layout-*.html`도 검사
- 합계 24건 정정 + SSOT 사각 해소

## 3. 신규 세션 첫 작업 (G3 TA-01~14 양산)

### 작업 1 — G3 양산 시작 (TA-01부터)

`feature/WI-G3-wireframes-tenant` 브랜치 (`01c800d`) 위에서 진행.

**TA 14 화면 목록 (예상)**:
- TA-01 대시보드
- TA-02 직원 목록
- TA-03 직원 상세 (탭: 기본/근태/휴가/결재/급여/문서)
- TA-04 신규 직원 등록
- TA-05 부서 / 조직도
- TA-06 권한 / 역할
- TA-07 근태 관리 (Master-Detail)
- TA-08 근태 정정 / 결재
- TA-09 휴가 신청 / 정책
- TA-10 결재 대시보드
- TA-11 결재 라인 / 위임
- TA-12 급여 / 문서
- TA-13 시스템 설정 (vert-tabs)
- TA-14 테넌트 본인 프로필

**진입 전 PRD 확인 필수**:
- `.flowset/prd/tenant/` 디렉토리 또는 `docs/FlowHR_screen_spec_v_1.md`에서 정확한 14 화면 명세 확인
- 화면별 패턴 / 상태 / 컴포넌트 / 권한 매트릭스 추출

### 작업 2 — G3 패턴 의무 (G2와 동일)

- `_layout-shell.html` 복사 (이제 인라인 sprite reference로 안전)
- 인라인 sprite block은 화면별로 별도 추가 (`<svg xmlns=... style="display:none"><symbol id="i-...">…</symbol></svg>`)
- DS 컴포넌트만 사용 (`components.css` SSOT)
- 화면별 inline `<style>`는 page-grid layout만 허용 (컴포넌트 재정의 금지)
- 5 상태 토글 (state-debug + body data-state 패턴)
- `.is-active` 변종만 사용 (`.active` 금지)
- native control DS wrap 의무 (`.select-wrap` / `.file-input` / `.date-input`)
- 사이드바: tenant 8 메뉴 + 실제 `href` (placeholder 금지)
- showcase 매핑 (`component-usage-matrix.json` patterns)

### 작업 3 — 평가 절차 (review-system v3)

그룹 양산 종료 시:
1. VERSION wf-v0.3.0 갱신 + CHANGELOG hotfix 항목 추가
2. commit/push
3. PR draft 생성
4. evaluator (`subagent_type=evaluator`, run_in_background) + codex (`subagent_type=general-purpose`, run_in_background, mcp__codex__codex 위탁) 병렬 호출
5. 두 통지 대기 후 통합 판정 (`review-system.md §4` 매트릭스)
6. PASS_BOTH → ready → CI → auto-merge → tag wf-v0.3.0
7. hotfix 최대 3회 사이클 (G2 사례 참조)
8. 그룹 완료 후 KI close-out (main 직접 push OK)

### 작업 4 — 페이스 옵션

- **권장 (안전)**: 묶음별 양산 (예: 대시보드+직원 3 화면 → 평가 → 다음 묶음). 컨텍스트 보호.
- **빠름**: 14 화면 일괄 양산 후 1회 평가 (G1/G2 패턴).
- **세밀**: 1 화면씩 양산 + 화면별 mini-evaluator (구체 검수).

기본 추천 — G2 패턴 유지 (일괄 양산 → 평가 → hotfix).

## 4. Known Issues 현황 (활성)

| 심각도 | 활성 | 임계 |
|--------|------|------|
| P0 | 0 | 1 |
| P1 | 0 | 3 |
| P2 | 3 (KI-049 analysis 권한 7화면 / KI-050 select-wrap 17건 / KI-051 showcase-coverage 강화) | 5 |
| P3 | 18 (KI-052 _layout-shell 외부 sprite는 본 commit으로 정정됨, INDEX 표 갱신 미반영 — close-out 시점) | 10 (이미 도달) |

**KI-052 상태 관리 메모**: 본 commit (`01c800d`)으로 정정 완료. G3 그룹 PR 머지 후 close-out 시 `~~KI-052~~ resolved` 처리.

**남은 .md 외부 sprite 후보 (KI-053 등록 검토)**:
- `_design-system/02-icons.md` L2 + `06-states.md` 10건 + `README.md` L32: 코드 예제 외부 sprite 참조 (사용자 copy 시 file:// 차단). NON_BLOCKING.

## 5. 핵심 정책 결정 (변경 금지)

| 결정 | 출처 |
|------|------|
| 평가 시스템 v3 (evaluator + codex + 5축 + Hard gate + Playwright smoke) | review-system.md §17 |
| KI 트리거 (P0=1, P1=3, P2=5, P3=10) | triggers.md §2 |
| PR auto-merge --squash --delete-branch | project.md §6 |
| 그룹별 단일 브랜치 + commit/push 후 그룹 PR | project.md §6 |
| **그룹 머지 직후 KI close-out은 main 직접 push 허용** | 사용자 결정 2026-05-17 |
| 화면별 inline `<style>` 컴포넌트 재정의 금지 (DS SSOT) | design-system-ssot CI + 03-components.md |
| 외부 SVG `<use>` 금지 → 인라인 sprite + #i-... reference 의무 (HTML + JS literal) | review-system.md §17-1 + CI inline-svg-sprite-check (확장: _layout-*.html 포함) |
| native control DS wrap 의무 (`.select-wrap` / `.file-input` / `.date-input`) | review-system.md §17-2 + CI native-element-wrap-check |
| **variant naming `.is-*` 표준 (`.active` 금지, runtime JS classList도)** | hotfix3-rev1 SSOT 통일 |
| 사용자 개입 6개 시점만 (P0/P1 trigger/downgrade/contract/충돌/3회 FAIL) | review-system.md §10 |
| 그룹 완료 시에만 사용자 보고 (능동 진행) | 사용자 결정 2026-05-16 |

## 6. PR 현황

| PR | 제목 | 상태 |
|----|------|------|
| #1 | WI-G0-docs wf-v0.0.0 베이스라인 | ✅ MERGED |
| #2 | WI-G1-docs G1 최초 진입점 (wf-v0.1.0) | ✅ MERGED |
| #3 | WI-G1eval-docs G1 fix1 평가 결과 | ✅ MERGED |
| #4 | WI-G1hotfix-fix CM-02~06+20+21 state column | ✅ MERGED |
| #5 | WI-G2-docs G2 운영 (wf-v0.2.0) | ✅ **MERGED 2026-05-17** |
| #6 | WI-RSv2-feat 평가 시스템 v2 | ✅ MERGED |
| #7 | WI-RSv3-feat 평가 시스템 v3 | ✅ MERGED |
| #(미생성) | G3 wf-v0.3.0 | ⏳ 양산 완료 후 생성 |

## 7. Task 상태 (이전 세션 → 신규 세션)

| 영역 | 상태 |
|------|------|
| T1~T8 (G0/G1/G2 양산 + 평가) | ✅ completed |
| T9 (G2 hotfix3-rev1) | ✅ completed (evaluator PASS 8.90) |
| T10 (G2 머지 + ready/tag) | ✅ completed (`wf-v0.2.0` 부여) |
| KI-052 정정 (G3 첫 commit) | ✅ completed (`01c800d`) |
| **G3 TA-01~14 양산** | ⏳ **신규 세션 시작** |
| G4 EM-01~11 양산 | ⏳ 대기 |
| Phase 5 전체 evaluator (44 화면) | ⏳ 대기 |

## 8. 컨텍스트 압축 시 우선 보존

신규 세션 컨텍스트 압축 시 가장 먼저 다시 로드되어야:
- **본 HANDOFF.md (필수 첫 작업)**
- `.flowset/contracts/review-system.md` (§17 v3 SSOT)
- `.flowset/contracts/review-rubric.md` (§10 5축)
- `.flowset/known-issues/INDEX.md`
- `.flowset/wireframes/_design-system/component-usage-matrix.json`
- `docs/FlowHR_screen_spec_v_1.md` (TA-01~14 명세)

## 9. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — Phase 5 PRD 결함 발견 시 batch-003 진행 가이드 | KI-027~031 |
| 2026-05-16 | 갱신 — G1 완료 + G2 양산 직전 | wf-v0.1.0 + 4 그룹 분할 |
| 2026-05-16 | 갱신 — G2 hotfix2 진행 중 다음 세션 인계 | 컨텍스트 한계 |
| 2026-05-16 | 갱신 — codex hotfix2 결과 + hotfix3 진입 안내 | OR 원칙 BLOCKED |
| **2026-05-17** | **본 갱신 — G2 wf-v0.2.0 머지 완료 + G3 진입 (KI-052 정정 후 TA-01 양산 대기)** | 신규 세션에서 G3 양산 시작 |
