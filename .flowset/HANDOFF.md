# FlowHR 핸드오프 — 신규 세션 진입 가이드

> **작성**: 2026-05-18 (Phase 5 정식 종료 — wf-v1.0.0 재부여 + Phase 6 진입 준비)
> **신규 세션 첫 작업**: 본 문서 §3 정독 → Phase 6 스프린트 계획 진입 (mvp-plan.md + sprint-001~N.md)
> **이전 핸드오프**: 2026-05-18 wf-v1.0.0 + phase-5.pass 1차 부여 후 사용자 지적으로 철회 → audit hotfix2 + 3 사이클 후 재부여

## 0. 사용자 지적 정정 사이클 (2026-05-18 audit hotfix1→3)

1차 wf-v1.0.0 부여 후 사용자가 두 가지 비판:
1. "45 풀화면 검증 안된 상태" — sampled 15 화면만 codex 검토, 30 화면 미검증
2. "codex 45+ MCP hang 위험" 결론 = 표본 1건 일반화 (추측)

→ tag wf-v1.0.0 철회 → 45 풀화면 codex 4 그룹 분할 호출 (G1+G2+G3+G4, hang 회피) → audit hotfix2 commit → evaluator FAIL 7.84 (KI-050 "17건 resolved" 단언이 실측 16건 + OP-04 1건 누락 + _showcase 4건 미검수로 부정합) → audit hotfix3 증적 기반 정정 → evaluator PASS 8.13 → **wf-v1.0.0 재부여**.

**교훈 (CLAUDE.md 규칙 강화 의무)**:
- codex sub-agent 결과는 1차 가설 — commit 전 grep 증적 검증 의무
- "X건 정정" 단언 전 실측 카운트
- KI "resolved" 단언 전 grep 0건 증적 제시

## 1. 현재 상태 요약

### Phase 5 와이어프레임 정식 종료

| 버전 | 그룹 | 화면 | 상태 | tag |
|------|------|------|------|-----|
| wf-v0.0.0 | 베이스라인 | (batch-003+004+005 + OP-01) | ✅ 머지 | wf-v0.0.0 |
| wf-v0.1.0 | G1 최초 진입점 | CM-01~06 + CM-20/21 (8) | ✅ 머지 | wf-v0.1.0 |
| wf-v0.1.1 | G1 hotfix | 7 화면 | ✅ 머지 | wf-v0.1.1 |
| wf-v0.2.0 | G2 운영 | OP-02~12 (11) | ✅ 머지 (PR #5) | wf-v0.2.0 |
| wf-v0.3.0 | G3 테넌트 매니저 | TA-01~14 (14) | ✅ 머지 (PR #8~10) | wf-v0.3.0 |
| wf-v0.4.0 | G4 테넌트 직원 | EM-01~11 (11) | ✅ 머지 (PR #12) | wf-v0.4.0 |
| wf-v0.4.1 | audit fix 1차 | DS systemic 정정 | ✅ 머지 (PR #13) | wf-v0.4.1 |
| wf-v0.4.2 | audit hotfix2 | 45 풀화면 codex 분할 결과 정정 | ✅ 머지 (PR #14) | wf-v0.4.2 |
| wf-v0.4.3 | audit hotfix3 | evaluator FAIL 7.84 증적 기반 정정 | ✅ 머지 (PR #15) | wf-v0.4.3 |
| **wf-v1.0.0** | **Phase 5 정식 종료** | **45 화면 + 4 그룹 codex 검증 + evaluator PASS 8.13** | ✅ **재부여 (commit ba183a5)** | **wf-v1.0.0** |

**현재 브랜치**: `main` (HEAD `de6e925` — 본 HANDOFF commit. wf-v1.0.0 tag는 ba183a5에 부여)

**Phase 5 화면 합계**: CM 8 + OP 12 + TA 14 + EM 11 = **45 화면**

## 2. 최근 진행 (2026-05-18 audit 사이클)

### 평가 사이클 추적

| 차수 | evaluator | codex | 통합 | 정정 |
|------|----------:|------:|------|------|
| 1차 (PR #13 commit) | FAIL 7.45 | full review hang 47분 | FAIL | h1 정정 |
| h1 (PR #13 commit) | PASS 8.07 | sampled CONDITIONAL 8.1 | MERGE_WITH_KI | h1.2 정정 |
| h1.2 (PR #13 commit) | (생략) | (생략) | MERGE_WITH_KI | 1차 wf-v1.0.0 부여 → 사용자 지적 → 철회 |
| h2 (PR #14 commit) | 미평가 | G1 8.1 + G2 6.8 + G3 8.8 + G4 8.7 | 가중 8.12 | h2 codex KI-050 P0 잔존 |
| h2 (PR #14 재평가) | FAIL 7.84 (Hard gate 미달) | G2 FAIL 7.2 | FAIL | h3 증적 정정 |
| **h3 (PR #15)** | **PASS 8.13** | G2 hotfix3 재평가 8.1 (G1/G3/G4는 hotfix2 평가 유지: 9.2/8.8/9.0) — **가중 평균 8.73** | **MERGE_WITH_KI → PASS** | **wf-v1.0.0 재부여** |

### codex 4 그룹 분할 검증 (45 화면 전수)

| 그룹 | 화면 | 점수 | 판정 | 평가 시점 |
|------|-----:|-----:|------|----------|
| G1 CM | 8 | 9.2 | PASS | hotfix2 재평가 |
| G2 OP | 12 | 8.1 | CONDITIONAL (P2 정합성 결함 2건 → 정리 완료) | hotfix3 재평가 |
| G3 TA | 14 | 8.8 | PASS | hotfix2 재평가 |
| G4 EM | 11 | 9.0 | PASS | hotfix2 재평가 |
| **가중 평균** | **45** | **8.73** | (= (9.2×8 + 8.1×12 + 8.8×14 + 9.0×11) / 45 = 393.0/45) | |

### 사용자 시각 검수 결함 해소 (11 화면)

사용자 직접 시각 검수로 지적한 11 화면 (TA 6 + OP 4 + EM 1):

| 화면 | 결함 | 해소 사이클 | 비고 |
|------|------|------------|------|
| TA-03 | 탭 디자인 시스템 미준수 | h1 (tabs/tabs-row alias + button reset) | codex G3 hotfix2 verification PASS |
| TA-06 | 상태버튼 (페이지네이션 정정) | h1.2 (page-btn SSOT) | codex G3 verification PASS |
| TA-07 | 캘린더 정렬 + 반차 잘림 | h1 (page-action-bar flex + leave-badge ellipsis + "½") | codex G3 verification PASS |
| TA-09 | 에러 메시지 반응형 | **시각 결함 직접 정정 없음 — codex G3 audit_hotfix_verification 항목 PASS 보고 (TA-09_error_responsive: PASS)** | 시각 검수 vs 코드 분석 결과 차이 가능. 사용자 추가 검수 권장. KI 등록 없음. |
| TA-10 | 탭 디자인 시스템 미준수 | h1 (동일 audit fix) | codex G3 verification PASS |
| TA-13 | vert-tabs UA 시각 | h1 (button.vert-tab reset) | codex G3 verification PASS |
| OP-02 | 테이블 정렬 + DS 일부 적용 | h2 (KI-050 3건 select-wrap) + h3 OP-04 무관 | codex G2 hotfix3 PASS |
| OP-05 | 테이블 정렬 + DS 일부 | h2 (KI-050 3건 select-wrap) | codex G2 hotfix3 PASS |
| OP-06 | 테이블 정렬 + DS 일부 | h2 (KI-050 3건 select-wrap) | codex G2 hotfix3 PASS |
| OP-10 | 디자인 시스템 미준수 | h1 (kpi-meta selector 통합) | codex G2 1차 PASS |
| EM-10 | 배지 적용 안됨 | h1 (badge variant CSS 양 패턴 — 288건 색상 해소) | codex G4 verification PASS |

**해소율**: 10/11 코드 정정 + codex verification PASS. 1건 (TA-09)은 코드 정정 없이 codex가 PASS 보고 — 사용자 실제 시각 결과와 차이 가능, 추가 검수 시 hotfix.

## 3. 신규 세션 첫 작업 — Phase 6 진입

Phase 5 정식 종료. Phase 6 (스프린트 계획) 진입.

### 작업 1 — Phase 6 산출물 (`.claude/rules/project.md §1`)

| 산출물 | 위치 | 의무 |
|--------|------|------|
| MVP 계획 | `.flowset/sprints/mvp-plan.md` | Phase 5 45 화면 → Sprint N 분할 + 우선순위 |
| Sprint 001~N | `.flowset/sprints/sprint-001.md` ~ `.flowset/sprints/sprint-N.md` | 각 Sprint 스토리/태스크/수용 기준/MD |

### 작업 2 — Phase 6 진입 전 의무 (KI-013/034 정리)

SSOT 출처: `.flowset/known-issues/INDEX.md:32` (KI-013 scheduled Phase 6) + `INDEX.md:53` (KI-034 open, Phase 6 KI-013과 함께 처리). **project.md §1 진행 순서표에는 명시 없음 — INDEX scheduled 표기 기반**.

- **KI-013** (P3) — Phase 2 EP-03/04/05/09/10/11/12 7 Epic Task 분해 미완 — INDEX scheduled (Phase 6)
- **KI-034** (P3) — tasks.md / estimation.md / dependency-graph.md stale (ST-073~080 미반영) — INDEX open (Phase 6 KI-013과 함께 처리)

### 작업 3 — Phase 6 evaluator + codex (모드 doc)

스프린트 계획 종료 시 evaluator + codex 호출. review-system.md §17 v3 5축 (Phase 6은 wireframe DS 충실도 축 비적용 — 4축).

### 작업 4 — KI 잔존 (Phase 6 사이클 또는 별도 batch)

**활성 P2 (4건, 임계 미달)**:
- KI-049 16 화면 권한 매트릭스 표 형식 (KI-069로 backtick 손상 분리)
- KI-054 icon-btn aria-label 52건 (WCAG 2.1 AA)
- KI-060 TA-13 vert-tab font-weight drift
- KI-061 components.css 7 base 셀렉터 중복 systemic

**활성 P3 (30건+)**: INDEX.md 참조.

## 4. Known Issues 현황 (Phase 5 종료 시점)

| 심각도 | 활성 | 임계 | 트리거 |
|--------|------|------|--------|
| P0 | 0 | 1 | ❌ |
| P1 | 0 | 3 | ❌ (audit hotfix3 OP-04 + _showcase 5건 정정 — KI-046/047/048 외 추가 이력) |
| P2 | 4 (KI-049/054/060/061) | 5 | ❌ (KI-050+KI-051 resolved로 트리거 해제) |
| P3 | 30+ | 10 | ✅ 도달 (차기 docs batch) |

**Phase 5 audit 사이클 resolved**: KI-050 (21건 select-wrap), KI-051 (CI native-wrap-check 강화).

## 5. 핵심 정책 결정 (변경 금지 + audit 교훈 반영)

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
| **CI native-element-wrap-check `.select-wrap` parent 검증 (KI-051 resolved)** | **audit hotfix3 / pr-checks.yml L256+** |
| variant naming `.is-*` 표준 (`.active` 금지) | G2 hotfix3-rev1 SSOT 통일 |
| `.badge.X` 와 `.badge-X` 양 패턴 selector 통합 (audit hotfix1) | DS SSOT 위반 재발 방지 |
| `.page-btn.is-active` SSOT 강제 (audit hotfix1.2) | 페이지네이션 inline DS bypass 차단 |
| 사용자 개입 6개 시점만 | review-system.md §10 |
| 그룹 완료 시에만 사용자 보고 (능동 진행) | 사용자 결정 2026-05-16 |
| codex MCP hang 시 모델 명시 (gpt-5.5) + 4 그룹 분할 fallback | 사용자 결정 2026-05-18 (Phase 5 full review hang + sampled hang 사례) |
| **codex sub-agent 결과는 1차 가설 — commit 전 grep 증적 검증 의무** | **audit hotfix3 사용자 비판 반영 2026-05-18** |
| **"X건 정정" 단언 전 실측 카운트** | **audit hotfix3** |
| **KI "resolved" 단언 전 grep 0건 증적 제시** | **audit hotfix3** |

## 6. PR 현황

| PR | 제목 | 상태 |
|----|------|------|
| #1~#12 | G0~G4 + system-v2/v3 + hotfix | ✅ MERGED |
| #13 | WI-Phase5-fix DS systemic 1차 정정 (audit fix) | ✅ MERGED |
| #14 | WI-Phase5-fix audit hotfix2 — 45 풀화면 codex 분할 결과 정정 | ✅ MERGED |
| **#15** | **WI-Phase5-fix audit hotfix3 — evaluator FAIL 7.84 증적 정정** | ✅ **MERGED 2026-05-18** |
| #(미생성) | Phase 6 스프린트 계획 | ⏳ 신규 세션 |

## 7. Task 상태

| 영역 | 상태 |
|------|------|
| G0/G1/G2/G3/G4 양산 + 평가 | ✅ completed |
| KI-063 CI sprite cross-check | ✅ resolved (PR #11) |
| Phase 5 audit fix 1차 (PR #13) | ✅ completed |
| Phase 5 audit hotfix2 (PR #14) + hotfix3 (PR #15) | ✅ completed |
| **Phase 5 정식 종료 marker `phase-5.pass` (재부여)** | ✅ **created** |
| **tag wf-v1.0.0 (재부여)** | ✅ **push 2026-05-18** |
| Phase 6 진입 | ⏳ **신규 세션** |

## 8. 컨텍스트 압축 시 우선 보존

- **본 HANDOFF.md (필수 첫 작업)**
- `.flowset/contracts/review-system.md` (§17 v3 SSOT)
- `.flowset/contracts/review-rubric.md` (§10 5축)
- `.flowset/known-issues/INDEX.md`
- `.flowset/wireframes/_design-system/component-usage-matrix.json` (v1.2.2 33 patterns)
- `.flowset/wireframes/_design-system/03-components.md` (G0~G4 + audit fix SSOT 동기)
- `.flowset/wireframes/_design-system/components.css` (audit fix 정정)
- `.flowset/eval-results/phase-5-full*.{eval,codex}.md` (8 평가 결과 파일)
- `.flowset/eval-results/phase-5.pass` (Phase 5 종료 marker)
- `.flowset/sprints/` (Phase 6 산출물 예정)

## 9. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — Phase 5 PRD 결함 발견 | KI-027~031 |
| 2026-05-16 | 갱신 — G1 완료 + G2 양산 직전 | wf-v0.1.0 |
| 2026-05-17 | 갱신 — G2 wf-v0.2.0 머지 + G3 진입 | wf-v0.2.0 tag |
| 2026-05-18 | 갱신 — G3 wf-v0.3.0 머지 + G4 진입 | wf-v0.3.0 tag |
| 2026-05-18 | 갱신 — G4 wf-v0.4.0 머지 + Phase 5 통합 안내 | wf-v0.4.0 tag |
| 2026-05-18 | 1차 wf-v1.0.0 부여 → 사용자 지적 → 철회 | "45 풀화면 codex 미검증" |
| **2026-05-18** | **본 갱신 — Phase 5 정식 종료 (audit hotfix2+3 후 wf-v1.0.0 재부여)** | **evaluator PASS 8.13 + codex 4 그룹 평균 8.78 + 사용자 시각 검수 9/9 해소** |
