# Phase 5 G4 Codex Review (EM 11 화면)

- **Group**: G4 (EM-01 ~ EM-11, 11 화면)
- **Model**: gpt-5.5
- **Date**: 2026-05-18
- **Reviewer**: mcp__codex__codex
- **Threshold**: 8.0
- **Result**: PASS (8.7)

## 결과 JSON

```json
{
  "group": "G4",
  "screens": 11,
  "overall_score": 8.7,
  "verdict": "PASS",
  "model": "gpt-5.5",
  "audit_hotfix_verification": {
    "EM-10_badge_variant": "PASS",
    "modal_title_EM-02_06": "PASS"
  },
  "summary": "G4 EM-01~11은 file:// 전제의 인라인 sprite, DS CSS 참조, G4 신규 6 컴포넌트의 components.css/_showcase/03-components/matrix 4-way 등록, EM-10 배지 양 패턴 정정, EM-02/EM-06 modal-title hotfix 적용이 모두 확인되어 차단 이슈는 없다. select/date/file native control wrap도 주요 대상은 통과한다. 남은 항목은 EM-03 calc-summary inline emphasis, textarea 클래스 사용 drift, EM-09 보안 탭 중복 식별자처럼 Phase 7 전환 전에 정리하면 좋은 P3 수준이다.",
  "findings": [
    {
      "id": "G4-PHASE5-CDX-001",
      "severity": "P3",
      "category": "DS SSOT",
      "screen": "EM-03",
      "file:line": ".flowset/wireframes/html/EM-03.html:176",
      "issue": "calc-summary의 사용일수 강조/위험 색상과 신청 후 잔여 구분선이 inline style로 남아 있다. components.css에는 .calc-val 기본만 있고 .calc-val.is-emphasis / .calc-val.is-danger / .calc-row.is-total 같은 variant가 없어 showcase 설명과 실제 사용이 완전한 SSOT가 아니다.",
      "fix": "components.css와 03-components.md/matrix에 calc-summary variant를 등록하고 EM-03 inline style을 해당 클래스로 치환한다."
    },
    {
      "id": "G4-PHASE5-CDX-002",
      "severity": "P3",
      "category": "native control wrap",
      "screen": "EM-02/EM-03/EM-08",
      "file:line": ".flowset/wireframes/html/EM-02.html:291",
      "issue": "textarea가 DS의 .textarea가 아니라 .input 클래스로 사용된다. select-wrap/date-input/file-input은 통과하지만 Textarea 컴포넌트 사용 명세와 화면 사용이 어긋난다.",
      "fix": "EM-02:291, EM-03:148, EM-08:145의 textarea class를 .textarea로 통일한다."
    },
    {
      "id": "G4-PHASE5-CDX-003",
      "severity": "P3",
      "category": "Phase 7 readiness",
      "screen": "EM-09",
      "file:line": ".flowset/wireframes/html/EM-09.html:132",
      "issue": "보안 vert-tab이 state 분기용으로 data-tab=\"security\"를 2개 가진다. 정적 와이어프레임 표시에는 문제 없지만 React 전환 시 key/active state 충돌 위험이 있다.",
      "fix": "단일 security 탭 요소에 state class만 토글하거나, preview 전용 식별자를 분리한다."
    }
  ],
  "user_decision_required": false
}
```

## Audit Hotfix 재검증 결과

| 항목 | 결과 |
|------|------|
| EM-10 badge variant CSS 양 패턴 | **PASS** |
| modal-title SSOT (EM-02 + EM-06) | **PASS** |

## Findings 요약

| ID | Severity | Category | Screen | Issue 요지 |
|----|----------|----------|--------|-----------|
| G4-PHASE5-CDX-001 | P3 | DS SSOT | EM-03 | calc-summary variant CSS 미정의 (inline style 잔존) |
| G4-PHASE5-CDX-002 | P3 | native control wrap | EM-02/03/08 | textarea가 `.input`으로 잘못 사용됨 (`.textarea`로 통일 필요) |
| G4-PHASE5-CDX-003 | P3 | Phase 7 readiness | EM-09 | 보안 vert-tab data-tab 중복 식별자 |

## 종합 판정

- **PASS** (8.7 / threshold 8.0)
- 차단 이슈 없음, P3 3건 (Phase 7 전환 전 정리 권장)
- 사용자 결정 필요: **false**
