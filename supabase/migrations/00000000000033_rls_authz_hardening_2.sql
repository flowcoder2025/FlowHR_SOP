-- WI-019 듀얼검증(codex 2차) P1/P2 정정 라운드 2. PostgreSQL 17.6 (SET NULL 컬럼지정 PG15+).
--
-- (P2) composite FK ON DELETE SET NULL 이 (tenant_id, <ref>) 전체를 NULL화 → tenant_id NOT NULL 위반으로
--      부모(employee/approval) DELETE 실패. PG15+ `set null (<col>)` 로 ref 컬럼만 NULL화하도록 9건 전수 정정.
-- (P1) requester self-routing: approval_steps_insert 에서 is_approval_requester 제거 → admin/service_role 만
--      step 생성(정상 결재 라우팅은 서버 service_role 이 approval_lines 기준 생성). requester 자기-결재자 지정 차단.
-- (P1-2) leaves/attendance_modifications status='approved'/'rejected' 직접 UPDATE를 employee/admin 모두 차단
--      → 승인/반려는 결재 워크플로(service_role RPC, RLS 우회) 매개. admin 겸직 직원 self-approve 경로 폐쇄.

-- =====================================================================
-- 1. SET NULL composite FK 9건 — ref 컬럼만 NULL화 (tenant_id 보존)
-- =====================================================================
alter table leaves drop constraint if exists leaves_substitute_employee_tenant_fk;
alter table leaves add constraint leaves_substitute_employee_tenant_fk
  foreign key (tenant_id, substitute_employee_id) references employees (tenant_id, id)
  on delete set null (substitute_employee_id);

alter table leaves drop constraint if exists leaves_approval_tenant_fk;
alter table leaves add constraint leaves_approval_tenant_fk
  foreign key (tenant_id, approval_id) references approvals (tenant_id, id)
  on delete set null (approval_id);

alter table attendances drop constraint if exists attendances_modified_by_tenant_fk;
alter table attendances add constraint attendances_modified_by_tenant_fk
  foreign key (tenant_id, modified_by) references employees (tenant_id, id)
  on delete set null (modified_by);

alter table approval_steps drop constraint if exists approval_steps_approver_tenant_fk;
alter table approval_steps add constraint approval_steps_approver_tenant_fk
  foreign key (tenant_id, approver_id) references employees (tenant_id, id)
  on delete set null (approver_id);

alter table attendance_modifications drop constraint if exists attendance_modifications_approval_tenant_fk;
alter table attendance_modifications add constraint attendance_modifications_approval_tenant_fk
  foreign key (tenant_id, approval_id) references approvals (tenant_id, id)
  on delete set null (approval_id);

alter table certificate_requests drop constraint if exists certificate_requests_approval_tenant_fk;
alter table certificate_requests add constraint certificate_requests_approval_tenant_fk
  foreign key (tenant_id, approval_id) references approvals (tenant_id, id)
  on delete set null (approval_id);

alter table documents drop constraint if exists documents_owner_tenant_fk;
alter table documents add constraint documents_owner_tenant_fk
  foreign key (tenant_id, owner_id) references employees (tenant_id, id)
  on delete set null (owner_id);

alter table employee_change_requests drop constraint if exists employee_change_requests_approval_tenant_fk;
alter table employee_change_requests add constraint employee_change_requests_approval_tenant_fk
  foreign key (tenant_id, approval_id) references approvals (tenant_id, id)
  on delete set null (approval_id);

alter table signatures drop constraint if exists signatures_signer_employee_tenant_fk;
alter table signatures add constraint signatures_signer_employee_tenant_fk
  foreign key (tenant_id, signer_employee_id) references employees (tenant_id, id)
  on delete set null (signer_employee_id);

-- =====================================================================
-- 2. requester self-routing 차단 — approval_steps INSERT는 관리자(+service_role 우회)만
-- =====================================================================
drop policy if exists approval_steps_insert on approval_steps;
create policy approval_steps_insert on approval_steps for insert with check (
  tenant_id = current_tenant_id() and is_tenant_admin()
);

-- =====================================================================
-- 3. 승인/반려 직접 설정 차단 — leaves / attendance_modifications (employee + admin 공통)
--    approved/rejected 전이는 결재 워크플로(service_role) 매개. service_role 은 RLS 우회.
-- =====================================================================
drop policy if exists leaves_update on leaves;
create policy leaves_update on leaves for update
  using (tenant_id = current_tenant_id() and (is_tenant_admin() or employee_id = current_employee_id()))
  with check (
    tenant_id = current_tenant_id() and (
      (is_tenant_admin() and status not in ('approved', 'rejected'))
      or (employee_id = current_employee_id() and status in ('draft', 'pending', 'cancelled'))
    )
  );

drop policy if exists attmod_update on attendance_modifications;
create policy attmod_update on attendance_modifications for update
  using (tenant_id = current_tenant_id() and (is_tenant_admin() or employee_id = current_employee_id()))
  with check (
    tenant_id = current_tenant_id() and (
      (is_tenant_admin() and status not in ('approved', 'rejected'))
      or (employee_id = current_employee_id() and status in ('draft', 'pending', 'cancelled'))
    )
  );
