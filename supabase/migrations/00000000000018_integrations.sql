-- 연동/API 키 (SSOT: .flowset/db/erd.md §4)

create table integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  type text not null,
  status integration_status not null default 'disconnected',
  credentials_encrypted jsonb,
  config jsonb,
  last_synced_at timestamptz,
  failure_count_24h int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table integration_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  integration_id uuid not null references integrations (id) on delete cascade,
  event_type text,
  request_payload jsonb,
  response_payload jsonb,
  http_status int,
  error_message text,
  created_at timestamptz not null default now()
);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete cascade,
  key_hash text not null unique,
  label text,
  owner_type text not null default 'tenant',
  created_by uuid references users (id) on delete set null,
  scopes text[] not null default '{}',
  reason text,
  expires_at date,
  last_used_at timestamptz,
  usage_count int not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_integrations_tenant_id on integrations (tenant_id);
create index idx_integration_logs_integration_id on integration_logs (integration_id);
create index idx_api_keys_tenant_id on api_keys (tenant_id);
