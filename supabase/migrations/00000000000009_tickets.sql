-- 지원 티켓 (SSOT: .flowset/db/erd.md §2)

create table tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete set null,
  ticket_number text not null unique,
  title text not null,
  type ticket_type not null default 'inquiry',
  priority ticket_priority not null default 'p2',
  status ticket_status not null default 'open',
  assigned_to uuid references users (id) on delete set null,
  requester_id uuid references users (id) on delete set null,
  sla_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets (id) on delete cascade,
  author_id uuid references users (id) on delete set null,
  body text not null,
  is_internal boolean not null default false,
  attachment_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_tickets_tenant_id on tickets (tenant_id);
create index idx_ticket_messages_ticket_id on ticket_messages (ticket_id);
