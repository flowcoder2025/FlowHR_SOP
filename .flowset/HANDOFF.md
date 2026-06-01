# FlowHR 핸드오프 — 신규 세션 진입 가이드

> **갱신**: 2026-06-01 batch P (WI-035-feat OP-04 신규 테넌트 등록 API 완료 — codex 2라운드 협의 + 사용자 승인(DB mig 42) + 듀얼검증 PASS_BOTH 머지 PR #54. **마이그레이션 42** `register_tenant` SECURITY DEFINER 원자 RPC(service_role only) — tenants+subscriptions+tenant_settings+초기데이터+관리자 invitation 단일 트랜잭션. **create-at-activate 정합**(DoD "admin user INSERT"→invitation 재해석, 등록 시 user 미생성). **enum 무변경**(표시상태 파생). ★ codex 가 evaluator PASS 통과분에서 P1×2[draft 무결성·sendInvite 직원초대 오염]+P2×2[modules subset·abandoned draft] 검출 → hotfix. KI-123~126 등재).
> **신규 세션 첫 작업**: 본 문서 **§-0p (2026-06-01 batch P)** 정독 → **WI-036-feat OP-04 7단계 마법사 UI** 착수(Stepper WI-030 + 실시간검증[check-domain/business/admin-email 액션 소비] + 임시저장 재진입[getOpenDraft/saveDraft] + 초기데이터 폼 + registerTenant 호출 + 관리자 활성화 [ST-006/010]). ⚠️ **모든 코드 머지는 듀얼검증 게이트(evaluator+codex PASS_BOTH + `<WI>.pass` 마커) 통과 필수** — `project.md §1-1`.
> **이전 핸드오프**: 2026-06-01 batch O (WI-034 결재라인 조건 분기, §-0o) / batch N (WI-033 TA-13 설정 UI, §-0n) / batch M (WI-032 TA-13 설정 API + pg_cron 엔진, §-0m) / batch L (WI-030 packages/ui + WI-031 DB foundation, §-0l) / batch K (Vercel 모노레포 배포 수정, §-0k) / batch J (WI-020-6 ST-003 활성화 — WI-020 인증 전체 종료, §-0j) / 2026-05-29 batch I (WI-020-5 ST-004 2FA, §-0i) / batch H (WI-020-4 ST-002 + 2FA 설계, §-0h) / batch G (WI-020-3 ST-072 오류/점검, §-0g) / batch F (WI-020-2 ST-078 약관/동의, §-0) / batch E (WI-021 사이클, §-0e) / batch D (WI-019 Day8~10, §-0d) / batch C (WI-020 ST-001 로그인, §-0b) / batch B (듀얼검증 게이트 + WI-019 Day3~5, §-1) / batch A (모노레포+인프라, §-2)

## -0p. 2026-06-01 batch P 세션 진척 — **신규 세션 여기부터**

### 완료 — WI-035-feat OP-04 신규 테넌트 등록 API (ST-006, PR #54 머지)

핸드오프 정독 → **codex 2라운드 협의**(원자 트랜잭션/create-at-activate 정합/enum 무변경/멱등) → 사용자 승인(DB mig 42) → 구현 → staging 실증 → **듀얼검증 PASS_BOTH** → auto-merge.

**codex 협의 확정 설계**:
- **인터페이스**: WI-032/033 패턴 — app/api route handler 없이 Server Action + `apps/web/lib/operator/tenant-registration/{permissions,queries,actions}.ts` + schemas SSOT `packages/schemas/src/operator-onboarding.ts`. UI는 WI-036.
- **원자 트랜잭션**: 신규 **마이그레이션 42** `register_tenant(p_operator_id, p_draft_id, p_idempotency_key, p_payload jsonb, p_admin_invitations jsonb)` SECURITY DEFINER RPC(service_role only) — tenants+subscriptions(가격 latch)+tenant_settings(company_info TA-13 shape)+departments(parent_code 단일패스 토폴로지)+work_policies+leave_types+approval_lines+document_templates+관리자 invitation 을 **단일 트랜잭션** 원자 INSERT.
- **★ create-at-activate 정합**: DoD "admin user 동시 INSERT"를 **invitation 행 생성으로 재해석**(WI-020-6 최신 계약). 등록 시 auth.users/public.users 미생성, invitation(target_role tenant_super/추가 tenant_hr_admin)만. token 은 앱이 평문 생성→hash 만 RPC 전달(평문은 activation URL 로만, Resend 미설정 KI-103). `accept_invitation` 최소확장 — tenant_super 수락 시 `tenants.admin_user_id` backfill(IS NULL 가드) + 활성화 audit actor(`system:activation`).
- **enum 무변경**: `tenant_status` 에 scheduled/pending_invite 추가 안 함(소비처 없는 투기값 회피). tenant.status=active 고정, 표시상태는 `admin_user_id IS NULL`(초대대기) / invitation pending / `contract_start_date>today`(예정) 로 **read-side 파생**(WI-037 OP-02 목록 소유, KI-123).
- **멱등**: 추가 테이블 없이 draft — RPC가 draft `FOR UPDATE`, `form_data._submission.idempotency_key` 보관. completed+동일 key→기존 tenant 반환(신규 invitation 미발급), 다른 key→P0103 conflict. draftId 미지정 시 Server Action 이 열린 draft 재사용/생성.
- **audit actor**: service_role 컨텍스트(auth.uid()=NULL)에서 RPC 가 `set_config('app.audit_actor_id/role', 운영자, true)` → mig 40 audit_row_change GUC fallback 으로 등록 audit 운영자 귀속.
- **보안(KI-109)**: register_tenant+accept_invitation `revoke from public,anon,authenticated` + service_role only(staging proacl 실측 `{postgres,service_role}`). admin 이메일 hard-check(invitations pending/accepted + auth.users). enabled_modules ⊆ plan.modules 강제.

**★ 듀얼검증 가치 재실증 (이번 세션 핵심)**: evaluator **PASS 8.88**(기능9.0/품질9.0/테스트8.5/계약9.0) 통과분에서 **codex 가 P1 2건 + P2 2건 검출** → 1차 FAIL.
- **P1-1**: completed draft 가 stale autosave(`saveDraft`)/`deleteDraft` 에 status 가드 부재 → 등록 완료 직후 `form_data._submission`(멱등 근거) 덮어쓰기/삭제 가능 → 멱등 replay 가 conflict 로 변질.
- **P1-2**: `sendInvite(email)` 이 `tenant_id+operator_flag=false+pending` 만 보고 초대 선택 → 같은 테넌트 pending **직원 초대**(employee_id 보유)를 잡아 `createInvitation` 이 employee_id 를 null 로 덮어 직원 초대 오염.
- **P2**: enabled_modules 가 plan.modules subset 검증 누락(basic plan 으로 payroll metadata 저장) / abandoned draft 로 등록 가능.
- **정정**(hotfix 94ceec4): saveDraft/deleteDraft `.in('status',['draft','submitting'])` 가드 / sendInvite `.in('target_role',[tenant_super,tenant_hr_admin]).is('employee_id',null)` / register_tenant enabled_modules subset(P0111)+abandoned 거부(P0102) / getRegistrationPlans active+custom / token_hash 오매핑 제거.
- 재검증: codex **PASS**(P0/P1 없음) → **PASS_BOTH**. turbo 21/21 + 단위(operator-onboarding 22 / web permissions 3, schemas 132 / web 87) + openapi 6 신규.

**staging 실증(검증된 사실)**: mig 42 적용 + 합성 운영자/draft 로 — 정상 등록(전 테이블 정합/부서 HQ→KITCHEN parent 링크/가격 latch 9900/audit actor=운영자/invitation 2건 pending) / 멱등 replay(already_completed=true 동일 tenant)·conflict(P0103) / 에러 P0101(operator)·P0102(draft/abandoned)·P0106(slug)·P0107(business)·P0109(role)·P0110(email)·P0111(modules subset) / accept_invitation tenant_super 수락→admin_user_id backfill+audit `system:activation`. 검증 후 합성 데이터 cascade 삭제 — staging pristine.

### ⚠️ 신규 KI (batch P)
- **KI-123 (P2)** — OP-04 표시상태(scheduled/pending_invite) 파생 read-path 미구현(enum 무변경 결정) + matrix.json OP-04 entity status drift. **WI-037 OP-02 목록 진입 시** 목록/배지 파생 + matrix 갱신.
- KI-124 (P3) — registerTenant `as unknown as Json` 이중 캐스트 2건(직렬화 안전, 타입 우회).
- KI-125 (P3) — register_tenant pgTAP 회귀 부재(staging 수동 실증 의존, KI-115 동류).
- KI-126 (P3) — checkAdminEmail 사전체크 auth.users 미조회(RPC hard-check 가 최종 강제, UX 사전신호 갭, codex P2→P3 이연).

### 다음 세션 첫 작업 — WI-036-feat OP-04 7단계 마법사 UI (ST-006/010)
- `app/[locale]/(operator)/.../tenants/new` 7단계 Stepper(WI-030 `Stepper`) — 1 회사정보/2 도메인(check-domain 실시간)/3 요금제(getRegistrationPlans)/4 관리자/5 모듈/6 초기데이터/7 검토. WI-035 액션 소비: `saveDraft`/`getOpenDraft`(임시저장 재진입) + `checkDomain`/`checkBusinessNumber`/`checkAdminEmail`(실시간 ≤300ms) + `registerTenant`(최종, idempotency_key 클라 생성) + `sendInvite`(재발송). 등록 성공 시 activation URL 표시(Resend 미설정 KI-103). 관리자 활성화(ST-010)는 기존 /activate 흐름.
- 이어서 WI-037(OP-02 목록 — DataTable/FilterBar + **KI-123 표시상태 파생**) → 038(OP-03 상세).
- 배포 대기 KI: KI-099(2FA env Vercel)/098(비번재설정 대시보드)/086(leaked-password)/103(Resend) — 베타 진입 전 일괄 프로비저닝.

## -0o. 2026-06-01 batch O 세션 진척

### 완료 — WI-034-feat 결재라인 조건 분기 (ST-054, PR #53 머지)

핸드오프 정독 → **codex 2라운드 협의**(범위 경계 + field-op 매트릭스 확정) → 구현 → 듀얼검증 PASS_BOTH → auto-merge. **DB/RLS 변경 없음**(§5 게이트 비대상).

**codex 협의 확정 설계**:
- DSL SSOT = `packages/schemas/src/approval-line-dsl.ts`(신규) — zod schema + 타입 + 순수 평가엔진 co-locate. **snake_case**(entity 컨벤션, schemas.md camelCase 초안 폐기 + 변경이력 기록).
- step `{order, approver_role(테넌트 4역할만 — operator_* 제외), dept_scope, specific_employee_id}`: `specific` ↔ employee id 상호강제. order는 **배열 위치 정합**(steps[i].order===i+1).
- condition `{field(enum 5: leave_days/department_id/employment_type/position/job_title), op, value, line.min(1)}`: field-op 매트릭스(숫자op=leave_days 전용, 문자 field=`==,!=,in,not_in`, employment_type enum 강제), 숫자 coerce 금지/NaN 거부.
- `resolveApprovalLine(rawLine, ctx)`: 첫 매칭 조건 line(없으면 default_line), **방어적 parse**(malformed condition skip, parse 실패→빈 steps), **미존재/무효 ctx field→false**(NaN/빈문자/잘못된 enum 과매칭 차단 — !=/not_in 방어).
- 스키마 승격: tenant-settings `approvalLinePayloadSchema` + `entities/approval.ts` 의 conditions/default_line 을 `z.unknown()` → strict DSL. 활성 라인 default_line≥1 강제. openapi 54 defs 유지(zod-to-openapi ZodEffects 정상).
- 앱 write: `actions.ts` strict 사전검증 + **unknown line id fail-closed**(현 테넌트 부재 id 거부) + **specific_employee_id 테넌트 소속 검증**(employees in 조회). queries 결재자 picker(employees/departments id,name RLS 조회), approval_lines data = `{lines, employees, departments}`.
- UI: 조건 트리 편집기(라인/조건/단계 + 부서·직원 picker, useActionState 유지). **라인 삭제 = 기존 id 라인 is_active=false 비활성화 항목 제출**(mig 40 apply 는 제출 lines[]만 순회 — 단순 배열 제거는 미반영이므로 initialRef 스냅샷으로 비활성화 항목 추가).
- audit: 정의 변경은 mig 29 `audit_row_change` 트리거가 before/after 자동 기록(추가 코드 불요). SLA 제외(스키마 부재).

**★ 듀얼검증 (codex 가 evaluator 통과분에서 P2 검출)**: evaluator **PASS 8.72**(기능8.6/품질8.8/테스트8.8/계약8.7) / codex 1차 **P0/P1 없음** + P2×2(`evaluateCondition` actual 무효값 과매칭[NaN→!=/not_in true] / `refineStepOrder` 집합검사만→역순 저장 통과) + P3×2(form-data 숫자 `Number(true)=1` coerce / entity default_line order refine 미적용) + evaluator P2(라인 삭제 동선) → **hotfix `94742e1`**(isValidActual 가드 / order 위치정합 / strictNumber / entity approvalStepArraySchema / 라인삭제 비활성화) → **재검증 PASS** → PASS_BOTH. turbo 21/21 + 단위(approval-line-dsl 27 신규 / tenant-settings 30 / form-data 22, schemas 110 / web 84) + openapi 54.

### ⚠️ 신규 KI (batch O)
- **KI-120 (P3)** — mig 40 `_apply_claimed` id-update affected-row-0 silent success(예약 후 라인 삭제). 전 target 공통(데이터 무해, 보고값 부정확, KI-114 동류). 예약 엔진 리팩토링(KI-116) 시.
- **KI-121 (P3)** — ST-046(Sprint 6) 실 요청시점 소비 시 `resolveApprovalLine` 방어 parse 외 specific_employee_id 테넌트 소속 **재검증** + approver_role 해석 필요(저장 시점 검증은 사후 직원 퇴사/이동 stale 가능).
- **KI-122 (P3)** — matrix.json ApprovalLine status(C/U/D missing) WI-032/033/034 미반영(전역 entity status drift, project.md §3). Phase 7 종료 시 일괄 갱신.

### 다음 세션 첫 작업 — WI-035-feat OP-04 등록 API (ST-006)
- check-domain/check-business-number 실시간 중복검증(≤300ms) + tenant_drafts upsert(임시저장/재진입, mig 36 `ux_tenant_drafts_one_open_per_operator`) + 최종 등록 **트랜잭션**(tenants + subscriptions + tenant_settings + admin user 동시 INSERT) + 관리자 초대(WI-020-6 `createInvitation` 재사용, Resend 미설정→URL 반환 KI-103). 결재라인 초기값은 WI-034 DSL 사용 가능.
- 이어서 WI-036(OP-04 마법사 UI, Stepper WI-030) → 037(OP-02 목록) → 038(OP-03 상세).
- 배포 대기 KI: KI-099(2FA env Vercel)/098(비번재설정 대시보드)/086(leaked-password)/103(Resend) — 베타 진입 전 일괄 프로비저닝.

## -0n. 2026-06-01 batch N 세션 진척

### 완료 — WI-033-feat TA-13 회사설정 UI (PR #52 머지)

핸드오프 정독 → **codex 2라운드 협의**(mig 40 apply 엔진 정합 직접 검증) → 구현 → 듀얼검증 PASS_BOTH → auto-merge.

**codex 협의 확정 설계**:
- 폼: **useActionState 유지**(react-hook-form 미도입 — 미설치 + 기존 8폼 패턴 일관). 동적 배열(leave_types/approval_lines)은 JSON hidden input → 서버 순수 빌더.
- approval_lines: **기본필드(이름/유형/활성)만 편집**, conditions/default_line 은 read-only 표시 + **보존**(WI-034 가 조건 편집 소유).
- 탭 상태: URL `?tab=` 동기화(server 1회 fetch + client useState + `history.replaceState`, RSC refetch 회피).
- 즉시/예약: 탭별 공통 `SettingsActionBar`(apply_at datetime-local → KST `+09:00` 정규화, 과거 거부).
- read-only 5탭: `ReadonlyPane`(roles/noti/templates/security) + `AuditLogsPane` 전용 — 9탭 shell 완성.

**산출물**: `(tenant)/admin/settings/{page,settings-client,actions}.tsx` + `_components/`(ActionBar/PendingChangeList/PermissionState/ReadonlyPane/AuditLogsPane/format) + `_panes/`(4탭 폼) + `lib/tenant-settings/{form-data,tabs}.ts`(순수, 단위 17) + i18n `screens.ta-13` ko/en(106 leaf 대칭). 라우트 `/admin/settings` SSG 6.83kB.

**★ 듀얼검증 가치 재실증 (이번 세션 핵심)**: evaluator 1차 **PASS 8.75** 통과분에서 **codex 가 P1 2건 + P2 2건 검출** → 1차 FAIL.
- **P1-1**: approval conditions/default_line 원본을 클라이언트 `original_lines_json` hidden input 으로 전송 → 같은 테넌트 admin 이 개발자도구로 위조 시 타 라인 조건 변조/삭제. (leave 원본 key 도 동일 클래스 — delete_keys 변조.)
- **P1-2**: `scheduled_setting_changes` UPDATE RLS(mig 39)가 INSERT target 제한(mig 41)과 비대칭 → pending row 사후 변경 여지. **WI-033 UI 미노출(INSERT 전용)** → KI-117.
- **P2**: leave_types 삭제가 FK(on delete restrict) 충돌 → 실패 큐 / JSON parse 실패가 `[]` 로 삼켜져 leave 대량삭제 payload 가능.
- **정정**(hotfix c4f6dcb): 원본을 클라이언트 대신 **서버가 DB(RLS tenant 격리)에서 권위 조회**(original hidden input + useRef 제거) + `parseJsonArrayStrict`(손상/위조=invalid 중단) + leave delete_keys 의 `leaves`/`leave_balances` FK 참조 사전 검사(`action.leave_in_use`).
- **정정2**(hotfix 8943265, codex CONDITIONAL): 세 DB 조회 error 시 **fail-closed**(`save_failed`) — approval 조회 실패 시 conditions 빈배열 저장(조건 소실 fail-open) 차단.
- 재검증: evaluator 8.63 / codex PASS → **PASS_BOTH**. turbo 21/21 + form-data 단위 17 + E2E 미인증 가드 2 PASS.

### ⚠️ 신규 KI (batch N)
- **KI-117 (P2)** — `scheduled_setting_changes` UPDATE RLS 가 INSERT target 제한과 비대칭(pending row target/payload/apply_at 사후변경 허용). WI-033 UI 미노출(INSERT 전용)이나 Data API 레벨 P1성. 조치: pending UPDATE 를 **cancel 전용 축소 또는 cancel RPC 대체** + 불변성 강제. **KI-109 보안 하드닝 sweep 동반 권장**.
- KI-118 (P3) — apply_at 즉시/예약 경계가 actions/patchTenantSetting 두 곳 `now+1s` 판단(datetime-local 분단위라 실질 무해).
- KI-119 (P3) — settings mutation E2E 가 admin 시드 부재로 env-gate skip(KI-089 동류).

### KI-113 사용자 결정 (batch N)
- **현행 유지** — hr_admin 보안/역할권한 탭 super 전용(민감 `security_policy` raw jsonb 노출 회피). 와이어프레임 §2 state4 의 hr_admin read-only 진입은 **큐레이션된 마스킹 read 뷰가 필요한 별도 WI** 로 분리(KI-113 유지). `permissions.ts canRead` + `ReadonlyPane` super_only 안내로 코드 반영.

### 다음 세션 첫 작업 — WI-034-feat 결재라인 조건 분기 (ST-054)
- `approval_lines.conditions`(jsonb) 평가엔진 + 조건트리 UI. WI-033 의 approval 폼은 conditions 를 보존만 하므로(서버 DB 권위 병합) WI-034 가 조건 DSL 편집/평가 소유. schemas `ConditionRule`(KI-019 resolved) 참조. "5일 이상 = 대표 결재" 분기 + audit(sprint-002 DoD).
- 이어서 WI-035(OP-04 등록 API) → 036(마법사 UI) → 037(OP-02 목록) → 038(OP-03 상세).
- 배포 대기 KI: KI-099(2FA env Vercel)/098(비번재설정 대시보드)/086(leaked-password)/103(Resend) — 베타 진입 전 일괄 프로비저닝.

## -0m. 2026-06-01 batch M 세션 진척

### 완료 — WI-032-feat TA-13 회사설정 API (PR #50 머지 43d7e55)

핸드오프 정독 → **codex 2라운드 협의** → 구현 → 듀얼검증 PASS_BOTH → auto-merge.

**codex 협의 확정 설계**:
- 인터페이스: **Server Action + `apps/web/lib/tenant-settings/{queries,actions,permissions}`** (REST route handler 미신설, `app/api/` 부재 — WI-020 전체 패턴. REST 명세는 도메인 계약).
- 범위: GET 9탭 envelope(P0 4탭 full + 나머지 readOnly/notImpl) + PATCH **P0 4탭**(company/work_policy/leave_policy/approval_lines). roles/notifications/document_templates/security PATCH + audit_logs 페이지네이션은 후속 WI.
- cron: **pg_cron + plpgsql** DB-side (Vercel Hobby cron 일1회·±59분 부적합. claim 이미 DB-side. pg_cron 1.6.4 staging 가용 확인).

**마이그레이션 40 — 예약 적용 엔진** (staging 적용 + 전 시나리오 실증):
| 함수 | 역할 |
|------|------|
| `audit_row_change`(수정) | 시스템 actor fallback — `app.audit_actor_*` GUC(auth.uid() NULL 시만, 기존 사용자 경로 무영향). **KI-110 resolved** |
| `claim_due_*`(교체) | backoff(1m/5m/15m/1h) + attempt cap(5) 추가 |
| `apply_one_*`(신규, service_role) | 즉시 적용 — 원자 claim(pending+due→applying) + apply. cron 과 경합해도 중복 적용 없음 |
| `_apply_claimed_*`(내부) | target별 payload(jsonb)→테이블: company→tenant_settings.company_info / work_policy→work_policies default 1행 upsert / leave_policy→leave_types upsert+delete_keys / approval_lines→id update·insert |
| `recover_stale_*` | applying 15분 정체 → attempt<5 pending, ≥5 failed |
| `run_due_*`(cron entrypoint) | recover_stale → claim_due → apply 루프 |

- pg_cron **설치** + cron.schedule 2개: `flowhr-apply-scheduled-settings`(매분) + `flowhr-audit-retention`(주간, mig 29 미등록분 재등록). 신규 5함수 **anon/auth EXECUTE revoke**(KI-109/WI-031 클래스 재발 없음, proacl 실측 {postgres,service_role}).
- **마이그레이션 41**(듀얼검증 hotfix): `scheduled_setting_changes` INSERT RLS 를 P0 4 target 제한(Data API 큐 오염 차단).

**앱/스키마**: `tenant-settings.ts` P0 4탭 payload zod(snake_case, full desired-state, `.strict()`) + 단위 27 / OpenAPI 54 defs / database.ts 재생성(apply_one/run_due/recover_stale 타입). queries 9탭 envelope(탭별 permission/implemented/data/pending) / actions 즉시(apply_one RPC)·예약 / permissions 순수 권한 매트릭스+단위.

**즉시/예약 흐름**: PATCH → 검증 → `scheduled_setting_changes` 큐 insert(사용자 세션, RLS+트리거가 예약행위 audit) → apply_at≤now 면 service_role `apply_one` RPC(applied/failed), 미래면 pending(pg_cron 매분 적용). 단일 이력 모델.

**듀얼검증 PASS_BOTH**: evaluator **8.45**(전 축 ≥7.5, 차단 0) / codex 1차 **WARNING**(P1 hr_admin GET 권한 과다[security/audit 노출] + P2 큐 INSERT target 미제한) → hotfix `31c9271`(canRead 정밀화: security/roles **super 전용**, audit 은 hr_admin 유지 / mig 41) → 재검증 **PASS**. turbo 21/21. **★ codex 가 evaluator 통과분에서 권한 과다·큐 오염 2건 검출 → 듀얼검증 가치 재실증.**

**staging 실증(검증된 사실)**: company 즉시 apply + audit `actor=예약자/system:scheduled-settings`(KI-110) / work_policy insert·update 중복없음 / leave_policy upsert+delete_keys / approval_lines insert+update / 미래예약 no-op / run_due due만(미래 제외) / 실패→pending(attempt1)·소진→failed(attempt5) / stale 복구(pending·failed·비stale제외). 검증 후 synthetic 테넌트 cascade 삭제 — staging pristine.

### ⚠️ 신규 KI (batch M)
- **KI-113 (P3)** — hr_admin 보안탭 read-only(와이어프레임 §2 state4) 미적용. 최소권한으로 security/roles super 전용 read. **WI-033 착수 시 사용자 재확인**(민감 필드 마스킹 후 hr_admin read 복원 여부).
- KI-112 (P3) — `leave_policy.grant_basis` 저장 위치 부재(tenant_settings 전용 컬럼 없음) → leave_types 만 처리. 컬럼 추가는 schema 승인범주 후속.
- KI-114 (P3) — actions apply_one RPC 에러 시 status='pending' 보고가 실제 행상태와 괴리 가능(데이터 무해).
- KI-115 (P3) — mig 40 엔진 pgTAP + actions 통합 테스트 부재(권한 매트릭스 unit 은 커버).
- KI-116 (P3) — mig 40 audit_row_change 전체 재정의(mig 29 복제) → 향후 드리프트 위험.
- **KI-110 resolved**(audit 시스템 actor fallback).

### staging 상태 (batch M)
- `nwcttwuvdnelfbpjeqzr`: 마이그레이션 **40·41 적용**(list_migrations 등록). **pg_cron 1.6.4 설치** + cron job 2개 활성. scheduled_setting_changes apply 엔진 함수 6종(proacl {postgres,service_role}). 테넌트/설정 데이터 0행(검증 후 정리).

### 다음 세션 첫 작업 — WI-033-feat TA-13 회사설정 UI
- `(tenant)/admin/settings/page.tsx` — SettingsPane(WI-030) 9탭 shell + 회사정보/근무/휴가/결재라인 4탭 폼(react-hook-form + zod). WI-032 `getTenantSettings`(GET)/`patchTenantSetting`(즉시·예약) 소비. 적용일 선택 UI(즉시/예약) + 예약 대기/실패 이력 표시(pending 필드). E2E.
- ⚠️ **KI-113 사용자 재확인** 후 hr_admin 보안탭 노출 범위 확정.
- 이어서 WI-034(결재라인 조건 엔진) → 035(OP-04 등록 API) → 036(마법사 UI) → 037(OP-02 목록) → 038(OP-03 상세).
- 배포 대기 KI: KI-099(2FA env Vercel)/098(비번재설정 대시보드)/086(leaked-password)/103(Resend) — 베타 진입 전 일괄 프로비저닝.

## -0l. 2026-06-01 batch L 세션 진척

### Sprint 2 진입 (codex 단일안 + 사용자 결정)

- **진입 순서**(codex 협의): packages/ui 토대 선행 → DB → TA-13 → OP-04 → OP-02/03. 의존 ST-007~010←ST-006, ST-053/054←ST-005(완료).
- **WI 번호 = WI-030~038** (Phase 8~10 예약 WI-022~029 회피, 사용자 결정). 매핑: 030 UI primitive / 031 DB foundation / 032 TA-13 설정 API / 033 TA-13 설정 UI / 034 결재라인 조건 / 035 OP-04 등록 API / 036 OP-04 마법사 UI+활성화 / 037 OP-02 목록+상태변경 / 038 OP-03 상세.
- **codex 정정(검증완료)**: sprint-002.md "마이그레이션 신규 생성"은 Phase 6 표현 — 9개 테이블 전부 mig 4/5/7/11 기존(Sprint 1 ERD). Sprint 2 DB는 보강/seed/scheduler delta.
- **요금 모델 결정(사용자)**: **PRD 유지(고정 티어 per-user)** + 입점사 맞춤 기능은 기존 `feature_flag_overrides`(mig 8, per-tenant ON/OFF)로 지원 — 추가 스키마 불요. 가격은 OP-04 와이어프레임 SSOT(기본 ₩9,900/명·프리미엄 ₩19,800/명·커스텀 협의), placeholder 아님. ⚠️ **요금/제품 모델 결정은 묻기 전에 PRD/와이어프레임 SSOT부터 확인**(이번 세션 사용자 2회 지적 — "prd 확인해봤니").

### 완료 — WI-030-feat packages/ui 도메인 primitive 5종 (PR #47 머지 858cc22)

Phase 5 `_design-system/components.css` SSOT → React, **비즈니스 로직 없는 reusable primitive**(화면별 fetch/validation은 화면 WI 소유):
| 컴포넌트 | 원천/용도 |
|----------|----------|
| `Stepper` | `.stepper`/`.step` G3 list (OP-04 7단계 좌측 네비). KI-061 부분 해소(OP-04 list형; EM-03/EM-08 2단 변종은 Sprint 5/7 잔존) |
| `DataTable`(+`RowLink`/`rowHighlight`/`nextSortState`) | `.table` (OP-02 목록) |
| `FilterBar`/`FilterChip`/`FilterPanel` | OP-02 필터 |
| `DomainPrefixInput` | `.domain-prefix`/`.domain-suffix` (OP-04 슬러그) |
| `SettingsPane`/`VerticalTabs` | TA-13 9탭 셸 |

검증 인프라 신규: **vitest(node) + react-dom/server `renderToStaticMarkup`**(jsdom 불요, React 19 호환 — react-dom devDep 추가). 단위 27. 듀얼검증 PASS_BOTH(evaluator 8.60 / codex WARNING P2×3 a11y[정렬·행 키보드, VerticalTabs ARIA] → hotfix[th 내부 button, tr tabIndex+keydown, nav+aria-current 패턴] → PASS). turbo 21/21. KI-107(Stepper summary)/108(콜백 jsdom interaction 미검증) 등재.

### 완료 — WI-031-feat Sprint 2 DB foundation (PR #48 머지 3ed8b7d)

마이그레이션 **36~39 staging 적용**(기존 테이블 delta):
- **36** hardening: tenant_drafts status enum+`ux_tenant_drafts_one_open_per_operator`(R-마법사 충돌)+step 1~7 / tenants 회사명 trgm GIN+status·plan·updated_at 인덱스+slug 소문자 unique / work_policies 테넌트당 기본 1개 / document_templates (tenant,key) / approval_lines 인덱스.
- **37** 예약 큐: `scheduled_setting_changes`(target 8탭/payload/apply_at/status enum/audit 필드) + RLS 3정책(operator/tenant_admin) + `claim_due_scheduled_setting_changes()`(pending→applying skip-locked 원자 claim, service_role) + audit 트리거.
- **38** seed: plans 3종(기본 9900/프리미엄 19800/커스텀, OP-04 SSOT, 멱등 upsert).
- **39** 보안 hotfix(아래).

타입/스키마 동기화: database.ts 재생성(staging gen) + zod 엔티티(tenantDraft 갱신/scheduledSettingChange 신규) + enum 2종 + OpenAPI 등록(ScheduledSettingChange). schemas 단위 53.

**★ 듀얼검증 가치 실증 (이번 세션 핵심)**: evaluator가 **codex(claim 함수 설계자)도 놓친 cross-tenant 보안 P1**을 검출 → 1차 FAIL.
- 결함: `claim_due_scheduled_setting_changes`(security definer)의 EXECUTE 가 Supabase **pg_default_acl 로 anon/authenticated 에 잔존**(`revoke all from public`만으론 무력 — mig 31 record_login_failure 와 **동일 클래스 재발**). 임의 인증/익명 사용자가 RPC 호출 시 전 테넌트 pending 행 claim + `returning sc.*` 로 cross-tenant payload 유출(RLS 우회) + cron DoS.
- 정정(mig 39): `revoke execute ... from public, anon, authenticated`(mig 31/39 패턴) + update 정책 축소(operator/tenant_admin 은 pending→pending/cancelled 만, applying/applied/failed 는 service_role 전용). **proacl 실측 {postgres,service_role}** + rls_matrix `T14/T15` staging PASS.
- 재평가 PASS 8.80 / codex 재검증 PASS → PASS_BOTH.

**⚠️ 신규 KI (batch L)**:
- **KI-109 (P2) — 보안, 다음 우선순위 권장**: `accept_invitation`(mig 35, 이미 배포됨)도 **동일 클래스 grant 누수**(staging proacl 실측 anon/auth execute=true). token_hash 게이트로 실 노출 제한적이나 service-only security-definer 함수 grant 일괄 감사·정정(`revoke from anon/authenticated`) 필요. ※ `get_invitation_by_token_hash` anon=true 는 비인증 /activate 검증용 **의도된 설계**(건드리지 말 것).
- KI-110 (P3): claim 함수 audit actor NULL(service_role 컨텍스트) — WI-032 cron apply 시 시스템 actor 보강.
- KI-111 (P3): `workPolicySchema.applicable_departments` z.array(uuidSchema) vs DB text[] 불일치(WI-021-1 도입, KI-090 동반 정정).
- (이미 등재) KI-107/108(WI-030).

### ⚠️ 교훈 (이번 세션)
- **듀얼검증은 단독 evaluator/codex 보다 강함** — 설계자(codex)가 놓친 결함을 독립 평가자(evaluator)가 검출. WI별 의무(project.md §1-1)의 가치 재실증. **evaluator는 자가보고 미신뢰 — staging proacl/RLS 직접 재현으로 검증**.
- **security-definer 함수 grant**: Supabase 는 `pg_default_acl` 로 anon/authenticated 에 EXECUTE 자동 부여 → `revoke from public` 만으론 부족. 반드시 `revoke ... from public, anon, authenticated`(service_role 만 grant). 향후 모든 service-only RPC 작성 시 적용.
- **제품/요금 결정은 PRD/와이어프레임 SSOT 먼저 확인** 후 사용자에게(추측·재질문 금지).

### staging 상태 (batch L)
- `nwcttwuvdnelfbpjeqzr`: 마이그레이션 **36~39 적용**(list_migrations 등록). `plans` **3행**(기본/프리미엄/커스텀). `scheduled_setting_changes` 테이블 + RLS 3 + claim 함수(proacl {postgres,service_role}). tenant_drafts status 등 4컬럼 추가. RLS 매트릭스 T1~T15 PASS.
- ⚠️ cron 자체(claim 후 실제 target 테이블 apply)는 미구현 — **WI-032 소유**(stale applying 복구 + 실패 재시도 동반).

### 다음 세션 첫 작업 — WI-032-feat TA-13 회사설정 API
- GET/PATCH `/tenant/settings/*` 9탭(회사정보/근무/휴가/결재라인 우선 P0) + 적용일 즉시/예약(`scheduled_setting_changes` 사용) + 예약 적용 cron(claim_due 호출 → target 적용 → status 전이) + 변경 이력.
- 의존: WI-031 완료(스키마/타입/큐 준비됨). 이어서 WI-033(설정 UI, SettingsPane 사용) → 034 → 035 → 036 → 037 → 038.
- 배포 대기 KI: KI-099(2FA env Vercel)/098(비번재설정 대시보드)/086(leaked-password)/103(Resend) — 베타 진입 전 일괄 프로비저닝.

## -0k. 2026-06-01 batch K 세션 진척

### 완료 — Vercel 모노레포 배포 설정 수정 (WI-019부터 누적된 배포 실패 해소)

사용자 지시로 Sprint 2 진입 전 Vercel production 배포 실패를 먼저 해소. **빌드는 WI-019부터 항상 성공**(26 페이지 생성)했고, output 위치 인식만 실패했음.

| 항목 | 내용 |
|------|------|
| 원인 | Vercel 프로젝트 설정이 **전부 null**(framework/rootDirectory/buildCommand/outputDirectory) → 모노레포 루트를 일반 프로젝트로 인식 → **Next.js 미감지** → 빌드 결과(`apps/web/.next`) 못 찾고 루트 `public/` 탐색 → `Error: No Output Directory named "public" found` 실패 |
| 해법 | 프로젝트 설정 **`rootDirectory=apps/web` + `framework=nextjs`** (Vercel REST API `PATCH /v9/projects/{id}?teamId=`, CLI 토큰 `%APPDATA%\com.vercel.cli\Data\auth.json` 의 `.token`). **커스텀 buildCommand 불필요** — 모든 workspace 패키지가 `exports: ./src/index.ts` 소스 직접참조 + apps/web `transpilePackages`라 `next build` 단독으로 전부 컴파일(turbo/dist 빌드 불요) |
| 검증 | production redeploy 성공(`Building→Completing→Aliased`) + 사이트 `/`·`/ko`·`/ko/login` **HTTP 200**(로그인 폼 렌더) + GitHub commit status **failure→success**. https://flowhr-sop.vercel.app |
| 영속성 | 프로젝트 설정이라 **이후 모든 push/PR 자동배포에 적용**. preview는 기존 Supabase mock 전략 유지. `.vercel/project.json`은 gitignore라 git에 미반영(메모리 `infra-free-tier-policy`에 기록) |

### ⚠️ production env 미설정 (배포는 정상, 일부 기능 fail-closed) — 사용자 조치 대기
- **KI-099**(2FA env 2키 `AUTH_TOTP_ENC_KEY`/`AUTH_CHALLENGE_SECRET` — 미설정 시 2FA 사용자 production 로그인 차단) / **KI-098**(비번재설정 Recovery 템플릿+Redirect URL) / **KI-086**(leaked-password) / **KI-103**(Resend 이메일). 실사용자 없어 비차단. 베타 진입 전 일괄 프로비저닝 권장.

### 다음 세션 첫 작업 — Sprint 2 진입 (테넌트 라이프사이클 + 회사 설정 P0)

- **Sprint 1 전체 완료**(ST-001~005 + ST-068/069 + ST-072 + ST-078, 9 Story 42 SP, 전부 듀얼검증 PASS_BOTH). 다음은 **Sprint 2**(`sprint-002.md`): ST-006 OP-04 7단계 마법사(13) / ST-007 OP-02 목록(5) / ST-008 OP-03 상세 8탭(8) / ST-009 상태변경+audit(3) / ST-010 관리자 활성화(2) / ST-053 TA-13 회사설정 9탭(13) / ST-054 결재라인 분기(5) = **49 SP**.
- ⚠️ **첫 진짜 도메인 UI 단계** — `packages/ui` 도메인 컴포넌트(Stepper/DataTable/FilterBar/DomainPrefixInput/SettingsPane) 신규 필요(현재 base 5종 Button/Input/Label/Card/Alert만). 이 컴포넌트화가 **P2 KI-054/061**(IconButton aria-label / Stepper 컴포넌트화) 자연해소 지점.
- **진입 순서/WI 분할 미정(사용자 협의 대기)** — 후보 3안: (A) ST-006 마법사 핵심부터 / (B) packages/ui 토대 먼저 / (C) ST-007 목록 작게 시작. **codex 단일안 협의 후 착수.** (의존: ST-007~010 ← ST-006, ST-006/053 동시)
- **P2 트리거 5건(KI-054/061/079/092/094, 임계 도달)**: prd-state 기록상 **defer 확정**(전부 미래 WI 자연해소 — KI-054/061 Sprint 2 packages/ui / KI-079 세션관리 / KI-092 OP-09 감사 / KI-094 글로벌 출시). 유지 여부 사용자 재확인 가능.
- ⚠️ 마이그레이션은 supabase MCP(원격 staging `nwcttwuvdnelfbpjeqzr`) 경로 — Docker 미설치. 코드 WI 머지는 **듀얼검증 게이트 필수**(project.md §1-1).

## -0j. 2026-06-01 batch J 세션 진척 — **신규 세션 여기부터**

### 완료 — WI-020-6-feat ST-003 계정 활성화 (CM-03, PR #44 머지)

**create-at-activate** 설계(codex 수렴) — `auth.users` 를 **활성화 시점에 생성**(초대 시점엔 invitations 행만). 활성화 전 계정 부재로 **forgot-password 우회를 구조적으로 차단**(로그인/재설정 경로 무수정). 사용자 승인 후 DB schema(invitations 테이블) 추가.

| 영역 | 산출물 |
|------|--------|
| 마이그레이션 35 | `invitations` 테이블(token_hash/email/target_role/tenant_id/employee_id/operator_flag/invited_by/expires_at/accepted_at/accepted_user_id/status) + `invitation_status` enum(pending/accepted/revoked) + RLS 6(operator full / tenant_admin operator_flag=false 차단) + SECURITY DEFINER 함수 2: `get_invitation_by_token_hash`(비인증 검증, 최소 projection, anon+service grant) / `accept_invitation`(원자 전환 — **SELECT FOR UPDATE → public.users INSERT → invitations claim UPDATE → operator/employee 분기**, service only). staging 적용 |
| 토큰 | `invitation-token.ts` — 32바이트 CSPRNG 평문(URL) → **sha256 해시** 저장(고엔트로피라 새 env 키 불요). timingSafe |
| invitations.ts | `createInvitation`(향후 OP-04/TA-02+seed 공통, 이메일 추상화) / `getInvitationInfo`(쿠키 anon rpc) / `activateAccount`(admin.createUser → `accept_invitation` rpc → 실패 시 auth.users 만 보상 삭제, public 측은 SQL 트랜잭션 자동 롤백) / `recordActivationConsents`(service_role+명시 userId, **세션 비의존** — setSession 직후 getUser=null 무음실패 회피) |
| /activate | page(토큰검증/만료분기) + form(비번설정 passwordSchema 재사용 + 필수약관 체크) + actions(activateAccount → recordActivationConsents → setSession → operator 강제 2FA(/me/security)/역할 대시보드) |
| 기타 | activateSchema(+테스트), audit `user.activated`, 점검 면제 `/activate`, i18n ko/en `auth.activate.*`, database.ts invitations+enum+함수 타입 |

**듀얼검증 PASS_BOTH** (evaluator 8.28 / codex 1차 **FAIL** — 실결함 4건: P1 SQL FK순서(claim before users INSERT) + P1 TS orphan(claim 실패 시 public.users 미삭제) + P1 consent 무음실패(setSession 직후 세션 못읽음) + P2 enum 미정의 → 정정 cafff5d/61bed1b → **PASS_VERIFIED**. evaluator 추가검출 **P2 inet clientIp**('unknown'→user_consents.ip_address inet 22P02 거부로 consent 무음누락) + P3 audit 중복 → **머지 전 선제 정정 754898d**). 검증: turbo 20/20 + 단위(schemas 51/api-client 13/web 52) + **E2E 34/34**(활성화 5 신규 + 회귀 29) + staging `source='activate'` consent 실증.

**신규 KI**: KI-103(P3 welcome_invite 실발송 미구현 — Resend+인비터 UI 후속) / KI-104(P3 활성화 보상 deleteUser 마저 실패 시 orphan auth.users — 운영 스캐너) / KI-105(P3 CM-03 in-flow 직원 선택 2FA 미구현 — /me/security 재사용 보완).

### ⚠️ 교훈 (이번 세션 — 중대)
- **도구 병렬 호출 남용 사고**: 한 메시지에 도구를 다수 묶으면 **첫 실패가 뒤 호출을 전부 "cancelled"** 시켜 진단 자체가 불가. + **E2E PowerShell 은 항상 종료코드 1**(WebServer stderr) → 다른 도구와 묶으면 무조건 줄취소. **규칙: E2E 실행/실패 가능 명령은 단독 호출. 결과 분석은 다음 메시지.** (사용자 다회 지적)
- **PowerShell `> file` 은 UTF-16(BOM)** 저장 → node JSON.parse 깨짐. `| Out-File -Encoding utf8` 사용. 결과 판정은 ASCII 토큰(passed/failed)으로(한글 콘솔 깨짐).
- **세션 중단 시 파일 쓰기 유실** 가능 — 신규 세션 진입 시 `git status` + 파일 존재 확인부터.
- **codex 위임 효과적**: FK 순서 버그(invitations.accepted_user_id 가 users FK → users INSERT 가 claim 보다 먼저여야)를 codex 가 정확히 진단·수정. 듀얼검증이 evaluator(P2 inet)·codex(P1 4건) 상호 보완으로 7건 실결함 검출.

### 다음 세션 첫 작업 — Sprint 진행
- **WI-020 인증 도메인 전체 완료**(ST-001 로그인 / ST-002 비번재설정 / ST-003 활성화 / ST-004 2FA / ST-078 약관 / ST-072 오류·점검). sprint-001 Day 6~12 인증/약관/오류 블록 종료.
- 다음은 `mvp-plan.md §4` + `sprint-001.md`(잔여) / `sprint-002.md` 확인해 선정. P2 트리거 5건(KI-054/061/079/092/094) 누적 — batch 처리 또는 React 변환 WI 시 자연해소 여부 사용자 협의.
- ⚠️ **원격 배포 시 사용자 조치 대기 KI**: KI-099(2FA env 키 Vercel)/098(비번재설정 대시보드 템플릿)/086(leaked-password)/103(Resend 이메일).

## -0i. 2026-05-29 batch I 세션 진척 — **신규 세션 여기부터**

### 완료 — WI-020-5-feat ST-004 2FA TOTP (CM-04, PR #43 머지)

커스텀 TOTP(speakeasy) — Supabase 네이티브 MFA 미사용. codex 설계 7항목(§-0h) 그대로 실행. **선행 env 2키 프로비저닝 완료**(로컬).

| 영역 | 산출물 |
|------|--------|
| challenge(핵심) | login actions 가 **격리 클라이언트**(`createIsolatedSupabaseClient`, no-op 쿠키)로 비번 검증→세션토큰만 획득(쿠키 미발급). `totp_enabled` 면 `{userId,email,access/refresh,returnTo,jti,exp+300s}` 를 `AUTH_CHALLENGE_SECRET` AES-256-GCM 봉인→`fh-2fa-challenge` HttpOnly/Secure/Lax → `/{locale}/two-factor`. 2FA 미사용은 cookie 클라 `setSession` |
| verify | `(auth)/two-factor/*` — challenge 해제(purpose/exp)→OTP 잠금확인→`verifyTotp`(speakeasy ±1) 또는 복구코드→통과 시 `setSession`+challenge 삭제(1회용)+잠금 초기화+약관가드 재적용→returnTo. 실패 `recordLoginFailure`(5회→/login?error=locked) |
| enable/disable | `(employee)/me/security/*`(OP-12/EM-09 보안탭 최소) — **단일 영속 패널**(revalidate 후 복구코드 화면 유지): enable(speakeasy 비밀→qrcode QR→pending 비밀 `fh-2fa-setup` 봉인→6자리 검증→`totp_enabled`+암호화 비밀+복구코드 8 scrypt 1회표시) / disable(현재 비번 격리검증+TOTP·복구코드, **operator 차단**) |
| 복구코드 | `XXXX-XXXX`(혼동문자 제외) 8개, scrypt(코드별 salt)+timingSafe, `users.recovery_codes_hash text[]`. **`.contains` CAS 원자 소비**(동일 코드 병렬 1회만, codex P2 정정) |
| operator 강제 2FA | `operator-2fa-guard.ts` + login 직후, `system_settings.require_operator_2fa`(기본 true). 약관 우선 |
| 인프라 | 전용 env 2키(`AUTH_TOTP_ENC_KEY`/`AUTH_CHALLENGE_SECRET`, 32B base64) fail-closed. 점검 면제 `/two-factor`·`/me/security`. audit 5종. `createIsolatedSupabaseClient` 추가 |

**듀얼검증 PASS_BOTH** (evaluator 8.93 / codex 1차 **FAIL** — 실결함 4건 검출: **P1 프로필 조회 실패 시 2FA fail-open**[일시 RLS 실패→OTP 없이 세션] + P2 operator 가드/disable role fail-open + P2 복구코드 비원자 → 정정 `5f981dc`[fail-closed 3건 + `.contains` CAS] → **PASS_VERIFIED**. jti 재생 단일사용은 DB 저장소 필요로 **KI-101 deferral**[recovery-marker 선례·HttpOnly 5분 완화, 머지 비차단]). 검증: turbo 20/20 + 단위(crypto 9+recovery 10+totp 5+schemas 7 / web 48+schemas 47) + **E2E 29/29 직렬**(workers:1, 2FA 가드 3 + staging 전체흐름 2[enable→재로그인 challenge→오답거부→TOTP통과→복구코드통과→disable, speakeasy 산출, test-employee service-role teardown] + login 9 회귀).

**신규 KI**: KI-099(P3 Vercel env 수동 프로비저닝) / KI-100(P3 2FA E2E env게이트·직렬·teardown, CI 자동화는 KI-082 secrets 동반) / KI-101(P3 jti 단일사용 하드닝 — DB 저장소 사용자 승인) / KI-102(P3 2FA 관리 재확인 rate-limit — 이미 인증+2차 게이트로 완화).

### ⚠️ 교훈 (이번 세션)
- **듀얼검증이 evaluator 가 놓친 P1 fail-open 을 검출** — 단독 evaluator(8.93 PASS) 만으로 머지했다면 2FA 우회 결함 출고. WI별 codex 병행 의무(project.md §1-1)의 가치 실증.
- **E2E 가 PoC 로 못 잡는 결함 검출** — enable 확인 시 서버 revalidate 가 조건부 분기(EnrollFlow)를 교체해 복구코드 미표시 → 단일 영속 패널로 통합. 구현 중 staging 실증 E2E 필수.
- **service-role 클라이언트 함정** — supabase-js 에서 `signInWithPassword` 호출한 클라이언트는 이후 요청을 사용자 토큰으로 보냄(service_role 상실→RLS no-op). 앱 코드는 `createServiceRoleClient`(signIn 안 함) 사용으로 정상이나, E2E teardown 헬퍼는 별도 pristine 클라이언트 분리 필요.

### 다음 세션 첫 작업 — WI-020-6 ST-003 계정 활성화 (CM-03)
- ⚠️ **착수 전 사용자 승인** — 커스텀 `invitations` 테이블(7일 토큰 1회용) = **DB schema 변경**(§5/§7-2). 마이그레이션 35 신규.
- 7일 토큰 + 1회용 + 비밀번호 설정(passwordSchema 재사용) + **약관 동의 흐름**(ST-078 `recordConsent(source='activate')` 재사용) + **선택 2FA**(ST-004 enable 흐름 재사용 — 이래서 ST-004 선행).
- `users.role==='operator_*'` 시 "건너뛰기(직원)" 숨김(KI-045). API `POST /auth/activate` + `GET /auth/activate/:token` + `POST /auth/invitations/resend`(auth.md).

## -0h. 2026-05-29 batch H 세션 진척 — **신규 세션 여기부터**

### 완료 — WI-020-4-feat ST-002 비밀번호 찾기/재설정 (CM-02, PR #41 머지)

P2 KI 5건 트리거 → **codex 협의 defer 확정**(전부 미래 WI 자연해소, 비응집 batch + KI-094 DB schema 회피). WI-020 인증보조 분할: **WI-020-4(ST-002) → WI-020-5(ST-004) → WI-020-6(ST-003)** (ST-003 선택2FA가 ST-004 의존).

| 영역 | 산출물 |
|------|--------|
| 메커니즘(codex 협의) | **token_hash + verifyOtp({type:'recovery'})** — PKCE code_verifier 부재(cross-device 링크 클릭) 회피. PKCE 미채택 |
| /auth/confirm | `app/auth/confirm/route.ts` Route Handler(req/res 쿠키 어댑터) — verifyOtp → recovery 세션 + **HMAC 서명 마커** 발급. middleware matcher `/auth` 제외(next-intl 리다이렉트 회피) |
| forgot | `(auth)/forgot-password/*` — resetPasswordForEmail + 미등록 동일 sent + `obscureTiming`(계정 열거 방지, AC-1) |
| reset | `(auth)/reset-password/*` — recovery 세션 **+ HMAC 마커(=본인)** 요구 → `updateUser` → `signOut({scope:'global'})` 전세션 무효화(AC-3) → `/login?reset=success` |
| 복구 게이트(codex P1-1) | `lib/auth/recovery.ts`(server-only) + `recovery-marker.ts`(순수, HMAC-SHA256 `userId.exp.HMAC`, 키=SUPABASE_SERVICE_ROLE_KEY, 15분, fail-closed) — 세션 보유/탈취자 위조 차단 |
| 정책/i18n | `passwordSchema`(≥10 대소문자/숫자/특수, 실시간 체크리스트 SSOT) + forgot/reset ko·en + config.toml recovery 템플릿+`templates/recovery.html` + minimum_password_length 10 |

**듀얼검증 PASS_BOTH** (evaluator 8.15 / codex 3라운드 CONDITIONAL→PASS_VERIFIED — 듀얼검증이 실결함 3건 검출: P1-1 복구게이트 부재→HMAC 마커 / P1-2 signOut 에러무시·audit순서 / P2 i18n 키 이중 네임스페이스). 검증: typecheck/lint/build 17/17 + unit(schemas 41 / web 24 / api-client 13) + E2E 24/24.

**신규 KI**: KI-097(P3 실메일·cross-device E2E 미검증 — Free SMTP) / KI-098(P3 원격 대시보드 Recovery 템플릿 + Redirect URL + SUPABASE_SERVICE_ROLE_KEY env 수동설정).

### 다음 세션 첫 작업 — WI-020-5 ST-004 2FA (CM-04) — codex 설계 확정 (그대로 실행)

**custom TOTP=speakeasy + qrcode(둘 다 미설치)**. DB schema 변경 없음(users.totp_enabled/totp_secret_encrypted/recovery_codes_hash 기존 사용). **단일 WI**(로그인 challenge + `/me/security` enable/manage + operator 강제).

⚠️ **선행 env 프로비저닝(codex 단일안 — 전용 키 2개)**:
- `AUTH_TOTP_ENC_KEY` (32바이트 base64) — TOTP secret AES-256-GCM 암호화-at-rest 키
- `AUTH_CHALLENGE_SECRET` (32바이트 base64) — challengeToken 봉인 키
- service_role 키 겸용 금지(유출/회전 파급 과대). 로컬 `.env.local` + staging/Vercel 프로비저닝(KI 등록 + .env.example 문서화). 부재 시 fail-closed.

**설계(codex 7항목 단일안)**:
1. **challenge 메커니즘(핵심)**: login actions 가 현재 쿠키기반 `createSupabaseServerClient()`로 signInWithPassword 즉시 세션발급 → 변경: **no-op 쿠키 어댑터 isolated 클라이언트**(`createServerClient(url,anon,{cookies:{getAll:()=>[],setAll:()=>{}}})`)로 비번검증·세션토큰 획득(쿠키 미발급). `totp_enabled` 면 `{access_token,refresh_token,userId,email,returnTo,jti,exp:+300s}` 를 `AUTH_CHALLENGE_SECRET` AES-GCM 봉인 → `fh-2fa-challenge` HttpOnly/Secure/Lax 쿠키. `/two-factor` 진입 즉시 쿠키삭제(단일사용) → exp/purpose/userId 검증 → OTP 검증 → 정상 쿠키 클라이언트 `setSession()` → `getRequiredConsents(locale)` 약관가드 재적용(현행 동일).
2. **enable/verify/disable UI**: 신규 `/{locale}/me/security` 최소 페이지(OP-12/EM-09 미구현). enable: speakeasy secret 생성 → qrcode QR → 6자리 검증 → `totp_enabled=true`+`totp_secret_encrypted`+복구코드 8 1회표시·해시저장. pending secret 은 DB 컬럼 추가 없이 `fh-2fa-setup` HttpOnly 단기 쿠키 봉인. disable: 현재 비번 재확인 + TOTP/복구코드. **operator 비활성화 차단**.
3. **복구코드 해싱**: Node `crypto.scrypt` + 코드별 랜덤 salt, 포맷 `scrypt$v=1$N=16384$r=8$p=1$<salt>$<hash>`(bcrypt 의존 회피, sha256은 저엔트로피 코드에 빠름). 매칭 1개→제거(users update), `timingSafeEqual`.
4. **OTP 5회 잠금**: 기존 `login_attempts`+`record_login_failure(email,ip)` RPC 재사용. 비번 성공 시 카운트 초기화 → OTP 실패부터 재누적 5회 잠금. `/two-factor` 진입·검증 전 `checkLoginLock`, 2FA 성공 시 `clearLoginAttempts`.
5. **operator 강제 2FA(AC-3)**: `operator_*`+`totp_enabled=false` → 세션발급 후 `/me/security?forced=2fa&return_url=/{locale}/operator` redirect. `system_settings.require_operator_2fa` default true 존재. operator layout/middleware 에서도 미설정 operator 의 `/operator/*` 접근 재차단. 약관 미동의 시 legal guard 우선.
6. **점검 면제**: `MAINTENANCE_ALLOW` exact Set 에 `/two-factor`, `/me/security` 추가.
7. **audit 타입**: `writeAuthAudit` 에 `auth.2fa_enabled`/`auth.2fa_verified`/`auth.2fa_failed`/`auth.recovery_code_used` 추가.

API 명세: `.flowset/api/auth.md` POST /auth/login(requires2fa+challengeToken) + POST /auth/2fa/verify. CM-04 5상태(input/loading/error/recovery/done). 와이어프레임 `.flowset/wireframes/analysis/CM-04.md`.
**이후**: WI-020-6 ST-003 활성화(⚠️ 커스텀 invitations 테이블 = DB schema 변경 → 착수 전 사용자 승인).

## -0g. 2026-05-29 batch G 세션 진척

### 완료 — WI-020-3-feat ST-072 오류/점검 (CM-06, codex 협의 A안)

PR #40 머지. 듀얼검증 **PASS_BOTH**(evaluator 8.40 / codex CONDITIONAL→hotfix→PASS_VERIFIED).

| 영역 | 산출물 |
|------|--------|
| 404 | `app/[locale]/not-found.tsx`(getTranslations) + `[...rest]/page.tsx` catch-all(미매칭 라우트 → 커스텀 404, next-intl 권장) + `components/error-state.tsx`(서버·클라 공용 인라인 SVG hero) |
| 500 | `app/[locale]/error.tsx`(boundary, `error.digest`=참조번호 + `NEXT_PUBLIC_SENTRY_DSN` 시 Sentry 안내 + 재시도) + `app/global-error.tsx`(루트 레이아웃 오류 — 자급자족 인라인/이중언어) |
| Sentry 추상화훅 | `lib/observability/sentry.ts`(`captureServerError` — DSN 미설정 no-op 구조화 로그 / DSN 시 sentryPending, **@sentry/nextjs 미설치 — S6 연동**) + `instrumentation.ts` `onRequestError` 연결(Next 15 안정) |
| 점검모드(503) | `lib/maintenance/queries.ts`(`getActiveMaintenance` TTL 15s 캐시 + `getUserRole` + `computeRetryAfterSeconds`/`isMaintenanceExempt` 순수함수) + `middleware.ts`(status=active 시 비-`operator_super` → `/maintenance` **503 rewrite + Retry-After**, `operator_super` 우회, `/login`·`/maintenance` **exact** 예외) + `maintenance/page.tsx`(활성/비활성 분기) + `countdown.tsx`. `lib/supabase/middleware.ts` refreshSession 가 client 반환(재사용) |
| i18n / 정합 | `ko/en` `system.error.{notFound,internal,maintenance}.*`(CM-06 §4 catalog 정합, 확장상태 serviceUnavailable/network 는 §8 유보=dead key 방지) + matrix.json MaintenanceWindow R=`pending`(public_view 읽기) + CM-06.md §8 구현 노트 + apps/web **vitest 인프라 신규**(vitest.config + test script) |

### 듀얼검증 (codex 실결함 검출 — 게이트 모범 사례)

| 라운드 | evaluator | codex | 정정 |
|------|------|------|------|
| 1차 | PASS 8.40 | **CONDITIONAL** P1×1+P2×1+P3×1 | — |
| hotfix(`5ea19b7`) | (유지) | **PASS_VERIFIED** | P1 점검 면제 prefix→exact match(`Set.has`, 중첩경로 503 누수 차단) / P2 CM-06 §4 catalog 유보 명시 / P3 RLS created_by 노출→KI-096 |
| → **PASS_BOTH** | | | `.flowset/eval-results/WI-020-3-feat.pass` |

### 신규 KI (batch G) — **P2 트리거 5건 도달**

| KI | 등급 | 내용 |
|----|----|----|
| KI-093 | P3 | 점검 active 503/operator_super 우회 자동 E2E 공백(staging seed fixture 필요, KI-089/091 동류). 비활성 E2E 5 + unit 14 + staging 수동 실증으로 핵심 커버 |
| KI-094 | P2 | `maintenance_windows` `message_en` 컬럼 부재 — 운영사 점검 본문 ko 단일(제목/기본안내는 i18n). 글로벌 출시 전 컬럼+fallback |
| KI-095 | P3 | 점검 미들웨어 TTL 15s 캐시 best-effort(Edge 인스턴스별) — 토글 반영 ≤15s 지연. Realtime/edge-config 무효화 후속 |
| KI-096 | P3 | `maintenance_windows` RLS `using(true)`(기존 mig 27) anon 직접조회 시 `created_by` 노출. 미들웨어는 안전컬럼만 select. column-level grants/public_view |

**⚠️ P2 활성 5건(KI-054/061/079/092/094) = 트리거 임계 도달** — 사용자 승인 후 batch WI 처리 권장(전부 Phase 7 React 변환/세션·점검·운영사 감사 scheduled).

### staging 상태 (batch G)

- `nwcttwuvdnelfbpjeqzr`: 마이그레이션 변경 없음(`maintenance_windows` 는 mig 4 기존 + RLS mig 27 기존). **점검 실증용 임시 active 창은 검증 후 삭제 — 현재 maintenance_windows 0행**(login/legal E2E 회귀 보존).
- 점검 활성 실증: anon `/ko/me`·`/ko` → 503 + `Retry-After`(scheduled_end 계산), `/ko/maintenance`·`/ko/login` 예외 200(활성 본문/로그인), 창 제거 후 `/ko/me` → 307 로그인 복귀.
- staging 에 **operator_super 계정 부재** → operator_super 라이브 우회는 unit(getUserRole/bypass)으로 검증(anon/employee 차단은 실증).

### 검증 (batch G)

- turbo typecheck/lint/build **20/20** + apps/web vitest **14**(computeRetryAfterSeconds/isMaintenanceExempt exact/getActiveMaintenance 매퍼·TTL/getUserRole) + Playwright E2E **19/19**(error-maintenance 5 신규 + login 9 + legal 5 회귀) + staging 점검 활성/복귀 실증.

### 다음 세션 첫 작업 — WI-020 인증보조 (ST-002~004)

- **ST-002 비번찾기(CM-02)**: 토큰 60분 + 미등록 이메일 동일응답(계정노출 방지) + 재설정 후 활성세션 무효화. `POST /auth/forgot-password` + `/reset-password`. **신규 top-level 경로(`/forgot-password`·`/reset-password`)는 점검 면제 목록(`isMaintenanceExempt`)에 명시 등록 필요** — 현재 exact match `/login`·`/maintenance`만.
- **ST-003 활성화(CM-03)**: 7일 토큰 1회용 + 약관 동의 흐름(ST-078 `recordConsent(source='activate')` 재사용) + 2FA. `users.role==='operator_*'` 시 "건너뛰기(직원)" 숨김(KI-045).
- **ST-004 2FA(CM-04)**: custom TOTP=speakeasy(미설치) + challengeToken + 복구코드 8. `users.totp_*` 컬럼 존재.
- 인접 KI: KI-080(/forbidden CM-05) / KI-079(rememberMe 세션 TTL).

## -0. 2026-05-29 batch F 세션 진척 — **신규 세션 여기부터**

### 완료 — WI-020-2-feat ST-078 약관/동의 (CM-21, PIPA 컴플라이언스)

codex 협의(Sentry 추상화훅 A / 분할 B = ST-078 먼저 / 게시 API+seed A) 채택. ST-072 오류·점검은 **WI-020-3 으로 분리**. PR #38 머지(`84a1853`). 듀얼검증 **PASS_BOTH**.

| 영역 | 산출물 |
|------|--------|
| DB (mig 34) | `legal_documents_ensure_single_active` + `user_consents_block_modify` 트리거(rls.md §6-1 SSOT, search_path 고정 + RPC revoke) + 게시 RLS `is_operator()`→**`is_operator_super()`** 교체(R1, AC-4). staging 적용 + 트리거 2종 실증(단일active 전환 / 불변 차단) |
| seed | `supabase/seed.sql` — terms/privacy × ko/en **active 1쌍**(placeholder 본문, 운영사 게시로 교체) + staging 주입 |
| schemas | `consentInput`/`legalDocumentPublish`(**ko·en 페어 스키마 강제**)/`requiredConsent` zod DTO(camelCase API 계약) + openapi **48 components** + 단위테스트(31) |
| server lib | `apps/web/lib/legal/{queries,actions,guard}` — 조회(요청언어 우선 ko fallback) / 필수동의 판정 / `recordConsent`(ip·ua·source 서버결정 + **agree 서버검증** + 멱등 upsert) / `publishLegalDocuments`(operator_super **세션 client** — RLS 실효 + ko/en 트랜잭션) |
| CM-21 | `(legal)/legal/[type]` 페이지(react-markdown 5상태, en 참고번역 banner) + 강제동의 폼 + **가드(로그인 직후 redirect AC-2 + 보호 레이아웃 employee/operator/tenant 3종 R4, 미들웨어 미사용)** |
| i18n / 정합 | `legal.*` ko/en + `safeInternalPath` 공용 추출(login actions 정합) + schemas.md DTO 노트 |

### 듀얼검증 (codex 실결함 검출 — 게이트 모범 사례)

| 라운드 | evaluator | codex | 정정 |
|------|------|------|------|
| 1차 | PASS 8.45 | **BLOCKED_FOR_HOTFIX** P1×1+P2×2 | — |
| hotfix (`f1ac057`) | (유지) | **PASS_VERIFIED** | P1 agree 서버검증 / P2 게시 service_role→세션client(RLS 실효) / P2 IP `node:net isIP` / P3 dead i18n key·`drop policy if exists` |
| → **PASS_BOTH** | | | `.flowset/eval-results/WI-020-2-feat.pass` |

### 신규 KI (batch F)

| KI | 등급 | 내용 |
|----|----|----|
| KI-091 | P3 | 강제동의 "동의-클릭→복귀" + operator 게시 트랜잭션 자동 E2E 미검증 — user_consents 불변 트리거로 멱등 cleanup 불가(시드 setup/teardown 필요). 비로그인 조회 E2E 5/5 + 가드/트리거/recordConsent staging DB 실증으로 핵심 커버. KI-089 동반 |
| KI-092 | P2 | ST-078 **AC-5 운영사 감사 화면**(동의 통계/이력, `GET /operator/legal/consents`) 미구현 — RLS plumbing 존재. OP-09 audit(EP-05) 별도 sprint deferral |

### staging 상태 (batch F)

- `nwcttwuvdnelfbpjeqzr`: 마이그레이션 **34 적용**(legal 트리거 2 + 게시 super 게이트). seed 약관 **4행**(terms/privacy × ko/en v1.0.0 active). **test-employee 동의 시드 2행**(terms-ko/privacy-ko, source=activate — 기존 login E2E 회귀 보존용).
- ⚠️ test-employee 미동의면 로그인 후 `/legal/terms?must_accept` redirect(강제동의 가드 정상 동작). E2E 회귀 위해 동의 시드 유지.

### 검증 (batch F)

- typecheck/lint/test/build **19/19** + 비로그인 약관 조회 E2E **5/5**(ko/en banner/privacy/404/언어전환) + 기존 login E2E **9 회귀 무손상** + 강제동의 트리거/recordConsent/required 판정 **staging DB 실증**.

### 다음 세션 첫 작업 후보

1. **WI-020-3-feat ST-072 오류/점검 (codex 협의 A안)**: CM-06 404/500/503 + 점검모드(`maintenance_windows` status=active 미들웨어 — 비-operator 503 / operator_super 우회) + **Sentry 추상화훅**(`captureServerError()` + DSN env 미설정 시 no-op, @sentry/nextjs 미설치 — 실제 연동/계정은 S6). `not-found.tsx`/`error.tsx` 신규. CM-05 forbidden(KI-080) 인접.
2. **WI-020 인증보조 (ST-002~004)**: 비번찾기/활성화(약관 동의 흐름 — ST-078 `recordConsent(source='activate')` 재사용)/2FA(custom TOTP=speakeasy+challengeToken+복구코드8, speakeasy 미설치).

## -0e. 2026-05-29 batch E 세션 진척

### 완료 — WI-021 사이클 (CI 토대 + OpenAPI 파이프라인 + 39 entity zod schema)

codex 우선순위 협의(WI-021 → WI-020 약관/오류 → WI-020 인증보조)로 진행. WI-021 계열 3건 머지(PR #34/#35/#36):

| WI | PR | 내용 | 듀얼검증 |
|----|----|----|------|
| WI-021-feat | #34 | `phase7-code.yml` CI 4 job(lint/typecheck/unit-test/build, `apps`·`packages` path-scope) + zod-to-openapi 파이프라인(`packages/schemas/scripts/build-openapi.ts`→`dist/openapi.yaml`) + OpenAPI diff 게이트 + 로그인 E2E job(KI-082, secrets 조건부) + PR template 코드 게이트 + turbo typecheck→build 선행 | PASS_BOTH (evaluator 8.40 / codex 5건 정정) |
| WI-021-2-ci | #35 | required 게이트 함정 해소 — `phase7-code.yml` **changes-gate 패턴**(on.paths 제거 → changes job + 각 job `if: code` → 비코드 PR skip=required 통과) + phase7 4 job **branch protection 필수체크 등록**(contexts 6→10) | (CI 보정, dual-gate skip) |
| WI-021-1-feat | #36 | ERD **39 entity zod schema** (`packages/schemas/src/entities/` 8파일, DB **snake_case 1:1**, database.ts Row 정합) + `openapi.yaml` **45 components** + `entities.test.ts` 23 + api/schemas.md SSOT 정합 노트 | PASS_BOTH (evaluator 8.75 / codex 4라운드 PASS) |

### 핵심 결정/정합 (batch E)

- **casing SSOT**: entity zod = **DB snake_case 1:1**(database.ts Row). API DTO camelCase는 Phase 4 초안 → `api/schemas.md`에 정합 노트. **실 SSOT = `packages/schemas/src/entities/*` + `dist/openapi.yaml`** (codex 협의, supabase 직결 + 변환 레이어 미사용)
- **DB text 컬럼 주의**: `employees.role`/`users.role`/`user_consents.document_type`/`audit_logs.request_id` 는 DB text → `z.string()`(enum/uuid 강제 금지). `user_consents.ip_address` 는 nullable inet → `z.string().nullable()`. **`operator_users.role` 만 실 DB enum**(operatorRoleEnum). 6역할 `appRoleEnum`은 입력/권한 검증용(entity 미적용)
- **날짜**: staging `information_schema` 실측 — `_date`/`joined_at`/`left_at`/`birth_date`/`contract_*`/`issued_at`(invoices)/`paid_at`/`period_*` 등은 `z.string().date()`, `_at`(timestamptz)은 `isoTimestampSchema`, time/inet은 `z.string()`. **`certificate_requests.issued_at` 는 timestamptz**(invoices.issued_at=date와 구분)
- **phase7-code.yml**: changes-gate(모든 PR 트리거). 필수체크 10개 = commit-msg/encoding/html-syntax/ds-ssot/version/dual-gate + Lint/Type Check/Unit Test/Build
- **OpenAPI 파이프라인**: zod→`dist/openapi.yaml`(gitignore 예외 추적, build job `git ls-files`+diff 게이트). endpoint req/res schema는 Sprint 2~6 점진

### 신규 KI (batch E)

| KI | 등급 | 내용 |
|----|----|----|
| KI-082 | P3 | 로그인 E2E CI 자동화 — 인프라 구축 완료, **repo secrets 5종 주입 시 자동 활성** |
| KI-088 | P3 | CI typecheck/build 중복(turbo cache key sha 고정) |
| KI-089 | P3 | e2e job staging 시드 setup/teardown 부재 |
| KI-090 | P3 | entity 테스트 39중 11 직접 + work_policies time/user_consents inet refine 부재 |

### 미해결/주의 (다음 세션 인지)

- **KI-082 secrets (사용자 외부 설정)**: GitHub repo secrets에 `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` 주입 시 로그인 E2E 자동 회귀 활성(시드 `test-employee@flowhr.test`)
- **Vercel preview fail**: 기존(WI-019부터) — `Output Directory "public"` 설정 누락(monorepo). **비필수체크**(branch protection 10개에 미포함). Vercel project root/output 설정은 별도 인프라 작업
- **Node 20 deprecation**: CI actions(checkout@v4/setup-node@v4/cache@v4/pnpm-action-setup@v4) **2026-06-02부터 Node 24 강제** — actions 버전 점검 chore 필요
- **prd-state.json**: 코드 WI PR에 상태 갱신 포함(main 직접 push 금지)

### 다음 세션 첫 작업 후보 (codex 재협의 순서)

1. **WI-020 약관/오류 (2순위)**: ST-078 약관·동의(CM-21 PIPA + ko/en 페어 + 강제동의 가드 + 운영사 게시, 8SP P0) + ST-072 오류·점검(CM-06 404/500/503 + Sentry). RLS/audit/legal_documents 의존 충족. **ST-078이 ST-003 활성화 약관 흐름 선행**(codex 근거). legal_documents/user_consents zod schema 이미 WI-021-1에 존재
2. **WI-020 인증보조 (3순위)**: ST-002 비번찾기(CM-02 토큰60분+미등록 동일응답) + ST-003 활성화(CM-03 7일토큰+1회+약관+2FA) + ST-004 2FA(CM-04 **custom TOTP=speakeasy+challengeToken+복구코드8**, speakeasy 미설치→설치 필요). users 테이블에 totp_enabled/totp_secret_encrypted/recovery_codes_hash 이미 존재

## -0d. 2026-05-29 batch D 세션 진척

### 완료 — WI-019 Day8~10 (RLS + audit + Realtime + composite FK)

`feature/WI-019-feat-rls-audit-realtime` → PR #32 머지(`07d18d5`). 듀얼검증 PASS_BOTH(evaluator 8.62 + codex 3차 PASS).

| 영역 | 산출물 |
|------|--------|
| ST-005 RLS | 마이그레이션 `27` — 39테이블 ENABLE RLS + 94정책(패턴 A/B/C/D) + 헬퍼 6종 **SECURITY DEFINER public.users 조회 기반**(JWT 클레임 부재 + hosted hook MCP 불가 → codex 협의, KI-084로 표준화 후속) + my_team_employee_ids + 운영사 우회 + 컴플라이언스 불변성 |
| KI-077 composite FK | 마이그레이션 `28`+`32` — employees/leave_types/approvals 부모 UNIQUE(tenant_id,id) + 자식 **19 FK**(28: 15건 employees 12/leave_types 2/approval_steps 1, 32: 폴리모픽 approval_id 4)를 (tenant_id,ref)→(tenant_id,id) 전환. **KI-077 resolved** |
| ST-068 audit | 마이그레이션 `29` — 범용 `audit_row_change()` SECURITY DEFINER + 21테이블 AFTER INSERT/UPDATE/DELETE + APPROVE 특례 + `prune_audit_logs()` 5년 보관(pg_cron 조건부). KI-026: 폴리모픽 자식 3개 제외. 월 파티셔닝 KI-085 유보 |
| ST-069 Realtime | 마이그레이션 `30` — supabase_realtime publication(notifications/approvals/approval_steps) + REPLICA IDENTITY FULL. 클라이언트 `packages/api-client/src/realtime.ts` (`useRealtimeSubscription` + 비종속 매니저, 자동 재연결 백오프 + 오프라인 fallback, `@flowhr/api-client/react` 서브패스) |
| 하드닝 | 마이그레이션 `31` — 술어헬퍼 search_path 고정 + audit_row_change/prune_audit_logs/record_login_failure RPC 노출 차단 |
| 인가 정정(codex 듀얼검증) | 마이그레이션 `32`/`33` — INSERT tenant 오귀속 차단(tickets/ticket_messages/user_consents) + 직원·admin status 자기승인 차단(leaves/attmod approved·rejected→service_role 매개) + approvals/approval_steps 라우팅 컬럼 불변 트리거 + requester self-routing 차단 + SET NULL composite FK 9건 `set null (<col>)` 컬럼지정(PG17, tenant_id NOT NULL 보존) |
| 검증 | RLS 매트릭스 **T1~T13** staging 실증 PASS(`supabase/tests/rls_matrix_check.sql`) + 로그인 무손상 + typecheck 7/7 + lint 8/8 + test 13 + build(/ko·/en) + security advisor 잔여 수용 |

### 듀얼검증 경과 (codex가 실제 결함 2라운드 검출 — 게이트 모범 사례)

| 라운드 | evaluator | codex | 정정 |
|------|------|------|------|
| 1차 | PASS 8.80 | FAIL P1 4 | mig32 (INSERT tenant 가드 + 자기승인 차단 + approval_id composite) |
| 2차 | PASS 8.80 | FAIL P1 2+P2 1 | mig33 (SET NULL 9건 컬럼지정[부모삭제 깨짐] + self-routing/admin self-approve 차단) |
| 3차 | PASS 8.62 | **PASS** | → **PASS_BOTH** |

### 신규 KI (batch D)

| KI | 등급 | 내용 |
|----|----|----|
| KI-084 | P3 | RLS 헬퍼 Custom Access Token Hook 표준화 (현 SECURITY DEFINER public.users 조회 → JWT 클레임. dashboard 활성화 필요) |
| KI-085 | P3 | audit_logs 월 파티셔닝 (현 비파티션 + 트리거/보관함수 제공. 스케일 시 전환) |
| KI-086 | P3 | Auth leaked-password protection dashboard 활성 |
| KI-087 | P3 | 결재 워크플로 SoD/상태전이 정식 가드 + leaves 미러 service_role RPC (Sprint 6 결재 처리 WI) |

### 인프라/환경 상태 (batch D)

- staging `nwcttwuvdnelfbpjeqzr`: **39테이블 RLS 활성 + 94정책** (마이그레이션 27) + composite FK(28/32/33) + audit 트리거 21(29) + Realtime publication 3(30) + 하드닝/인가정정(31/32/33). 마이그레이션 원격 적용 완료(1~20, 25~33).
- **RLS 헬퍼 클레임 소스**: `auth.uid()` → `public.users` 조회(SECURITY DEFINER, search_path 고정). JWT 커스텀 클레임 미사용 — KI-084로 표준화 예정. rls.md §1/§4에 구현 정합 노트 반영.
- **승인/반려 전이**: leaves/attendance_modifications의 status=approved/rejected는 PostgREST 직접 UPDATE 차단 → service_role 결재 RPC 매개(정식 RPC는 Sprint 6 KI-087). approval_steps INSERT는 관리자/service_role 전용.
- 테스트 유저 시드(`test-employee@flowhr.test`) + audit_logs 기존 row 유지. RLS 매트릭스 테스트는 BEGIN..ROLLBACK으로 비영속.

### 다음 세션 첫 작업 후보

1. **WI-020 잔여**: ST-002 비번찾기(CM-02) + ST-003 활성화(CM-03) + ST-004 2FA(CM-04, **custom TOTP=speakeasy+challengeToken+복구코드8 결정됨**) + ST-078 약관(CM-21) + ST-072 오류(CM-06). ST-072/078은 RLS+audit 의존(이제 충족).
2. **WI-021**: zod-to-openapi + `phase7-code.yml` CI 4 job (build→typecheck 순서 주의 — `.next/types` include). KI-082 로그인 E2E CI 자동화 포함.

---

## -0b. 2026-05-29 batch C 세션 진척 (WI-020 ST-001 로그인)

### 완료 — WI-020 ST-001 로그인 핵심 (Sprint 1 Day 6~7)

`feature/WI-020-feat-login-core` (커밋 fcf6542 base UI 5종 + d6582ca 로그인 핵심 + c40454f 듀얼검증 정정), auto-merge PR.

| 영역 | 산출물 |
|------|--------|
| 인증 | `@supabase/ssr` 서버/서비스롤 클라이언트(`packages/api-client/src/{server,service-role}.ts`, `/server` 서브패스 server-only) + 미들웨어 세션갱신·인증가드(`apps/web/middleware.ts` + `lib/supabase/middleware.ts`) |
| CM-01 | `app/[locale]/(auth)/login/{page,login-form,actions}.tsx` + `(auth)/layout.tsx` — 서버액션 + useActionState, ko/en i18n, 비밀번호 토글, return_url 소비(오픈리다이렉트 방지) |
| 5회 잠금 | `supabase/migrations/26_login_attempts.sql` (login_attempts RLS+정책0 + `record_login_failure` RPC SECURITY DEFINER, service_role 단독 grant, (email,ip) 5회→5분, 15분 윈도우) |
| 역할 리다이렉트 | `roleToRedirectPath`/`canAccessPath`(api-client) + 최소 랜딩 placeholder 3종 `(operator)/(tenant)/(employee)` (후속 OP-01/TA-01/EM-01 대체) |
| audit | `auth.login`/`login_failed`/`locked` (service_role, best-effort) |
| 검증 | typecheck 7/7 + lint 8/8 + 단위 12 + next build + **Playwright E2E 9/9 (실 로그인→/ko/me, 5회 잠금, return_url 보안, audit staging 실증)** |

### 듀얼검증 (PASS_WITH_KI)

- evaluator PASS 8.38/10 (4축 ≥7.5) / codex CONDITIONAL → **정정 2건**(service_role server-only 경계 + return_url 소비) + **KI 6건 등록** → `.flowset/eval-results/WI-020-feat.{eval,codex,pass}.md`.
- **사용자 승인 deferral (2026-05-29)**: codex P1(분산 무차별대입 하드닝)을 KI-078로 등록 후 머지 (CAPTCHA+per-IP 429+TOCTOU는 명세가 후속으로 미뤄둔 항목).

### 신규 KI (batch C)

| KI | 등급 | 내용 |
|----|----|----|
| KI-078 | P1 | 분산/멀티-IP 무차별대입 하드닝 (CAPTCHA + per-IP 429 rate-limit + TOCTOU 사전예약) — 인증 하드닝 WI |
| KI-079 | P2 | rememberMe 세션 TTL(30d/12h) 미반영 — 세션관리 ST-005 |
| KI-080 | P3 | 역할불일치 /forbidden(CM-05) 미적용 + /me 폴백 |
| KI-081 | P3 | 잠금 윈도우 경계 문서화/단위 |
| KI-082 | P3 | 핵심 로그인 E2E CI 자동화 (WI-021 phase7-code.yml) |
| KI-083 | P3 | audit best-effort 실패 알림 보강 |

### 인프라/환경 상태 (batch C)

- staging `nwcttwuvdnelfbpjeqzr`: public **40 테이블** (39 + login_attempts) + `record_login_failure` 함수. RLS는 login_attempts만 활성(정책0/service_role 전용) — **나머지 39 테이블 RLS 미적용, Day8 ST-005 예정**.
- **테스트 사용자 시드** (staging): `test-employee@flowhr.test` / `Test1234!@` (role=employee). E2E 재현용 — 유지. (auth.users 직접 INSERT + 토큰컬럼 '' 보정, public.users role 매핑)
- **`SUPABASE_SERVICE_ROLE_KEY`**: 로컬 `apps/web/.env.local`에만 입력됨(gitignore). **Vercel staging/preview엔 미배포** — staging 배포 시 주입 필요. preview는 mock(미연동) 전략 유지.
- E2E 실행: `cd apps/web && E2E_TEST_EMAIL=test-employee@flowhr.test E2E_TEST_PASSWORD='Test1234!@' pnpm exec playwright test` (DASHBOARD env는 MSYS 경로변환 주의 — 미설정 시 기본 /me).

### 다음 세션 첫 작업 후보

1. **WI-020 잔여**: ST-002 비번찾기(CM-02) + ST-003 활성화(CM-03) + ST-004 2FA(CM-04) + ST-078 약관(CM-21) + ST-072 오류(CM-06). 2FA는 Supabase MFA(AAL) 또는 auth.md custom 플로우 결정 필요.
2. **WI-019 Day8~10**: ST-005 RLS 정책 SQL(39테이블, KI-077 composite FK 결정) + ST-068 audit 트리거(21테이블) + ST-069 Realtime publication.
3. **WI-021**: zod-to-openapi + `phase7-code.yml` CI 4 job (KI-082 E2E 자동화 포함).

---

## -1. 2026-05-28 batch B 세션 진척 — **신규 세션 여기부터**

### 완료 (PR #26~28, main `5e7d451` 기준 — `git log`로 최신 확인)

| PR | WI | 내용 |
|----|----|----|
| #26 | WI-019-feat | apps/web 스캐폴드(Next 15.5 + Tailwind v4 + next-intl `[locale]` ko/en) + packages 7개 + supabase init + ERD 39엔티티 스키마 마이그레이션 1~20 원격 staging 적용 + `packages/types/database.ts` 생성 (Day 3~5) |
| #27 | WI-DualGate-chore | **듀얼검증 머지 게이트 구축** — CI `dual-verification-gate`(branch protection 필수체크) + `project.md §1-1` 신설 + KI-077 등록 |
| #28 | WI-019-1-fix | WI-019 듀얼검증 정정 — approval_id UNIQUE 4테이블 + users.employee_id UNIQUE (마이그레이션 25) + packages 7개 lint 커버리지 |

### 이번 세션 핵심 — 듀얼검증 게이트 (절대 스킵 금지)

- **코드 WI(`apps`/`packages`/`supabase`)는 머지 전 evaluator + codex 한 세트 PASS_BOTH + `.flowset/eval-results/<WI>.pass` 마커 필수.** CI `dual-verification-gate`(pr-checks.yml, branch protection 필수체크)가 마커 부재/stale 시 **기계적으로 머지 차단**. PR #28에서 실전 통과 입증.
- WI-019 듀얼검증: evaluator PASS 8.35 / codex CONDITIONAL → 정정(PR #28, evaluator 8.85 / codex 결함0 → PASS_BOTH).
- **교훈(사용자 지적)**: 듀얼검증은 "Sprint 종료 시"가 아니라 **WI별 머지 전** 의무. 메모가 아닌 CI 게이트로 강제함. **핸드오프 갱신도 검증 대상**.

### 인프라/스키마 상태

- 원격 staging `nwcttwuvdnelfbpjeqzr`: public **39 테이블** + UNIQUE 보강 (마이그레이션 1~20 + 25) 적용됨. **RLS 전 테이블 미적용 — Day 8 ST-005 예정 (staging 비어있는 비프로덕션)**.
- **Docker 미설치** → 마이그레이션/타입은 **supabase MCP(원격)** 경로. `supabase db reset --local` 불가. (`project_supabase-local-workflow` 메모)
- `apps/web/.env.example`만 커밋(키 없음). 로컬 `.env.local` 미생성.
- 디렉토리 구조 SSOT = `mvp-plan.md §1` (현 코드 정합). WI-020 로그인은 `app/[locale]/(auth)/login/`.

### 다음 세션 첫 작업 — WI-020-feat 로그인 핵심 (Sprint 1 Day 6~7)

- `feature/WI-020-feat-login-core` 브랜치(base UI 컴포넌트 5종 Button/Input/Label/Card/Alert 커밋 보존, 미머지) → **최신 main rebase 후** 진행.
- ST-001: Supabase Auth(@supabase/ssr) 로그인 + CM-01 페이지 + 5회 실패 잠금 + 역할별 리다이렉트 + audit. (Task #5/#6)
- ⚠️ **5회 잠금**: 현 `users` 스키마에 `failed_login_count`/`locked_until` 없음 → `api/auth.md` 설계 확인 후 마이그레이션 필요 가능성.
- 머지 시 **듀얼검증 게이트 통과 필수** (`<WI>.pass` 마커가 마지막 코드 커밋의 후손이어야 함).

### KI 현황 (2026-05-28 batch B)

| 등급 | 활성 | 비고 |
|------|----|----|
| P0 | 0 | — |
| P1 | 1 | **KI-077** (WI-019 교차테넌트 FK, Day8 ST-005 일괄 결정 — 사용자 defer) |
| P2 | 2 | KI-054/061 (Phase 7 React 변환 scheduled) |
| P3 | 22 | Phase 7~10 scheduled |

### 환경 (실측)

**실측 설치 버전** (package.json은 semver 범위, 예: turbo `^2.3.0` / typescript `^5.7.0` / next-intl `^3.26.3` / tailwindcss `^4` / node `>=20.0.0`): pnpm 9.15.0 / turbo 2.9.14 / typescript 5.9.3 / next 15.5.18 / react 19.1.0 / next-intl 3.26.5 / supabase CLI 2.101.0 / tailwind 4.3.0 / node 24.12.0 / supabase MCP 인증됨. (세션 시작 시 재측정 권장)

---

## -2. 2026-05-28 batch A 세션 진척 (모노레포 + 인프라 연동) — 완료

### 완료 (PR #20~24, main `baba6da` 기준 — `git log`로 최신 확인)

| PR | WI | 내용 |
|----|----|----|
| #20 | WI-018-feat | 모노레포 루트 셋업 (pnpm@9.15.0 workspaces + Turborepo 2.9.14 + tsconfig.base + devDeps 5종) |
| #21 | WI-InfraPolicy-docs | **유료 가정 정정** — Phase 1~6 무단 산입 유료 기능(Supabase Pro/Vercel Pro/Sentry/NHN/Tauri 인증서) → Free 시작 + Pro 전환 5트리거. `guardrails.md §9(산입 금지 원칙)/§10(인프라 정책 SSOT)` 신설 |
| #22 | WI-KI-batch-007-docs | 문서 정합 9건 (KI-032/033/040/042/056/062/074/075 resolved + KI-016 NHN DEFER) |
| #23 | WI-KI-batch-008-wf | 와이어프레임 정정 5건 (권한매트릭스 15화면 역할\|권한 2열 + TA-13/CM-04/CM-21) + Phase 7 재분류 8건. **wf-v1.0.1** tag |
| #24 | WI-env-chore | **Supabase ↔ Vercel 연동** + supabase MCP/skills 셋업 |

### 인프라 연동 완료 (SSOT: `guardrails.md §10` + `prd-state.json infra_connection`)

- **Supabase** `nwcttwuvdnelfbpjeqzr` (Free) ↔ **Vercel** `flowhr-sop` (yh-devs-projects/kryou2922, 나중 flowcoder25 이전)
- production env: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`(legacy JWT). **service_role은 WI-020 시점**.
- **프로젝트 supabase MCP** (`.mcp.json`, project_ref 직결, OAuth 인증 완료) — 마이그레이션/스키마 직접 조작 가능
- **supabase agent skills** 설치 (`.agents/skills/{supabase,supabase-postgres-best-practices}`) — Phase 7 DB 작업 시 모범사례
- 운영 전략 (codex 역제안): preview = Supabase 미연동 mock / PR 검증 = CI ephemeral `supabase start` / staging = Free 1개
- ⚠️ **기존 yh-devs/flowhr(별개 payroll 프로젝트)는 무관 — 건드리지 말 것**

### 핵심 정책 (이번 세션 확립)

- **외부 비용/유료 기능은 사용자 명시 승인 전 산출물 의무화 금지** (`guardrails.md §9`). 협업: 사용자=기획/결정, AI=개발/유지보수.
- **Pro 전환 5트리거**: 3사 입점 / DB 400MB / Storage 800MB / Connection 60 위험 / SLA·컴플라이언스 요구.

### (batch A 당시) 다음 작업이었던 WI-019 — ✅ **완료** (PR #26 Day3~5 + PR #28 정정, batch B에서 처리). Day 8~10(RLS/audit/Realtime)은 WI-020 후 잔여.

`sprint-001.md` Day 3~5 (WI 매핑 주석 참조 — WI-018 모노레포 / **WI-019 인프라(apps/web 스캐폴드 + supabase init + RLS + audit + Realtime)** / WI-020 인증+약관 / WI-021 zod-openapi+CI):
1. `pnpm dlx create-next-app apps/web` (Next.js 15 + Tailwind + App Router + `[locale]` i18n)
2. `packages/{ui,schemas,types,api-client,i18n,platform,config}` 7개 스캐폴드
3. `supabase init` (루트) + Phase 3 마이그레이션 변환 + `packages/types/database.ts` 생성 (supabase MCP 활용)
4. `.env.local` 동기화 (`vercel env pull --environment=production` 또는 로컬 supabase)

### KI 현황 (2026-05-28)

| 등급 | 활성 | 비고 |
|------|----|----|
| P0/P1 | 0 | — |
| P2 | 2 | KI-054/061 (Phase 7 React 변환 scheduled) |
| P3 | 22 | 전부 Phase 7~10 코드/단계 의존 scheduled — 지금 docs/wf batch로 처리 가능한 KI는 소진 |

### 환경 (실측)

pnpm 9.15.0 (corepack) / turbo 2.9.14 / typescript 5.9.3 / vitest 2.1.9 / @playwright/test 1.60.0 / node 24.12.0 / Vercel CLI 50.1.6 (kryou2922-4113 로그인) / supabase MCP 인증됨

> ⚠️ **§0 이하는 2026-05-19 Phase 6 종료 시점 스냅샷** — 브랜치/카운트/PR/테이블 수 등은 그 시점 기준이며, **현재 상태는 위 §-1(batch B)이 최신·정확**. 신규 세션은 §-1만 따르면 충분(§0 이하는 이력 참고).

## 0. Phase 6 종료 사이클 (2026-05-19)

신규 세션 진입 후 사용자 명령 "핸드오프 읽고 작업 진행해"로 시작:

1. **Phase 2 재평가 (KI-013/034 closure, PR #16)** — Phase 6 진입 전 의무 2건 처리
   - KI-013: EP-03/04/05/09/10/11/12 7 Epic + ST-073~080 + ST-071 Task 137건 신규 분해 → 80 Story / 223 Task / 838 MD
   - KI-034: 5 파일 합계/의존/카운트 stale 정합화
   - 평가 4 사이클: 1차 FAIL 6.90 → 2차 FAIL 7.625 → 3차 FAIL 7.625 → **4차 PASS 8.475 (evaluator) + 8.34 (codex gpt-5.5)**
   - PASS_BOTH 통합 판정 → main 머지 (commit `d6aaa95`)

2. **사용자 지적**: "디렉토리 구조 명확히 잡고 가" → codex 협의 7건 결정 채택

3. **Phase 6 mvp-plan + sprint-001~010 (PR #17)** — 11 파일 신규 작성
   - 디렉토리 구조 SSOT (codex 7건 결정): `apps/{web,desktop}` + `packages/{ui,schemas,types,api-client,i18n,platform,config}` + 루트 `supabase/`
   - KI-071 묶음 closure (15곳: epics SP 7곳 + estimation 4곳 + stories L646 + prd-state.json:61 i18n + api/README.md:3 entity + .claude/rules/project.md:57 CI 카운트)
   - 평가 사이클: evaluator 1차 PASS 8.40 → 2차 PASS 9.00 / codex 1차 FAIL 7.4 → 2차 CONDITIONAL 7.88 → 3차 CONDITIONAL 7.81 → 4차 CONDITIONAL 8.21 (mechanical fix 22건 누적 closure + false alarm 2건)
   - PASS_WITH_KI 통합 판정 → main 머지 (commit `8ac2d6c`)

**교훈 (CLAUDE.md 규칙 강화 의무)**:
- review-system.md §7-1 evaluator + codex 한 세트 의무 (Phase 6 1차 codex 호출 누락 사용자 지적 후 정정)
- codex 호출 표준 절차: `Agent subagent_type=codex:codex-rescue` + 모델 unset (gpt-5.5 기본) + `--read-only` for 검증
- codex 검토 범위 한계 인지 (4차 P1 잔존이 사실 false alarm — L282 산식 누락 검출). 산수 정밀도 결함은 mechanical fix이지만 closure 검증 시 라인 범위 명시
- 사용자가 옵션 결정 떠넘기지 말고 codex와 follow-up으로 단일 최적안 도출 후 보고

## 1. 상태 요약 (2026-05-19 Phase 6 종료 스냅샷 — 현재는 §-1)

### Phase 5/6 완전 종료 + Phase 7 진입 대기

| Phase | 산출물 | 평가 | 머지 | 상태 |
|-------|------|------|------|------|
| 0 셋업 | `.flowset/` 구조 + CLAUDE.md | (생략) | — | ✅ |
| 1 PRD | `.flowset/prd/` 50 파일 | PASS 8.15 → 재평가 9.13 | — | ✅ |
| 2 백로그 | `.flowset/backlog/` 6 파일 (80 Story / 415 SP / 223 Task / 838 MD) | PASS 8.29 → 재평가 8.03 → 4차 재평가 PASS_BOTH 8.475/8.34 | PR #16 | ✅ |
| 3 ERD | `.flowset/db/` 23 파일 (39 entity + 39 테이블 + RLS) | PASS 8.68 → 재평가 8.21 | — | ✅ |
| 4 API | `.flowset/api/` (280 endpoint, Markdown) | PASS 8.78 → 재평가 8.40 | — | ✅ |
| 5 와이어프레임 | 45 화면 HTML + DS SSOT (wf-v1.0.0) | PASS 8.13 / codex 4 그룹 가중 8.73 | wf-v1.0.0 | ✅ |
| 6 스프린트 계획 | `mvp-plan.md` + `sprint-001~010.md` 11 파일 | **PASS_WITH_KI 9.00/8.21** | PR #17 | ✅ |
| **7 개발 착수** | `apps/` + `packages/` + `supabase/` 코드 (sprint-001~010 점진) | — | — | ⏳ **신규 세션** |
| 8 QA | (Phase 7 후 진입) | — | — | ⏳ |
| 9 베타 | (Phase 8 후 진입) | — | — | ⏳ |
| 10 운영 | (Phase 9 후 진입) | — | — | ⏳ |

**브랜치 (2026-05-19 시점)**: `main` (Phase 6 종료 commit `8ac2d6c`). **현재 main HEAD는 §-1 참조(`5e7d451`)** — `git log -1 --format=%h main`으로 최신 확인.

**전체 MVP 합계 (보강 후)**: 80 Story / 415 SP / 223 Task / 218 MD 순수 / 838 MD 보수 / 10 Sprint × 2주 = **19~20주 (약 4.6개월)** — mvp-plan §4-1 정밀 계산 (415 SP × 0.5 / 20 MD/sprint = 약 10.4 sprint, 9.5~10 sprint 흡수)

## 2. 모노레포 디렉토리 구조 SSOT (codex 7건 결정 채택, 2026-05-19)

> **SSOT 위치**: `.flowset/sprints/mvp-plan.md §1`. 본 절은 짧은 요약만.

```
FlowHR_SOP/
├── apps/
│   ├── web/                  # Next.js 15 App Router + PWA (manifest.json + sw.js)
│   │   └── app/[locale]/{(auth),(operator),(tenant),(employee)}/  # 44 화면 라우트
│   └── desktop/              # Tauri 2.x (src-tauri/)
├── packages/
│   ├── ui/                   # shadcn + Phase 5 DS 40+ React 변환
│   ├── schemas/              # zod schemas (zod-to-openapi 변환 대상)
│   ├── types/                # DB/domain TypeScript types
│   ├── api-client/           # Supabase wrapper + TanStack Query hooks
│   ├── i18n/                 # next-intl ko + en MVP
│   ├── platform/             # web/pwa/tauri 분기 + iOS 제약
│   └── config/               # ESLint/TS/Tailwind 공유
├── supabase/                 # 루트 (CLI 기본 + 03-tech-architecture.md SSOT)
│   ├── migrations/           # Phase 3 ERD 변환 (24 파일 + RLS 정책 SQL)
│   ├── functions/            # Edge Functions (cron + 외부 콜백)
│   └── seed.sql
├── .github/workflows/
│   ├── pr-checks.yml         # 현행 9 job (3 공통 + 6 wireframe path-scope)
│   └── phase7-code.yml       # 신규 4 job (lint + typecheck + unit-test + build, Sprint 1 day 13~14 작성)
├── .flowset/                 # Phase 1~10 산출물 SSOT (변경 안 함)
├── docs/                     # 원본 명세
└── pnpm-workspace.yaml + turbo.json + tsconfig.base.json + package.json + CLAUDE.md
```

### codex 7건 결정 요약 (mvp-plan.md §1-1)

1. **supabase 위치**: 루트 `supabase/` (Supabase CLI 기본 + 03-tech SSOT)
2. **i18n MVP**: ko + en 동시 (WI-KI-batch-005 사용자 결정 2026-05-16)
3. **entity 카운트**: 39 entity / 44 screen (matrix.json SSOT)
4. **OpenAPI 변환**: `zod-to-openapi`, Sprint 1 day 13~14
5. **CI job**: 현행 9 + Phase 7 신규 4
6. **packages/platform 채택**: web/pwa/tauri 분기 + iOS 제약 중앙화
7. **packages/config 채택**: Turborepo 표준 공유 설정

## 3. (2026-05-19 작성) Phase 7 Sprint 1 부트스트랩 시퀀스 — 참고용. **실제 진입점은 §-1**

### 작업 1 — Sprint 1 Day 1~14 시퀀스 (`sprint-001.md` SSOT)

42 SP / 30 MD 보수. 9 Story 분해: ST-001 (5) + ST-002 (3) + ST-003 (3) + ST-004 (5) + ST-005 (5) + ST-068 (5) + ST-069 (5) + ST-072 (3) + ST-078 (8) = 42 SP (sprint-001.md L4 SSOT 정합).

| Day | 작업 | 산출물 | 의존 |
|-----|-----|------|------|
| 1~2 | 모노레포 셋업 | `pnpm-workspace.yaml` + `turbo.json` + `tsconfig.base.json` + 루트 devDeps | (없음) |
| 3~4 | apps/web + packages 7개 스캐폴드 | `apps/web/`, `packages/{ui,schemas,types,api-client,i18n,platform,config}/` | Day 1~2 |
| 5 | supabase 인프라 (RLS 정책 제외) | `supabase/migrations/` 12 파일 + `packages/types/src/database.ts` | Day 3~4 |
| 6~7 | ST-001 로그인 핵심 (Supabase Auth + CM-01) | `apps/web/app/[locale]/(auth)/login/page.tsx` + 5회 잠금 + 역할별 리다이렉트 | Day 5 |
| 8~10 | **4 그룹 병렬** — ST-002~004 (인증 보조) + ST-005 (RLS) + ST-068 (audit) + ST-069 (Realtime) | 4 마이그레이션 + 권한 매트릭스 테스트 + Realtime wrapper | Day 6~7 |
| 11~12 | ST-078 약관 (PIPA + ko/en 페어) + ST-072 오류/점검 | `legal_documents + user_consents` 마이그레이션 + CM-21/CM-06 페이지 | Day 8~10 |
| 13~14 | zod-to-openapi + `phase7-code.yml` CI 4 job | `packages/schemas/dist/openapi.yaml` + 신규 CI workflow | Day 11~12 |

### 작업 2 — Sprint 1 Day 1 의무 (외부 신청)

> **인프라 결정 SSOT**: `.flowset/guardrails.md §10` (사용자 2026-05-19 — Free 시작 + Pro 전환 5트리거 + NHN DEFER + Tauri 자체 인증서).

- **D+0 즉시 (무료)**:
  - **Supabase Free org + flowhr-staging project 생성** (Pro 전환은 5트리거 도달 시)
  - **Vercel 프로젝트 (무료)** — preview는 Supabase 미연동 mock UI, staging만 연동 (Pro 전환은 서비스 런칭 시)
- **DEFER**:
  - **NHN Cloud 알림톡** → 테넌트별 옵션 기능. 첫 옵션 활성 또는 고객 계약 조건 시 신청 (60일). 기본 알림은 인앱 + 이메일(Resend)
- **S6 직전 (무료)**:
  - Sentry Free Developer 계정 (S6 진입 전 활성)

### 작업 3 — Sprint 1 DoD 검증 (`sprint-001.md` L138~)

- [ ] `apps/web` 빌드 PASS (`pnpm turbo run build`)
- [ ] `packages/ui` base 16 컴포넌트 (Button/Input/Card/Alert/Stepper 등)
- [ ] `supabase/migrations/` 24+ 파일 + RLS 정책 SQL → `pnpm supabase db reset --local` PASS
- [ ] `packages/types/src/database.ts` 자동 생성 + git 커밋
- [ ] `packages/schemas/dist/openapi.yaml` 생성 + CI 검증
- [ ] 6 역할 × 44 화면 권한 매트릭스 자동 테스트 (TS-021-005-QA-1)
- [ ] ST-001~004 + ST-072 + ST-078 E2E Playwright PASS
- [ ] audit_logs 트리거 21 테이블 INSERT/UPDATE/DELETE/APPROVE 4 이벤트 검증
- [ ] Realtime notifications 클라이언트 wrapper 구독 + 자동 재연결 검증
- [ ] CI 신규 4 job (`phase7-code.yml`) 통과
- [ ] PR template 갱신 (API/스키마 동시 갱신 의무)

### 작업 4 — 코드 WI별 머지 게이트 (의무, 절대 스킵 금지)

> **정정 (2026-05-28)**: 듀얼검증은 "Sprint 종료 시"가 아니라 **각 코드 WI 머지 전** 의무다 (`.claude/rules/project.md §1-1` SSOT). CI `dual-verification-gate`가 기계적으로 강제. 이전 "Sprint 1 종료 시" 표기로 WI-019를 검증 없이 머지한 사고 재발 방지.

- 코드 WI(`apps/**`/`packages/**`/`supabase/**`) 머지 전 evaluator + codex 한 세트 호출 (Phase 7 mode: **code**, 첫 WI는 review-system.md §7-1 full review)
- `.flowset/eval-results/WI-XXX.{eval,codex,pass}.md` 저장
- KI-072/073/074 점검 (Phase 7 Sprint 1 실측 후 처리 예정 P3 3건)
- prd-state.json `7-dev-kickoff` status 갱신 (`in_progress` → 부분 진행 / `completed` → Sprint 1 종료)

## 4. Known Issues 현황 (Phase 6 종료 시점)

| 심각도 | 활성 | 임계 | 트리거 |
|--------|------|------|--------|
| P0 | 0 | 1 | ❌ |
| P1 | 0 | 3 | ❌ |
| P2 | 4 (KI-049/054/060/061) | 5 | ❌ 임계 미달 (KI-071 묶음 resolved 후) |
| P3 | 32 | 10 | ✅ 도달 (KI-072/073/074 신규 추가) |

**Phase 6 사이클 resolved**: KI-013 + KI-034 (Phase 2 closure) + KI-071 묶음 (15곳)
**Phase 6 사이클 신규 등록**: KI-072 (P3, sprint-007 S6 spill 결합), KI-073 (P3, MD 보수배수 임계), KI-074 (P3, mvp-plan §4 S5 가독성)

**P3 32건 트리거 도달 — 차기 docs batch 또는 Phase 7 Sprint 1 회고 시 처리 결정**

## 5. 핵심 정책 결정 (변경 금지)

| 결정 | 출처 | 일자 |
|------|------|----|
| 모노레포 디렉토리 구조 SSOT (codex 7건 권고) | mvp-plan.md §1 | 2026-05-19 |
| i18n MVP ko + en 동시 | WI-KI-batch-005 + mvp-plan §1-1 | 2026-05-16/19 |
| OpenAPI 변환 `zod-to-openapi`, Sprint 1 day 13~14 | mvp-plan §1-1, §3-3 | 2026-05-19 |
| Sprint 1 day 1 NHN 알림톡 신청 의무 (D+0) | sprint-001.md + mvp-plan §5 | 2026-05-19 |
| Phase 7 CI 신규 4 job (`phase7-code.yml`) | mvp-plan §6, sprint-001.md Day 13~14 | 2026-05-19 |
| 평가 시스템 v3 (5축, Phase 5만 / Phase 6+ 4축) | review-system.md §17 / review-rubric.md §10 | 2026-05-16 |
| KI 트리거 (P0=1, P1=3, P2=5, P3=10) | triggers.md §2 | 기존 |
| PR auto-merge --squash --delete-branch | project.md §6 | 2026-05-16 |
| **codex 호출 표준**: `Agent subagent_type=codex:codex-rescue` + 모델 unset (gpt-5.5 기본) + `--read-only` for 검증 | codex-cli-runtime skill + 2026-05-19 사용자 지적 | 2026-05-19 |
| **review-system.md §7-1 의무**: evaluator + codex 한 세트 호출 (단독 호출 금지) | 2026-05-19 사용자 지적 | 2026-05-19 |
| **codex 검토 범위 한계 인지**: codex가 라인 범위 한정 검토하므로 산수/정합 결함이 false alarm일 수 있음 (Phase 6 4차 codex P1 L282 산식 누락 검출 사례). 재평가 시 의문 결함은 grep으로 실제 확인 의무 + closure 검증 시 라인 범위 명시 | Phase 6 4차 사이클 교훈 | 2026-05-19 |

## 6. PR 현황

| PR | 제목 | 머지 commit | 상태 |
|----|------|----|----|
| #1~#15 | Phase 5 G0~G4 + system v2/v3 + audit hotfix 1~3 | (15개) | ✅ MERGED |
| #16 | WI-Phase6prep-docs Phase 6 진입 전 의무 closure (KI-013 + KI-034) | `d6aaa95` | ✅ MERGED |
| **#17** | **WI-016-docs Phase 6 MVP 스프린트 계획 (mvp-plan + sprint-001~010)** | **`8ac2d6c`** | ✅ **MERGED 2026-05-18T17:50:16Z** |
| #(미생성) | Phase 7 Sprint 1 부트스트랩 (모노레포 + 인증 + RLS + audit + Realtime + 약관 + 오류 + CI) | — | ⏳ 신규 세션 |

## 7. Task 상태

| 영역 | 상태 |
|------|------|
| Phase 5 G0~G4 양산 + 평가 | ✅ completed |
| Phase 5 audit fix 1/2/3 + wf-v1.0.0 재부여 | ✅ completed |
| Phase 2 재평가 (KI-013/034 closure) | ✅ PASS_BOTH (PR #16) |
| **Phase 6 mvp-plan + sprint-001~010** | ✅ **PASS_WITH_KI (PR #17)** |
| **Phase 7 Sprint 1 부트스트랩** | ⏳ **신규 세션** |

## 8. 컨텍스트 압축 시 우선 보존 + 신규 세션 읽기 순서

### 신규 세션 진입 시 읽기 순서 (의무)

1. **본 HANDOFF.md** (첫 작업) — Phase 6 종결 + Phase 7 진입 안내
2. `.flowset/sprints/mvp-plan.md` — Phase 7+ SSOT (디렉토리 + 변환 정책 + Sprint 1~10)
3. `.flowset/sprints/sprint-001.md` — Sprint 1 Day 1~14 부트스트랩 시퀀스
4. `.flowset/backlog/stories.md` — 80 Story / 415 SP SSOT (P0~P3 그룹)
5. `.flowset/backlog/tasks.md` — 223 Task / 838 MD (TS-001~223 분해)
6. `.flowset/backlog/dependency-graph.md` — Sprint 1~10 의존 + 외부 의존
7. `.flowset/backlog/estimation.md` — MD 환산 + 비용 + Sprint 용량
8. `.flowset/backlog/epics.md` — 12 Epic 마스터
9. `.flowset/known-issues/INDEX.md` — 활성 KI (P3 32건 트리거 도달 점검)
10. `.flowset/prd-state.json` — current_phase: 7-dev-kickoff
11. (필요 시) `.flowset/prd/03-tech-architecture.md` — 기술 스택 SSOT
12. (필요 시) `.flowset/wireframes/_design-system/{tokens.css,components.css,03-components.md}` — Phase 5 DS → packages/ui 변환 원천
13. (필요 시) `.flowset/contracts/review-system.md §7-1` — evaluator + codex 한 세트 의무

### 컨텍스트 압축 시 보존 우선순위

- L1 (필수): 본 HANDOFF + mvp-plan + sprint-001
- L2 (강): backlog/{stories,tasks,dependency-graph} + INDEX + prd-state
- L3 (참조): backlog/{estimation,epics} + prd/03-tech + wireframes/_design-system + contracts/review-system

## 9. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — Phase 5 PRD 결함 발견 | KI-027~031 |
| 2026-05-16~18 | Phase 5 G0~G4 + audit hotfix 1~3 + wf-v1.0.0 재부여 | 와이어프레임 양산 |
| 2026-05-18 | Phase 5 정식 종료 + Phase 6 진입 안내 | audit 사이클 종결 |
| **2026-05-19** | **Phase 6 정식 종료 — PR #16 (KI-013/034 closure PASS_BOTH 8.475/8.34) + PR #17 (mvp-plan + sprint-001~010 PASS_WITH_KI 9.00/8.21) 머지 + Phase 7 진입 안내** | **Phase 6 mvp-plan + sprint 작성 + codex 7건 디렉토리 SSOT 채택 + KI-071 묶음 + 신규 KI-072~074 등록** |
