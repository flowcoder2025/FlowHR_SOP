# FlowHR 핸드오프 — 신규 세션 진입 가이드

> **작성**: 2026-05-18 (Phase 5 종료 — wf-v1.0.0 머지 완료, Phase 6 진입 준비)
> **신규 세션 첫 작업**: 본 문서 §3 정독 → Phase 6 스프린트 계획 진입 (mvp-plan.md + sprint-001~N.md)
> **이전 핸드오프**: 2026-05-18 G4 wf-v0.4.0 머지 (현재 본 문서로 갱신)

## 1. 현재 상태 요약

### Phase 5 와이어프레임 종료

| 버전 | 그룹 | 화면 | 상태 | tag |
|------|------|------|------|-----|
| wf-v0.0.0 | 베이스라인 | (batch-003+004+005 + OP-01) | ✅ 머지 | wf-v0.0.0 |
| wf-v0.1.0 | G1 최초 진입점 | CM-01~06 + CM-20/21 (8) | ✅ 머지 | wf-v0.1.0 |
| wf-v0.1.1 | G1 hotfix | 7화면 | ✅ 머지 | wf-v0.1.1 |
| (system-v2) | 평가 시스템 v2 | evaluator + codex | ✅ 머지 (PR #6) | — |
| (system-v3) | 평가 시스템 v3 | file:// + 5축 | ✅ 머지 (PR #7) | — |
| wf-v0.2.0 | G2 운영 | OP-02~12 (11) | ✅ 머지 (PR #5) | wf-v0.2.0 |
| wf-v0.3.0 | G3 테넌트 매니저 | TA-01~14 (14) | ✅ 머지 (PR #8/#9/#10) | wf-v0.3.0 |
| (KI-063 강화) | G4 진입 전 의무 | CI sprite cross-check | ✅ 머지 (PR #11) | — |
| wf-v0.4.0 | G4 테넌트 직원 | EM-01~11 (11) | ✅ 머지 (PR #12) | wf-v0.4.0 |
| **wf-v0.4.1** | **Phase 5 audit fix** | **DS systemic 정정** | ✅ **머지 (PR #13)** | **wf-v0.4.1** |
| **wf-v1.0.0** | **Phase 5 종료** | **45 화면 통합** | ✅ **종료 마커** | **wf-v1.0.0** |

**현재 브랜치**: `main` (HEAD: `072483f` PR #13 merge + HANDOFF/tag commit 후속)

**Phase 5 화면 합계**: CM 8 + OP 12 + TA 14 + EM 11 = **45 화면**

## 2. 최근 진행 (2026-05-18, audit fix 사이클)

### audit fix 사이클 (PR #13)

사용자 시각 검수로 9 화면 결함 직접 지적 → DS systemic 정정 + Phase 5 전체 평가.

**평가 사이클**:

| 차수 | evaluator | codex | 통합 |
|------|----------:|------:|------|
| 1차 (Phase 5 full) | FAIL 7.45 (3 축 미달 + Hard gate 위반) | full review hang 47분 | FAIL |
| 2차 (audit hotfix1 재평가) | PASS 8.07 (모든 축 7.5+) | sampled 30% CONDITIONAL 8.1 | **MERGE_WITH_KI** |

**정정 commit 시퀀스**:
- `69743b5` — P1 badge variant CSS (288건 색상 미적용 해소) + KI-061 tab dead code
- `a630b52` — modal/stepper/vert-tab/kpi-meta/leave-badge + TA-13 button reset + TA-07 정렬/잘림
- `0fc4706` — NEW-P1 3건 + KI-049 16 화면 권한 매트릭스 + SSOT 동기
- `56d456e` — htmlhint fix (_showcase `<button` raw → `&lt;` escape)
- `f5c247c` — SAMP-P2-002 page-btn + ticket-status-current 4-way 동기
- merge: `072483f` (squash + delete-branch)

### 사용자 지적 9 화면 결함 해소 매트릭스

| 화면 | 결함 | 해소 |
|------|------|------|
| TA-03 / TA-10 / TA-13 | 탭 디자인 시스템 미준수 | ✅ tabs/tabs-row alias + button reset (audit fix L753-756 + L409) |
| TA-06 | 상태버튼 | ✅ 페이지네이션 inline DS bypass 정정 (sed) |
| TA-07 | 이전/다음달 정렬 + 반차 잘림 | ✅ page-action-bar flex-wrap + leave-badge ellipsis + "½" 텍스트 단축 |
| TA-09 | 에러 메시지 반응형 | ⏳ 잔존 (KI-057 768px breakpoint 부재) |
| OP-02 / OP-05 / OP-06 | 테이블 정렬 + DS 일부 적용 | 부분 해소 — bare select 잔존 (KI-050) |
| OP-10 | 디자인 시스템 미준수 | ✅ kpi-meta selector 통합 |
| EM-10 | 배지 적용 안됨 | ✅ badge variant CSS 288건 해소 |

### DS systemic 정정 효과

- `.badge.success` (CSS) ↔ `.badge-success` (HTML) 패턴 mismatch 해소 — **288건 색상 적용**
- `.tab` / `.tab.is-active` 중복 정의 dead code 제거 (KI-061)
- `.modal-header/footer/body` 중복 + `.modal-title` SSOT 신규
- `.stepper/.step` G2/G3 중복 dead code
- `.tabs` ≡ `.tabs-row` alias + `button.tab` UA reset (TA-03/10 정정)
- `button.vert-tab` UA reset (TA-13 정정)
- `.kpi-sub` ≡ `.kpi-meta` alias (OP-06/10 정정)
- `.leave-badge` overflow ellipsis + min-width (TA-07 정정)
- `.page-btn.is-active` SSOT 강제 (9 화면 페이지네이션 inline DS bypass 정정)
- `.ticket-status-current` components.css 등록 (OP-08)

### 4-way SSOT 동기 (audit hotfix1 + 1.2)

components.css ↔ 03-components.md ↔ _showcase.html ↔ matrix.json 4-way 동기:
- `.modal-title` (G4 audit fix)
- `button.tab` / `button.vert-tab` reset
- `.kpi-meta` alias
- `.page-btn` / `.page-btn.is-active` (audit hotfix1.2)
- `.ticket-status-current` (audit hotfix1.2)

matrix.json v1.2.2 — 33 patterns.

## 3. 신규 세션 첫 작업 — Phase 6 진입

Phase 5 종료. Phase 6 (스프린트 계획) 진입:

### 작업 1 — Phase 6 산출물

`.claude/rules/project.md §1 진행 순서표`:

| 산출물 | 위치 | 의무 |
|--------|------|------|
| MVP 계획 | `.flowset/sprints/mvp-plan.md` | Phase 5 45 화면 → Sprint N 분할 + 우선순위 |
| Sprint 001~N | `.flowset/sprints/sprint-001.md` ~ `.flowset/sprints/sprint-N.md` | 각 Sprint 스토리/태스크/수용 기준/MD |
| KI-013 (P3) | Phase 2 7 Epic Task 분해 미완 | Phase 6 진입 전 완료 |
| KI-034 (P3) | tasks.md / estimation.md / dependency-graph.md stale | Phase 6 진입 전 정정 |

### 작업 2 — Phase 6 evaluator 호출

Phase 6 종료 시 `.claude/agents/evaluator.md` 호출 (doc 모드, 5축).

### 작업 3 — KI 잔존 (Phase 6 사이클 안에서 처리 또는 별도 batch)

**활성 P2 (4건)**:
- KI-049 16 화면 권한 매트릭스 표 형식 미완 (backtick 손상 — KI-069로 분리)
- KI-050 bare select 17건 (OP-02/05/06/07/11)
- KI-051 CI showcase-coverage-check anchor만 검사
- KI-054 icon-btn aria-label 52건

**활성 P3 (30건)**: INDEX.md 참조.

### 작업 4 — Phase 6 진입 전 의무 (없음)

KI-063 같은 차단성 의무 없음. 바로 Phase 6 시작 가능.

## 4. Known Issues 현황 (활성 — Phase 5 종료 시점)

| 심각도 | 활성 | 임계 | 트리거 |
|--------|------|------|--------|
| P0 | 0 | 1 | ❌ |
| P1 | 0 | 3 | ❌ (1차 NEW-P1 3건 모두 audit hotfix1로 resolved) |
| P2 | 4 (KI-049/050/051/054) | 5 | ❌ (audit hotfix2 후 5건 미달) |
| P3 | 30 (KI-005/006/007/013/016/017/020/023/025/032~036/038/040/042~045/055~057/062/064~069) | 10 | ✅ 도달 |

**Phase 5 resolved (audit fix)**: KI-063 (G4 진입 전 의무) + NEW-P1 3건 (modal-title / ticket-status-current / page-btn) + NEW-P2 1건 (4-way 동기) — INDEX.md strike 처리는 차후 batch.

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
| CI inline-svg-sprite-check sprite cross-check 의무 (KI-063 resolved) | PR #11 / pr-checks.yml §3 |
| native control DS wrap 의무 | review-system.md §17-2 + CI |
| variant naming `.is-*` 표준 (`.active` 금지) | G2 hotfix3-rev1 SSOT 통일 |
| 사용자 개입 6개 시점만 | review-system.md §10 |
| 그룹 완료 시에만 사용자 보고 (능동 진행) | 사용자 결정 2026-05-16 |
| codex MCP hang 시 모델 명시 (gpt-5.5) + sampled 모드 fallback | 사용자 결정 2026-05-18 (Phase 5 full review hang 사례) |
| PR auto-merge가 CI 일부 PASS 시점에 머지 가능 | branch protection enforce_admins=false |
| **`.badge.X` 와 `.badge-X` 양 패턴 selector 통합 (audit hotfix1)** | DS SSOT 위반 재발 방지 |
| **`.page-btn.is-active` SSOT 강제 (audit hotfix1.2)** | 페이지네이션 inline DS bypass 차단 |

## 6. PR 현황

| PR | 제목 | 상태 |
|----|------|------|
| #1~#10 | G0~G3 + system-v2/v3 + hotfix | ✅ MERGED |
| #11 | WI-G4prep-ci CI sprite cross-check (KI-063) | ✅ MERGED |
| #12 | WI-G4-docs G4 직원 와이어프레임 (wf-v0.4.0) | ✅ MERGED |
| **#13** | **WI-Phase5-fix DS systemic 정정 (audit fix)** | ✅ **MERGED 2026-05-18 (squash)** |
| #(미생성) | Phase 6 스프린트 계획 | ⏳ 신규 세션 |

## 7. Task 상태

| 영역 | 상태 |
|------|------|
| G0/G1/G2/G3/G4 양산 + 평가 | ✅ completed |
| KI-063 CI sprite cross-check | ✅ resolved (PR #11) |
| Phase 5 audit fix (DS systemic + 사용자 지적 9 화면) | ✅ completed (PR #13) |
| **Phase 5 종료 marker `phase-5.pass`** | ✅ **created** |
| Phase 6 진입 | ⏳ **신규 세션** |

## 8. 컨텍스트 압축 시 우선 보존

- **본 HANDOFF.md (필수 첫 작업)**
- `.flowset/contracts/review-system.md` (§17 v3 SSOT)
- `.flowset/contracts/review-rubric.md` (§10 5축)
- `.flowset/known-issues/INDEX.md`
- `.flowset/wireframes/_design-system/component-usage-matrix.json` (v1.2.2 33 patterns)
- `.flowset/wireframes/_design-system/03-components.md` (G3 + G4 + audit hotfix1 SSOT)
- `.flowset/wireframes/_design-system/components.css` (audit hotfix1 정정)
- `.flowset/eval-results/phase-5-full*.{eval,codex}.md` (Phase 5 평가 사이클 4 파일)
- `.flowset/sprints/` (Phase 6 산출물 예정)

## 9. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — Phase 5 PRD 결함 발견 | KI-027~031 |
| 2026-05-16 | 갱신 — G1 완료 + G2 양산 직전 | wf-v0.1.0 |
| 2026-05-17 | 갱신 — G2 wf-v0.2.0 머지 + G3 진입 | wf-v0.2.0 tag |
| 2026-05-18 | 갱신 — G3 wf-v0.3.0 머지 + G4 진입 | wf-v0.3.0 tag |
| 2026-05-18 | 갱신 — G4 wf-v0.4.0 머지 + Phase 5 통합 안내 | wf-v0.4.0 tag |
| **2026-05-18** | **본 갱신 — Phase 5 audit fix + wf-v1.0.0 종료 + Phase 6 진입 안내** | **wf-v1.0.0 tag + Phase 5 종료 marker** |
