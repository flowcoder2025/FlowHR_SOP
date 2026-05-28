-- WI-019 정정 (v1.1 follow-up, migrations.md §5) — 1:1 링크 UNIQUE 제약 보강
-- 출처: WI-019 듀얼검증 codex P2-SCHEMA-002/003 (.flowset/eval-results/WI-019-020.codex.md)
-- approval_id / users.employee_id 는 nullable이며 plain UNIQUE (NULL 다중 허용, NULLS NOT DISTINCT 미사용).

alter table attendance_modifications
  add constraint uq_attendance_modifications_approval_id unique (approval_id);

alter table leaves
  add constraint uq_leaves_approval_id unique (approval_id);

alter table certificate_requests
  add constraint uq_certificate_requests_approval_id unique (approval_id);

alter table employee_change_requests
  add constraint uq_employee_change_requests_approval_id unique (approval_id);

alter table users
  add constraint uq_users_employee_id unique (employee_id);
