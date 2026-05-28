-- 결재 (SSOT: .flowset/db/erd.md §3, KI-014 polymorphic routing)
-- request_object_id는 polymorphic(휴가/근태수정/증명서/정보변경/문서)이라 FK 없음.

create table approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  requester_id uuid not null references employees (id) on delete cascade,
  request_type approval_request_type not null,
  request_object_id uuid,
  title text,
  status approval_status not null default 'pending',
  current_step int not null default 0,
  total_steps int not null default 0,
  sla_deadline timestamptz,
  requested_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table approval_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  approval_id uuid not null references approvals (id) on delete cascade,
  step_order int not null,
  approver_id uuid references employees (id) on delete set null,
  status approval_step_status not null default 'pending',
  comment text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_approvals_tenant_id on approvals (tenant_id);
create index idx_approvals_requester_id on approvals (requester_id);
create index idx_approval_steps_approval_id on approval_steps (approval_id);
create index idx_approval_steps_approver_id on approval_steps (approver_id);

-- polymorphic 1:1 결재 링크 FK (해당 테이블이 먼저 생성되어 보류했던 것).
alter table attendance_modifications
  add constraint fk_attendance_mods_approval foreign key (approval_id) references approvals (id) on delete set null;
alter table leaves
  add constraint fk_leaves_approval foreign key (approval_id) references approvals (id) on delete set null;
