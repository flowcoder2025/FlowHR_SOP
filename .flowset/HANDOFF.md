# FlowHR 핸드오프 — 신규 세션 진입 가이드

> **작성**: 2026-05-18 (G3 wf-v0.3.0 머지 완료 + Playwright hotfix4 완료, G4 진입 직전)
> **신규 세션 첫 작업**: 본 문서 §3 정독 → G4 양산 시작 (EM-01부터 또는 묶음 선택)
> **이전 핸드오프**: 2026-05-17 G3 TA-01 양산 대기 (현재 본 문서로 갱신)

## 1. 현재 상태 요약

### Phase 5 와이어프레임 진행

| 버전 | 그룹 | 화면 | 상태 | tag |
|------|------|------|------|-----|
| wf-v0.0.0 | 베이스라인 | (batch-003+004+005 + OP-01) | ✅ 머지 | wf-v0.0.0 |
| wf-v0.1.0 | G1 최초 진입점 | CM-01~06 + CM-20/21 (8) | ✅ 머지 | wf-v0.1.0 |
| wf-v0.1.1 | G1 hotfix | state 토글 flex-direction column 7화면 | ✅ 머지 | wf-v0.1.1 |
| (system-v2) | 평가 시스템 v2 | evaluator + codex 통합 정책 | ✅ 머지 (PR #6) | — |
| (system-v3) | 평가 시스템 v3 | file:// 호환 + 렌더링 + DS 충실도 5축 | ✅ 머지 (PR #7) | — |
| wf-v0.2.0 | G2 운영 | OP-02~12 (11) + hotfix1/2/3/rev1 | ✅ 머지 (PR #5) | wf-v0.2.0 |
| **wf-v0.3.0** | **G3 테넌트 매니저** | **TA-01~14 (14)** + hotfix1/2/3/4 | ✅ **머지 (PR #8/#9/#10)** | **wf-v0.3.0** |
| wf-v0.4.0 | G4 테넌트 직원 | EM-01~11 (11) | 🟡 **신규 세션 양산 대기** | — |
| wf-v1.0.0 | Phase 5 전체 | 44 화면 통합 | ⏳ 대기 | — |

**현재 브랜치**: `main` (HEAD: `af4c149` — PR #10 머지 직후)

## 2. 최근 진행 (2026-05-17 ~ 2026-05-18)

### G3 wf-v0.3.0 머지 완료 (PR #8 + #9 + #10)

**3 PR 시퀀스**:
- **PR #8** (commit `9e774573`, 2026-05-18T09:07:57Z) — G3 14 화면 + hotfix1/2/3 통합
- **PR #9** (commit `034bad8`, 2026-05-18T09:17:44Z) — TA-03 use width/height (효과 없음, 진단 commit)
- **PR #10** (commit `af4c149`, 2026-05-18T09:24:44Z) — TA-03 inline sprite 4 symbol 추가 (진짜 정정, Playwright PASS)

**평가 결과 (3 사이클)**:

| 사이클 | evaluator | codex | 통합 |
|--------|----------:|------:|------|
| 양산 직후 | PASS 9.22 | FAIL 6.1 | BLOCKED |
| hotfix1 | PASS 8.48 | FAIL 7.0 | BLOCKED |
| hotfix2 | PASS 8.65 | FAIL 7.3 | BLOCKED |
| hotfix3 | PASS 8.475 | CONDITIONAL 8.1 (gpt-5.5) | MERGE_WITH_KI |
| hotfix4 | (별도 PR — Playwright만 정정) | — | PASS (CI) |

**Codex MCP hang 사고**: hotfix3 1차 호출 1시간6분 hang, 2차 38분 hang. 사용자 결정으로 gpt-5.5 모델 명시 후 12분 만에 정상 응답 (CONDITIONAL 8.1).

### G3 산출물

- HTML 14 화면 (TA-01~14)
- Analysis 14 (PRD 매핑 + 5상태 + i18n + API + 권한 + Phase 7 + 의존성)
- VERSION wf-v0.3.0
- CHANGELOG hotfix1/2/3 항목
- components.css 870 → 1023+ lines (G3 신규 9 + base + 모바일 override)
- _showcase.html 15 → 24 sections (G3 9 신규 demo)
- 03-components.md §G3.1~G3.9 (~270 lines Anatomy + Props + Phase 7)
- component-usage-matrix.json v1.1.0 (14 → 24 patterns)
- tokens.css `--color-accent-bg` 추가

### Playwright iconInvisible 사고 + 정정 (PR #9 → #10)

- 1차 시도 (PR #9): TA-03 13건 svg `<use>`에 width/height attribute 추가 — **효과 없음**
- 진단 (artifact 다운로드 + grep): **TA-03 inline sprite에 `i-arrow-right` / `i-download` / `i-eye` / `i-pdf` 4 symbol 누락**이 진짜 원인
- 2차 시도 (PR #10): sprite block 끝에 4 symbol 추가 → **Playwright PASS**

**교훈**: CI `inline-svg-sprite-check`는 sprite block 존재만 검사, 사용된 use href와 정의된 symbol id의 cross-check는 미실시. → KI-063 후보 (CI 강화).

## 3. 신규 세션 첫 작업 (G4 EM-01~11 양산)

### 작업 1 — G4 양산 시작 (EM-01부터)

main에서 새 브랜치 분기.

```bash
git checkout main && git pull --ff-only origin main
git checkout -b feature/WI-G4-wireframes-employee
```

**EM 11 화면 (PRD 기준)**:
- `.flowset/prd/domains/employee/EM-01~11.md` 정확히 확인 (HANDOFF 예상 X)
- PRD `prd/domains/employee/README.md` 인덱스 + 권한 매트릭스 + 사이드바 구조 (8 메뉴, 05-layouts.md §employee)

### 작업 2 — G4 패턴 의무 (G3와 동일)

- `_layout-shell.html` 복사 + employee 사이드바 8 메뉴 + 화면별 active
- 인라인 sprite 의무 (file:// 호환) — **사용 use href와 정의된 symbol id cross-check 필수** (G3 사고 교훈)
- 5 상태 토글 (state-debug + body data-state)
- `.is-active` variant SSOT (`.active` 금지)
- native control wrap (`.select-wrap` / `.file-input` / `.date-input`)
- href 실제 경로 (placeholder 0)
- showcase 매핑 + 03-components G4 신규 패턴 사양 (있다면)
- G3 신규 components (profile-card / org-tree / calendar-grid / approval-timeline+sticky / approval-shell / report-shell / settings-shell / integration-grid / req-shell) 재사용 가능

### 작업 3 — 평가 절차 (review-system v3 + G3 교훈)

그룹 양산 종료 시:
1. VERSION wf-v0.4.0 + CHANGELOG 항목
2. commit/push
3. PR draft 생성
4. evaluator (subagent_type=evaluator, run_in_background) + codex (subagent_type=general-purpose, run_in_background, mcp__codex__codex 위탁 — **gpt-5.5 모델 명시**)
5. 두 통지 대기 후 통합 판정
6. PASS_BOTH → ready → CI → auto-merge → tag wf-v0.4.0
7. hotfix 최대 3회 사이클
8. **사용 use href와 sprite symbol id cross-check 의무** (G3 PR #9/#10 사고 교훈)
9. 그룹 완료 후 KI close-out

### 작업 4 — 페이스 옵션

- **권장 (G2/G3 패턴)**: 일괄 양산 → 평가 → hotfix
- 묶음별: 컨텍스트 보호
- 세밀: 1 화면씩

## 4. Known Issues 현황 (활성)

| 심각도 | 활성 | 임계 | 트리거 |
|--------|------|------|--------|
| P0 | 0 | 1 | ❌ |
| P1 | 0 | 3 | ❌ |
| P2 | 6 (KI-049/050/051/054/060/061) | 5 | 도달 |
| P3 | 20 (KI-005/006/007/013/015/016/017/020/023/025/032~036/038/040/041~045/055/056/057/062) | 10 | 도달 |

**G3 resolved**: KI-046/047/048/052/053/058/059 (P1/P2/P3 일부)

**G4 진입 전 또는 차기 batch 권고**:
- KI-049 analysis 권한 매트릭스 7화면 누락 (OP-04/05/06/08/10/11/12)
- KI-050 .select-wrap 17건 미적용
- KI-054 icon-only aria-label (WCAG 2.1 AA)
- KI-060 TA-13 vert-tab font-weight drift (600 vs 700 SSOT)
- KI-061 components.css 7 base 셀렉터 중복 systemic
- KI-063 (신규 후보) CI inline-svg-sprite-check를 use href ↔ symbol id cross-check 강화

## 5. 핵심 정책 결정 (변경 금지)

| 결정 | 출처 |
|------|------|
| 평가 시스템 v3 (5축 + Hard gate + Playwright smoke) | review-system.md §17 |
| KI 트리거 (P0=1, P1=3, P2=5, P3=10) | triggers.md §2 |
| PR auto-merge --squash --delete-branch | project.md §6 |
| 그룹별 단일 브랜치 + commit/push 후 그룹 PR | project.md §6 |
| 그룹 머지 직후 KI close-out은 main 직접 push 허용 | 사용자 결정 2026-05-17 |
| 화면별 inline `<style>` 컴포넌트 재정의 금지 (DS SSOT) | design-system-ssot CI + 03-components.md |
| 외부 SVG `<use>` 금지 → 인라인 sprite + #i-... reference 의무 | review-system.md §17-1 + CI |
| native control DS wrap 의무 | review-system.md §17-2 + CI |
| variant naming `.is-*` 표준 (`.active` 금지) | G2 hotfix3-rev1 SSOT 통일 |
| 사용자 개입 6개 시점만 | review-system.md §10 |
| 그룹 완료 시에만 사용자 보고 (능동 진행) | 사용자 결정 2026-05-16 |
| **codex MCP hang 시 모델 명시 (gpt-5.5)** | **사용자 결정 2026-05-18** |
| **PR auto-merge가 CI 일부 PASS 시점에 머지 가능** | branch protection enforce_admins=false (관찰) |

## 6. PR 현황

| PR | 제목 | 상태 |
|----|------|------|
| #1~#7 | G0~G2 + system-v2/v3 | ✅ MERGED |
| **#8** | **WI-G3-docs G3 테넌트 와이어프레임 (wf-v0.3.0)** | ✅ **MERGED 2026-05-18 (auto-merge)** |
| **#9** | **WI-G3hotfix3-fix TA-03 use width/height (효과 없음)** | ✅ **MERGED 2026-05-18 (진단 commit)** |
| **#10** | **WI-G3hotfix4-fix TA-03 inline sprite 4 symbol 추가** | ✅ **MERGED 2026-05-18 (Playwright PASS)** |
| #(미생성) | G4 wf-v0.4.0 | ⏳ 양산 완료 후 생성 |

## 7. Task 상태 (이전 세션 → 신규 세션)

| 영역 | 상태 |
|------|------|
| G0/G1/G2 양산 + 평가 | ✅ completed |
| **G3 TA-01~14 양산 + hotfix1/2/3/4 + 머지** | ✅ **completed (wf-v0.3.0 tag)** |
| G4 EM-01~11 양산 | 🟡 **신규 세션 시작** |
| Phase 5 전체 evaluator (44 화면) | ⏳ 대기 |

## 8. 컨텍스트 압축 시 우선 보존

- **본 HANDOFF.md (필수 첫 작업)**
- `.flowset/contracts/review-system.md` (§17 v3 SSOT)
- `.flowset/contracts/review-rubric.md` (§10 5축)
- `.flowset/known-issues/INDEX.md`
- `.flowset/wireframes/_design-system/component-usage-matrix.json` (v1.1.0 24 patterns)
- `.flowset/wireframes/_design-system/03-components.md` (§G3.1~G3.9 신규 사양)
- `docs/FlowHR_screen_spec_v_1.md` (EM-01~11 명세)

## 9. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — Phase 5 PRD 결함 발견 시 batch-003 진행 가이드 | KI-027~031 |
| 2026-05-16 | 갱신 — G1 완료 + G2 양산 직전 | wf-v0.1.0 + 4 그룹 분할 |
| 2026-05-16 | 갱신 — G2 hotfix2 진행 중 다음 세션 인계 | 컨텍스트 한계 |
| 2026-05-16 | 갱신 — codex hotfix2 결과 + hotfix3 진입 안내 | OR 원칙 BLOCKED |
| 2026-05-17 | 갱신 — G2 wf-v0.2.0 머지 완료 + G3 진입 | wf-v0.2.0 tag + G3 양산 시작 |
| **2026-05-18** | **본 갱신 — G3 wf-v0.3.0 머지 완료 (PR #8/#9/#10) + G4 진입 안내** | wf-v0.3.0 tag + G4 EM 양산 시작 |
