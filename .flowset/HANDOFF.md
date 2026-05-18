# FlowHR 핸드오프 — 신규 세션 진입 가이드

> **작성**: 2026-05-18 (G4 wf-v0.4.0 머지 완료, Phase 5 전체 통합 진입 직전)
> **신규 세션 첫 작업**: 본 문서 §3 정독 → Phase 5 전체 evaluator (44 화면 통합) 또는 사용자 결정
> **이전 핸드오프**: 2026-05-18 G3 wf-v0.3.0 머지 완료 + G4 진입 안내 (현재 본 문서로 갱신)

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
| wf-v0.3.0 | G3 테넌트 매니저 | TA-01~14 (14) + hotfix1/2/3/4 | ✅ 머지 (PR #8/#9/#10) | wf-v0.3.0 |
| (KI-063 강화) | G4 진입 전 의무 | CI sprite cross-check | ✅ 머지 (PR #11) | — |
| **wf-v0.4.0** | **G4 테넌트 직원** | **EM-01~11 (11) + hotfix1/2** | ✅ **머지 (PR #12)** | **wf-v0.4.0** |
| wf-v1.0.0 | Phase 5 전체 | **45 화면 통합** | ⏳ **신규 세션 진행 결정** | — |

**현재 브랜치**: `main` (HEAD: `c43ea50` — PR #12 squash 머지 commit)

**Phase 5 화면 합계**: CM 8 + OP 12 + TA 14 + EM 11 = **45 화면** (PRD spec 44 화면 + CM-22 PWA install 1)

## 2. 최근 진행 (2026-05-18)

### G4 wf-v0.4.0 머지 완료 (PR #12)

**1 PR 시퀀스 (3 commit)**:
- commit `0a39bf9` (2026-05-18T10:5x:xxZ) — G4 11 화면 + 11 analysis + DS 보강 + VERSION/CHANGELOG
- commit `79315fc` (2026-05-18T11:xx:xxZ) — hotfix1 (codex 4 finding + evaluator P2 2건 mechanical fix)
- commit `1a25d91` (2026-05-18T11:xx:xxZ) — hotfix2 (codex 재평가 P2/P3 + evaluator P3 mechanical fix)
- merge commit `c43ea50` (2026-05-18T11:32:28Z) — PR #12 squash 머지 + auto-merge + delete-branch

**평가 결과 (3 사이클)**:

| 사이클 | evaluator | codex (gpt-5.5) | 통합 | 정정 |
|--------|----------:|----------------:|------|------|
| 1차 | PASS 8.74 | CONDITIONAL 7.2 | MERGE_WITH_KI / hotfix1 | hotfix1 8건 mechanical fix |
| 2차 (hotfix1 재평가) | PASS 8.98 | CONDITIONAL 8.1 | MERGE_WITH_KI / hotfix2 | hotfix2 5건 mechanical fix |
| 3차 (hotfix2 후) | — (생략) | — (생략) | MERGE_WITH_KI | PASS 매트릭스 적용 — codex 결함 전수 해소 |

### G4 산출물

- HTML 11 화면 (EM-01~11)
- Analysis 11 (PRD 매핑 + 5~6상태 + i18n + API + 권한 + Phase 7 + 의존성)
- VERSION wf-v0.4.0
- CHANGELOG hotfix1/2 항목
- components.css 988 → 1100+ lines (G4 신규 6 §G4.1~G4.6 + 보조 자식 §G4.7 7종 + button.notif-row reset + 모바일 override)
- _showcase.html G4 6 신규 demo section
- 03-components.md §G4.1~G4.6 (~125 lines Anatomy + Props + Phase 7)
- component-usage-matrix.json v1.1.0 → v1.2.1 (24 → 31 patterns)

### G4 신규 패턴 (6)

1. **ClockCard** — 출퇴근 시계 + 액션 그룹 (EM-01/02, PWA 핵심)
2. **LeaveBalanceCard** — 잔여 휴가 강조 (EM-01/04, 48px accent num)
3. **StatMiniList** — 미니 리스트 3건 (EM-01)
4. **CalcSummary** — 자동 계산 박스 (EM-03 휴가 신청)
5. **ChartPlaceholder** — Donut 차트 placeholder (EM-04, Phase 7 chart lib 교체 전)
6. **NotifRow** — 알림 카드 리스트 (EM-10, is-unread variant + button reset)

### G4 보조 자식 클래스 SSOT (7)

components.css §G4.7 — `.info-row-key/val` (7화면) + `.empty-state-title/desc` (10화면) + `.tab-count` (+is-active variant) + `.form-help` + `.history-card` (3화면).

## 3. 신규 세션 첫 작업 옵션

Phase 5 와이어프레임 모든 그룹 완료 (G0~G4, 45 화면). **다음 작업은 사용자 결정** — 3 옵션:

### 옵션 A — Phase 5 전체 evaluator (wf-v1.0.0)

review-system.md §17-3 정책: "Phase 5 전체 evaluator (44 화면) — full review". 본 단계는 cross-group 일관성, 전 화면 Playwright smoke, 모든 KI 잔존 정리.

작업:
1. main에서 새 브랜치 `feature/WI-Phase5-final-evaluator`
2. Phase 5 전체 evaluator 호출 (full review, sampled 30% 미적용)
3. 결과에 따라 KI 일괄 정정 (현재 활성 P2 7건 + P3 28건 검토)
4. wf-v1.0.0 tag + Phase 5 종료 마커 (`.flowset/eval-results/phase-5.pass`)
5. Phase 6 (스프린트 계획) 진입 준비

### 옵션 B — Phase 6 직접 진입 (스프린트 계획)

Phase 5는 G0~G4 그룹별 evaluator로 충분히 검증됨 (각 그룹 PASS). Phase 5 전체 evaluator를 생략하고 Phase 6 (스프린트 계획 — mvp-plan.md + sprint-001~N.md) 직접 진입. CLAUDE.md `project.md §1` 진행 순서표 명시.

### 옵션 C — KI 잔존 일괄 정리 (docs batch)

활성 KI 35건 (P2 6 + P3 28) 일괄 정리 batch. evaluator/codex 추가 호출 없이 mechanical fix만. wf-v0.4.1 patch tag 또는 별도 docs commit.

**사용자 결정 의무 시점**: 본 분기점은 review-system.md §10에 포함되지 않으나 진행 방향 선택 → **사용자 입력 필요**.

## 4. Known Issues 현황 (활성 — wf-v0.4.0 머지 후)

| 심각도 | 활성 | 임계 | 트리거 |
|--------|------|------|--------|
| P0 | 0 | 1 | ❌ |
| P1 | 0 | 3 | ❌ |
| P2 | 6 (KI-049/050/051/054/060/061 — KI-063 G4 진입 전 resolved) | 5 | 도달 |
| P3 | 28 (KI-005/006/007/013/016/017/020/023/025/032~036/038/040/042~045/055/056/057/062 + **KI-064/065/066/067 G4 evaluator 신규**) | 10 | 도달 |

**G4 resolved**: 신규 KI 없음 (모든 결함 hotfix1/2에서 머지 전 해소)

**G4 신규 P3 (차후 batch)**:
- KI-064 EM-11 사이드바 비표시 시각 분기
- KI-065 EM-03 `.calc-val.is-emphasis` variant
- KI-066 EM-09 vert-tab data-tab=security 중복
- KI-067 페이지 한정 grid 8종 컴포넌트화 후보

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
| **CI inline-svg-sprite-check sprite cross-check 의무** (KI-063 resolved) | PR #11 / pr-checks.yml §3 |
| native control DS wrap 의무 | review-system.md §17-2 + CI |
| variant naming `.is-*` 표준 (`.active` 금지) | G2 hotfix3-rev1 SSOT 통일 |
| 사용자 개입 6개 시점만 | review-system.md §10 |
| 그룹 완료 시에만 사용자 보고 (능동 진행) | 사용자 결정 2026-05-16 |
| codex MCP hang 시 모델 명시 (gpt-5.5) | 사용자 결정 2026-05-18 |
| PR auto-merge가 CI 일부 PASS 시점에 머지 가능 | branch protection enforce_admins=false (관찰) |

## 6. PR 현황

| PR | 제목 | 상태 |
|----|------|------|
| #1~#10 | G0~G3 + system-v2/v3 + hotfix4 | ✅ MERGED |
| #11 | WI-G4prep-ci CI sprite cross-check 강화 (KI-063) | ✅ MERGED 2026-05-18 |
| **#12** | **WI-G4-docs G4 직원 와이어프레임 (wf-v0.4.0)** | ✅ **MERGED 2026-05-18** |
| #(미생성) | Phase 5 전체 또는 Phase 6 진입 | ⏳ 사용자 결정 후 |

## 7. Task 상태 (이전 세션 → 신규 세션)

| 영역 | 상태 |
|------|------|
| G0/G1/G2/G3 양산 + 평가 | ✅ completed |
| KI-063 CI sprite cross-check 강화 | ✅ completed (PR #11) |
| **G4 EM-01~11 양산 + hotfix1/2 + 머지** | ✅ **completed (wf-v0.4.0 tag)** |
| Phase 5 전체 evaluator (45 화면) | ⏳ **사용자 결정 — 옵션 A/B/C** |

## 8. 컨텍스트 압축 시 우선 보존

- **본 HANDOFF.md (필수 첫 작업)**
- `.flowset/contracts/review-system.md` (§17 v3 SSOT)
- `.flowset/contracts/review-rubric.md` (§10 5축)
- `.flowset/known-issues/INDEX.md`
- `.flowset/wireframes/_design-system/component-usage-matrix.json` (v1.2.1 31 patterns)
- `.flowset/wireframes/_design-system/03-components.md` (§G3 + §G4 신규 사양)
- `.flowset/wireframes/_design-system/components.css` (§G4 + §G4.7 SSOT)
- `.flowset/eval-results/phase-5-g4*.{eval,codex}.md` (G4 평가 결과 4 파일)
- `docs/FlowHR_screen_spec_v_1.md` (Phase 5 SSOT, 45 화면 통합)

## 9. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — Phase 5 PRD 결함 발견 시 batch-003 진행 가이드 | KI-027~031 |
| 2026-05-16 | 갱신 — G1 완료 + G2 양산 직전 | wf-v0.1.0 + 4 그룹 분할 |
| 2026-05-16 | 갱신 — G2 hotfix2 진행 중 다음 세션 인계 | 컨텍스트 한계 |
| 2026-05-16 | 갱신 — codex hotfix2 결과 + hotfix3 진입 안내 | OR 원칙 BLOCKED |
| 2026-05-17 | 갱신 — G2 wf-v0.2.0 머지 완료 + G3 진입 | wf-v0.2.0 tag + G3 양산 시작 |
| 2026-05-18 | 갱신 — G3 wf-v0.3.0 머지 완료 + G4 진입 안내 | wf-v0.3.0 tag + G4 EM 양산 시작 |
| **2026-05-18** | **본 갱신 — G4 wf-v0.4.0 머지 완료 + Phase 5 전체 통합 안내** | **wf-v0.4.0 tag + Phase 5 종료 옵션** |
