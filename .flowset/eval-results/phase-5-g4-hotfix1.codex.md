---
target: Phase 5 와이어프레임 G4 그룹 (wf-v0.4.0) hotfix1 재평가
group: G4 (Employee 도메인 EM-01~11)
pr: https://github.com/flowcoder2025/FlowHR_SOP/pull/12
branch: feature/WI-G4-wireframes-employee
commit: 79315fc
reviewer: codex (mcp__codex__codex)
model: gpt-5.5
mode: hotfix1 재평가 (이전 4 findings + 정정 부수효과 + EM-02 offline + §G4.7 일관)
prior_findings: [G4-CDX-001(P1), G4-CDX-002(P2), G4-CDX-003(P2), G4-CDX-004(P2)]
prior_findings_status: all resolved
date: 2026-05-18
overall_score: 8.1
verdict: CONDITIONAL
findings_total: 2
findings_p0: 0
findings_p1: 0
findings_p2: 1
findings_p3: 1
mechanical_fix_count: 4
user_decision_required: false
---

# Codex Review — Phase 5 G4 (wf-v0.4.0) hotfix1 재평가

## Summary

hotfix1 commit 79315fc 기준 이전 codex 4 findings는 file-input sr-only 구조, EM-03 date input class, modal aria-labelledby 매핑, EM-10 notif-row button/href 및 CSS reset 모두 mechanical fix 통과로 판정한다. EM-02 offline state도 동작 토글과 분석 상태 매트릭스에는 반영됐으나 일부 주석/분석 문구가 stale이고, 더 크게는 components.css §G4.7의 '보조 자식 클래스 8종' 정정이 실제 CSS 정의와 사용처 기준으로 완결되지 않아 CONDITIONAL이다.

## Verdict

**CONDITIONAL** — overall_score 8.1, mechanical_fix_count 4 (이전 4건 모두 resolved). 신규 P2 1건 + P3 1건. user_decision_required=false.

## Prior Findings — Resolved

| ID | severity | category | resolution |
|----|----------|----------|------------|
| G4-CDX-001 | P1 | DS native control | EM-02:285-290 + EM-03:154-160 file-input sr-only 구조 통일 — PASS |
| G4-CDX-002 | P2 | DS native control | EM-03:131,135 `<input class="input" type="date">` 통일 — PASS |
| G4-CDX-003 | P2 | a11y modal | EM-02:261 + EM-06:214 aria-modal + aria-labelledby + modal-title id — PASS |
| G4-CDX-004 | P2 | interaction notif-row | EM-10:156 button + EM-10:165 href + components.css button reset + hover 일반화 — PASS |

## New Findings

### G4-HF1-REVAL-001 (P2 / DS SSOT)

- **file**: `.flowset/wireframes/_design-system/components.css`
- **issue**: §G4.7이 '보조 자식 클래스 8종' SSOT 등록으로 기록됐지만 실제 정의는 `.info-row-key` / `.info-row-val` / `.empty-state-title` / `.empty-state-desc` / `.tab-count` / `.form-help` 6종과 하위 variant뿐이다. 이전 evaluator 목록의 `.history-card`는 EM-02 등에서 계속 사용되지만 CSS 정의가 없고, `.file-input-name`은 `file-input-filename`으로 교체되어 헤더/CHANGELOG의 8종 주장과 실제 DS 표준이 불일치한다.
- **fix**: `.history-card`를 §G4.7에 정의하거나 해당 사용을 기존 `.card` / 페이지 상태 셀렉터로 정리하고, `file-input-name`은 obsolete로 명시한 뒤 §G4.7 및 CHANGELOG의 카운트를 실제 정의 기준으로 갱신한다.

### G4-HF1-REVAL-002 (P3 / Documentation)

- **file**: `.flowset/wireframes/html/EM-02.html`
- **issue**: EM-02 offline 상태는 CSS / state-debug / 본문 배너에는 추가됐지만 파일 상단 주석은 여전히 '상태 (5)'로 offline을 누락한다. `.flowset/wireframes/analysis/EM-02.md`도 상태 매트릭스는 6개로 갱신됐으나 §3 상태 토글 설명에는 `.state-default` / `empty` / `modal` / `error`만 남아 offline이 빠져 있다.
- **fix**: EM-02.html 상단 상태 주석을 6 state로 갱신하고, EM-02.md §3 상태 토글 목록에 `.state-offline`을 포함시킨다.

## Mechanical Fix Tally

- 4 (이전 G4-CDX-001~004 모두 fix 검증 통과)

## User Decision Required

- **false** (P2 1건 + P3 1건 — review-system.md §10 트리거 미도달)

## Raw JSON

```json
{
  "overall_score": 8.1,
  "verdict": "CONDITIONAL",
  "model": "gpt-5.5",
  "summary": "hotfix1 commit 79315fc 기준 이전 codex 4 findings는 file-input sr-only 구조, EM-03 date input class, modal aria-labelledby 매핑, EM-10 notif-row button/href 및 CSS reset 모두 mechanical fix 통과로 판정한다. EM-02 offline state도 동작 토글과 분석 상태 매트릭스에는 반영됐으나 일부 주석/분석 문구가 stale이고, 더 크게는 components.css §G4.7의 '보조 자식 클래스 8종' 정정이 실제 CSS 정의와 사용처 기준으로 완결되지 않아 CONDITIONAL이다.",
  "findings": [
    {
      "id": "G4-HF1-REVAL-001",
      "severity": "P2",
      "category": "DS SSOT",
      "file": ".flowset/wireframes/_design-system/components.css",
      "issue": "§G4.7이 '보조 자식 클래스 8종' SSOT 등록으로 기록됐지만 실제 정의는 .info-row-key/.info-row-val/.empty-state-title/.empty-state-desc/.tab-count/.form-help 6종과 하위 variant뿐이다. 이전 evaluator 목록의 .history-card는 EM-02 등에서 계속 사용되지만 CSS 정의가 없고, .file-input-name은 file-input-filename으로 교체되어 헤더/CHANGELOG의 8종 주장과 실제 DS 표준이 불일치한다.",
      "fix": ".history-card를 §G4.7에 정의하거나 해당 사용을 기존 .card/페이지 상태 셀렉터로 정리하고, file-input-name은 obsolete로 명시한 뒤 §G4.7 및 CHANGELOG의 카운트를 실제 정의 기준으로 갱신한다."
    },
    {
      "id": "G4-HF1-REVAL-002",
      "severity": "P3",
      "category": "Documentation",
      "file": ".flowset/wireframes/html/EM-02.html",
      "issue": "EM-02 offline 상태는 CSS/state-debug/본문 배너에는 추가됐지만 파일 상단 주석은 여전히 '상태 (5)'로 offline을 누락한다. .flowset/wireframes/analysis/EM-02.md도 상태 매트릭스는 6개로 갱신됐으나 §3 상태 토글 설명에는 `.state-default/empty/modal/error`만 남아 offline이 빠져 있다.",
      "fix": "EM-02.html 상단 상태 주석을 6 state로 갱신하고, EM-02.md §3 상태 토글 목록에 `.state-offline`을 포함시킨다."
    }
  ],
  "mechanical_fix_count": 4,
  "user_decision_required": false
}
```
