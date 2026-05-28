-- 글로벌 테이블 (SSOT: .flowset/db/erd.md §2)
-- created_by / triggered_by 의 users FK는 users 생성 후(file 6)에 ALTER로 추가.

create table plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  base_price_krw int,
  per_user_price_krw int,
  included_users int,
  modules text[] not null default '{}',
  status plan_status not null default 'active',
  is_public boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table feature_flags (
  key text primary key,
  label_ko text,
  description text,
  module text,
  global_state feature_flag_state not null default 'inactive',
  plan_ids uuid[] not null default '{}',
  is_beta boolean not null default false,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table roles (
  key text primary key,
  label_ko text,
  default_permissions jsonb not null default '{}'::jsonb,
  is_system boolean not null default false
);

create table system_settings (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null default 'FlowHR',
  brand_logo_url text,
  brand_logo_url_dark text,
  password_policy jsonb,
  session_policy jsonb,
  require_operator_2fa boolean not null default true,
  mail_config jsonb,
  notification_channels jsonb,
  data_retention jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table maintenance_windows (
  id uuid primary key default gen_random_uuid(),
  status maintenance_status not null default 'inactive',
  message_ko text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  activated_at timestamptz,
  deactivated_at timestamptz,
  created_by uuid
);

create table backup_jobs (
  id uuid primary key default gen_random_uuid(),
  status backup_status not null default 'pending',
  kind backup_kind not null default 'auto',
  storage_url text,
  size_bytes bigint,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  triggered_by uuid
);
