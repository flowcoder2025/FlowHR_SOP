---EVAL_RESULT---
PHASE: 7
MODE: code
WI: WI-032-feat — TA-13 회사설정 API (GET 9탭 + PATCH P0 4탭 + 적용일 즉시/예약 pg_cron 엔진)
ARTIFACT_PATHS:
  - supabase/migrations/00000000000040_sprint2_settings_apply_engine.sql
  - packages/schemas/src/tenant-settings.ts
  - packages/schemas/src/tenant-settings.test.ts
  - apps/web/lib/tenant-settings/queries.ts
  - apps/web/lib/tenant-settings/actions.ts
  - packages/schemas/src/index.ts
  - packages/schemas/scripts/build-openapi.ts
  - packages/schemas/dist/openapi.yaml
  - packages/types/src/database.ts
  - .flowset/api/tenant.md
  - .flowset/known-issues/INDEX.md

SCORES:
- 기능 완성도: 8.5 | GET 9탭 envelope(queries.ts:185-194 permission/implemented/data/pending) + PATCH P0 4탭 즉시/예약 분기(actions.ts:55-101) 완전 구현. 즉시-과거오프셋(actions.ts:58-59 now-1s)로 시계차 due 누락 방지, 예약 no-op(mig40:297 apply_at<=now 게이트). 미구현 탭은 implemented=false 로 명시(queries.ts:31-36)+PATCHABLE enum 거부(테스트 134). grant_basis 제외는 KI-112 정당화(저장컬럼 부재, mig11:3-11 확인). 안티패턴(TODO/FIXME/빈함수/any) grep 0건. 감점: actions.ts:90-95 applyError 경로가 실제 행상태(applying/failed 가능)와 무관히 status='pending' 고정 보고(P2, NON_BLOCKING).
- 코드 품질: 8.5 | plpgsql 예외처리(mig40:264-271 subtransaction 롤백+attempt cap), idempotent(cron.schedule job_name upsert mig40:382-392, ON CONFLICT upsert). lint/typecheck 21/21 PASS(turbo 실측). 에러삼키기 없음(insert/apply 실패 console.error+구조화 반환 actions.ts:74-77,90-95). `any`/`as any` 0건(grep). 중복 로직 3회+ 없음. 감점: GET 의 6-way Promise.all(queries.ts:101-156) 가독성 다소 낮음(P3, 비차단). audit_row_change 재정의(mig40:29-86)가 mig29 원본을 통째 복붙 변경 — 드리프트 위험은 있으나 단일 SSOT(최신 mig40)로 수렴.
- 테스트 커버리지: 8.0 | schemas 단위 27 PASS(tenant-settings.test.ts, 실측 27/27) — 음성케이스 강함(strict 미지키 거부 31, 잘못된 email/url/time/uuid/request_type, name 누락, 범위초과, 미지원탭 거부 134). DB 엔진은 staging MCP 실증(즉시/예약 no-op/재시도 attempt1·소진 attempt5/stale 복구/proacl service-only)으로 보강. 감점: queries.ts(권한 게이트 canRead/canEdit)·actions.ts(권한·즉시/예약 분기) 의 TS 단위/통합 테스트 부재 — 권한 매트릭스 양성/음성이 schema 레벨에만 존재, lib 레벨 회귀 자동화 없음(P2, NON_BLOCKING). DB 함수 pgTAP 회귀 부재(staging 수동 실증 의존, KI-082 동류).
- 계약 준수: 8.5 | payload zod(snake_case) ↔ DB컬럼(mig11) ↔ apply SQL(mig40:164-253) 1:1 정합 실측(company/work_policy/leave_types/approval_lines 전 필드 대조). database.ts 함수 시그니처(2541-2634)가 mig40 와 정확 일치(Args/Returns/SetofOptions). openapi.yaml 5 DTO 등록·생성 일관(build-openapi.ts:113-118 ↔ dist 2706-2863). 권한게이트(super/hr_admin) ↔ tenant.md TA-13(L171-172) + scheduled_setting_changes INSERT RLS(mig37:82-87 tenant_admin+created_by=auth.uid()) 정합. api/tenant.md L186 구현노트로 Server Action 패턴 명시. 감점: TA-13 명세상 hr_admin "일부 탭"인데 구현은 4 PATCH탭 모두 hr_admin 허용 — 명세-구현 미세 간극(P3).

WEIGHTED_TOTAL: 8.45/10  ((8.5×0.30)+(8.5×0.25)+(8.0×0.25)+(8.5×0.20) = 2.55+2.125+2.00+1.70)
THRESHOLD: 8.0 (각 축 ≥ 7.5)
VERDICT: PASS

NON_BLOCKING_OBSERVATIONS:
- [P2] apps/web/lib/tenant-settings/actions.ts:90-95 — apply_one RPC 자체 실패 시 반환 status 를 'pending' 으로 하드코딩 보고하나 실제 DB 행은 'applying'(stale 복구 대기) 또는 'failed'(attempt 소진) 일 수 있음 → UI 가 표시하는 상태와 실제 큐 상태 괴리 가능. 조치: 실패 시 행 status 재조회 후 반영 또는 'unknown' 상태 추가.
- [P2] apps/web/lib/tenant-settings/{queries,actions}.ts — 권한 게이트(canRead/canEdit/canEditTab, super/hr_admin/manager 분기)와 즉시/예약 분기에 대한 TS 단위/통합 테스트 부재. 권한 양성/음성 자동 회귀가 zod schema 레벨(27 tests)에만 존재. 조치: lib 레벨 권한 매트릭스 테스트(role×tab×permission) 추가(KI-108 jsdom/통합 인프라 동반 가능).
- [P3] supabase/migrations/...40.sql — DB apply 엔진(apply_one/run_due/claim_due/recover_stale/_apply_claimed)의 pgTAP/자동 회귀 부재 — staging MCP 수동 실증만(검증된 사실이나 CI 회귀 보호 없음, KI-082 동류). 조치: pg 회귀 테스트 인프라 도입 WI 시 흡수.
- [P3] .flowset/api/tenant.md TA-13(L172) "hr_admin (일부 탭)" vs 구현(canEditTab: super/hr_admin 가 P0 4탭 전부 편집) — 명세상 hr_admin 편집 가능 탭 세분(회사정보/휴가/문서양식)과 구현 간 미세 간극. 조치: 명세 정밀화 또는 탭별 hr_admin 편집 매트릭스 반영.
- [P3] mig40:29-86 audit_row_change 전체 재정의가 mig29 본문을 복제 후 GUC fallback 만 추가 — 향후 audit 로직 변경 시 두 마이그레이션 동기화 필요(드리프트 위험). 현재는 최신 mig40 이 SSOT 로 수렴해 무해.

ANTI_PATTERNS_FOUND:
- (코드 안티패턴 0건) TODO/FIXME/빈함수/`catch(e){}`/`any`/`as any`/하드코딩 매직값 grep 결과 0건. lib + schemas + migration 전수 확인. 단 한 건의 하드코딩 문자열 'system:scheduled-settings'(mig40:161)는 audit actor role 표기로 의도된 상수(매직값 아님).

ISSUES:
- (차단 ISSUE 없음 — 위 NON_BLOCKING_OBSERVATIONS 가 전부 비차단 P2/P3)

SECURITY 회의적 검증 결과 (지침 1):
- grant 누수(KI-109/WI-031 P1 클래스): 신규 5함수 전부 mig40:362-366 에서 `revoke all from public, anon, authenticated` 후 service-only grant(370-372). _apply_claimed/recover_stale 는 grant 없음(definer 내부호출). staging proacl 실측 {postgres, service_role}만 — 회귀 없음. PASS.
- audit GUC fallback 회귀: GUC(app.audit_actor_*)는 auth.uid() IS NULL 일 때만 읽음(mig40:67-73). 실 사용자 세션은 auth.uid() 비-NULL → GUC 무시(기존 경로 무영향). 인증 사용자의 GUC 스푸핑 불가(auth.uid() 우선). actor_role 도 current_role_key() 우선(74-77). set_config is_local=true 라 트랜잭션 로컬, 루프 내 행별 재설정(mig40:159-161 begin 외부, 각 행 반복마다 덮어씀) → 행간 누수 없음. PASS.
- RLS 우회 경로: GET/PATCH insert 는 사용자 세션 client(RLS 적용). 실제 apply 만 service_role(apply_one). claim_due returning sc.* 의 cross-tenant 유출은 mig39 에서 이미 차단(service-only). PASS.
- payload 주입: 전 payload .strict()(company/work_policy/leave_policy types/approval_line) → 미지키 거부(테스트 31 검증). settingsPatchInputSchema 는 payload 를 record 로 받되 parseSettingPayload 로 tab별 strict 재검증(actions.ts:46). PASS.

동시성/내구성 검증 결과 (지침 3):
- 즉시 apply_one vs cron run_due 중복방지: 둘 다 status='pending' 원자 UPDATE claim(apply_one mig40:292-298, claim_due 99-125 for update skip locked). 같은 행 동시 claim 시 한쪽만 'applying' 전환 → 중복적용 없음. PASS.
- 재시도/cap: claim_due attempt_count<5 + backoff(0/1m/5m/15m/1h, mig40:109-120), _apply_claimed 예외시 attempt>=5 → failed 아니면 pending(264-271). PASS.
- stale 복구: recover_stale(15분 경과 applying → attempt 따라 pending/failed, mig40:313-333), run_due 가 선행 호출(349). PASS.
- 트랜잭션 경계: _apply_claimed 의 inner begin/exception(subtransaction)로 target+audit 동반 롤백(132 주석대로). PASS.

RECOMMENDATION:
- 승인(PASS). 가중 8.45 ≥ 8.0, 각 축 ≥ 7.5(최저 테스트 8.0).
- 개선 제안(비차단): (1) actions.ts apply 실패 status 보고 정합(P2) — 다음 회사설정 UI WI(WI-033 등) 착수 시 동반. (2) lib 권한 매트릭스 통합 테스트(P2) — KI-108 jsdom 인프라 WI 와 묶어 처리. (3) DB 엔진 pgTAP 회귀(P3) — KI-082 CI 인프라 WI 흡수.
- 본 evaluator 채점은 codex 결과 미인지 독립 채점. 호출자(Claude 본체)가 codex 통지 대기 후 review-system.md §4 매트릭스로 통합 판정 — PASS_BOTH 시에만 .flowset/eval-results/WI-032-feat.pass(PASS_BOTH) 마커 생성.

NEXT_ACTION:
- evaluator 측: PASS. codex 독립 리뷰 결과와 통합 후 PASS_BOTH 확정 시 머지 게이트(project.md §1-1) 통과.
- 본 .eval.md 는 통합 입력 — 마커(.pass)는 호출자가 듀얼검증 통합 후 생성(evaluator 는 마커 미생성).
---END_EVAL---
