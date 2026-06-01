# WI-035-feat OP-04 신규 테넌트 등록 API (ST-006) — 듀얼검증 채점표

> 2026-06-01. evaluator(code 모드) + codex 통합. 통합 verdict = **PASS_BOTH**.

## evaluator (PASS 8.88/10)

| 축 | 점수 | 근거 |
|----|------|------|
| 기능 완성도 | 9.0 | 6대 핵심 충족 — register_tenant 단일 트랜잭션(8테이블+invitation, 부분실패 롤백) / create-at-activate 정합(등록 시 user 미생성, invitation 만; admin_user_id 는 accept_invitation tenant_super 수락 시 backfill, IS NULL 가드 멱등) / 멱등(completed+key 일치 시 기존 tenant 반환·신규 invitation 미발급, FOR UPDATE 직렬화) / 입력검증(slug 예약어 82·형식·연속하이픈, 사업자번호 정규화, 이메일 중복, 부서 토폴로지, 계약기간) / unique_violation backstop. 감점: scheduled/pending_invite 표시상태 파생 read-path 는 WI-037 이연. |
| 코드 품질 | 9.0 | 모노레포 컨벤션 일관(snake_case DB 1:1, 순수/server-only/use-server 계층), lint 0 warning, tsc EXIT 0, catch 삼키기·any·하드코딩 role/tenant 0건, fail-closed 일관. 감점: actions `as unknown as Json` 이중 캐스트 2건. |
| 테스트 커버리지 | 8.5 | schema 22 + permissions 3 PASS(예약어/정규화/계약기간/이메일중복/부서 토폴로지 양음성/strict, 권한 음양성). 감점: RPC 로직(멱등/에러경로/부서/latch/audit)은 staging 수동 실증(pgTAP 부재, KI-115 동류) / E2E 는 UI(WI-036) 이연(KI-119/089 정책). |
| 계약 준수 | 9.0 | RPC↔DB 컬럼 완전정합(subscriptions latch/tenant_settings unique/plans/tenant_drafts), database.ts 생성타입 일치. **KI-109 staging 실증**: register_tenant+accept_invitation EXECUTE={postgres,service_role}, anon/authenticated 0건. audit GUC fallback(mig40 규약) 운영자 귀속. |

**WEIGHTED_TOTAL: 8.88 / THRESHOLD 8.0(각 축 ≥7.5) → PASS** (기능 9.0×.30 + 품질 9.0×.25 + 테스트 8.5×.25 + 계약 9.0×.20)

NON_BLOCKING: P2 표시상태 파생 read-path + matrix.json OP-04 entity status(WI-037 이연, KI-123) / P3 Json 이중캐스트(KI-124) / P3 register_tenant pgTAP 부재(KI-125).

## codex (PASS — hotfix 후)

1차 **FAIL**: P0 없음. P1×2(① completed draft 가 stale autosave/delete 로 멱등근거 훼손 가능 ② sendInvite(email)이 같은 테넌트 pending 직원 초대를 잡아 employee_id 오염) + P2×2(enabled_modules plan.modules subset 미검증 / abandoned draft 등록 허용) + P2(checkAdminEmail auth.users 미조회) + P3×2(sales_stopped plan 노출 / token_hash collision→admin_email 오매핑). False alarm 없음 — KI-109/create-at-activate/멱등 replay/slug·business race 매핑은 정상 확인.

hotfix `94ceec4` → **재검증 PASS**(P0/P1 없음):
- [P1] saveDraft/deleteDraft `.in('status',['draft','submitting'])` 가드(completed 불변, 0-row no-op)
- [P1] sendInvite `.in('target_role',[tenant_super,tenant_hr_admin]).is('employee_id',null)` 제한
- [P2] register_tenant `enabled_modules ⊆ v_plan.modules`(P0111) — staging 실증 basic+payroll→P0111
- [P2] register_tenant 비-open(abandoned 등) draft 거부(P0102) — staging 실증 abandoned→P0102
- [P3] getRegistrationPlans `active/custom` 만
- [P3] token_hash collision 오매핑 제거(일반 에러 재발생)
- [P2→P3 이연] checkAdminEmail auth.users 사전체크: RPC hard-check 가 최종 강제 + spec §3-2("타 테넌트 관리자"=invitations) 충족 → KI-126(codex 동의)

## 통합 판정 (review-system.md §4)

evaluator PASS 8.88 + codex PASS → **PASS_BOTH**. 머지 승인(project.md §1-1). 코드 변경 후 마커 커밋(신선도 충족).
