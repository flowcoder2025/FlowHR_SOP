# WI-019-feat 평가 (evaluator) — RLS + audit + Realtime + composite FK (Sprint 1 Day 8~10)

> mode: code / phase: 7 / 브랜치: feature/WI-019-feat-rls-audit-realtime
> 3 라운드 평가 (codex 듀얼검증 정정 동반). 최종 PASS 8.62/10.

## 라운드별 결과

| 라운드 | 총점 | Verdict | 비고 |
|--------|------|---------|------|
| 1차 | 8.80 | PASS | NON_BLOCKING P2 2(approval self-approval WITH CHECK / 매니저 팀범위 미테스트) + P3 4 |
| 2차 | 8.80 | PASS | codex 1차 P1 4 정정(mig32) 검증 — 1차 NON_BLOCKING 해소 확인 |
| 3차 | 8.62 | PASS | codex 2차 P1/P2 3 정정(mig33) 검증 — 전수 해소 확인 |

## 최종 채점 (3차)

| 축 | 점수 | 근거 |
|----|------|------|
| 기능 완성도 30% | 9.0 | codex P1/P2 전수 staging 실증 해소. SET NULL 9건 confdelsetcols 컬럼지정 / approval_steps_insert requester 제거 / leaves·attmod approved·rejected admin 포함 차단. |
| 코드 품질 25% | 8.7 | mig33 최소·정확(PG17 컬럼지정 문법). 코드 무손상. realtime teardown/disposed 가드 견고. |
| 테스트 커버리지 25% | 8.2 | T1~T13 ALL_RLS_ASSERTIONS_PASS 독립 재실행. 음성/양성 양면. 감점: T11 rejected 미단언 / 결재 정상흐름 E2E(service_role RPC 미구현, KI-087). |
| 계약 준수 20% | 8.3 | matrix/erd composite FK 정합, KI-077 resolved. 감점: rls.md §1/§4 SSOT drift(본 PR에서 §1/§4 구현 정합 노트로 보강). |

**WEIGHTED_TOTAL: 8.62/10 (임계 8.0, 각 축 ≥7.5) — VERDICT: PASS**

독립 재검증(캐시 무시): typecheck 7/7 · lint 8/8 · test 13/13 · build PASS · staging pg_constraint/pg_policy 직접 조회 + T1~T13 재실행 + security advisor(신규 0).

## NON_BLOCKING_OBSERVATIONS (KI 처리)

- [P2] rls.md §1/§4 SSOT drift → **본 PR에서 §1(헬퍼 SECURITY DEFINER)·§4(결재 SoD) 구현 정합 노트 추가로 해소**. 잔여 표준화는 KI-084.
- [P3] 결재 SoD 비대칭(approval_steps 전이 + leaves 미러 RPC) → KI-087 (Sprint 6).
- [P3] login_attempts RLS no-policy(서비스롤 전용 의도, advisor INFO) → 기존 WI-020 설계.
- [P3] T11 admin rejected 차단 미단언(정책은 차단) → 회귀 테스트 보강 후보.

ANTI_PATTERNS: 없음.

## 통합 판정 입력
evaluator PASS 8.62 + codex 3차 PASS(P0/P1 0) → **PASS_BOTH** (review-system.md §4).
