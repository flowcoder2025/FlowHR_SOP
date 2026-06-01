-- Sprint 2 — TA-13 회사설정 예약 적용 엔진 (WI-032)
-- SSOT: .flowset/sprints/sprint-002.md DoD "적용일 예약 cron" + .flowset/api/tenant.md TA-13
--       + .flowset/wireframes/analysis/TA-13.md §8 (scheduled 상태 + cron 변환)
--
-- WI-031(mig 37)이 scheduled_setting_changes 큐 + claim_due(다건 원자 claim)를 제공.
-- 본 마이그레이션은 "적용" 측면을 닫는다:
--   1) audit_row_change(mig 29) 시스템 actor fallback  — KI-110 해소
--   2) claim_due  backoff + attempt cap (재시도 폭주 차단)
--   3) _apply_claimed_scheduled_setting_change(id)      — target 테이블 적용(내부)
--   4) apply_one_scheduled_setting_change(id)           — 즉시 적용 path(원자 claim+apply, service_role)
--   5) recover_stale_scheduled_setting_changes()        — stale 'applying' 복구
--   6) run_due_scheduled_setting_changes(limit)         — cron entrypoint(recover→claim→apply)
--   7) grants — service-only(anon/authenticated revoke, mig 31/39 패턴)
--   8) pg_cron 설치 + cron.schedule(매분 적용 + audit 보관 재등록)
--
-- security definer 함수 grant 누수 클래스(KI-109/WI-031 P1): 신규 함수마다 즉시
--   revoke from public, anon, authenticated. Supabase pg_default_acl 가 anon/authenticated 에
--   EXECUTE 를 자동 부여하므로 revoke from public 만으론 무력.

set search_path = public, pg_catalog;

-- =====================================================================
-- 1. audit_row_change: 시스템 actor fallback (KI-110)
--    실 사용자 세션은 auth.uid()/current_role_key() 가 채워지고 GUC 미설정 → 기존 동작 그대로.
--    service_role/cron(시스템) 컨텍스트(auth.uid()=NULL, current_role_key()=NULL)에서만
--    예약 적용 엔진이 트랜잭션 로컬로 심은 app.audit_actor_* GUC 로 actor 를 보강.
--    GUC 는 _apply_claimed_scheduled_setting_change 만 set_config(is_local=true) 로 설정 → 타 경로 무영향.
-- =====================================================================
create or replace function audit_row_change() returns trigger
  language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_rec        jsonb;
  v_before     jsonb;
  v_after      jsonb;
  v_tenant     uuid;
  v_target     uuid;
  v_action     text;
  v_actor_id   uuid;
  v_actor_role text;
  v_guc_actor  text;
begin
  if tg_op = 'DELETE' then
    v_rec := to_jsonb(old); v_before := v_rec; v_after := null;
  elsif tg_op = 'INSERT' then
    v_rec := to_jsonb(new); v_before := null; v_after := v_rec;
  else
    v_before := to_jsonb(old); v_after := to_jsonb(new); v_rec := v_after;
  end if;

  v_tenant := coalesce(
    nullif(v_rec ->> 'tenant_id', '')::uuid,
    case when tg_table_name = 'tenants' then nullif(v_rec ->> 'id', '')::uuid end,
    current_tenant_id()
  );
  v_target := nullif(v_rec ->> 'id', '')::uuid;

  if tg_table_name in ('approvals', 'approval_steps')
     and tg_op = 'UPDATE'
     and (v_after ->> 'status') = 'approved'
     and (v_before ->> 'status') is distinct from 'approved' then
    v_action := tg_table_name || '.approve';
  else
    v_action := tg_table_name || '.' || lower(tg_op);
  end if;

  -- actor: 실 사용자 우선, 시스템 컨텍스트는 GUC fallback.
  v_actor_id := auth.uid();
  if v_actor_id is null then
    v_guc_actor := nullif(current_setting('app.audit_actor_id', true), '');
    if v_guc_actor ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      v_actor_id := v_guc_actor::uuid;
    end if;
  end if;
  v_actor_role := coalesce(
    current_role_key(),
    nullif(current_setting('app.audit_actor_role', true), '')
  );

  insert into public.audit_logs
    (tenant_id, actor_id, actor_role, action, target_type, target_id, before, after, result)
  values
    (v_tenant, v_actor_id, v_actor_role, v_action, tg_table_name, v_target, v_before, v_after, 'success');

  return null; -- AFTER 트리거 반환값 무시
end;
$$;

-- =====================================================================
-- 2. claim_due: backoff + attempt cap (mig 37 교체)
--    pending + due + attempt_count<5 + backoff 경과 행만 applying 으로 원자 전환.
--    backoff 곡선(시도별): 0 / 1m / 5m / 15m / 1h. recover_stale 와 함께 "최대 5회 시도" 보장.
-- =====================================================================
create or replace function claim_due_scheduled_setting_changes(p_limit int default 50)
returns setof scheduled_setting_changes
language sql
security definer
set search_path = public, pg_catalog
as $$
  update scheduled_setting_changes sc
     set status = 'applying',
         attempt_count = sc.attempt_count + 1,
         last_attempt_at = now(),
         updated_at = now()
   where sc.id in (
     select id
       from scheduled_setting_changes
      where status = 'pending'
        and apply_at <= now()
        and attempt_count < 5
        and (
          last_attempt_at is null
          or now() >= last_attempt_at +
            case attempt_count
              when 0 then interval '0'
              when 1 then interval '1 minute'
              when 2 then interval '5 minutes'
              when 3 then interval '15 minutes'
              else interval '1 hour'
            end
        )
      order by apply_at asc, id asc
      for update skip locked
      limit least(greatest(coalesce(p_limit, 50), 1), 100)
   )
  returning sc.*;
$$;

-- =====================================================================
-- 3. _apply_claimed_scheduled_setting_change(id) — 내부 apply
--    status='applying' 인 행만 적용. target 별 payload(full desired-state)→테이블 반영.
--    성공: applied. 예외: attempt_count>=5 면 failed, 아니면 pending(backoff 재시도).
--    예외 블록(subtransaction)이라 실패 시 target 변경 + 그 audit 까지 함께 롤백.
--    grant 없음 — run_due/apply_one(security definer, owner=postgres)에서만 호출.
-- =====================================================================
create or replace function _apply_claimed_scheduled_setting_change(p_id uuid)
returns scheduled_setting_changes
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_row     scheduled_setting_changes;
  v_payload jsonb;
  v_tenant  uuid;
  v_lt      jsonb;
  v_line    jsonb;
  v_del     text[];
begin
  select * into v_row from scheduled_setting_changes where id = p_id and status = 'applying' for update;
  if not found then
    -- 다른 워커가 이미 처리했거나 상태 불일치 → no-op(현재 상태 그대로 반환)
    select * into v_row from scheduled_setting_changes where id = p_id;
    return v_row;
  end if;

  v_payload := v_row.payload;
  v_tenant  := v_row.tenant_id;

  -- 시스템 actor GUC(KI-110): 예약자(created_by) + 시스템 적용 표기. 트랜잭션 로컬.
  perform set_config('app.audit_actor_id', coalesce(v_row.created_by::text, ''), true);
  perform set_config('app.audit_actor_role', 'system:scheduled-settings', true);

  begin
    if v_row.target = 'company' then
      insert into tenant_settings (tenant_id, company_info)
      values (v_tenant, v_payload)
      on conflict (tenant_id) do update
        set company_info = excluded.company_info, updated_at = now();

    elsif v_row.target = 'work_policy' then
      update work_policies
         set name                   = coalesce(v_payload ->> 'name', name),
             standard_clock_in      = nullif(v_payload ->> 'standard_clock_in', '')::time,
             standard_clock_out     = nullif(v_payload ->> 'standard_clock_out', '')::time,
             late_threshold         = nullif(v_payload ->> 'late_threshold', '')::time,
             break_minutes_default  = coalesce((v_payload ->> 'break_minutes_default')::int, break_minutes_default),
             weekly_max_hours       = coalesce((v_payload ->> 'weekly_max_hours')::int, weekly_max_hours),
             applicable_departments = coalesce(
               (select array_agg(x) from jsonb_array_elements_text(coalesce(v_payload -> 'applicable_departments', '[]'::jsonb)) x),
               '{}'::text[]
             ),
             applied_from           = nullif(v_payload ->> 'applied_from', '')::date,
             updated_at             = now()
       where tenant_id = v_tenant and is_default = true;
      if not found then
        insert into work_policies
          (tenant_id, name, is_default, standard_clock_in, standard_clock_out, late_threshold,
           break_minutes_default, weekly_max_hours, applicable_departments, applied_from)
        values
          (v_tenant, coalesce(v_payload ->> 'name', '기본 근무정책'), true,
           nullif(v_payload ->> 'standard_clock_in', '')::time,
           nullif(v_payload ->> 'standard_clock_out', '')::time,
           nullif(v_payload ->> 'late_threshold', '')::time,
           coalesce((v_payload ->> 'break_minutes_default')::int, 0),
           coalesce((v_payload ->> 'weekly_max_hours')::int, 52),
           coalesce(
             (select array_agg(x) from jsonb_array_elements_text(coalesce(v_payload -> 'applicable_departments', '[]'::jsonb)) x),
             '{}'::text[]
           ),
           nullif(v_payload ->> 'applied_from', '')::date);
      end if;

    elsif v_row.target = 'leave_policy' then
      for v_lt in select value from jsonb_array_elements(coalesce(v_payload -> 'leave_types', '[]'::jsonb)) as t(value)
      loop
        insert into leave_types
          (tenant_id, key, label_ko, default_days, is_paid, carryover_allowed, evidence_required, sort_order)
        values
          (v_tenant, v_lt ->> 'key', v_lt ->> 'label_ko',
           coalesce((v_lt ->> 'default_days')::int, 0),
           coalesce((v_lt ->> 'is_paid')::boolean, true),
           coalesce((v_lt ->> 'carryover_allowed')::boolean, false),
           coalesce((v_lt ->> 'evidence_required')::boolean, false),
           coalesce((v_lt ->> 'sort_order')::int, 0))
        on conflict (tenant_id, key) do update
          set label_ko          = excluded.label_ko,
              default_days       = excluded.default_days,
              is_paid            = excluded.is_paid,
              carryover_allowed  = excluded.carryover_allowed,
              evidence_required  = excluded.evidence_required,
              sort_order         = excluded.sort_order,
              updated_at         = now();
      end loop;
      v_del := coalesce(
        (select array_agg(x) from jsonb_array_elements_text(coalesce(v_payload -> 'delete_keys', '[]'::jsonb)) x),
        '{}'::text[]
      );
      if array_length(v_del, 1) is not null then
        delete from leave_types where tenant_id = v_tenant and key = any(v_del);
      end if;

    elsif v_row.target = 'approval_lines' then
      for v_line in select value from jsonb_array_elements(coalesce(v_payload -> 'lines', '[]'::jsonb)) as t(value)
      loop
        if nullif(v_line ->> 'id', '') is not null then
          update approval_lines
             set name         = v_line ->> 'name',
                 request_type = (v_line ->> 'request_type')::approval_request_type,
                 conditions   = coalesce(v_line -> 'conditions', '[]'::jsonb),
                 default_line = coalesce(v_line -> 'default_line', '[]'::jsonb),
                 is_active    = coalesce((v_line ->> 'is_active')::boolean, true),
                 updated_at   = now()
           where id = (v_line ->> 'id')::uuid and tenant_id = v_tenant;
        else
          insert into approval_lines
            (tenant_id, name, request_type, conditions, default_line, is_active)
          values
            (v_tenant, v_line ->> 'name', (v_line ->> 'request_type')::approval_request_type,
             coalesce(v_line -> 'conditions', '[]'::jsonb),
             coalesce(v_line -> 'default_line', '[]'::jsonb),
             coalesce((v_line ->> 'is_active')::boolean, true));
        end if;
      end loop;

    else
      raise exception 'unsupported scheduled setting target: %', v_row.target;
    end if;

    update scheduled_setting_changes
       set status = 'applied', applied_at = now(), error_message = null, updated_at = now()
     where id = p_id
     returning * into v_row;

  exception when others then
    update scheduled_setting_changes
       set status        = (case when attempt_count >= 5 then 'failed' else 'pending' end)::scheduled_setting_change_status,
           error_message = left(sqlerrm, 1000),
           updated_at    = now()
     where id = p_id
     returning * into v_row;
  end;

  return v_row;
end;
$$;

-- =====================================================================
-- 4. apply_one_scheduled_setting_change(id) — 즉시 적용 path (service_role RPC)
--    pending + due 인 경우만 원자 claim 후 apply. cron run_due 와 경합해도 중복 적용 없음.
--    미래 예약(apply_at>now) 또는 이미 claim 된 행이면 현재 상태 그대로 반환(실패 아님).
-- =====================================================================
create or replace function apply_one_scheduled_setting_change(p_id uuid)
returns scheduled_setting_changes
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_claimed boolean;
  v_row     scheduled_setting_changes;
begin
  update scheduled_setting_changes
     set status = 'applying',
         attempt_count = attempt_count + 1,
         last_attempt_at = now(),
         updated_at = now()
   where id = p_id and status = 'pending' and apply_at <= now()
   returning true into v_claimed;

  if v_claimed is not true then
    select * into v_row from scheduled_setting_changes where id = p_id;
    return v_row;
  end if;

  return _apply_claimed_scheduled_setting_change(p_id);
end;
$$;

-- =====================================================================
-- 5. recover_stale_scheduled_setting_changes() — stale 'applying' 복구
--    워커 크래시 등으로 applying 에 멈춘 행을 backoff 재시도(pending) 또는 failed 로 되돌린다.
-- =====================================================================
create or replace function recover_stale_scheduled_setting_changes(
  p_stale_after interval default interval '15 minutes',
  p_max_attempts int default 5
)
returns int
language sql
security definer
set search_path = public, pg_catalog
as $$
  with recovered as (
    update scheduled_setting_changes
       set status        = (case when attempt_count >= p_max_attempts then 'failed' else 'pending' end)::scheduled_setting_change_status,
           error_message = coalesce(error_message, 'recovered from stale applying'),
           updated_at    = now()
     where status = 'applying'
       and last_attempt_at is not null
       and last_attempt_at < now() - p_stale_after
     returning 1
  )
  select count(*)::int from recovered;
$$;

-- =====================================================================
-- 6. run_due_scheduled_setting_changes(limit) — cron entrypoint
--    recover_stale → claim_due(다건) → 각 행 _apply_claimed. 적용 시도 건수 반환.
-- =====================================================================
create or replace function run_due_scheduled_setting_changes(p_limit int default 50)
returns int
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_row     scheduled_setting_changes;
  v_applied int := 0;
begin
  perform recover_stale_scheduled_setting_changes();
  for v_row in select * from claim_due_scheduled_setting_changes(p_limit)
  loop
    perform _apply_claimed_scheduled_setting_change(v_row.id);
    v_applied := v_applied + 1;
  end loop;
  return v_applied;
end;
$$;

-- =====================================================================
-- 7. grants — service-only (KI-109/WI-031 패턴: anon/authenticated 자동 grant 차단)
-- =====================================================================
revoke all on function claim_due_scheduled_setting_changes(int)              from public, anon, authenticated;
revoke all on function _apply_claimed_scheduled_setting_change(uuid)         from public, anon, authenticated;
revoke all on function apply_one_scheduled_setting_change(uuid)              from public, anon, authenticated;
revoke all on function recover_stale_scheduled_setting_changes(interval, int) from public, anon, authenticated;
revoke all on function run_due_scheduled_setting_changes(int)                from public, anon, authenticated;

-- claim_due/apply_one/run_due 는 service_role(즉시 path) + cron(postgres) 호출.
-- _apply_claimed/recover_stale 는 definer 내부 호출만 → 별도 grant 불요(owner=postgres 실행).
grant execute on function claim_due_scheduled_setting_changes(int) to service_role;
grant execute on function apply_one_scheduled_setting_change(uuid) to service_role;
grant execute on function run_due_scheduled_setting_changes(int)   to service_role;

-- =====================================================================
-- 8. pg_cron 설치 + 스케줄 (cron.schedule 는 job_name 기준 upsert — 재실행 idempotent)
-- =====================================================================
create extension if not exists pg_cron;

do $$
begin
  -- 매분 예약 적용 워커
  perform cron.schedule(
    'flowhr-apply-scheduled-settings',
    '* * * * *',
    'select public.run_due_scheduled_setting_changes(50)'
  );
  -- mig 29 audit 보관 cron: 당시 pg_cron 미설치라 미등록 → 이제 설치됐으므로 재등록.
  perform cron.schedule(
    'flowhr-audit-retention',
    '0 3 * * 0',
    'select public.prune_audit_logs()'
  );
end;
$$;
