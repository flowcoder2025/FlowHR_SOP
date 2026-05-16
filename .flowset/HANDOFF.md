# FlowHR 핸드오프 — 신규 세션 진입 가이드

> **작성**: 2026-05-16 (G2 hotfix2 진행 중 컨텍스트 한계 도달, 다음 세션 인계)
> **신규 세션 첫 작업**: 본 문서 정독 → §3 "신규 세션 첫 작업"의 agent 결과 파일 확인 → 통합 판정 → 머지/tag 진행
> **이전 핸드오프**: 2026-05-16 G2 양산 직후 (wf-v0.1.0 머지 + G2 양산 11/11 후 핸드오프) — 본 문서로 갱신.

## 1. 현재 상태 요약

### Phase 5 와이어프레임 진행 (wf-v* 버전)

| 버전 | 그룹 | 화면 | 상태 | tag |
|------|------|------|------|-----|
| wf-v0.0.0 | 베이스라인 | (batch-003+004+005 + OP-01) | ✅ 머지 | wf-v0.0.0 |
| wf-v0.1.0 | G1 최초 진입점 | CM-01~06 + CM-20/21 (8) | ✅ 머지 | wf-v0.1.0 |
| wf-v0.1.1 | G1 hotfix | state 토글 flex-direction column 7화면 | ✅ 머지 | wf-v0.1.1 |
| (system-v2) | 평가 시스템 v2 | evaluator + codex 통합 정책 | ✅ 머지 (PR #6) | (tag 없음) |
| (system-v3) | 평가 시스템 v3 | file:// 호환 + 렌더링 + DS 충실도 5축 | ✅ 머지 (PR #7) | (tag 없음) |
| **wf-v0.2.0** | **G2 운영** | **OP-02~12 (11) + hotfix2 진행 중** | 🟡 **PR #5 진행, hotfix2 재평가 대기** | — |
| wf-v0.3.0 | G3 테넌트 매니저 | TA-01~14 (14) | ⏳ 대기 (G2 머지 후) | — |
| wf-v0.4.0 | G4 테넌트 직원 | EM-01~11 (11) | ⏳ 대기 | — |
| wf-v1.0.0 | Phase 5 전체 | 44 화면 통합 | ⏳ 대기 | — |

**현재 브랜치**: `feature/WI-G2-wireframes-operator` (HEAD: `931539d`)

## 2. 최근 진행 (2026-05-16)

### system-v2 (PR #6 머지) — 평가 시스템 v2

evaluator (Claude sub-agent) + codex (gpt-5 MCP) 통합 평가 + KI 트리거 정책 명문화. `.flowset/contracts/review-system.md` SSOT.

### system-v3 (PR #7 머지) — file:// 호환 + 렌더링 검수 + DS 충실도 5축

G2 운영 후 사용자 검수에서 아이콘 미표시 + native control + showcase 분리 누락 발견. Codex 협의 합의안 반영:
- 외부 SVG `<use>` 금지, 인라인 sprite 의무
- native control DS 패턴 의무 (`.select-wrap` / `.file-input` / `.date-input`)
- Playwright smoke 즉시 도입 (pixelmatch는 Phase 7)
- showcase 사용 매트릭스 (`component-usage-matrix.json`)
- CI 신규 4 job
- evaluator 5번째 축 "DS 사용 충실도 10%" + Hard gate
- codex 프롬프트 5항목 의무 체크리스트

### G2 hotfix batch-006 (진행 중, 미머지)

**시작**: G2 양산 PASS 8.11 후 사용자 검수에서 아이콘/native/showcase 누락 발견 → system-v3 적용
**커밋 히스토리** (G2 브랜치, 16fea0c~931539d 7 hotfix 커밋):
1. `16fea0c` VERSION wf-v0.2.0 + CHANGELOG G2 양산 11 화면
2. `2165d29` KI-046~049 등록 (P1 trigger 도달)
3. `040a4f2` components.css 11 G2 컴포넌트 정식 등록 + @media 768px
4. `44dcb47` DS 보강 v3 — .select chevron + .select-wrap/.file-input/.date-input + 인라인 sprite
5. `603c7e3` CI 4 신규 job + component-usage-matrix.json
6. `cdf45e5` 20 화면 v3 patch (sprite + native wrap + href + aria)
7. `931539d` **hotfix2 — 9 P0/P1 결함 정정** (외부 use 치환 + inline 재정의 제거 + variant + href + showcase + 03-components + CI)

**hotfix1 평가 결과** (직전):
- evaluator FAIL 5.29/10 (5축 4축 미달 + Hard gate 다중 위반)
- codex FAIL 4.0/10 (P1 3건 미해결 + §17-7 신규 P1)
- 핵심 결함: 외부 use 306건 잔존 (patch agent가 sprite 삽입만, use 참조 치환 누락), 9 화면 inline 재정의, OP-04 bare file input, variant drift, 사이드바 href 97건 누락, _showcase.html anchor 부재, 03-components.md 8 컴포넌트 미등록, CI 로직 결함

**hotfix2 정정 (931539d, agent 자기 보고)**:
- P0-1: 외부 svg use 19 화면 300건 → `#i-...` 0건 잔존
- P1-2: 9 화면 inline 재정의 제거 (modal/drawer/stepper/switch/toggle-pill/period-chip/diff/tab/vert-tab)
- P1-3: OP-04 file input `.file-input` wrap
- P1-4: variant drift 32건 (toggle-pill 13 + switch 14 + step 5) → `.is-*`
- P1-5: 사이드바 href 159건 추가 (sidebar 97 + dropdown 5 + row 5 + footer 24 + other 28)
- P1-6: _showcase.html 15 패턴 anchor 신설 (matrix.json 100% 정합)
- P1-7: 03-components.md 10 신규 섹션 (Modal/Switch/Stepper/Toggle Pill/Period Chip/Drawer/Diff/File Input/Date Input/Select Wrap)
- P1-8: CI inline-svg-sprite-check 로직 보강 (외부 1건+ fail)
- P2-9: CI design-system-ssot banned 9 클래스 추가
- 추가: OP-12 `.session-row` → `.session-card` rename + role/aria-checked

**검증 (agent 자기보고 100% PASS)**: 외부 svg=0, 변종=0, bare native=0, a 무href=0, banned 정의=0, showcase 15/15.

## 3. 신규 세션 첫 작업 (우선순위 순)

### 작업 1 — agent 결과 파일 확인 + hotfix3 즉시 진입

**상태 (2026-05-16 컨텍스트 종료 시점)**:
- ✅ codex hotfix2 결과 통지 받음 → `.flowset/eval-results/WI-G2-codex-review-hotfix2.md` 저장 (Claude 본체가 통지 요약 작성, agent는 read-only sandbox)
  - **점수 6.5/10 FAIL** — P0 잔존 (JS password toggle 외부참조 재주입) + 신규 P1 (.active vs .is-active drift) + P2 (select-wrap 17건)
- ❓ evaluator hotfix2 결과 미통지 — `.flowset/eval-results/WI-G2-wireframes-operator-hotfix2.eval.md` 존재 여부 확인 필요:
  ```bash
  ls -la .flowset/eval-results/WI-G2-wireframes-operator-hotfix2.* 2>&1
  ```

**evaluator 결과 없으면**: agent 재호출 (`Agent(subagent_type=evaluator, run_in_background=true, prompt=...본 §6 참조...)`)

### 작업 2 — hotfix3 즉시 진입 (3회 중 마지막)

codex 결과 FAIL 확정 → review-system.md §4 OR 원칙으로 BLOCKED_FOR_HOTFIX_3.

**hotfix3 정정 사항** (codex 결과 §결함 참조 — `.flowset/eval-results/WI-G2-codex-review-hotfix2.md`):

**P0 (즉시)**:
- 4 화면 JS sed (CM-01 / CM-02 / CM-03 / OP-12):
  ```bash
  for f in .flowset/wireframes/html/{CM-01,CM-02,CM-03,OP-12}.html; do
    sed -i "s|'\.\./_design-system/icons\.svg#|'#|g" "$f"
  done
  ```
- 검증: `grep -n "'\.\./_design-system/icons\.svg" .flowset/wireframes/html/*.html` 결과 0건

**P1**:
- `.active` → `.is-active` 전역 통일 (components.css / _showcase.html / 03-components.md / 화면 inline 모두)
- variant naming v3 표준 (`.is-*`) 적용

**P2 (KI 등록, NON_BLOCKING)**:
- `.select-wrap` 미적용 17건 — KI 등록 후 다음 batch
- CI showcase-coverage 강화 — KI 등록

**CI 추가**:
- JS source 외부 sprite reference 검사 (codex §결론 권장 — codex 5항목 §17-7-1 확장)
  ```yaml
  # inline-svg-sprite-check job 보강
  if grep -nE "'?\\.\\./_design-system/icons\\.svg" *.html | grep -v '<use ' ; then
    fail=1
  fi
  ```

### 작업 3 — hotfix3 evaluator + codex 재평가

**review-system.md §4 매트릭스**:
- evaluator PASS + codex PASS → **PASS_BOTH** → 즉시 ready/auto-merge
- evaluator PASS + codex WARNING → **CONDITIONAL** → KI 등록 + 트리거 평가
- evaluator FAIL OR codex FAIL → **BLOCKED_FOR_HOTFIX_3** (3회 중 마지막)

**3회 중 진행**: hotfix1 FAIL → hotfix2 (현재) → hotfix3는 1회 남음. 3회 연속 FAIL 시 사용자 에스컬레이션.

### 작업 3 — PASS_BOTH 시 머지/tag

```bash
git checkout main
git pull --ff-only origin main
gh pr ready 5
gh pr merge 5 --auto --squash --delete-branch
# CI PASS 후 머지 → main 자동 동기화
sleep 30
git checkout main && git pull --ff-only origin main
MERGE_SHA=$(gh pr view 5 --json mergeCommit -q '.mergeCommit.oid')
git tag -a wf-v0.2.0 "$MERGE_SHA" -m "wf-v0.2.0 — G2 운영 (OP-02~12, 11 화면) + hotfix1/2"
git push origin wf-v0.2.0
```

### 작업 4 — 그룹 완료 보고 (사용자)

PASS_BOTH → 머지 → tag 부여 → 사용자에게 보고:
- 점수 (evaluator + codex)
- 11 화면 + hotfix1/2 변경 요약
- 다음 단계 (G3 진입 안내)

### 작업 5 — G3 진입 (사용자 OK 후)

`feature/WI-G3-wireframes-tenant` 브랜치 + TA-01~14 14 화면 양산.
- 사이드바: tenant 8 메뉴 (대시보드/직원/근태/휴가/결재/급여·문서/리포트/설정)
- 패턴: G2와 동일 — _layout-shell 인라인 sprite + DS 컴포넌트만 사용 + 5 상태 토글
- system-v3 의무 (file:// 호환 + native wrap + showcase 매핑 + 5축 평가)

## 4. Known Issues 현황 (활성)

| 심각도 | 활성 | 임계 |
|--------|------|------|
| P0 | 0 | 1 |
| P1 | 3 (KI-046/047/048 batch-006 진행 중) | 3 |
| P2 | 1 (KI-049 analysis 권한) | 5 |
| P3 | 17 | 10 (이미 도달) |

**KI-046~049**: hotfix2 진행 중 — 재평가 PASS 시 archive로 이동. PASS 못 하면 hotfix3로 정정.

## 5. 핵심 정책 결정 (변경 금지)

| 결정 | 출처 |
|------|------|
| 평가 시스템 v3 (evaluator + codex 통합 + 5축 + Hard gate + Playwright smoke) | review-system.md §17 |
| KI 트리거 (P0=1, P1=3, P2=5, P3=10) | triggers.md §2 |
| PR auto-merge --squash --delete-branch | project.md §6 |
| 그룹별 단일 브랜치 + commit/push 후 그룹 PR | project.md §6 |
| 화면별 inline `<style>` 컴포넌트 재정의 금지 (DS SSOT) | design-system-ssot CI + 03-components.md |
| 외부 SVG `<use>` 금지 → 인라인 sprite + #i-... reference 의무 (file:// 호환) | review-system.md §17-1 + CI inline-svg-sprite-check |
| native control DS wrap 의무 (`.select-wrap` / `.file-input` / `.date-input`) | review-system.md §17-2 + CI native-element-wrap-check |
| 사용자 개입 6개 시점만 (P0/P1 trigger/downgrade/contract/충돌/3회 FAIL) | review-system.md §10 |
| 그룹 완료 시에만 사용자 보고 (능동 진행) | 사용자 결정 2026-05-16 |

## 6. evaluator + codex agent 재호출 prompt (요약)

agent 재호출이 필요한 경우 (작업 1에서 결과 파일 없을 때):

### evaluator hotfix2
- subagent_type: `evaluator`
- 라벨: WI-G2-wireframes-operator-hotfix2
- v3 5축 (review-rubric.md §10) + Hard gate
- 직전 hotfix1 P0/P1 9건 HEAL 검증 (본 문서 §2 hotfix2 변경 표 참조)
- 출력: `.flowset/eval-results/WI-G2-wireframes-operator-hotfix2.eval.md` + `.pass` (PASS 시)

### codex hotfix2
- subagent_type: `general-purpose`
- prompt 내 `mcp__codex__codex` 호출 (sandbox: read-only)
- 의무 체크 §17-7 5항목
- 출력: `.flowset/eval-results/WI-G2-codex-review-hotfix2.md`

## 7. 디렉토리 / 파일 인덱스 (변경분 위주)

```
.flowset/
├── HANDOFF.md (본 문서)
├── VERSION (wf-v0.2.0)
├── CHANGELOG.md (wf-v0.2.0 + system-v3 + wf-v0.1.1 + wf-v0.1.0 + wf-v0.0.0)
├── contracts/
│   ├── review-system.md (v3 SSOT, §17 추가)
│   ├── review-system-v2-draft.md (Codex 협의 원본)
│   ├── review-system-v3-draft.md (Codex v3 협의 원본)
│   ├── review-rubric.md (§10 5번째 축 추가)
│   └── api-standard.md
├── known-issues/
│   ├── INDEX.md (KI-046~049 진행 중)
│   └── triggers.md
├── eval-results/
│   ├── WI-G2-wireframes-operator.eval.md + .pass (G2 양산 PASS 8.11)
│   ├── WI-G2-codex-review.md (G2 양산 WARNING 6.8)
│   ├── WI-G2-wireframes-operator-hotfix1.eval.md (hotfix1 FAIL 5.29 — Read 또는 Write 가능)
│   ├── WI-G2-codex-review-hotfix1.md (hotfix1 FAIL 4.0)
│   ├── WI-G2-wireframes-operator-hotfix2.eval.md (작성 대기 — 신규 세션 확인)
│   ├── WI-G2-wireframes-operator-hotfix2.pass (작성 대기)
│   └── WI-G2-codex-review-hotfix2.md (작성 대기)
└── wireframes/
    ├── _design-system/
    │   ├── components.css (G2 11 컴포넌트 + .select-wrap/.file-input/.date-input 정식 등록)
    │   ├── _layout-shell.html + _layout-auth.html (인라인 sprite 통합)
    │   ├── component-usage-matrix.json (신규, 14 패턴 + 5 forbidden_global)
    │   ├── 03-components.md (G2 10 섹션 추가)
    │   └── _showcase.html (15 패턴 anchor 신설)
    └── html/
        ├── CM-01.html ~ CM-21.html (G1 8 + 인라인 sprite)
        └── OP-01.html ~ OP-12.html (G2 12 + hotfix2 정정)

.github/workflows/pr-checks.yml (9 job: commit-msg + utf8 + html-syntax + design-system-ssot + version + inline-svg-sprite + native-element-wrap + showcase-coverage + playwright-smoke)

.claude/
├── agents/evaluator.md (5번째 축 + Codex 협업 명시)
└── rules/project.md §7 (자동화 v3 시퀀스 + 사용자 개입 + Playwright)
```

## 8. PR 현황

| PR | 제목 | 상태 |
|----|------|------|
| #1 | WI-G0-docs wf-v0.0.0 베이스라인 | ✅ MERGED |
| #2 | WI-G1-docs G1 최초 진입점 (wf-v0.1.0) | ✅ MERGED |
| #3 | WI-G1eval-docs G1 fix1 평가 결과 | ✅ MERGED |
| #4 | WI-G1hotfix-fix CM-02~06+20+21 state column | ✅ MERGED |
| #5 | **WI-G2-docs G2 운영 (wf-v0.2.0)** | 🟡 **OPEN (draft, hotfix2 재평가 대기)** |
| #6 | WI-RSv2-feat 평가 시스템 v2 | ✅ MERGED |
| #7 | WI-RSv3-feat 평가 시스템 v3 | ✅ MERGED |

## 9. Task 상태 (다음 세션 인계)

| ID | 상태 | 비고 |
|----|------|------|
| T1~T6 | completed | G0 + G1 + G1 hotfix |
| T7 | completed | G2 양산 11/11 |
| T8 | in_progress | G2 evaluator + PR + tag wf-v0.2.0 (그룹 사이클) |
| T14 | completed | 시스템 v2 |
| T15, T16, T18 | completed | G2 hotfix DS 보강 / CI 4 job / 19 화면 patch |
| T17 | in_progress | G2 hotfix 재평가 (evaluator + codex hotfix2 background, 본 세션 종료 시점) |
| T9~T13 | pending | G3 / G4 / Phase 5 전체 evaluator |

## 10. 컨텍스트 압축 시 우선 보존

신규 세션 컨텍스트 압축 시 가장 먼저 다시 로드되어야:
- **본 HANDOFF.md (필수 첫 작업)**
- `.flowset/contracts/review-system.md` (§17 v3 SSOT)
- `.flowset/eval-results/WI-G2-wireframes-operator-hotfix2.eval.md` (작성되어 있다면)
- `.flowset/eval-results/WI-G2-codex-review-hotfix2.md` (작성되어 있다면)
- `.flowset/known-issues/INDEX.md`
- `.flowset/wireframes/_design-system/component-usage-matrix.json`

## 11. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — Phase 5 PRD 결함 발견 시 batch-003 진행 가이드 | KI-027~031 |
| 2026-05-16 | 갱신 — G1 완료 + G2 양산 직전 | wf-v0.1.0 + 4 그룹 분할 |
| 2026-05-16 | **본 갱신 — G2 hotfix2 진행 중 컨텍스트 한계 도달, 다음 세션 인계** | 능동 진행 중 evaluator + codex 재평가 background 대기 |
