-- 회사 설정/정책 (SSOT: .flowset/db/erd.md §3, §4)

create table tenant_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants (id) on delete cascade,
  company_info jsonb,
  security_policy jsonb,
  notification_config jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table work_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  standard_clock_in time,
  standard_clock_out time,
  late_threshold time,
  break_minutes_default int not null default 0,
  weekly_max_hours int not null default 52,
  applicable_departments text[] not null default '{}',
  is_default boolean not null default false,
  applied_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table leave_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  key text not null,
  label_ko text,
  default_days int not null default 0,
  evidence_required boolean not null default false,
  carryover_allowed boolean not null default false,
  is_paid boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, key)
);

create table approval_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  request_type approval_request_type not null,
  conditions jsonb not null default '[]'::jsonb,
  default_line jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table document_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  key text not null,
  label_ko text,
  template_body text,
  variables text[] not null default '{}',
  template_format text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_work_policies_tenant_id on work_policies (tenant_id);
create index idx_leave_types_tenant_id on leave_types (tenant_id);
create index idx_approval_lines_tenant_id on approval_lines (tenant_id);
create index idx_document_templates_tenant_id on document_templates (tenant_id);
