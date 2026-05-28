-- KI-077 — 멀티테넌트 교차참조 방지 composite FK (DB 레벨 defense-in-depth)
-- SSOT: .flowset/known-issues/INDEX.md KI-077 + codex 협의 2026-05-29 (단일 권고: composite FK 핵심부 한정)
--
-- 문제: tenant-scoped 자식(leaves 등)의 employee_id/leave_type_id/approval_id가 단일 FK라
--       부모 테넌트 동일성을 DB가 강제하지 못함 → 교차 테넌트 UUID 조합 가능.
-- 조치: 부모(employees/leave_types/approvals)에 UNIQUE (tenant_id, id) 추가 + 핵심 자식 FK를
--       (tenant_id, <ref>) → 부모(tenant_id, id) composite FK로 전환.
-- 범위: codex 권고대로 핵심 HR/결재 참조부만. legal_documents/user_consents 등 글로벌·동의 도메인 제외.
--       approval_lines는 현 스키마에 FK 참조자가 없어(요청은 request_type 논리 매핑) 대상 제외.
-- NULL 허용 컬럼은 MATCH SIMPLE 기본 동작으로 NULL 시 미검사(기존 nullable 의미 보존).

-- ---------------------------------------------------------------------
-- 1. 부모 UNIQUE (tenant_id, id) — composite FK 타깃
-- ---------------------------------------------------------------------
alter table employees   add constraint employees_tenant_id_id_uniq   unique (tenant_id, id);
alter table leave_types add constraint leave_types_tenant_id_id_uniq unique (tenant_id, id);
alter table approvals   add constraint approvals_tenant_id_id_uniq   unique (tenant_id, id);

-- ---------------------------------------------------------------------
-- 2. employees 참조 자식 → (tenant_id, <employee_ref>) composite
-- ---------------------------------------------------------------------

-- leaves.employee_id (NOT NULL, cascade) + substitute_employee_id (nullable, set null)
alter table leaves drop constraint if exists leaves_employee_id_fkey;
alter table leaves add constraint leaves_employee_tenant_fk
  foreign key (tenant_id, employee_id) references employees (tenant_id, id) on delete cascade;
alter table leaves drop constraint if exists leaves_substitute_employee_id_fkey;
alter table leaves add constraint leaves_substitute_employee_tenant_fk
  foreign key (tenant_id, substitute_employee_id) references employees (tenant_id, id) on delete set null;

-- leave_balances.employee_id (cascade)
alter table leave_balances drop constraint if exists leave_balances_employee_id_fkey;
alter table leave_balances add constraint leave_balances_employee_tenant_fk
  foreign key (tenant_id, employee_id) references employees (tenant_id, id) on delete cascade;

-- attendances.employee_id (cascade) + modified_by (nullable, set null)
alter table attendances drop constraint if exists attendances_employee_id_fkey;
alter table attendances add constraint attendances_employee_tenant_fk
  foreign key (tenant_id, employee_id) references employees (tenant_id, id) on delete cascade;
alter table attendances drop constraint if exists attendances_modified_by_fkey;
alter table attendances add constraint attendances_modified_by_tenant_fk
  foreign key (tenant_id, modified_by) references employees (tenant_id, id) on delete set null;

-- attendance_modifications.employee_id (cascade)
alter table attendance_modifications drop constraint if exists attendance_modifications_employee_id_fkey;
alter table attendance_modifications add constraint attendance_modifications_employee_tenant_fk
  foreign key (tenant_id, employee_id) references employees (tenant_id, id) on delete cascade;

-- approvals.requester_id (NOT NULL, cascade)
alter table approvals drop constraint if exists approvals_requester_id_fkey;
alter table approvals add constraint approvals_requester_tenant_fk
  foreign key (tenant_id, requester_id) references employees (tenant_id, id) on delete cascade;

-- approval_steps.approver_id (nullable, set null)
alter table approval_steps drop constraint if exists approval_steps_approver_id_fkey;
alter table approval_steps add constraint approval_steps_approver_tenant_fk
  foreign key (tenant_id, approver_id) references employees (tenant_id, id) on delete set null;

-- certificate_requests.employee_id (cascade)
alter table certificate_requests drop constraint if exists certificate_requests_employee_id_fkey;
alter table certificate_requests add constraint certificate_requests_employee_tenant_fk
  foreign key (tenant_id, employee_id) references employees (tenant_id, id) on delete cascade;

-- employee_change_requests.employee_id (cascade)
alter table employee_change_requests drop constraint if exists employee_change_requests_employee_id_fkey;
alter table employee_change_requests add constraint employee_change_requests_employee_tenant_fk
  foreign key (tenant_id, employee_id) references employees (tenant_id, id) on delete cascade;

-- documents.owner_id (nullable, set null)
alter table documents drop constraint if exists documents_owner_id_fkey;
alter table documents add constraint documents_owner_tenant_fk
  foreign key (tenant_id, owner_id) references employees (tenant_id, id) on delete set null;

-- signatures.signer_employee_id (nullable, set null)
alter table signatures drop constraint if exists signatures_signer_employee_id_fkey;
alter table signatures add constraint signatures_signer_employee_tenant_fk
  foreign key (tenant_id, signer_employee_id) references employees (tenant_id, id) on delete set null;

-- ---------------------------------------------------------------------
-- 3. leave_types 참조 자식 → (tenant_id, leave_type_id) composite
-- ---------------------------------------------------------------------
alter table leaves drop constraint if exists leaves_leave_type_id_fkey;
alter table leaves add constraint leaves_leave_type_tenant_fk
  foreign key (tenant_id, leave_type_id) references leave_types (tenant_id, id) on delete restrict;

alter table leave_balances drop constraint if exists leave_balances_leave_type_id_fkey;
alter table leave_balances add constraint leave_balances_leave_type_tenant_fk
  foreign key (tenant_id, leave_type_id) references leave_types (tenant_id, id) on delete restrict;

-- ---------------------------------------------------------------------
-- 4. approvals 참조 자식 → (tenant_id, approval_id) composite
-- ---------------------------------------------------------------------
alter table approval_steps drop constraint if exists approval_steps_approval_id_fkey;
alter table approval_steps add constraint approval_steps_approval_tenant_fk
  foreign key (tenant_id, approval_id) references approvals (tenant_id, id) on delete cascade;

-- 보조 인덱스 — composite FK 참조 컬럼 페어 (조인/제약 검사 성능)
create index if not exists idx_leaves_tenant_employee on leaves (tenant_id, employee_id);
create index if not exists idx_leaves_tenant_leave_type on leaves (tenant_id, leave_type_id);
create index if not exists idx_leave_balances_tenant_employee on leave_balances (tenant_id, employee_id);
create index if not exists idx_attendances_tenant_employee on attendances (tenant_id, employee_id);
create index if not exists idx_approvals_tenant_requester on approvals (tenant_id, requester_id);
create index if not exists idx_approval_steps_tenant_approval on approval_steps (tenant_id, approval_id);
