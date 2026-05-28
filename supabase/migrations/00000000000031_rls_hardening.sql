-- ST-005 보안 하드닝 (Supabase security advisor 대응, 2026-05-29)
--
-- (1) migration 3 술어 헬퍼(is_operator/is_operator_super/is_tenant_admin)의 search_path 고정
--     — function_search_path_mutable 경고 해소.
-- (2) 트리거 전용/관리자 전용 SECURITY DEFINER 함수의 anon/authenticated RPC 노출 차단
--     — audit_row_change(트리거 전용), prune_audit_logs(관리자/cron 전용).
-- (3) record_login_failure 를 service_role 전용으로 — WI-020 시 anon/authenticated 기본 grant
--     잔존(advisor 0029)을 보정. 로그인 흐름은 service_role 클라이언트로 호출(login-lock.ts).
--
-- 주: current_tenant_id/current_role_key/current_employee_id/my_team_employee_ids/
--     is_approval_step_approver/is_approval_requester 는 RLS 정책 평가가 호출자(anon/authenticated)
--     권한으로 실행하므로 EXECUTE 유지 의무. 모두 호출자 본인 claim/소속만 반환 → 데이터 누설 없음.
--     (advisor 0028/0029 잔여는 RLS 헬퍼 설계상 수용 — analysis 문서 기록.)

-- (1) 술어 헬퍼 search_path 고정
create or replace function is_operator() returns boolean
  language sql stable set search_path = public, pg_catalog as $$
    select current_role_key() in ('operator_super', 'operator_staff')
$$;
create or replace function is_operator_super() returns boolean
  language sql stable set search_path = public, pg_catalog as $$
    select current_role_key() = 'operator_super'
$$;
create or replace function is_tenant_admin() returns boolean
  language sql stable set search_path = public, pg_catalog as $$
    select current_role_key() in ('tenant_super', 'tenant_hr_admin')
$$;

-- (2) 트리거/관리자 전용 함수 RPC 노출 차단
revoke execute on function audit_row_change() from public, anon, authenticated;
revoke execute on function prune_audit_logs(interval) from public, anon, authenticated;

-- (3) record_login_failure service_role 전용 보정
revoke execute on function record_login_failure(text, text) from public, anon, authenticated;
