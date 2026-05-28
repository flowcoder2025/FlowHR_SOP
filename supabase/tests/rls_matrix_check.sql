-- RLS / composite FK / audit / immutability / 인가 검증 (ST-005·ST-068·KI-077 + codex P1 정정)
-- SSOT: .flowset/db/rls.md + .flowset/known-issues/INDEX.md KI-077
--
-- 실행: supabase MCP execute_sql 또는 psql 로 전체 실행. BEGIN..ROLLBACK 으로 데이터 비영속.
-- 성공 시 마지막 'ALL_RLS_ASSERTIONS_PASS' 반환. 한 assertion이라도 실패하면 RAISE EXCEPTION 으로 중단.
-- 헬퍼가 SECURITY DEFINER public.users 조회 기반이므로 request.jwt.claims.sub + SET ROLE authenticated 로 행위자 시뮬레이션.
-- 본 WI(2026-05-29) staging 실행 결과: ALL_RLS_ASSERTIONS_PASS (T1~T10).
-- 역할: operator_super / tenant_super / tenant_manager / employee 커버. operator_staff/tenant_hr_admin 음성케이스는 Phase 8 QA 확장.

begin;
-- ===== seed (postgres) =====
insert into auth.users (id) values
  ('a0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000004'),
  ('a0000000-0000-4000-8000-000000000005');
insert into tenants (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111','TenantA','rls-test-tenant-a'),
  ('22222222-2222-2222-2222-222222222222','TenantB','rls-test-tenant-b');
insert into departments (id, tenant_id, name) values
  ('90000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','DeptA');
insert into public.users (id, role, tenant_id) values
  ('a0000000-0000-4000-8000-000000000001','operator_super',null),
  ('a0000000-0000-4000-8000-000000000002','tenant_super','11111111-1111-1111-1111-111111111111'),
  ('a0000000-0000-4000-8000-000000000003','employee','11111111-1111-1111-1111-111111111111'),
  ('a0000000-0000-4000-8000-000000000004','employee','22222222-2222-2222-2222-222222222222'),
  ('a0000000-0000-4000-8000-000000000005','tenant_manager','11111111-1111-1111-1111-111111111111');
insert into employees (id, tenant_id, name, role, user_id, department_id) values
  ('b0000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','AdminA','tenant_super','a0000000-0000-4000-8000-000000000002',null),
  ('b0000000-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111','EmpA','employee','a0000000-0000-4000-8000-000000000003','90000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000004','22222222-2222-2222-2222-222222222222','EmpB','employee','a0000000-0000-4000-8000-000000000004',null),
  ('b0000000-0000-4000-8000-000000000005','11111111-1111-1111-1111-111111111111','MgrA','tenant_manager','a0000000-0000-4000-8000-000000000005','90000000-0000-4000-8000-000000000001');
update public.users set employee_id='b0000000-0000-4000-8000-000000000002' where id='a0000000-0000-4000-8000-000000000002';
update public.users set employee_id='b0000000-0000-4000-8000-000000000003' where id='a0000000-0000-4000-8000-000000000003';
update public.users set employee_id='b0000000-0000-4000-8000-000000000004' where id='a0000000-0000-4000-8000-000000000004';
update public.users set employee_id='b0000000-0000-4000-8000-000000000005' where id='a0000000-0000-4000-8000-000000000005';
insert into leave_types (id, tenant_id, key) values
  ('c0000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','annual'),
  ('c0000000-0000-4000-8000-000000000002','22222222-2222-2222-2222-222222222222','annual');
insert into leaves (id, tenant_id, employee_id, leave_type_id, status) values
  ('d0000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','b0000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000001','pending'),
  ('d0000000-0000-4000-8000-000000000002','22222222-2222-2222-2222-222222222222','b0000000-0000-4000-8000-000000000004','c0000000-0000-4000-8000-000000000002','pending');
insert into approvals (id, tenant_id, requester_id, request_type, status) values
  ('70000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','b0000000-0000-4000-8000-000000000003','leave','pending'),
  ('70000000-0000-4000-8000-000000000002','22222222-2222-2222-2222-222222222222','b0000000-0000-4000-8000-000000000004','leave','pending');
insert into legal_documents (id, type, version, language, is_active) values
  ('e0000000-0000-4000-8000-000000000001','terms','1.0','ko',true);
insert into user_consents (id, user_id, document_id, document_type, version, source) values
  ('f0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003','e0000000-0000-4000-8000-000000000001','terms','1.0','activate');

-- ===== T1: employee A (self-only) + 교차테넌트 insert RLS 차단 =====
reset role; set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}'; set local role authenticated;
do $$ begin
  if (select count(*) from employees) <> 1 then raise exception 'T1a empA employees=% (exp 1)', (select count(*) from employees); end if;
  if (select count(*) from leaves) <> 1 then raise exception 'T1b empA leaves=% (exp 1)', (select count(*) from leaves); end if;
  if exists (select 1 from leaves where id='d0000000-0000-4000-8000-000000000002') then raise exception 'T1c empA sees tenantB leave'; end if;
end $$;
do $$ declare ok boolean := false; begin
  begin
    insert into leaves (tenant_id, employee_id, leave_type_id, status)
      values ('22222222-2222-2222-2222-222222222222','b0000000-0000-4000-8000-000000000004','c0000000-0000-4000-8000-000000000002','pending');
  exception when others then ok := true; end;
  if not ok then raise exception 'T1d cross-tenant insert NOT blocked by RLS'; end if;
end $$;

-- ===== T2: tenant_super A (tenant-wide: AdminA + EmpA + MgrA = 3) =====
reset role; set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}'; set local role authenticated;
do $$ begin
  if (select count(*) from employees) <> 3 then raise exception 'T2a adminA employees=% (exp 3)', (select count(*) from employees); end if;
  if (select count(*) from leaves) <> 1 then raise exception 'T2b adminA leaves=% (exp 1)', (select count(*) from leaves); end if;
end $$;

-- ===== T3: operator (cross-tenant bypass: 4 employees / 2 leaves) =====
reset role; set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}'; set local role authenticated;
do $$ begin
  if (select count(*) from employees) <> 4 then raise exception 'T3a operator employees=% (exp 4)', (select count(*) from employees); end if;
  if (select count(*) from leaves) <> 2 then raise exception 'T3b operator leaves=% (exp 2)', (select count(*) from leaves); end if;
end $$;

-- ===== T4: user_consents immutability (empA) =====
reset role; set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}'; set local role authenticated;
do $$ begin
  if (select count(*) from user_consents) <> 1 then raise exception 'T4a empA consent read=% (exp 1)', (select count(*) from user_consents); end if;
  update user_consents set version='9.9' where id='f0000000-0000-4000-8000-000000000001';
  if (select version from user_consents where id='f0000000-0000-4000-8000-000000000001') <> '1.0' then raise exception 'T4b consent mutated (immutability fail)'; end if;
  delete from user_consents where id='f0000000-0000-4000-8000-000000000001';
  if (select count(*) from user_consents) <> 1 then raise exception 'T4c consent deleted (immutability fail)'; end if;
end $$;

-- ===== T5: composite FK cross-tenant employee ref (postgres) =====
reset role;
do $$ declare ok boolean := false; begin
  begin
    insert into leaves (tenant_id, employee_id, leave_type_id, status)
      values ('11111111-1111-1111-1111-111111111111','b0000000-0000-4000-8000-000000000004','c0000000-0000-4000-8000-000000000001','pending');
  exception when others then ok := true; end;
  if not ok then raise exception 'T5 composite FK did NOT block cross-tenant employee ref'; end if;
end $$;

-- ===== T6: audit trigger fires on employees UPDATE =====
do $$ declare b bigint; a bigint; act text; begin
  select count(*) into b from audit_logs where target_type='employees';
  update employees set name='EmpA2' where id='b0000000-0000-4000-8000-000000000003';
  select count(*) into a from audit_logs where target_type='employees';
  if a <= b then raise exception 'T6a audit trigger did not fire (before=% after=%)', b, a; end if;
  select action into act from audit_logs where target_type='employees' and target_id='b0000000-0000-4000-8000-000000000003' and action='employees.update' limit 1;
  if act is null then raise exception 'T6b audit action employees.update missing'; end if;
end $$;

-- ===== T7: 직원 자기승인 차단 (codex P1-2) — empA가 자기 leave status=approved 시도 =====
reset role; set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}'; set local role authenticated;
do $$ declare ok boolean := false; begin
  begin
    update leaves set status='approved' where id='d0000000-0000-4000-8000-000000000001';
  exception when others then ok := true; end;
  if not ok then raise exception 'T7 employee self-approval NOT blocked (status=approved allowed)'; end if;
  -- 양성: 본인 취소는 허용
  update leaves set status='cancelled' where id='d0000000-0000-4000-8000-000000000001';
  if (select status from leaves where id='d0000000-0000-4000-8000-000000000001') <> 'cancelled' then raise exception 'T7b employee self-cancel should be allowed'; end if;
end $$;

-- ===== T8: 티켓 교차테넌트 INSERT 차단 (codex P1-1) — empA가 tenant_id=tB 티켓 생성 시도 =====
reset role; set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}'; set local role authenticated;
do $$ declare ok boolean := false; begin
  begin
    insert into tickets (tenant_id, ticket_number, title, requester_id)
      values ('22222222-2222-2222-2222-222222222222','RT-1','x','a0000000-0000-4000-8000-000000000003');
  exception when others then ok := true; end;
  if not ok then raise exception 'T8 cross-tenant ticket insert NOT blocked'; end if;
end $$;

-- ===== T9: approval_id composite cross-tenant 차단 (codex P1-4, KI-077 완성) — postgres =====
reset role;
do $$ declare ok boolean := false; begin
  begin
    update leaves set approval_id='70000000-0000-4000-8000-000000000002' where id='d0000000-0000-4000-8000-000000000001'; -- tA leave → tB approval
  exception when others then ok := true; end;
  if not ok then raise exception 'T9 cross-tenant approval_id link NOT blocked by composite FK'; end if;
end $$;

-- ===== T10: 매니저 팀범위 (evaluator P2) — MgrA가 DeptA 팀(self + EmpA)만 가시 =====
reset role; set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000005","role":"authenticated"}'; set local role authenticated;
do $$ begin
  if (select count(*) from employees) <> 2 then raise exception 'T10a manager team employees=% (exp 2: self+EmpA)', (select count(*) from employees); end if;
  if not exists (select 1 from employees where id='b0000000-0000-4000-8000-000000000003') then raise exception 'T10b manager cannot see team member EmpA'; end if;
  if exists (select 1 from employees where id='b0000000-0000-4000-8000-000000000002') then raise exception 'T10c manager sees non-team AdminA'; end if;
  if exists (select 1 from employees where id='b0000000-0000-4000-8000-000000000004') then raise exception 'T10d manager sees other-tenant EmpB'; end if;
end $$;

reset role;
select 'ALL_RLS_ASSERTIONS_PASS' as result;
rollback;
