-- 기능 플래그 오버라이드 (SSOT: .flowset/db/erd.md §2)

create table feature_flag_overrides (
  flag_key text not null references feature_flags (key) on delete cascade,
  tenant_id uuid not null references tenants (id) on delete cascade,
  value boolean not null,
  created_by uuid references users (id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  primary key (flag_key, tenant_id)
);

create index idx_feature_flag_overrides_tenant_id on feature_flag_overrides (tenant_id);
