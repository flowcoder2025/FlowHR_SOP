-- 알림 (SSOT: .flowset/db/erd.md §3)

create table notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  type notification_type not null,
  title text,
  message text,
  link_url text,
  metadata jsonb,
  read_status boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_id on notifications (user_id);
create index idx_notifications_user_unread on notifications (user_id) where read_status = false;
