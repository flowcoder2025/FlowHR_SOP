-- ST-069 — Realtime publication (notifications / approvals / approval_steps)
-- SSOT: sprint-001.md Day 8~10 그룹 D + dependency-graph.md ST-069
--
-- Supabase Realtime "Postgres Changes"는 supabase_realtime publication에 등록된 테이블만 송출.
-- RLS가 켜진 상태이므로 구독자는 자신의 정책으로 가시한 행 변경만 수신(테넌트/본인 격리 유지).
-- UPDATE/DELETE 시 old record 전체를 payload에 포함하려면 REPLICA IDENTITY FULL 필요.

-- publication 보장 (Supabase 기본 생성되나 방어적으로 확인)
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end;
$$;

-- old record 포함 (UPDATE/DELETE payload)
alter table notifications   replica identity full;
alter table approvals       replica identity full;
alter table approval_steps  replica identity full;

-- publication에 테이블 추가 (이미 등록 시 중복 오류 회피)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'approvals'
  ) then
    alter publication supabase_realtime add table approvals;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'approval_steps'
  ) then
    alter publication supabase_realtime add table approval_steps;
  end if;
end;
$$;
