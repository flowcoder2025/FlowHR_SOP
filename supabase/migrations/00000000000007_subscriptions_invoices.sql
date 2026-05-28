-- 구독/청구 (SSOT: .flowset/db/erd.md §2)

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  plan_id uuid references plans (id) on delete set null,
  latched_price_per_user int,
  latched_base_price int,
  period_start date,
  period_end date,
  billing_cycle billing_cycle not null default 'monthly',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  subscription_id uuid references subscriptions (id) on delete set null,
  invoice_number text not null unique,
  period_month date,
  active_users int,
  subtotal_krw bigint,
  tax_krw bigint,
  total_krw bigint,
  status invoice_status not null default 'draft',
  issued_at date,
  due_date date,
  paid_at date,
  payment_method text,
  tax_invoice_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_tenant_id on subscriptions (tenant_id);
create index idx_invoices_tenant_id on invoices (tenant_id);
