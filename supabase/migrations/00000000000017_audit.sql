-- 감사 로그 (SSOT: .flowset/db/erd.md §3, rls.md §6)
-- 21개 테이블 AFTER 트리거(자동 캡처)는 ST-068(Sprint 1 Day 8)에서 별도 마이그레이션.
-- tenant_id/actor_id는 FK 미설정 — append-only 감사 이력은 테넌트/유저 삭제 후에도 보존.

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  actor_role text,
  action text not null,
  target_type text,
  target_id uuid,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  request_id text,
  result audit_result not null default 'success',
  created_at timestamptz not null default now()
);

create index idx_audit_logs_tenant_id on audit_logs (tenant_id);
create index idx_audit_logs_actor_id on audit_logs (actor_id);
create index idx_audit_logs_created_at on audit_logs (created_at);
create index idx_audit_logs_target on audit_logs (target_type, target_id);
