-- ST-005 RLS 정책 (SSOT: .flowset/db/rls.md §1~6-1)
-- 39 테이블 ENABLE RLS + 패턴 A/B/C/D 정책 + 운영사 우회 + 컴플라이언스 불변성.
--
-- [클레임 소스 결정 — codex 협의 2026-05-29] migration 3 헬퍼는 auth.jwt() 커스텀 클레임
-- (tenant_id/role/employee_id)을 읽으나, WI-020 로그인은 이 클레임을 JWT에 주입하지 않고
-- public.users 조회로 역할을 얻는다(session.ts/actions.ts). hosted Supabase에서 Custom Access
-- Token Hook 활성화는 supabase MCP로 불가(auth config 토글 미지원)하므로, 본 마이그레이션은
-- 헬퍼를 SECURITY DEFINER 함수로 재정의하여 public.users를 직접 조회(테이블 RLS 우회)한다.
-- → Custom Access Token Hook 으로의 표준화는 KI 후속 (config.toml [auth.hook.custom_access_token]
--   주석 + dashboard/Management API 활성화 필요).
-- users 테이블엔 아직 RLS 정책이 없었고, 헬퍼가 WHERE id = auth.uid() 본인 행만 조회하므로 재귀 없음.

-- =====================================================================
-- §1. 헬퍼 재정의 (SECURITY DEFINER · STABLE · search_path 고정)
-- =====================================================================

create or replace function current_tenant_id() returns uuid
  language sql stable security definer set search_path = public, pg_catalog as $$
    select tenant_id from public.users where id = auth.uid()
$$;

create or replace function current_role_key() returns text
  language sql stable security definer set search_path = public, pg_catalog as $$
    select role from public.users where id = auth.uid()
$$;

create or replace function current_employee_id() returns uuid
  language sql stable security definer set search_path = public, pg_catalog as $$
    select employee_id from public.users where id = auth.uid()
$$;

-- is_operator()/is_operator_super()/is_tenant_admin()는 migration 3에서 current_role_key()를
-- 호출하므로 자동으로 정상 동작(재정의 불요).

-- 매니저 팀 직원 ID 집합 (migration 3에서 departments/employees 미생성으로 deferred — rls.md §1)
create or replace function my_team_employee_ids() returns setof uuid
  language sql stable security definer set search_path = public, pg_catalog as $$
    with recursive my_subtree as (
      select d.id
        from public.departments d
        join public.employees e on e.department_id = d.id
        where e.id = current_employee_id() and e.role = 'tenant_manager'
      union all
      select d.id
        from public.departments d
        join my_subtree ms on d.parent_id = ms.id
    )
    select e.id from public.employees e where e.department_id in (select id from my_subtree)
$$;

-- approvals ↔ approval_steps 교차 참조용 헬퍼 (정책 상호 재귀 회피 — 각자 상대 테이블 RLS 우회)
create or replace function is_approval_step_approver(p_approval_id uuid, p_only_pending boolean default false)
  returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
    select exists (
      select 1 from public.approval_steps s
      where s.approval_id = p_approval_id
        and s.approver_id = current_employee_id()
        and (not p_only_pending or s.status = 'pending')
    )
$$;

create or replace function is_approval_requester(p_approval_id uuid)
  returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
    select exists (
      select 1 from public.approvals a
      where a.id = p_approval_id and a.requester_id = current_employee_id()
    )
$$;

grant execute on function
  current_tenant_id(), current_role_key(), current_employee_id(),
  my_team_employee_ids(),
  is_approval_step_approver(uuid, boolean), is_approval_requester(uuid)
  to anon, authenticated;

-- =====================================================================
-- §2. 글로벌 공개 읽기 / 운영사 쓰기 (tenant_id 없음)
-- =====================================================================

alter table plans enable row level security;
create policy plans_read   on plans for select using (true);
create policy plans_write  on plans for all
  using (is_operator_super()) with check (is_operator_super());

alter table feature_flags enable row level security;
create policy feature_flags_read  on feature_flags for select using (true);
create policy feature_flags_write on feature_flags for all
  using (is_operator()) with check (is_operator());

alter table roles enable row level security;
create policy roles_read  on roles for select using (true);
create policy roles_write on roles for all
  using (is_operator_super()) with check (is_operator_super());

alter table maintenance_windows enable row level security;
create policy maintenance_windows_read  on maintenance_windows for select using (true);
create policy maintenance_windows_write on maintenance_windows for all
  using (is_operator()) with check (is_operator());

-- =====================================================================
-- §3. 운영사 전용 (tenant_id 없음)
-- =====================================================================

alter table system_settings enable row level security;
create policy system_settings_read  on system_settings for select using (is_operator());
create policy system_settings_write on system_settings for all
  using (is_operator_super()) with check (is_operator_super());

alter table backup_jobs enable row level security;
create policy backup_jobs_all on backup_jobs for all
  using (is_operator()) with check (is_operator());

-- operator_users: 조회는 운영사 전체, 변경은 운영사 최고관리자만(operator_staff 계정관리 차단 — 보안 강화)
alter table operator_users enable row level security;
create policy operator_users_read  on operator_users for select using (is_operator());
create policy operator_users_write on operator_users for all
  using (is_operator_super()) with check (is_operator_super());

-- =====================================================================
-- §4. 운영사 + 자기 테넌트 읽기 / 운영사 쓰기
-- =====================================================================

alter table tenants enable row level security;
create policy tenants_read  on tenants for select
  using (is_operator() or id = current_tenant_id());
create policy tenants_write on tenants for all
  using (is_operator()) with check (is_operator());

-- 운영사가 생성한 테넌트 초안 (본인 작성분)
alter table tenant_drafts enable row level security;
create policy tenant_drafts_all on tenant_drafts for all
  using (is_operator() and created_by = auth.uid())
  with check (is_operator() and created_by = auth.uid());

-- 청구: 테넌트는 자기 것 SELECT만, 변경은 운영사
alter table subscriptions enable row level security;
create policy subscriptions_read  on subscriptions for select
  using (tenant_id = current_tenant_id() or is_operator());
create policy subscriptions_write on subscriptions for all
  using (is_operator()) with check (is_operator());

alter table invoices enable row level security;
create policy invoices_read  on invoices for select
  using (tenant_id = current_tenant_id() or is_operator());
create policy invoices_write on invoices for all
  using (is_operator()) with check (is_operator());

alter table feature_flag_overrides enable row level security;
create policy ffo_read  on feature_flag_overrides for select
  using (tenant_id = current_tenant_id() or is_operator());
create policy ffo_write on feature_flag_overrides for all
  using (is_operator()) with check (is_operator());

-- =====================================================================
-- §5. 지원 티켓 (테넌트 ↔ 운영사)
-- =====================================================================

alter table tickets enable row level security;
create policy tickets_read on tickets for select using (
  is_operator()
  or requester_id = auth.uid()
  or (is_tenant_admin() and tenant_id = current_tenant_id())
);
create policy tickets_insert on tickets for insert with check (
  requester_id = auth.uid() or is_operator()
);
create policy tickets_update on tickets for update using (
  is_operator() or (is_tenant_admin() and tenant_id = current_tenant_id())
) with check (
  is_operator() or (is_tenant_admin() and tenant_id = current_tenant_id())
);
create policy tickets_delete on tickets for delete using (is_operator());

-- ticket_messages: tenant_id 없음 → tickets 접근성 + 내부메모(is_internal) 가시성 분기
alter table ticket_messages enable row level security;
create policy ticket_messages_read on ticket_messages for select using (
  exists (
    select 1 from public.tickets t
    where t.id = ticket_messages.ticket_id and (
      is_operator() or t.requester_id = auth.uid()
      or (is_tenant_admin() and t.tenant_id = current_tenant_id())
    )
  )
  and (is_internal = false or is_operator() or is_tenant_admin())
);
create policy ticket_messages_insert on ticket_messages for insert with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.tickets t
    where t.id = ticket_messages.ticket_id and (
      is_operator() or t.requester_id = auth.uid()
      or (is_tenant_admin() and t.tenant_id = current_tenant_id())
    )
  )
);

-- =====================================================================
-- §6. HR 도메인
-- =====================================================================

-- departments: 테넌트 구성원 조회, 관리자 변경
alter table departments enable row level security;
create policy departments_read  on departments for select
  using (tenant_id = current_tenant_id() or is_operator());
create policy departments_write on departments for all
  using ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super())
  with check ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super());

-- employees: 패턴 C (관리자 전체 / 매니저 팀 / 본인), 변경은 관리자
alter table employees enable row level security;
create policy employees_read on employees for select using (
  is_operator()
  or (tenant_id = current_tenant_id() and (
        is_tenant_admin()
        or id = current_employee_id()
        or (current_role_key() = 'tenant_manager' and id in (select my_team_employee_ids()))
  ))
);
create policy employees_write on employees for all
  using ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super())
  with check ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super());

-- users: 본인 + 자기 테넌트 관리자 조회 + 운영사. 쓰기는 운영사 전용.
-- (본인 프로필/locale 수정은 추후 프로필 WI에서 service_role 서버액션으로 — 자기-역할 상승 차단)
alter table users enable row level security;
create policy users_read  on users for select using (
  id = auth.uid()
  or is_operator()
  or (is_tenant_admin() and tenant_id = current_tenant_id())
);
create policy users_write on users for all
  using (is_operator()) with check (is_operator());

-- attendances: 패턴 C
alter table attendances enable row level security;
create policy attendances_read on attendances for select using (
  is_operator()
  or (tenant_id = current_tenant_id() and (
        is_tenant_admin()
        or employee_id = current_employee_id()
        or (current_role_key() = 'tenant_manager' and employee_id in (select my_team_employee_ids()))
  ))
);
create policy attendances_insert on attendances for insert with check (
  tenant_id = current_tenant_id() and (employee_id = current_employee_id() or is_tenant_admin())
);
create policy attendances_update on attendances for update using (
  tenant_id = current_tenant_id() and (is_tenant_admin() or employee_id = current_employee_id())
) with check (
  tenant_id = current_tenant_id() and (is_tenant_admin() or employee_id = current_employee_id())
);
create policy attendances_delete on attendances for delete using (
  tenant_id = current_tenant_id() and is_tenant_admin()
);

-- attendance_modifications: 패턴 C + 직원 본인 신청
alter table attendance_modifications enable row level security;
create policy attmod_read on attendance_modifications for select using (
  is_operator()
  or (tenant_id = current_tenant_id() and (
        is_tenant_admin()
        or employee_id = current_employee_id()
        or (current_role_key() = 'tenant_manager' and employee_id in (select my_team_employee_ids()))
  ))
);
create policy attmod_insert on attendance_modifications for insert with check (
  tenant_id = current_tenant_id() and employee_id = current_employee_id()
);
create policy attmod_update on attendance_modifications for update using (
  tenant_id = current_tenant_id() and (is_tenant_admin() or employee_id = current_employee_id())
) with check (
  tenant_id = current_tenant_id() and (is_tenant_admin() or employee_id = current_employee_id())
);
create policy attmod_delete on attendance_modifications for delete using (
  tenant_id = current_tenant_id() and is_tenant_admin()
);

-- leave_types: 전 직원 조회, 관리자 변경
alter table leave_types enable row level security;
create policy leave_types_read  on leave_types for select
  using (tenant_id = current_tenant_id() or is_operator());
create policy leave_types_write on leave_types for all
  using ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super())
  with check ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super());

-- leaves: 패턴 C + 직원 본인 신청/취소
alter table leaves enable row level security;
create policy leaves_read on leaves for select using (
  is_operator()
  or (tenant_id = current_tenant_id() and (
        is_tenant_admin()
        or employee_id = current_employee_id()
        or (current_role_key() = 'tenant_manager' and employee_id in (select my_team_employee_ids()))
  ))
);
create policy leaves_insert on leaves for insert with check (
  tenant_id = current_tenant_id() and employee_id = current_employee_id()
);
create policy leaves_update on leaves for update using (
  tenant_id = current_tenant_id() and (is_tenant_admin() or employee_id = current_employee_id())
) with check (
  tenant_id = current_tenant_id() and (is_tenant_admin() or employee_id = current_employee_id())
);
create policy leaves_delete on leaves for delete using (
  tenant_id = current_tenant_id() and (is_tenant_admin() or employee_id = current_employee_id())
);

-- leave_balances: 패턴 C 조회 + 관리자 변경
alter table leave_balances enable row level security;
create policy leave_balances_read on leave_balances for select using (
  is_operator()
  or (tenant_id = current_tenant_id() and (
        is_tenant_admin()
        or employee_id = current_employee_id()
        or (current_role_key() = 'tenant_manager' and employee_id in (select my_team_employee_ids()))
  ))
);
create policy leave_balances_write on leave_balances for all
  using ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super())
  with check ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super());

-- approval_lines: 전 직원 조회, 관리자 변경
alter table approval_lines enable row level security;
create policy approval_lines_read  on approval_lines for select
  using (tenant_id = current_tenant_id() or is_operator());
create policy approval_lines_write on approval_lines for all
  using ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super())
  with check ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super());

-- approvals: KI-014 polymorphic routing (요청자/결재자/매니저-팀/관리자/운영사)
alter table approvals enable row level security;
create policy approvals_read on approvals for select using (
  is_operator()
  or (tenant_id = current_tenant_id() and (
        requester_id = current_employee_id()
        or is_approval_step_approver(id)
        or (current_role_key() = 'tenant_manager' and requester_id in (select my_team_employee_ids()))
        or is_tenant_admin()
  ))
);
create policy approvals_insert on approvals for insert with check (
  tenant_id = current_tenant_id() and requester_id = current_employee_id()
);
create policy approvals_update on approvals for update using (
  tenant_id = current_tenant_id() and (
    is_tenant_admin()
    or is_approval_step_approver(id, true)
    or (requester_id = current_employee_id() and status in ('pending', 'in_progress'))
  )
) with check (tenant_id = current_tenant_id());
create policy approvals_delete on approvals for delete using (
  tenant_id = current_tenant_id() and is_tenant_admin()
);

-- approval_steps: 본인 결재단계 + 요청자 조회 + 관리자
alter table approval_steps enable row level security;
create policy approval_steps_read on approval_steps for select using (
  is_operator()
  or (tenant_id = current_tenant_id() and (
        approver_id = current_employee_id()
        or is_tenant_admin()
        or is_approval_requester(approval_id)
  ))
);
create policy approval_steps_insert on approval_steps for insert with check (
  tenant_id = current_tenant_id() and (is_tenant_admin() or is_approval_requester(approval_id))
);
create policy approval_steps_update on approval_steps for update using (
  tenant_id = current_tenant_id() and (
    is_tenant_admin() or (approver_id = current_employee_id() and status = 'pending')
  )
) with check (tenant_id = current_tenant_id());
create policy approval_steps_delete on approval_steps for delete using (
  tenant_id = current_tenant_id() and is_tenant_admin()
);

-- documents: 본인 소유 / company_wide / 관리자
alter table documents enable row level security;
create policy documents_read on documents for select using (
  is_operator()
  or (tenant_id = current_tenant_id() and (
        owner_id = current_employee_id()
        or visibility = 'company_wide'
        or is_tenant_admin()
  ))
);
create policy documents_write on documents for all
  using ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super())
  with check ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super());

-- certificate_requests: 패턴 B (본인) + 관리자 처리
alter table certificate_requests enable row level security;
create policy cert_req_read on certificate_requests for select using (
  is_operator()
  or (tenant_id = current_tenant_id() and (employee_id = current_employee_id() or is_tenant_admin()))
);
create policy cert_req_insert on certificate_requests for insert with check (
  tenant_id = current_tenant_id() and employee_id = current_employee_id()
);
create policy cert_req_update on certificate_requests for update using (
  tenant_id = current_tenant_id() and is_tenant_admin()
) with check (tenant_id = current_tenant_id() and is_tenant_admin());
create policy cert_req_delete on certificate_requests for delete using (
  tenant_id = current_tenant_id() and is_tenant_admin()
);

-- notifications: 본인만 + 운영사 감사 조회
alter table notifications enable row level security;
create policy notifications_read on notifications for select
  using (user_id = auth.uid() or is_operator());
create policy notifications_self_modify on notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- audit_logs: 조회만 제한(운영사 전체 / 관리자 자기테넌트 / 본인 actor). INSERT는 트리거·service_role.
-- UPDATE/DELETE 정책 부재 = append-only(기본 거부).
alter table audit_logs enable row level security;
create policy audit_logs_read on audit_logs for select using (
  is_operator()
  or (is_tenant_admin() and tenant_id = current_tenant_id())
  or actor_id = auth.uid()
);

-- employee_change_requests: 패턴 B (본인) + 관리자 승인
alter table employee_change_requests enable row level security;
create policy ecr_read on employee_change_requests for select using (
  is_operator()
  or (tenant_id = current_tenant_id() and (employee_id = current_employee_id() or is_tenant_admin()))
);
create policy ecr_insert on employee_change_requests for insert with check (
  tenant_id = current_tenant_id() and employee_id = current_employee_id()
);
create policy ecr_update on employee_change_requests for update using (
  tenant_id = current_tenant_id() and is_tenant_admin()
) with check (tenant_id = current_tenant_id() and is_tenant_admin());
create policy ecr_delete on employee_change_requests for delete using (
  tenant_id = current_tenant_id() and is_tenant_admin()
);

-- =====================================================================
-- §7. 설정 / 연동 / v1.2
-- =====================================================================

alter table tenant_settings enable row level security;
create policy tenant_settings_read  on tenant_settings for select
  using (tenant_id = current_tenant_id() or is_operator());
create policy tenant_settings_write on tenant_settings for all
  using ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super())
  with check ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super());

alter table work_policies enable row level security;
create policy work_policies_read  on work_policies for select
  using (tenant_id = current_tenant_id() or is_operator());
create policy work_policies_write on work_policies for all
  using ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super())
  with check ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super());

alter table document_templates enable row level security;
create policy document_templates_read  on document_templates for select
  using (tenant_id = current_tenant_id() or is_operator());
create policy document_templates_write on document_templates for all
  using ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super())
  with check ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super());

-- integrations: credentials 민감 — 변경은 tenant_super 단독
alter table integrations enable row level security;
create policy integrations_read  on integrations for select
  using (is_operator() or (tenant_id = current_tenant_id() and is_tenant_admin()));
create policy integrations_write on integrations for all
  using ((tenant_id = current_tenant_id() and current_role_key() = 'tenant_super') or is_operator_super())
  with check ((tenant_id = current_tenant_id() and current_role_key() = 'tenant_super') or is_operator_super());

-- integration_logs: 조회만(시스템·service_role INSERT)
alter table integration_logs enable row level security;
create policy integration_logs_read on integration_logs for select
  using (is_operator() or (tenant_id = current_tenant_id() and is_tenant_admin()));

-- api_keys: 운영사 키(operator_super) 또는 테넌트 키(tenant_super, owner_type='tenant')
alter table api_keys enable row level security;
create policy api_keys_read on api_keys for select using (
  is_operator()
  or (tenant_id = current_tenant_id() and current_role_key() = 'tenant_super' and owner_type = 'tenant')
);
create policy api_keys_write on api_keys for all using (
  is_operator_super()
  or (tenant_id = current_tenant_id() and current_role_key() = 'tenant_super' and owner_type = 'tenant')
) with check (
  is_operator_super()
  or (tenant_id = current_tenant_id() and current_role_key() = 'tenant_super' and owner_type = 'tenant')
);

-- signatures: 문서 테넌트 격리 + 서명자 본인 + 관리자
alter table signatures enable row level security;
create policy signatures_read on signatures for select using (
  is_operator()
  or (tenant_id = current_tenant_id() and (signer_employee_id = current_employee_id() or is_tenant_admin()))
);
create policy signatures_write on signatures for all
  using ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super())
  with check ((tenant_id = current_tenant_id() and is_tenant_admin()) or is_operator_super());

-- =====================================================================
-- §8. 컴플라이언스 (패턴 D — rls.md §6-1)
-- =====================================================================

-- legal_documents: 비로그인도 active 버전 조회(푸터 링크) + 운영사 게시
alter table legal_documents enable row level security;
create policy legal_docs_read   on legal_documents for select
  using (is_active = true or is_operator());
create policy legal_docs_insert on legal_documents for insert
  with check (is_operator());
create policy legal_docs_update on legal_documents for update
  using (is_operator()) with check (is_operator());
create policy legal_docs_delete on legal_documents for delete
  using (is_operator());

-- user_consents: 본인 동의 기록 + 운영사/자기회사 super 감사. 불변(UPDATE/DELETE 차단).
-- (단일-active/불변 강제 트리거는 ST-078에서 추가 — migration 20 주석 정책)
alter table user_consents enable row level security;
create policy consents_self_insert on user_consents for insert
  with check (user_id = auth.uid());
create policy consents_read on user_consents for select using (
  user_id = auth.uid()
  or is_operator()
  or (current_role_key() = 'tenant_super' and tenant_id = current_tenant_id())
);
create policy consents_no_update on user_consents for update using (false);
create policy consents_no_delete on user_consents for delete using (false);
