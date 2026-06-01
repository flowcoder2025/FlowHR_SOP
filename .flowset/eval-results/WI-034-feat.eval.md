# WI-034-feat 결재라인 조건 분기 (ST-054) — 듀얼검증 채점표

> 2026-06-01. evaluator(code 모드) + codex 통합. 통합 verdict = **PASS_BOTH**.

## evaluator (PASS 8.72/10)

| 축 | 점수 | 근거 |
|----|------|------|
| 기능 완성도 | 8.6 | DSL 검증 완전(field-op 매트릭스/order/ specific_employee_id 게이팅/employment_type enum/strict) + 평가엔진 방어성(미존재 fail-closed·malformed skip·graceful degrade). 감점: 라인 "삭제" 동선(→ hotfix 정정). |
| 코드 품질 | 8.8 | any/catch{}/TODO/stub 0건, 책임 분리 명확, lint/typecheck 통과. |
| 테스트 커버리지 | 8.8 | dsl 27 + tenant-settings 30 + form-data 22 전부 PASS, 양성/음성/fail-closed/graceful degrade 커버. |
| 계약 준수 | 8.7 | i18n ko/en 완전 대칭, 보안 계약 강건(unknown id fail-closed·tenant 소속검증·strict 재검증·RLS). |

**WEIGHTED_TOTAL: 8.72 / THRESHOLD 8.0(각 축 ≥7.5) → PASS**

NON_BLOCKING: P2 라인 삭제 동선(→ hotfix 정정, KI 아님) / P3 matrix.json status drift(KI-122) / P3 ST-046 범위경계(문서화됨).

## codex (PASS — hotfix 후)

1차: P0/P1 없음. P2×2(evaluateCondition actual 가드 / refineStepOrder 위치정합) + P3×2(form-data 숫자 coerce / entity default_line refine). False alarm: unknown-id fail-closed·specific_employee_id 빈문자 reject·GET shape·i18n 대칭은 정상 확인.

hotfix 94742e1 → **재검증 PASS**(5건 모두 설계 의도대로, 잔여 blocking 없음).

## 통합 판정 (review-system.md §4)

evaluator PASS + codex PASS = **PASS_BOTH** → 머지 승인(project.md §1-1).

## hotfix 요약 (머지 전 선제 정정)

| 출처 | 등급 | 정정 |
|------|------|------|
| codex | P2 | `evaluateCondition` isValidActual 가드 — NaN/빈문자/잘못된 enum actual 과매칭 차단 |
| codex | P2 | `refineStepOrder` 위치 정합(steps[i].order===i+1) — 역순 저장 거부 |
| codex | P3 | form-data 숫자 배열 strictNumber — boolean/비숫자 암묵 coerce 차단 |
| codex | P3 | entity `default_line` → `approvalStepArraySchema`(order refine 정합) |
| evaluator | P2 | 라인 삭제 → 기존 id 라인 is_active=false 비활성화 항목 제출(apply 반영) |

## NON_BLOCKING → KI 적재

- **KI-120 (P3)** — mig 40 `_apply_claimed` id-update affected-row-0 silent success(예약 후 라인 삭제). 전 target 공통. KI-116 audit/엔진 리팩토링 시.
- **KI-121 (P3)** — ST-046(Sprint 6) 실 요청시점 소비 시 resolveApprovalLine 방어 parse 외 specific_employee_id 테넌트 소속 **재검증** + approver_role 해석 필요(저장 시점 검증은 사후 직원 퇴사/이동 stale 가능).
- **KI-122 (P3)** — matrix.json ApprovalLine status(C/U/D missing) WI-032/033/034 미반영(전역 entity status drift). Phase 7 종료 시 일괄 갱신.
