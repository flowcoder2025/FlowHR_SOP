-- ST-068 — audit_logs AFTER 트리거 (핵심 21 테이블) + 5년 보관
-- SSOT: .flowset/db/rls.md §6 + .flowset/backlog/tasks.md TS-124-023-DB-1 + api/common.md §KI-026
--
-- 이벤트: INSERT / UPDATE / DELETE / APPROVE(approvals·approval_steps status→approved 전이 특례) = 4종.
-- 제외(KI-026 정책, common.md L112): attendance_modifications / certificate_requests /
--   employee_change_requests 폴리모픽 자식은 개별 트리거 미적용 — 연결된 approvals audit에 포함.
--   (중복 로그 회피. 자식 세부는 애플리케이션 audit가 보강 — stories.md L246 "이중: 트리거+애플리케이션")
-- 그 외 제외: 로그/임시(notifications/ticket_messages/integration_logs/audit_logs/tenant_drafts),
--   운영 ops(system_settings/backup_jobs/maintenance_windows/operator_users/plans/feature_flags/roles),
--   v1.2(signatures), 컴플라이언스 self-log(user_consents)/게시이력(legal_documents — published_by/at 자체기록).
-- 파티셔닝(월): 본 WI 비대상 — audit_logs는 비파티션 기존 테이블 + staging에 WI-020 로그인 audit 존재.
--   대규모 스케일 최적화로 후속 KI(테이블 재생성 동반). 본 WI는 트리거 + 보관함수까지 제공.

-- =====================================================================
-- 1. 범용 audit 트리거 함수 (SECURITY DEFINER — caller RLS와 무관하게 audit_logs INSERT)
-- =====================================================================
create or replace function audit_row_change() returns trigger
  language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_rec    jsonb;
  v_before jsonb;
  v_after  jsonb;
  v_tenant uuid;
  v_target uuid;
  v_action text;
begin
  if tg_op = 'DELETE' then
    v_rec := to_jsonb(old); v_before := v_rec; v_after := null;
  elsif tg_op = 'INSERT' then
    v_rec := to_jsonb(new); v_before := null; v_after := v_rec;
  else
    v_before := to_jsonb(old); v_after := to_jsonb(new); v_rec := v_after;
  end if;

  -- tenant_id: 행 컬럼 우선, tenants 테이블은 id 자신, 그 외 호출자 테넌트로 폴백
  v_tenant := coalesce(
    nullif(v_rec ->> 'tenant_id', '')::uuid,
    case when tg_table_name = 'tenants' then nullif(v_rec ->> 'id', '')::uuid end,
    current_tenant_id()
  );
  v_target := nullif(v_rec ->> 'id', '')::uuid;

  -- APPROVE 특례: 결재 status가 approved 로 전이될 때
  if tg_table_name in ('approvals', 'approval_steps')
     and tg_op = 'UPDATE'
     and (v_after ->> 'status') = 'approved'
     and (v_before ->> 'status') is distinct from 'approved' then
    v_action := tg_table_name || '.approve';
  else
    v_action := tg_table_name || '.' || lower(tg_op);
  end if;

  insert into public.audit_logs
    (tenant_id, actor_id, actor_role, action, target_type, target_id, before, after, result)
  values
    (v_tenant, auth.uid(), current_role_key(), v_action, tg_table_name, v_target, v_before, v_after, 'success');

  return null; -- AFTER 트리거 반환값 무시
end;
$$;

-- =====================================================================
-- 2. 21 핵심 테이블 AFTER INSERT/UPDATE/DELETE 트리거
-- =====================================================================
create trigger audit_tenants                after insert or update or delete on tenants                for each row execute function audit_row_change();
create trigger audit_subscriptions          after insert or update or delete on subscriptions          for each row execute function audit_row_change();
create trigger audit_invoices               after insert or update or delete on invoices               for each row execute function audit_row_change();
create trigger audit_feature_flag_overrides after insert or update or delete on feature_flag_overrides for each row execute function audit_row_change();
create trigger audit_tickets                after insert or update or delete on tickets                for each row execute function audit_row_change();
create trigger audit_departments            after insert or update or delete on departments            for each row execute function audit_row_change();
create trigger audit_employees              after insert or update or delete on employees              for each row execute function audit_row_change();
create trigger audit_users                  after insert or update or delete on users                  for each row execute function audit_row_change();
create trigger audit_attendances            after insert or update or delete on attendances            for each row execute function audit_row_change();
create trigger audit_leave_types            after insert or update or delete on leave_types            for each row execute function audit_row_change();
create trigger audit_leaves                 after insert or update or delete on leaves                 for each row execute function audit_row_change();
create trigger audit_leave_balances         after insert or update or delete on leave_balances         for each row execute function audit_row_change();
create trigger audit_approval_lines         after insert or update or delete on approval_lines         for each row execute function audit_row_change();
create trigger audit_approvals              after insert or update or delete on approvals              for each row execute function audit_row_change();
create trigger audit_approval_steps         after insert or update or delete on approval_steps         for each row execute function audit_row_change();
create trigger audit_documents              after insert or update or delete on documents              for each row execute function audit_row_change();
create trigger audit_tenant_settings        after insert or update or delete on tenant_settings        for each row execute function audit_row_change();
create trigger audit_work_policies          after insert or update or delete on work_policies          for each row execute function audit_row_change();
create trigger audit_document_templates     after insert or update or delete on document_templates     for each row execute function audit_row_change();
create trigger audit_integrations           after insert or update or delete on integrations           for each row execute function audit_row_change();
create trigger audit_api_keys               after insert or update or delete on api_keys               for each row execute function audit_row_change();

-- =====================================================================
-- 3. 5년 보관 — 정리 함수 + (pg_cron 존재 시) 주간 스케줄
-- =====================================================================
create or replace function prune_audit_logs(p_retain interval default interval '5 years')
  returns bigint language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_deleted bigint;
begin
  delete from public.audit_logs where created_at < now() - p_retain;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
revoke execute on function prune_audit_logs(interval) from public; -- 운영자/cron 전용 (service_role/postgres)

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'flowhr-audit-retention',
      '0 3 * * 0',  -- 매주 일요일 03:00 UTC
      'select public.prune_audit_logs()'
    );
  end if;
end;
$$;
