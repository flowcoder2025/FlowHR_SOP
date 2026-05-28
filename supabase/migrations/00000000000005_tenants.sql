-- 운영사: tenants, tenant_drafts, operator_users (SSOT: .flowset/db/erd.md §2)
-- users 참조 FK(admin_user_id / created_by / operator_users.user_id)는 file 6에서 ALTER 추가.

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_number text unique,
  slug text not null unique,
  representative_name text,
  industry text,
  address text,
  phone text,
  plan_id uuid references plans (id) on delete set null,
  status tenant_status not null default 'active',
  contract_start_date date,
  contract_end_date date,
  user_limit int,
  active_user_count int not null default 0,
  admin_user_id uuid,
  logo_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table tenant_drafts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid,
  current_step int not null default 1,
  form_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table operator_users (
  user_id uuid primary key,
  role operator_role not null,
  is_active boolean not null default true,
  invited_at timestamptz,
  activated_at timestamptz
);
