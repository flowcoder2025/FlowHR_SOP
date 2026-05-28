# WI-019-feat codex 코드리뷰 — RLS + audit + Realtime + composite FK

> read-only (gpt-5.5). 3 라운드 (`Agent subagent_type=codex:codex-rescue`). 최종 PASS.

## 라운드별 결과

| 라운드 | Verdict | P1 | 내용 |
|--------|---------|----|----|
| 1차 | FAIL | 4 | tickets INSERT tenant 누락 / 직원 leaves·attmod self-approve / approvals·approval_steps 라우팅·자기승인 미차단 / KI-077 approval_id composite 미완성 + P2 2 + P3 2 |
| 2차 | FAIL | 2(+1 P2) | (개방) admin 겸직 self-approve / requester self-routing + (신규 P2) SET NULL composite FK가 tenant_id NOT NULL 위반으로 부모 DELETE 실패(9건) |
| 3차 | **PASS** | 0 | 2차 결함 3종 전수 해소 확인 + 신규 결함 0 + 마이그레이션 27~32 잔존 0 |

> codex가 두 라운드에 걸쳐 **실제 결함**을 정확히 검출(전부 grep/staging 검증, false alarm 0). 특히 2차 SET NULL은 `(tenant_id, ref)` 전체 NULL화로 부모 삭제를 깨는 광범위 버그를 잡음.

## 정정 매핑

| codex 결함 | 정정 |
|-----------|------|
| 1차 P1 tickets/leaves/attmod/approvals INSERT·UPDATE 인가 + approval_id composite | 마이그레이션 32 (INSERT tenant 가드 + status 자기승인 차단 + 라우팅 컬럼 불변 트리거 + approval_id 4테이블 composite) |
| 2차 신규 P2 SET NULL composite FK | 마이그레이션 33 — 9건 전수 `on delete set null (<ref col>)` 컬럼지정(PG17), tenant_id 보존 |
| 2차 P1 requester self-routing | 마이그레이션 33 — approval_steps INSERT 관리자 전용 |
| 2차 P1 admin self-approve | 마이그레이션 33 — leaves/attmod approved·rejected 직접 UPDATE 차단(admin 포함), 승인은 service_role RPC 매개 |

## 3차 최종 verdict

**PASS — P0 0 / P1 0.** DEFECT A(SET NULL 9건 컬럼지정)·B(approval_steps_insert requester 제거)·C(leaves/attmod approved·rejected 차단) 전수 해소, 신규 결함 없음, mig27~32 잔존 없음.

## 통합 판정
codex PASS + evaluator PASS 8.62 → **PASS_BOTH** (review-system.md §4). 잔여 결재 워크플로 SoD/전이는 KI-087(Sprint 6).
