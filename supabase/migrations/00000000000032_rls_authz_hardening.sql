-- WI-019 듀얼검증(codex) P1/P2 정정 — RLS 인가 강화 + KI-077 approval_id composite 완성
-- 2026-05-29. 근거: codex WI-019 코드리뷰 (P1 4 + P2 2).

-- =====================================================================
-- P1-1 / P2: 쓰기 시 tenant_id 오귀속 차단 (tickets / ticket_messages / user_consents INSERT)
-- =====================================================================
drop policy tickets_insert on tickets;
create policy tickets_insert on tickets for insert with check (
  is_operator() or (requester_id = auth.uid() and tenant_id = current_tenant_id())
);

drop policy ticket_messages_insert on ticket_messages;
create policy ticket_messages_insert on ticket_messages for insert with check (
  author_id = auth.uid()
  and (is_internal = false or is_operator() or is_tenant_admin())
  and exists (
    select 1 from public.tickets t
    where t.id = ticket_messages.ticket_id and (
      is_operator() or t.requester_id = auth.uid()
      or (is_tenant_admin() and t.tenant_id = current_tenant_id())
    )
  )
);

drop policy consents_self_insert on user_consents;
create policy consents_self_insert on user_consents for insert with check (
  user_id = auth.uid() and tenant_id is not distinct from current_tenant_id()
);

-- =====================================================================
-- P1-2: 직원 자기 leaves / attendance_modifications 자기승인 차단 (status 전이 제한)
--       USING(소유)으로 본인 행만, WITH CHECK 로 비관리자는 비-승인 상태로만 전이.
-- =====================================================================
drop policy leaves_update on leaves;
create policy leaves_update on leaves for update
  using (tenant_id = current_tenant_id() and (is_tenant_admin() or employee_id = current_employee_id()))
  with check (
    tenant_id = current_tenant_id() and (
      is_tenant_admin()
      or (employee_id = current_employee_id() and status in ('draft', 'pending', 'cancelled'))
    )
  );

drop policy attmod_update on attendance_modifications;
create policy attmod_update on attendance_modifications for update
  using (tenant_id = current_tenant_id() and (is_tenant_admin() or employee_id = current_employee_id()))
  with check (
    tenant_id = current_tenant_id() and (
      is_tenant_admin()
      or (employee_id = current_employee_id() and status in ('draft', 'pending', 'cancelled'))
    )
  );

-- =====================================================================
-- P1-3: approvals / approval_steps 자기승인 + 라우팅 컬럼 변경 차단
--   (a) WITH CHECK 로 요청자는 승인/반려 불가(취소/진행만), 승인은 현재단계 결재자/관리자만
--   (b) BEFORE UPDATE 트리거로 라우팅/소유 컬럼 불변 (operator/service_role 우회)
-- =====================================================================
drop policy approvals_update on approvals;
create policy approvals_update on approvals for update
  using (
    tenant_id = current_tenant_id() and (
      is_tenant_admin()
      or is_approval_step_approver(id, true)
      or (requester_id = current_employee_id() and status in ('pending', 'in_progress'))
    )
  )
  with check (
    tenant_id = current_tenant_id() and (
      is_tenant_admin()
      or is_approval_step_approver(id, true)
      or (requester_id = current_employee_id() and status in ('pending', 'in_progress', 'cancelled'))
    )
  );

drop policy approval_steps_update on approval_steps;
create policy approval_steps_update on approval_steps for update
  using (
    tenant_id = current_tenant_id() and (
      is_tenant_admin() or (approver_id = current_employee_id() and status = 'pending')
    )
  )
  with check (
    tenant_id = current_tenant_id() and (is_tenant_admin() or approver_id = current_employee_id())
  );

create or replace function lock_approval_routing_columns() returns trigger
  language plpgsql set search_path = public, pg_catalog as $$
begin
  -- 관리 경로(operator/service_role/슈퍼유저)는 우회. invoker 트리거이므로 current_user=실제 호출 role.
  if is_operator() or current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;
  if tg_table_name = 'approvals' then
    if new.tenant_id is distinct from old.tenant_id
       or new.requester_id is distinct from old.requester_id
       or new.request_type is distinct from old.request_type then
      raise exception 'approvals 라우팅/소유 컬럼은 변경할 수 없습니다 (tenant_id/requester_id/request_type)';
    end if;
  elsif tg_table_name = 'approval_steps' then
    if new.tenant_id is distinct from old.tenant_id
       or new.approval_id is distinct from old.approval_id
       or new.approver_id is distinct from old.approver_id
       or new.step_order is distinct from old.step_order then
      raise exception 'approval_steps 라우팅 컬럼은 변경할 수 없습니다 (approval_id/approver_id/step_order)';
    end if;
  end if;
  return new;
end;
$$;
create trigger lock_approvals_routing
  before update on approvals for each row execute function lock_approval_routing_columns();
create trigger lock_approval_steps_routing
  before update on approval_steps for each row execute function lock_approval_routing_columns();

-- =====================================================================
-- P1-4: KI-077 완성 — 폴리모픽 approval_id 링크 composite FK 전환
--       (leaves / attendance_modifications / certificate_requests / employee_change_requests)
--       동일 테넌트 approval 만 참조하도록 DB 강제. nullable → on delete set null.
-- =====================================================================
alter table leaves drop constraint if exists fk_leaves_approval;
alter table leaves add constraint leaves_approval_tenant_fk
  foreign key (tenant_id, approval_id) references approvals (tenant_id, id) on delete set null;

alter table attendance_modifications drop constraint if exists fk_attendance_mods_approval;
alter table attendance_modifications add constraint attendance_modifications_approval_tenant_fk
  foreign key (tenant_id, approval_id) references approvals (tenant_id, id) on delete set null;

alter table certificate_requests drop constraint if exists certificate_requests_approval_id_fkey;
alter table certificate_requests add constraint certificate_requests_approval_tenant_fk
  foreign key (tenant_id, approval_id) references approvals (tenant_id, id) on delete set null;

alter table employee_change_requests drop constraint if exists employee_change_requests_approval_id_fkey;
alter table employee_change_requests add constraint employee_change_requests_approval_tenant_fk
  foreign key (tenant_id, approval_id) references approvals (tenant_id, id) on delete set null;
