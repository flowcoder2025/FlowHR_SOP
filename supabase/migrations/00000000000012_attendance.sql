-- 근태 (SSOT: .flowset/db/erd.md §3)
-- 위치는 ERD의 point 대안으로 jsonb {lat,lng} 채택 (PostGIS 미사용, db/migrations.md "postgis 선택").
-- attendance_modifications.approval_id FK는 approvals 생성 후(file 14) ALTER.

create table attendances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  work_date date not null,
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  break_minutes int not null default 0,
  work_type work_type not null default 'office',
  status attendance_status not null default 'normal',
  clock_in_location jsonb,
  clock_out_location jsonb,
  device_id text,
  modified_by uuid references employees (id) on delete set null,
  modification_reason text,
  work_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table attendance_modifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  attendance_id uuid references attendances (id) on delete set null,
  target_date date,
  request_type modification_request_type not null,
  original_value timestamptz,
  requested_value timestamptz,
  reason text,
  attachment_ids uuid[] not null default '{}',
  approval_id uuid,
  status approval_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_attendances_tenant_id on attendances (tenant_id);
create index idx_attendances_employee_date on attendances (employee_id, work_date);
create index idx_attendance_mods_tenant_id on attendance_modifications (tenant_id);
create index idx_attendance_mods_employee_id on attendance_modifications (employee_id);
