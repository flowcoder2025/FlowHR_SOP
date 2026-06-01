-- =====================================================================
-- 00000000000042_sprint2_register_tenant.sql
-- WI-035 OP-04 신규 테넌트 등록 API (ST-006)
-- SSOT: .flowset/api/operator.md OP-04 + .flowset/prd/domains/operator/OP-04-onboarding.md
--       + .flowset/sprints/sprint-002.md (DoD: 최종 등록 트랜잭션)
--
-- 설계(codex 2라운드 협의 + 사용자 승인):
--  1) register_tenant() — 신규 SECURITY DEFINER RPC(service_role only). tenants + subscriptions +
--     tenant_settings + 초기데이터(departments/work_policies/leave_types/approval_lines/
--     document_templates) + 관리자 invitation 을 **단일 트랜잭션**으로 원자 INSERT.
--     create-at-activate(WI-020-6 mig 35): 관리자 user 는 활성화 시점 생성 → 등록 시점엔 invitation 만.
--     멱등: draft.status='completed' + 동일 idempotency_key → 기존 tenant 반환(재시도 안전).
--     audit: service_role 컨텍스트(auth.uid()=NULL)이므로 mig 40 audit_row_change 의 GUC fallback
--            (app.audit_actor_*)에 운영자를 심어 등록 audit 을 운영자 actor 로 귀속.
--  2) accept_invitation() 최소 확장 — tenant_super 수락 시 tenants.admin_user_id 보강 +
--     활성화 audit actor(GUC) 설정. create-at-activate 의 admin_user_id 누락 보강.
--
-- enum/신규 테이블 변경 없음(onboarding 표시상태 pending_invite/scheduled 는 admin_user_id IS NULL /
-- invitation pending / contract_start_date 로 파생 — tenant_status 에 소비처 없는 값 추가 회피).
--
-- 권한(KI-109/WI-031 클래스 재발 방지): security-definer 함수는 Supabase pg_default_acl 로
-- anon/authenticated 에 EXECUTE 가 자동 부여되므로 revoke from public,anon,authenticated + service_role 만 grant.
-- =====================================================================

set search_path = public;

-- ── 1) accept_invitation 최소 확장 (tenant_super → tenants.admin_user_id 보강) ──────
-- mig 35 원자 전환 유지 + 활성화 audit actor(GUC) + tenant_super 수락 시 admin_user_id set.
create or replace function public.accept_invitation(p_token_hash text, p_user_id uuid)
returns table (target_role text, tenant_id uuid, operator_flag boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv invitations;
begin
  -- 활성화 audit actor(service_role 컨텍스트 — auth.uid()=NULL). 함수 내 모든 audit 가 신규 user 로 귀속.
  perform set_config('app.audit_actor_id', p_user_id::text, true);
  perform set_config('app.audit_actor_role', 'system:activation', true);

  -- 1) 초대 행을 FOR UPDATE 로 잠가 동시성 mutex 확보 후 검증.
  select * into v_inv
    from invitations
    where token_hash = p_token_hash
    for update;

  if not found
     or v_inv.status <> 'pending'
     or v_inv.accepted_at is not null
     or v_inv.expires_at <= now() then
    raise exception 'invitation not claimable' using errcode = 'P0001';
  end if;

  -- 2) public.users 먼저 생성(FK 대상). 이후 claim UPDATE 가 accepted_user_id FK 를 만족.
  insert into public.users (id, role, tenant_id, employee_id, locale)
    values (p_user_id, v_inv.target_role, v_inv.tenant_id, v_inv.employee_id, 'ko');

  -- 3) 초대 claim (단일 트랜잭션 — 실패 시 전체 롤백되어 public 측 부분상태 없음).
  update invitations
    set status = 'accepted', accepted_at = now(), accepted_user_id = p_user_id, updated_at = now()
    where id = v_inv.id;

  if v_inv.operator_flag then
    insert into public.operator_users (user_id, role, invited_at, activated_at, is_active)
      values (p_user_id, v_inv.target_role::operator_role, v_inv.created_at, now(), true);
  elsif v_inv.employee_id is not null then
    update public.employees
      set status = 'active', user_id = p_user_id, updated_at = now()
      where id = v_inv.employee_id;
  end if;

  -- 4) (WI-035) tenant 의 대표 관리자(tenant_super) 활성화 시 admin_user_id 보강.
  --    이미 지정된 경우(재초대/복수 super)는 덮어쓰지 않는다(admin_user_id is null 가드).
  if v_inv.target_role = 'tenant_super' and v_inv.tenant_id is not null then
    update public.tenants
      set admin_user_id = p_user_id, updated_at = now()
      where id = v_inv.tenant_id and admin_user_id is null;
  end if;

  return query select v_inv.target_role, v_inv.tenant_id, v_inv.operator_flag;
end;
$$;

revoke all on function public.accept_invitation(text, uuid) from public, anon, authenticated;
grant execute on function public.accept_invitation(text, uuid) to service_role;

-- ── 2) register_tenant — 7단계 최종 등록 원자 트랜잭션 ────────────────────────────
-- p_admin_invitations: [{email, target_role, token_hash, expires_at}] (1번째=대표 tenant_super).
--   앱이 평문 토큰을 생성해 hash 만 전달(token 원자성 + create-at-activate). 활성화 URL 구성은 앱.
create or replace function public.register_tenant(
  p_operator_id uuid,
  p_draft_id uuid,
  p_idempotency_key text,
  p_payload jsonb,
  p_admin_invitations jsonb
)
returns table (
  tenant_id uuid,
  draft_id uuid,
  invitation_ids uuid[],
  status tenant_status,
  already_completed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft tenant_drafts;
  v_operator_role text;
  v_existing_key text;
  v_slug text;
  v_business_number text;
  v_plan plans;
  v_company jsonb;
  v_tenant_id uuid;
  v_invitation_ids uuid[] := '{}';
  v_inv_id uuid;
  v_email text;
  v_role text;
  v_elem jsonb;
begin
  -- 0) 운영자 검증 + audit actor 설정(service_role 컨텍스트).
  select role into v_operator_role from public.users where id = p_operator_id;
  if v_operator_role is null or v_operator_role not in ('operator_super', 'operator_staff') then
    raise exception 'operator only' using errcode = 'P0101';
  end if;
  perform set_config('app.audit_actor_id', p_operator_id::text, true);
  perform set_config('app.audit_actor_role', v_operator_role, true);

  -- 1) draft 잠금(FOR UPDATE) — 멱등/동시제출 직렬화. draft 는 운영자 본인 소유.
  select * into v_draft from public.tenant_drafts where id = p_draft_id for update;
  if not found or v_draft.created_by is distinct from p_operator_id then
    raise exception 'draft not found' using errcode = 'P0102';
  end if;

  -- 2) 멱등: 이미 completed 면 동일 key → 기존 tenant 반환, 다른 key → conflict.
  if v_draft.status = 'completed' then
    v_existing_key := v_draft.form_data #>> '{_submission,idempotency_key}';
    if v_existing_key is not distinct from p_idempotency_key then
      return query
        select v_draft.submitted_tenant_id,
               v_draft.id,
               '{}'::uuid[],
               (select t.status from public.tenants t where t.id = v_draft.submitted_tenant_id),
               true;
      return;
    end if;
    raise exception 'idempotency conflict' using errcode = 'P0103';
  end if;

  -- 3) 관리자 invitation 최소 1건(대표) 필요.
  if p_admin_invitations is null or jsonb_typeof(p_admin_invitations) <> 'array'
     or jsonb_array_length(p_admin_invitations) = 0 then
    raise exception 'admin invitation required' using errcode = 'P0104';
  end if;

  -- 4) 슬러그/사업자번호 중복 사전검사(친절한 에러). 형식/예약어는 앱(schemas SSOT) 사전검증.
  v_slug := lower(p_payload #>> '{slug}');
  if v_slug is null or v_slug = '' then
    raise exception 'slug required' using errcode = 'P0105';
  end if;
  if exists (select 1 from public.tenants where lower(slug) = v_slug) then
    raise exception 'slug taken' using errcode = 'P0106';
  end if;

  v_business_number := p_payload #>> '{company,business_number}';
  if v_business_number is not null
     and exists (select 1 from public.tenants where business_number = v_business_number) then
    raise exception 'business number taken' using errcode = 'P0107';
  end if;

  -- 5) plan 검증 + 가격 latch(등록 시점 plans 값 고정).
  select * into v_plan from public.plans where id = (p_payload #>> '{plan_id}')::uuid;
  if not found then
    raise exception 'plan not found' using errcode = 'P0108';
  end if;

  -- 6) 관리자 이메일 hard-check(전역 invitation pending/accepted + auth.users + 역할 화이트리스트).
  for v_elem in select value from jsonb_array_elements(p_admin_invitations) loop
    v_email := lower(v_elem ->> 'email');
    v_role := v_elem ->> 'target_role';
    if v_role not in ('tenant_super', 'tenant_hr_admin') then
      raise exception 'invalid admin role' using errcode = 'P0109';
    end if;
    if exists (
      select 1 from public.invitations i
       where lower(i.email) = v_email and i.status in ('pending', 'accepted')
    ) or exists (select 1 from auth.users au where lower(au.email) = v_email) then
      raise exception 'admin email taken: %', v_email using errcode = 'P0110';
    end if;
  end loop;

  -- 7) tenants INSERT — status active(표시상태는 read 시 admin_user_id/contract 로 파생).
  v_company := p_payload -> 'company';
  insert into public.tenants (
    name, business_number, slug, representative_name, industry, address, phone, logo_url,
    plan_id, status, contract_start_date, contract_end_date, user_limit, metadata
  ) values (
    v_company ->> 'name',
    v_business_number,
    v_slug,
    v_company ->> 'representative_name',
    nullif(v_company ->> 'industry', ''),
    nullif(v_company ->> 'address', ''),
    nullif(v_company ->> 'phone', ''),
    nullif(v_company ->> 'logo_url', ''),
    v_plan.id,
    'active',
    (p_payload ->> 'contract_start_date')::date,
    nullif(p_payload ->> 'contract_end_date', '')::date,
    (p_payload ->> 'user_limit')::int,
    jsonb_build_object('enabled_modules', coalesce(p_payload -> 'enabled_modules', '[]'::jsonb))
  ) returning id into v_tenant_id;

  -- 8) subscriptions INSERT(가격 latch).
  insert into public.subscriptions (
    tenant_id, plan_id, latched_price_per_user, latched_base_price,
    period_start, period_end, billing_cycle
  ) values (
    v_tenant_id, v_plan.id, v_plan.per_user_price_krw, v_plan.base_price_krw,
    (p_payload ->> 'contract_start_date')::date,
    nullif(p_payload ->> 'contract_end_date', '')::date,
    coalesce((p_payload ->> 'billing_cycle')::billing_cycle, 'monthly')
  );

  -- 9) tenant_settings INSERT(company_info = TA-13 company 탭 shape, WI-032 정합).
  insert into public.tenant_settings (tenant_id, company_info)
  values (
    v_tenant_id,
    jsonb_strip_nulls(jsonb_build_object(
      'company_name', v_company ->> 'name',
      'ceo_name', v_company ->> 'representative_name',
      'contact', v_company ->> 'phone',
      'address', v_company ->> 'address',
      'industry', v_company ->> 'industry',
      'logo_url', v_company ->> 'logo_url'
    ))
  );

  -- 10) departments — 단일 패스(payload 토폴로지 순서: 상위 먼저, schema 강제). parent 는 code 조회.
  for v_elem in select value from jsonb_array_elements(coalesce(p_payload -> 'departments', '[]'::jsonb)) loop
    insert into public.departments (tenant_id, name, code, parent_id)
    values (
      v_tenant_id,
      v_elem ->> 'name',
      nullif(v_elem ->> 'code', ''),
      case
        when nullif(v_elem ->> 'parent_code', '') is not null then
          (select d.id from public.departments d
            where d.tenant_id = v_tenant_id and d.code = v_elem ->> 'parent_code' limit 1)
        else null
      end
    );
  end loop;

  -- 11) work_policy(선택) — 테넌트 기본 정책(is_default=true).
  if jsonb_typeof(p_payload -> 'work_policy') = 'object' then
    insert into public.work_policies (
      tenant_id, name, standard_clock_in, standard_clock_out, late_threshold,
      break_minutes_default, weekly_max_hours, applicable_departments, is_default
    ) values (
      v_tenant_id,
      coalesce(nullif(p_payload #>> '{work_policy,name}', ''), '기본 근무제'),
      nullif(p_payload #>> '{work_policy,standard_clock_in}', '')::time,
      nullif(p_payload #>> '{work_policy,standard_clock_out}', '')::time,
      nullif(p_payload #>> '{work_policy,late_threshold}', '')::time,
      coalesce((p_payload #>> '{work_policy,break_minutes_default}')::int, 0),
      coalesce((p_payload #>> '{work_policy,weekly_max_hours}')::int, 52),
      coalesce(
        (select array_agg(x) from jsonb_array_elements_text(p_payload #> '{work_policy,applicable_departments}') x),
        '{}'
      ),
      true
    );
  end if;

  -- 12) leave_types(선택).
  for v_elem in select value from jsonb_array_elements(coalesce(p_payload -> 'leave_types', '[]'::jsonb)) loop
    insert into public.leave_types (
      tenant_id, key, label_ko, default_days, is_paid, carryover_allowed, evidence_required, sort_order
    ) values (
      v_tenant_id,
      v_elem ->> 'key',
      nullif(v_elem ->> 'label_ko', ''),
      coalesce((v_elem ->> 'default_days')::int, 0),
      coalesce((v_elem ->> 'is_paid')::boolean, true),
      coalesce((v_elem ->> 'carryover_allowed')::boolean, false),
      coalesce((v_elem ->> 'evidence_required')::boolean, false),
      coalesce((v_elem ->> 'sort_order')::int, 0)
    );
  end loop;

  -- 13) approval_lines(선택) — conditions/default_line jsonb 는 WI-034 DSL 로 앱이 검증한 그대로 저장.
  for v_elem in select value from jsonb_array_elements(coalesce(p_payload -> 'approval_lines', '[]'::jsonb)) loop
    insert into public.approval_lines (
      tenant_id, name, request_type, conditions, default_line, is_active
    ) values (
      v_tenant_id,
      v_elem ->> 'name',
      (v_elem ->> 'request_type')::approval_request_type,
      coalesce(v_elem -> 'conditions', '[]'::jsonb),
      coalesce(v_elem -> 'default_line', '[]'::jsonb),
      coalesce((v_elem ->> 'is_active')::boolean, true)
    );
  end loop;

  -- 14) document_templates(선택).
  for v_elem in select value from jsonb_array_elements(coalesce(p_payload -> 'document_templates', '[]'::jsonb)) loop
    insert into public.document_templates (
      tenant_id, key, label_ko, template_body, variables, template_format
    ) values (
      v_tenant_id,
      v_elem ->> 'key',
      nullif(v_elem ->> 'label_ko', ''),
      nullif(v_elem ->> 'template_body', ''),
      coalesce((select array_agg(x) from jsonb_array_elements_text(v_elem -> 'variables') x), '{}'),
      nullif(v_elem ->> 'template_format', '')
    );
  end loop;

  -- 15) 관리자 invitation(들) — create-at-activate. token_hash 는 앱이 평문 토큰 해시.
  for v_elem in select value from jsonb_array_elements(p_admin_invitations) loop
    insert into public.invitations (
      token_hash, email, target_role, tenant_id, operator_flag, invited_by, expires_at
    ) values (
      v_elem ->> 'token_hash',
      lower(v_elem ->> 'email'),
      v_elem ->> 'target_role',
      v_tenant_id,
      false,
      p_operator_id,
      (v_elem ->> 'expires_at')::timestamptz
    ) returning id into v_inv_id;
    v_invitation_ids := array_append(v_invitation_ids, v_inv_id);
  end loop;

  -- 16) draft completed + 멱등키 보관(재시도 replay 근거).
  update public.tenant_drafts
     set status = 'completed',
         submitted_tenant_id = v_tenant_id,
         completed_at = now(),
         current_step = 7,
         form_data = jsonb_set(
           coalesce(form_data, '{}'::jsonb),
           '{_submission}',
           jsonb_build_object('idempotency_key', p_idempotency_key, 'completed_at', now())
         ),
         updated_at = now()
   where id = p_draft_id;

  return query select v_tenant_id, p_draft_id, v_invitation_ids, 'active'::tenant_status, false;

exception
  -- 동시성 backstop: 사전검사 통과 후 unique 제약이 최종 승자 결정 → 도메인 에러로 정규화.
  when unique_violation then
    declare v_constraint text;
    begin
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint in ('tenants_slug_key', 'ux_tenants_slug_lower') then
        raise exception 'slug taken' using errcode = 'P0106';
      elsif v_constraint = 'tenants_business_number_key' then
        raise exception 'business number taken' using errcode = 'P0107';
      elsif v_constraint in ('invitations_token_hash_key', 'ux_invitations_pending_email') then
        raise exception 'admin email taken' using errcode = 'P0110';
      else
        raise;
      end if;
    end;
end;
$$;

revoke all on function public.register_tenant(uuid, uuid, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.register_tenant(uuid, uuid, text, jsonb, jsonb) to service_role;
