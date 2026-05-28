-- 조직: departments, employees (SSOT: .flowset/db/erd.md §3)
-- 순환 FK(departments.head_employee_id, users.employee_id)는 employees 생성 후 ALTER.

create table departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  parent_id uuid references departments (id) on delete set null,
  name text not null,
  code text,
  head_employee_id uuid,
  is_active boolean not null default true,
  description text,
  path_cache text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_number text,
  user_id uuid unique references users (id) on delete set null,
  name text not null,
  email text,
  phone text,
  department_id uuid references departments (id) on delete set null,
  position text,
  job_title text,
  employment_type employment_type not null default 'regular',
  status employee_status not null default 'invited',
  joined_at date,
  probation_ends_at date,
  left_at date,
  birth_date date,
  bank_account_encrypted text,
  address jsonb,
  emergency_contact jsonb,
  family_info jsonb,
  avatar_url text,
  role text not null default 'employee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, employee_number),
  unique (tenant_id, email)
);

create index idx_departments_tenant_id on departments (tenant_id);
create index idx_departments_parent_id on departments (parent_id);
create index idx_employees_tenant_id on employees (tenant_id);
create index idx_employees_department_id on employees (department_id);

-- 순환 FK 마무리
alter table departments
  add constraint fk_departments_head_employee foreign key (head_employee_id) references employees (id) on delete set null;
alter table users
  add constraint fk_users_employee foreign key (employee_id) references employees (id) on delete set null;
