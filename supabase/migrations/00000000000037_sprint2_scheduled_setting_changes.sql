-- Sprint 2 — 회사설정 적용일 예약 큐 (WI-031, TS-147 적용일 예약 cron)
-- SSOT: .flowset/sprints/sprint-002.md DoD "적용일 예약 cron" + .flowset/backlog/tasks.md TS-147
-- 미래 예약 상태는 본 큐가 단독 소유. due 시점에 service_role cron이 claim → 실제 target 테이블 적용.
-- work_policies.applied_from은 "이미 적용된 정책의 효력일"이고, 예약 대기 상태는 여기에만 존재(역할 분담).

set search_path = public, extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'scheduled_setting_change_status') then
    create type scheduled_setting_change_status as enum
      ('pending', 'applying', 'applied', 'failed', 'cancelled');
  end if;
end
$$;

create table if not exists scheduled_setting_changes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  target text not null,
  payload jsonb not null default '{}'::jsonb,
  apply_at timestamptz not null,
  status scheduled_setting_change_status not null default 'pending',
  created_by uuid references users (id) on delete set null,
  applied_at timestamptz,
  cancelled_at timestamptz,
  error_message text,
  attempt_count int not null default 0,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduled_setting_changes_target_check check (
    target in (
      'company',
      'work_policy',
      'leave_policy',
      'approval_lines',
      'roles',
      'notifications',
      'document_templates',
      'security'
    )
  ),
  constraint scheduled_setting_changes_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint scheduled_setting_changes_attempt_count_nonnegative check (attempt_count >= 0)
);

-- due 큐 스캔(cron): pending + apply_at 도래.
create index if not exists idx_scheduled_setting_changes_pending_due
  on scheduled_setting_changes (apply_at, id)
  where status = 'pending';

-- TA-13 탭별 예약 이력 조회.
create index if not exists idx_scheduled_setting_changes_tenant_status_apply_at
  on scheduled_setting_changes (tenant_id, status, apply_at desc);

create index if not exists idx_scheduled_setting_changes_created_by
  on scheduled_setting_changes (created_by);

-- ── RLS (mig 3/27 헬퍼 그대로: operator 전체 / tenant_admin 자기 테넌트) ──────────
alter table scheduled_setting_changes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scheduled_setting_changes'
      and policyname = 'scheduled_setting_changes_read'
  ) then
    create policy scheduled_setting_changes_read on scheduled_setting_changes
      for select using (
        is_operator()
        or (tenant_id = current_tenant_id() and is_tenant_admin())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scheduled_setting_changes'
      and policyname = 'scheduled_setting_changes_insert'
  ) then
    create policy scheduled_setting_changes_insert on scheduled_setting_changes
      for insert with check (
        (is_operator() and created_by = auth.uid())
        or (tenant_id = current_tenant_id() and is_tenant_admin() and created_by = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scheduled_setting_changes'
      and policyname = 'scheduled_setting_changes_update'
  ) then
    create policy scheduled_setting_changes_update on scheduled_setting_changes
      for update using (
        is_operator()
        or (tenant_id = current_tenant_id() and is_tenant_admin())
      )
      with check (
        is_operator()
        or (tenant_id = current_tenant_id() and is_tenant_admin())
      );
  end if;
end
$$;

-- ── cron claim: pending → applying 원자 전환(skip locked), service_role 전용 ─────
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
      order by apply_at asc, id asc
      for update skip locked
      limit least(greatest(coalesce(p_limit, 50), 1), 100)
   )
  returning sc.*;
$$;

revoke all on function claim_due_scheduled_setting_changes(int) from public;
grant execute on function claim_due_scheduled_setting_changes(int) to service_role;

-- ── audit 트리거(mig 29 audit_row_change 존재 시) ───────────────────────────────
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'audit_row_change'
  )
  and not exists (
    select 1 from pg_trigger where tgname = 'audit_scheduled_setting_changes'
  ) then
    create trigger audit_scheduled_setting_changes
      after insert or update or delete on scheduled_setting_changes
      for each row execute function audit_row_change();
  end if;
end
$$;
