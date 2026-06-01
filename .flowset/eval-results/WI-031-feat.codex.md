# WI-031-feat codex 리뷰 결과

codex 스레드: `019e7fd3-e4d5-7870-ae36-22e2056603ba` (Sprint 2 진입 설계 → WI-030 → WI-031 DDL 설계 + 구현 리뷰 연속).

## 1차 리뷰 — Verdict: WARNING

P0/P1 없음. 36/38 staging 재적용·기존데이터 안전, seed 정제(roles seed 제외 / 가격 OP-04 SSOT / Sprint 8 인덱스 trim / feature_flag_overrides 재사용) 전부 타당 확인.
- [P2] `scheduled_setting_changes_update` 가 tenant_admin 에게 status 전이 컬럼 전체 조작 허용 — applying/applied/failed 위조 가능. claim 함수(service_role) 소유 전이를 정책으로 좁혀야.
- [P3] OP-02 검색 인덱스가 회사명 trgm 중심 — slug/business_number 부분검색은 API 쿼리 확정 후(WI-032/033) 추가 권장.

> ⚠️ codex는 자신이 설계한 claim 함수의 **EXECUTE grant 누수(P1)를 놓침** — evaluator 가 검출. 듀얼검증 상호보완 실증.

## 재검증 (hotfix mig 39 후) — Verdict: PASS

- P1 해소: mig 39 가 claim 함수 EXECUTE 를 public/anon/authenticated 모두 revoke(mig 31 패턴). service_role grant 유지 → proacl {postgres,service_role} 정합.
- P2 해소: update 정책 drop+recreate — old row status='pending', new row status in (pending,cancelled). operator/tenant_admin 은 예약 수정/취소만, applying/applied/failed 는 service_role claim 경로.
- T14/T15 테스트 보강 확인. 회귀 없음. `drop policy if exists` 적용순서 안전.
- applicable_departments / accept_invitation 은 본 WI hotfix 범위 밖(KI) 판단 동의.

→ **PASS_VERIFIED**. 잔존 차단 결함 0.
