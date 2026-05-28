-- 휴가 (SSOT: .flowset/db/erd.md §3)
-- leaves.approval_id FK는 approvals 생성 후(file 14) ALTER.

create table leaves (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  leave_type_id uuid not null references leave_types (id) on delete restrict,
  start_date date,
  end_date date,
  half_day half_day not null default 'none',
  used_days numeric not null default 0,
  reason text,
  substitute_employee_id uuid references employees (id) on delete set null,
  attachment_ids uuid[] not null default '{}',
  approval_id uuid,
  status leave_status not null default 'draft',
  requested_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table leave_balances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  leave_type_id uuid not null references leave_types (id) on delete restrict,
  year int not null,
  granted numeric not null default 0,
  used numeric not null default 0,
  scheduled numeric not null default 0,
  remaining numeric generated always as (granted - used - scheduled) stored,
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, employee_id, leave_type_id, year)
);

create index idx_leaves_tenant_id on leaves (tenant_id);
create index idx_leaves_employee_id on leaves (employee_id);
create index idx_leave_balances_employee_id on leave_balances (employee_id);
