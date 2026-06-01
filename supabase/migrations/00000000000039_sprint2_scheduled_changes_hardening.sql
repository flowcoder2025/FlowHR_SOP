-- Sprint 2 — scheduled_setting_changes 보안 하드닝 (WI-031 듀얼검증 hotfix)
-- 듀얼검증 P1(evaluator): claim_due_scheduled_setting_changes(security definer)의 EXECUTE 가
--   Supabase pg_default_acl 로 anon/authenticated 에 잔존 → `revoke all from public` 만으론 무력
--   (mig 31 record_login_failure 와 동일 클래스). 임의 인증/익명 사용자가 RPC 호출 시 전 테넌트
--   pending 행 claim + returning sc.* 로 cross-tenant payload 유출(RLS 우회) + cron starvation/DoS.
-- 듀얼검증 P2(codex): update 정책이 operator/tenant_admin 에게 status 전이 컬럼 전체 조작 허용 →
--   pending 행을 pending/cancelled 로만 변경 허용. applying/applied/failed 전이는 service_role
--   claim 함수(security definer) 전용.

set search_path = public, extensions;

-- P1: security definer claim 함수 RPC 노출 차단 (mig 31 패턴 일치)
revoke execute on function claim_due_scheduled_setting_changes(int) from public, anon, authenticated;

-- P2: update 정책 축소 — operator/tenant_admin 은 pending 행을 pending/cancelled 로만 변경 가능
drop policy if exists scheduled_setting_changes_update on scheduled_setting_changes;
create policy scheduled_setting_changes_update on scheduled_setting_changes
  for update
  using (
    status = 'pending'
    and (is_operator() or (tenant_id = current_tenant_id() and is_tenant_admin()))
  )
  with check (
    status in ('pending', 'cancelled')
    and (is_operator() or (tenant_id = current_tenant_id() and is_tenant_admin()))
  );
