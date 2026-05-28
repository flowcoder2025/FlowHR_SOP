-- users: auth.users 확장 (SSOT: .flowset/db/erd.md §3 + §5 locale)
-- employee_id FK는 employees 생성 후(file 10) ALTER 추가.

create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  employee_id uuid,
  tenant_id uuid references tenants (id) on delete set null,
  role text,
  totp_enabled boolean not null default false,
  totp_secret_encrypted text,
  recovery_codes_hash text[],
  last_login_at timestamptz,
  last_login_ip text,
  locale text not null default 'ko' check (locale in ('ko', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_locale on users (locale);
create index idx_users_tenant_id on users (tenant_id);

-- 앞선 테이블의 users 참조 FK (생성 순서상 보류했던 것).
alter table tenants
  add constraint fk_tenants_admin_user foreign key (admin_user_id) references users (id) on delete set null;
alter table tenant_drafts
  add constraint fk_tenant_drafts_created_by foreign key (created_by) references users (id) on delete set null;
alter table operator_users
  add constraint fk_operator_users_user foreign key (user_id) references users (id) on delete cascade;
alter table maintenance_windows
  add constraint fk_maintenance_created_by foreign key (created_by) references users (id) on delete set null;
alter table backup_jobs
  add constraint fk_backup_triggered_by foreign key (triggered_by) references users (id) on delete set null;
