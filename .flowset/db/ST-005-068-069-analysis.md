# WI-019 Day 8~10 — RLS · audit · Realtime · composite FK 구현 분석

> SSOT 참조: `.flowset/db/rls.md`(RLS), `.flowset/backlog/tasks.md` TS-124(audit), `.flowset/known-issues/INDEX.md` KI-077.
> 적용 대상: 원격 staging `nwcttwuvdnelfbpjeqzr` (supabase MCP). 마이그레이션 27~31.
> 작성: 2026-05-29 (batch D).

## 1. 산출물 요약

| 영역 | 마이그레이션 | 내용 |
|------|------------|------|
| ST-005 RLS | `27_rls_policies.sql` | 39 테이블 ENABLE RLS + 94 정책(패턴 A/B/C/D) + 헬퍼 6종 + 운영사 우회 + 컴플라이언스 불변성 |
| KI-077 | `28` + `32` | 부모(employees/leave_types/approvals) UNIQUE(tenant_id,id) + 자식 composite FK 총 19건 — 28: 15건(employees 12 + leave_types 2 + approval_steps.approval_id 1), 32: 폴리모픽 approval_id 4건(leaves/attendance_modifications/certificate_requests/employee_change_requests) |
| ST-068 audit | `29_audit_triggers.sql` | 범용 `audit_row_change()` SECURITY DEFINER + 21 테이블 AFTER INSERT/UPDATE/DELETE + APPROVE 특례 + `prune_audit_logs()` 5년 보관 |
| ST-069 Realtime | `30_realtime_publication.sql` | supabase_realtime publication(notifications/approvals/approval_steps) + REPLICA IDENTITY FULL |
| 하드닝 | `31_rls_hardening.sql` | 술어헬퍼 search_path 고정 + 트리거/관리자 함수 RPC 노출 차단 + record_login_failure service_role 전용 보정 |
| 인가 정정 | `32_rls_authz_hardening.sql` | **codex 듀얼검증 P1/P2 정정** — INSERT tenant 오귀속 차단(tickets/ticket_messages/user_consents) + 직원 자기승인 차단(leaves/attendance_modifications status 전이 제한) + approvals/approval_steps 자기승인 차단(WITH CHECK) + 라우팅 컬럼 불변 트리거 + KI-077 approval_id composite 완성 |
| 클라이언트 | `packages/api-client/src/realtime.ts` | `createRealtimeSubscription`(비종속 매니저) + `useRealtimeSubscription`(React 훅) — 자동 재연결(지수 백오프) + 오프라인 fallback + onReconnect. `@flowhr/api-client/react` 서브패스 |

## 2. 핵심 설계 결정 (codex 협의 2026-05-29)

1. **다음 WI = WI-019 Day8~10** (RLS/audit/Realtime). 근거: ST-072/078의 의존 루트 + 39테이블 RLS 미적용이 최대 보안 갭. 순서 WI-019 → WI-020 → WI-021.
2. **KI-077 = composite FK (핵심부 한정)**. 전체 39테이블 일괄이 아니라 employees/leave_types/approvals 참조 핵심 HR·결재부만. legal_documents 등 글로벌·동의 도메인 제외. approval_lines는 현 스키마에 FK 참조자 부재로 제외.
3. **ST-004 2FA = custom TOTP** (speakeasy + 자체 challengeToken 5분 + 복구코드 8개). users 스키마(`totp_enabled`/`totp_secret_encrypted`/`recovery_codes_hash`) + auth.md 명세가 custom challenge 흐름 SSOT. → WI-020 잔여 시 적용 (본 WI 비대상).
4. **RLS 클레임 소스 = SECURITY DEFINER public.users 조회** (JWT 커스텀 클레임 부재 블로커 대응). migration 3 헬퍼가 `auth.jwt() ->> '...'`를 읽으나 WI-020 로그인은 클레임 미주입 + hosted Supabase에서 Custom Access Token Hook 활성화는 MCP 불가. → 헬퍼를 `auth.uid()` 기반 `public.users` 조회 SECURITY DEFINER STABLE(`search_path` 고정)로 재정의. 앱 동작과 정합, users RLS 정책 자기참조 재귀 없음(헬퍼가 WHERE id=auth.uid() 본인 행만 + DEFINER 우회). → Access Token Hook 표준화는 후속 KI.

## 3. 검증 증거 (staging 실증)

### 3-1. RLS / 격리 / FK / audit / 불변성 / 인가 매트릭스 — `supabase/tests/rls_matrix_check.sql` (BEGIN..ROLLBACK)
실행 결과 **ALL_RLS_ASSERTIONS_PASS** (T1~T10, 역할 operator_super/tenant_super/tenant_manager/employee 커버):
- T1 employee A: 본인 employees 1 / leaves 1, 타테넌트 휴가 비가시, 교차테넌트 insert RLS 차단
- T2 tenant_super A: 테넌트 전체 employees 3 / leaves 1
- T3 operator: 전체 우회 employees 4 / leaves 2
- T4 user_consents 불변(UPDATE/DELETE no-op)
- T5 composite FK: 교차테넌트 직원 참조 insert 거부
- T6 audit 트리거: employees UPDATE 시 `employees.update` audit_logs 기록
- T7 직원 자기승인 차단(leaves status=approved 거부) + 본인 취소 허용 (codex P1-2)
- T8 티켓 교차테넌트 INSERT 차단 (codex P1-1)
- T9 approval_id 교차테넌트 링크 composite FK 차단 (codex P1-4 / KI-077 완성)
- T10 매니저 팀범위: MgrA가 DeptA 팀(self+EmpA)만 가시, AdminA/타테넌트 EmpB 비가시 (evaluator P2 커버)

### 3-2. 적용 상태
RLS 활성 40 테이블(39 + login_attempts) / audit 트리거 21 / RLS 정책 94 / Realtime 3 테이블.

### 3-3. 회귀 — WI-020 로그인 무손상
실제 테스트 유저로 로그인 프로필 조회(`users where id=auth.uid()`) RLS 하 정상 → **LOGIN_PROFILE_READ_OK**.

### 3-4. 코드 검증
turbo typecheck 7/7 + lint 8/8 + unit test 13(api-client realtime 6 + auth 7) + build(/ko·/en SSG) PASS.

### 3-5. Supabase security advisor (하드닝 후)
- 해소: function_search_path_mutable(is_operator/is_operator_super/is_tenant_admin), audit_row_change·prune_audit_logs·record_login_failure RPC 노출.
- **수용 잔여(설계상)**: current_tenant_id/current_role_key/current_employee_id/my_team_employee_ids/is_approval_step_approver/is_approval_requester 의 anon·authenticated EXECUTE — RLS 정책 평가가 호출자 권한으로 실행하므로 EXECUTE 필수. 모두 호출자 본인 claim/소속만 반환(데이터 누설 없음).

## 4. 의도된 deferral / 후속 (KI)

| 항목 | 사유 | KI |
|------|------|----|
| Custom Access Token Hook 표준화 | hosted hook 활성화 dashboard/Mgmt API 필요(MCP 불가). 현 SECURITY DEFINER 조회가 정상 동작 | KI-084 (P3) |
| audit_logs 월 파티셔닝 | 비파티션 기존 테이블 + staging에 기존 audit 존재 → 재생성 invasive. 스케일 최적화로 유보(트리거·보관함수는 제공) | KI-085 (P3) |
| Auth leaked-password protection | dashboard auth config 토글(범위 외) | KI-086 (P3) |
| users 본인 프로필(locale) 수정 | RLS 쓰기 operator 전용 — 자기 역할상승 차단. 본인 locale 수정은 프로필 WI에서 service_role 서버액션으로 | (프로필 WI EM-09/OP-12) |
| pg_cron 보관 스케줄 | pg_cron 미설치 시 스킵(조건부) — 설치 시 주간 prune 자동 등록 | KI-085 연계 |

## 5. KI-077 해소

부모 UNIQUE(tenant_id,id) + 자식 composite FK로 "동일 테넌트 부모" DB 강제. T5 실증으로 교차테넌트 참조 거부 확인 → **resolved**.

## 6. 듀얼검증 (evaluator + codex)

- **evaluator**: PASS 8.80/10 (4축 ≥7.5, 독립 재실행으로 typecheck/lint/test/build 재확인). P0/P1 0건.
- **codex 1차**: FAIL — P1 4건(tickets INSERT tenant 누락 / 직원 자기 leaves·근태수정 status 자기승인 / approvals·approval_steps 라우팅 컬럼·자기승인 미차단 / KI-077 approval_id composite 미완성) + P2 2 + P3 2. 전부 실제 결함(false alarm 0).
  → **정정 1**(마이그레이션 32 + realtime.ts): T7~T10 회귀 추가 + staging 재실증.
- **codex 2차**: FAIL — 개방 P1 2(admin 겸직 직원 self-approve / requester self-routing) + 신규 P2 1(SET NULL composite FK가 tenant_id NOT NULL 위반으로 부모 DELETE 실패 — 9건 전수). 검증 결과 실제 결함(SET NULL은 codex 본 것보다 광범위).
  → **정정 2**(마이그레이션 33): (1) SET NULL composite FK 9건을 `on delete set null (<ref col>)` 컬럼지정(PG17)으로 — tenant_id 보존 + 부모 DELETE 정상. (2) approval_steps INSERT를 관리자 전용 → requester self-routing 차단. (3) leaves/attmod의 approved/rejected 직접 UPDATE를 employee·admin 공통 차단 → 승인/반려는 service_role 결재 RPC 매개(admin self-approve 폐쇄). RLS 매트릭스 T11~T13 추가 + staging 재실증 PASS.
- evaluator round2 NON_BLOCKING도 반영: approval self-approval WITH CHECK·매니저 팀범위(정정1) + requester self-routing(정정2) 해소. drop policy는 마이그레이션 33부터 `if exists` 적용. rls.md §1 SSOT drift는 KI-084로 추적.

## 7. 변경 이력

| 일자 | 변경 |
|------|------|
| 2026-05-29 | 초안 — ST-005/068/069 + KI-077 구현 + staging 실증 + codex 4종 협의 |
| 2026-05-29 | codex 듀얼검증 1차 P1/P2 정정 — 마이그레이션 32(인가 강화 + approval_id composite 완성 + 라우팅 컬럼 잠금) + realtime P3 + T7~T10 회귀 테스트 |
| 2026-05-29 | codex 듀얼검증 2차 P1/P2 정정 — 마이그레이션 33(SET NULL 9건 컬럼지정 + approval_steps INSERT 관리자 전용 + leaves/attmod approved/rejected 직접전이 차단) + T11~T13 회귀 테스트. KI-087(결재 워크플로 SoD/전이 가드 Sprint 6) 등록 |
