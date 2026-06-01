-- Sprint 2 — scheduled_setting_changes INSERT target 범위 제한 (WI-032 듀얼검증 hotfix, codex P2)
-- 결함: mig 37 INSERT 정책은 target 제한이 없어, tenant_admin 이 Data API(/rest/v1/scheduled_setting_changes)로
--   미구현 target(roles/notifications/document_templates/security)을 직접 큐에 적재할 수 있다.
--   비인가 적용은 없으나(apply 엔진이 'unsupported target' 예외 → 재시도/failed), cron 재시도/실패 큐 오염 가능.
-- 조치: WI-032 가 실제 구현한 P0 4 target 으로 INSERT with-check 를 좁힌다.
--   후속 WI 가 target 을 추가 구현하면 본 정책을 확장한다(check constraint 의 8 target 은 큐 스키마 상한 유지).

set search_path = public, pg_catalog;

drop policy if exists scheduled_setting_changes_insert on scheduled_setting_changes;
create policy scheduled_setting_changes_insert on scheduled_setting_changes
  for insert with check (
    target in ('company', 'work_policy', 'leave_policy', 'approval_lines')
    and (
      (is_operator() and created_by = auth.uid())
      or (tenant_id = current_tenant_id() and is_tenant_admin() and created_by = auth.uid())
    )
  );
