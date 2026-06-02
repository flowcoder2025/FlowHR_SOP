# WI-037-feat OP-02 테넌트 목록 — codex 코드 리뷰 (듀얼검증)

> codex thread 019e86f6 (설계 3R 협의 연속). 2026-06-02. gpt-5 계열.

## 1차 리뷰 — FAIL (P1×1 + P2×4 + P3×4)
- **P1**: tenants_write RLS=is_operator() 라 operator_staff 가 Data API 로 직접 UPDATE 가능(앱은 operator_super 강제). → DB 변경 없이 KI 이관 + PR accepted-risk 명시 조건부 수용.
- **P2-1**: 만료 pending 초대도 `pending_invite` 표시(expires_at 미검사).
- **P2-2**: 사업자번호 digit-only 입력이 저장형(###-##-#####)과 미스매치.
- **P2-3**: 회사명 RowLink 가 미존재 OP-03 상세로 dead link(catch-all notFound).
- **P2-4**: out-of-range page(?page=999) 미보정 → 빈 목록/비정상 range 표시.
- **P3**: `_` LIKE 와일드카드 미제거 / CSV 선행공백 formula 미완화 / sub·invoice tie-breaker 부재 / semantic audit best-effort(수용).

## hotfix 1 (커밋 526f0a0)
- 만료초대 `.gt(expires_at)` / 사업자번호 normalize eq OR / dead link → 텍스트 / page 보정 재조회 / `_` sanitize / CSV `/^[\s]*[=+\-@]/` / tie-breaker(period_start·created_at).
- P1 RLS → KI-131 전용 등재(주석 정정), app-layer operator_super 강제 유지.

## 2차 리뷰 — P2×1
- **P2**: soft-delete(deleted_at) 테넌트가 목록/내보내기/상태변경에서 미제외(tombstone 재노출).

## hotfix 2 (커밋 b35b890)
- queryTenantRows `.is('deleted_at', null)` / changeTenantStatus 조회·UPDATE 양쪽 `.is('deleted_at', null)`. archived(status)는 deleted_at NULL 이라 목록 유지.

## 3차 재검증 — **PASS**
- 잔여 P2+ 코드 결함 없음. 1차/2차 지적 전부 반영 확인.
- 조건: KI-131(P2)/132/133/134(P3) INDEX 등재 + PR accepted-risk 명시(완료).

## 통합 판정: PASS_BOTH (evaluator 8.38 PASS + codex 3차 PASS)
