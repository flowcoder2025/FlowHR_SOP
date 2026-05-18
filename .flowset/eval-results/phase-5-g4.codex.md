---
target: Phase 5 와이어프레임 G4 그룹 (wf-v0.4.0)
group: G4 (Employee 도메인 EM-01~11)
pr: https://github.com/flowcoder2025/FlowHR_SOP/pull/12
branch: feature/WI-G4-wireframes-employee
commit: 0a39bf9
reviewer: codex (mcp__codex__codex)
model: gpt-5.5
mode: changed-files + sampled-screens (30%) + known-risk-checklist
sampled_screens: [EM-01, EM-03, EM-06, EM-09]
date: 2026-05-18
overall_score: 7.2
verdict: CONDITIONAL
findings_total: 4
findings_p0: 0
findings_p1: 1
findings_p2: 3
findings_p3: 0
mechanical_fix_count: 8
user_decision_required: false
---

# Codex Review — Phase 5 G4 (wf-v0.4.0)

## Summary

G4 11개 화면은 기본 DS import, inline sprite, select-wrap, G4 신규 패턴 매핑은 대체로 정합하나, 파일/날짜 native control이 DS 명세와 달라 OS 기본 UI가 노출될 수 있고 일부 modal/a 태그 접근성 결함이 남아 PASS 기준에는 미달한다.

## Verdict

- **overall_score**: 7.2 / 10
- **verdict**: CONDITIONAL
- **model**: gpt-5.5
- **user_decision_required**: false

## Findings

### G4-CDX-001 (P1 / DS SSOT)
- **file**: `.flowset/wireframes/html/EM-02.html:286`
- **issue**: EM-02와 EM-03의 file-input이 DS 명세의 sr-only input + file-input-btn + file-input-filename 구조가 아니라 native file input과 미정의 file-input-name을 사용한다.
- **fix**: EM-02:286~289, EM-03:156~159를 `<label class="file-input"><input type="file" class="sr-only"> <span class="file-input-btn">...</span> <span class="file-input-filename is-empty">...</span></label>` 구조로 통일한다.

### G4-CDX-002 (P2 / DS SSOT)
- **file**: `.flowset/wireframes/html/EM-03.html:131`
- **issue**: EM-03의 date-input 내부 input 두 개가 `class="input"` 없이 사용되어 components.css의 `.date-input > .input` appearance/padding/calendar override가 적용되지 않는다.
- **fix**: EM-03:131,135의 date input을 `<input class="input" type="date" ...>`로 수정해 03-components.md §Date Input 및 matrix fix 예시와 맞춘다.

### G4-CDX-003 (P2 / A11y)
- **file**: `.flowset/wireframes/html/EM-02.html:260`
- **issue**: EM-02와 EM-06의 modal-overlay/modal-box가 `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 없이 렌더링된다.
- **fix**: modal-box에 dialog role과 aria-modal을 부여하고 modal-title에 id를 추가한 뒤 aria-labelledby로 연결한다.

### G4-CDX-004 (P2 / A11y)
- **file**: `.flowset/wireframes/html/EM-10.html:156`
- **issue**: EM-10의 notif-row 두 개가 `<a class="notif-row">` 형태로 href 없이 작성되어 링크 의미와 키보드 포커스가 깨진다.
- **fix**: 이동 대상이 있으면 href를 추가하고, 비이동 액션이면 button으로 바꾸거나 role/tabindex/키보드 핸들러를 명시한다.

## Mechanical Fix Estimate

- 총 8건 (file-input 구조 통일 2개소, date-input class="input" 4개 + dialog role/aria 세트 + notif-row href/button 변환)

## Raw JSON

```json
{
  "overall_score": 7.2,
  "verdict": "CONDITIONAL",
  "model": "gpt-5.5",
  "summary": "G4 11개 화면은 기본 DS import, inline sprite, select-wrap, G4 신규 패턴 매핑은 대체로 정합하나, 파일/날짜 native control이 DS 명세와 달라 OS 기본 UI가 노출될 수 있고 일부 modal/a 태그 접근성 결함이 남아 PASS 기준에는 미달한다.",
  "findings": [
    {
      "id": "G4-CDX-001",
      "severity": "P1",
      "category": "DS SSOT",
      "file": ".flowset/wireframes/html/EM-02.html:286",
      "issue": "EM-02와 EM-03의 file-input이 DS 명세의 sr-only input + file-input-btn + file-input-filename 구조가 아니라 native file input과 미정의 file-input-name을 사용한다.",
      "fix": "EM-02:286~289, EM-03:156~159를 `<label class=\"file-input\"><input type=\"file\" class=\"sr-only\"> <span class=\"file-input-btn\">...</span> <span class=\"file-input-filename is-empty\">...</span></label>` 구조로 통일한다."
    },
    {
      "id": "G4-CDX-002",
      "severity": "P2",
      "category": "DS SSOT",
      "file": ".flowset/wireframes/html/EM-03.html:131",
      "issue": "EM-03의 date-input 내부 input 두 개가 `class=\"input\"` 없이 사용되어 components.css의 `.date-input > .input` appearance/padding/calendar override가 적용되지 않는다.",
      "fix": "EM-03:131,135의 date input을 `<input class=\"input\" type=\"date\" ...>`로 수정해 03-components.md §Date Input 및 matrix fix 예시와 맞춘다."
    },
    {
      "id": "G4-CDX-003",
      "severity": "P2",
      "category": "A11y",
      "file": ".flowset/wireframes/html/EM-02.html:260",
      "issue": "EM-02와 EM-06의 modal-overlay/modal-box가 `role=\"dialog\"`, `aria-modal=\"true\"`, `aria-labelledby` 없이 렌더링된다.",
      "fix": "modal-box에 dialog role과 aria-modal을 부여하고 modal-title에 id를 추가한 뒤 aria-labelledby로 연결한다."
    },
    {
      "id": "G4-CDX-004",
      "severity": "P2",
      "category": "A11y",
      "file": ".flowset/wireframes/html/EM-10.html:156",
      "issue": "EM-10의 notif-row 두 개가 `<a class=\"notif-row\">` 형태로 href 없이 작성되어 링크 의미와 키보드 포커스가 깨진다.",
      "fix": "이동 대상이 있으면 href를 추가하고, 비이동 액션이면 button으로 바꾸거나 role/tabindex/키보드 핸들러를 명시한다."
    }
  ],
  "mechanical_fix_count": 8,
  "user_decision_required": false,
  "user_decision_reason": ""
}
```
