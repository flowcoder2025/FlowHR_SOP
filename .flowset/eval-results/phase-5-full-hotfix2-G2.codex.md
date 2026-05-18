# Phase 5 audit hotfix2 — G2 OP codex 재평가

- 평가 대상: OP-01 ~ OP-12 (12 화면)
- 평가자: codex (gpt-5.5)
- 기준 commit: bdb0735 (audit hotfix2)
- 평가 시각: 2026-05-18
- thread: 019e3b7b-b4c8-7ff2-b3ae-9af910032acd

## 요약

| 항목 | 값 |
|------|-----|
| group | G2 |
| screens | 12 |
| overall_score | **7.2** |
| verdict | **FAIL** |
| user_decision_required | false |

### audit hotfix2 verification

| 검증 항목 | 결과 |
|----------|------|
| KI-050 .select-wrap 17 files | **FAIL** |
| OP-02/05/06/07/11 bare select zero | **PASS** |

> 5 화면(OP-02/05/06/07/11) 내 bare select 잔존은 0건 (PASS).
> 그러나 codex가 검토 범위 OP-01~12 전체에서 OP-04에 bare `<select class="select">` 1건 잔존을 발견 → KI-050 정정의 검토 범위가 5 화면에 한정되어 OP-04 누락. 결과적으로 17 files PASS는 인정되나 범위 확장 시 FAIL.

## findings (총 5건)

### 1. P0 — G2-HF2-KI050-RESIDUAL (OP-04)
- **위치**: `.flowset/wireframes/html/OP-04.html:179`
- **이슈**: OP-01~12 전체 재검토 범위에서 bare `<select class="select">` 1건 잔존. showcase SSOT의 '전 화면에서 .select 단독 사용 금지'와 충돌.
- **수정**: `<div class="select-wrap"><select class="select">...</select></div>`로 래핑.

### 2. P1 — G2-HF2-SSOT-SELECT-SHOWCASE-DRIFT (showcase)
- **위치**: `.flowset/wireframes/_showcase.html:386, 529, 618, 809`
- **이슈**: DS SSOT showcase 자체에 `.select-wrap` 없는 select 예시 4건이 남아 있음. 같은 파일 1040행의 강제 규칙과 불일치.
- **수정**: showcase의 select 데모도 모두 `.select-wrap > .select` 구조로 정정.

### 3. P2 — G2-HF2-COUNT-VARIANT-MISMATCH (OP-02/05/06/07/11)
- **위치**: OP-07.html:261-262, OP-11.html:174-176
- **이슈**: 핫픽스 설명은 17건 및 `.select-sm` variant 적용을 주장하지만, 대상 5화면 확인 결과 select는 16건이며 OP-07 모달 2건과 OP-11 3건은 `.select-sm`가 없음. bare select는 0건이므로 핵심 래핑은 통과하나 감사 메타와 variant 적용 범위가 불일치.
- **수정**: 실제 대상 건수/variant 기준을 정정하거나, 누락 select에 `.select-sm` 적용.

### 4. P2 — G2-HF1-PAGEBTN-CONSISTENCY (OP-02/06/09)
- **위치**: OP-02.html:387-393, OP-06.html:261-266, OP-09.html:286-291
- **이슈**: audit hotfix1의 `.page-btn.is-active`와 OP-08 `.ticket-status-current`는 유지됨. 다만 pagination SSOT는 모든 pagination cell을 `.page-btn`로 제시하는데 OP-02/06/09는 활성 숫자만 `.page-btn`, 나머지는 `btn btn-ghost btn-sm`로 남아 showcase consistency가 낮음.
- **수정**: pagination 버튼 전체를 `.page-btn` 계열로 통일.

### 5. P3 — G2-A11Y-FORM-LABEL-ASSOCIATION (OP-04)
- **위치**: `.flowset/wireframes/html/OP-04.html:176-181`
- **이슈**: 폼 label과 input/select가 `for`/`id`로 연결되지 않은 sibling 구조. 시각 라벨은 있으나 보조기술 programmatic name 보장이 약함.
- **수정**: 입력 요소에 id를 부여하고 label `for`를 연결.

## 원본 응답 (JSON)

```json
{
  "group": "G2",
  "screens": 12,
  "overall_score": 7.2,
  "verdict": "FAIL",
  "audit_hotfix2_verification": {
    "KI-050_select_wrap_17_files": "FAIL",
    "OP-02_05_06_07_11_bare_select_zero": "PASS"
  },
  "findings": [
    {
      "severity": "P0",
      "id": "G2-HF2-KI050-RESIDUAL",
      "screen": "OP-04",
      "location": ".flowset/wireframes/html/OP-04.html:179",
      "issue": "OP-01~12 전체 재검토 범위에서 bare `<select class=\"select\">` 1건 잔존. showcase SSOT의 '전 화면에서 .select 단독 사용 금지'와 충돌한다.",
      "fix": "`<div class=\"select-wrap\"><select class=\"select\">...</select></div>`로 래핑."
    },
    {
      "severity": "P1",
      "id": "G2-HF2-SSOT-SELECT-SHOWCASE-DRIFT",
      "screen": "showcase",
      "location": ".flowset/wireframes/_showcase.html:386,529,618,809",
      "issue": "DS SSOT showcase 자체에 `.select-wrap` 없는 select 예시 4건이 남아 있다. 같은 파일 1040행의 강제 규칙과 불일치.",
      "fix": "showcase의 select 데모도 모두 `.select-wrap > .select` 구조로 정정."
    },
    {
      "severity": "P2",
      "id": "G2-HF2-COUNT-VARIANT-MISMATCH",
      "screen": "OP-02/05/06/07/11",
      "location": "OP-07.html:261-262, OP-11.html:174-176",
      "issue": "핫픽스 설명은 17건 및 `.select-sm` variant 적용을 주장하지만, 대상 5화면에서 확인되는 select는 16건이며 OP-07 모달 2건과 OP-11 3건은 `.select-sm`가 없다. bare select는 0건이므로 핵심 래핑은 통과하나 감사 메타와 variant 적용 범위가 불일치.",
      "fix": "실제 대상 건수/variant 기준을 정정하거나, 요구가 맞다면 누락 select에 `.select-sm` 적용."
    },
    {
      "severity": "P2",
      "id": "G2-HF1-PAGEBTN-CONSISTENCY",
      "screen": "OP-02/06/09",
      "location": "OP-02.html:387-393, OP-06.html:261-266, OP-09.html:286-291",
      "issue": "audit hotfix1의 `.page-btn.is-active`와 OP-08 `.ticket-status-current`는 유지됨. 다만 pagination SSOT는 모든 pagination cell을 `.page-btn`로 제시하는데 OP-02/06/09는 활성 숫자만 `.page-btn`, 나머지는 `btn btn-ghost btn-sm`로 남아 showcase consistency가 낮다.",
      "fix": "pagination 버튼 전체를 `.page-btn` 계열로 통일."
    },
    {
      "severity": "P3",
      "id": "G2-A11Y-FORM-LABEL-ASSOCIATION",
      "screen": "OP-04",
      "location": ".flowset/wireframes/html/OP-04.html:176-181",
      "issue": "폼 label과 input/select가 `for`/`id`로 연결되지 않은 sibling 구조다. 시각 라벨은 있으나 보조기술 프로그램matic name 보장이 약하다.",
      "fix": "입력 요소에 id를 부여하고 label `for`를 연결."
    }
  ],
  "user_decision_required": false
}
```
