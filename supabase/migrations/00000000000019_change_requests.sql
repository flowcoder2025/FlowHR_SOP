-- 직원 정보 변경 요청 (SSOT: .flowset/db/erd.md §3)

create table employee_change_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  field_name text not null,
  old_value jsonb,
  new_value jsonb,
  reason text,
  approval_id uuid references approvals (id) on delete set null,
  status change_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_employee_change_requests_employee_id on employee_change_requests (employee_id);
create index idx_employee_change_requests_tenant_id on employee_change_requests (tenant_id);
