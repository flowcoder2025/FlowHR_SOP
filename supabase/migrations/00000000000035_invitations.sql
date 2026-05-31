-- =====================================================================
-- 00000000000035_invitations.sql
-- ST-003 계정 활성화(CM-03) — invitations 테이블 + 활성화 SECURITY DEFINER 함수
-- 설계: create-at-activate (codex 수렴 2026-05-31). auth.users 는 활성화 시점에 생성 →
--       활성화 전 계정 부재로 forgot-password 우회가 구조적으로 불가능(로그인 경로 무수정).
--       pending 운영사 초대도 operator_users 가 아닌 invitations(operator_flag=true)로 표현.
-- 토큰: 평문 32바이트 CSPRNG(URL) → DB 는 sha256(token) hex 만 저장(고엔트로피 → preimage 안전).
-- =====================================================================

create type invitation_status as enum ('pending', 'accepted', 'revoked');

create table invitations (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,                              -- sha256(평문 토큰) hex
  email text not null,                                          -- 초대 대상 이메일(소문자 정규화)
  target_role text not null,                                    -- users.role 정합(employee/tenant_*/operator_*)
  tenant_id uuid references tenants (id) on delete cascade,     -- 운영사 초대는 null
  employee_id uuid references employees (id) on delete cascade, -- 직원 초대만(TA-02 선생성 employee 참조)
  operator_flag boolean not null default false,                -- true=운영사 초대(OP-04)
  invited_by uuid references public.users (id),                 -- 초대자(감사용)
  expires_at timestamptz not null,                             -- 7일 만료
  accepted_at timestamptz,                                     -- 수락(claim) 시각 — 동시성 mutex
  accepted_user_id uuid references public.users (id),          -- 활성화로 생성된 user
  status invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_invitations_email on invitations (lower(email));
create index idx_invitations_tenant_status on invitations (tenant_id, status);
create index idx_invitations_expires_at on invitations (expires_at);
-- 이메일당 pending 1건만 — 재발송은 기존 pending 을 갱신(중복 초대 방지).
create unique index ux_invitations_pending_email on invitations (lower(email)) where status = 'pending';

alter table invitations enable row level security;

-- 운영사: invitations 전체 관리(OP-04). 삭제 정책 부재 → revoke 는 status 전환으로만.
create policy invitations_operator_read on invitations for select using (is_operator());
create policy invitations_operator_insert on invitations for insert with check (is_operator());
create policy invitations_operator_update on invitations for update
  using (is_operator()) with check (is_operator());

-- 테넌트 관리자: 본 테넌트 직원 초대만(TA-02). operator_flag=true 생성 차단.
create policy invitations_tenant_admin_read on invitations for select
  using (is_tenant_admin() and tenant_id = current_tenant_id());
create policy invitations_tenant_admin_insert on invitations for insert
  with check (is_tenant_admin() and tenant_id = current_tenant_id() and operator_flag = false);
create policy invitations_tenant_admin_update on invitations for update
  using (is_tenant_admin() and tenant_id = current_tenant_id())
  with check (is_tenant_admin() and tenant_id = current_tenant_id());

-- ── 비인증 활성화 토큰 검증 (SECURITY DEFINER, 최소 projection — token_hash 미노출) ──
create or replace function public.get_invitation_by_token_hash(p_token_hash text)
returns table (
  email text,
  target_role text,
  tenant_id uuid,
  operator_flag boolean,
  expires_at timestamptz,
  status invitation_status,
  is_expired boolean,
  company_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.email,
    i.target_role,
    i.tenant_id,
    i.operator_flag,
    i.expires_at,
    i.status,
    (i.expires_at < now()) as is_expired,
    t.name as company_name
  from invitations i
  left join tenants t on t.id = i.tenant_id
  where i.token_hash = p_token_hash
$$;

-- ── 활성화 원자 전환 (SECURITY DEFINER, service_role 전용) ──
-- 조건부 UPDATE 가 동시성 mutex: pending+미만료+미수락인 행을 단 한 호출만 차지(claim)한다.
-- (auth.users email UNIQUE 가 동시 createUser 도 직렬화하므로 이중 방어.)
-- 성공 시 public.users 생성 + 운영사/직원 측 전환을 같은 함수 내에서 원자 수행한다.
-- 실패(미수락/만료/이미 사용) 시 예외 → 호출부가 admin.deleteUser 보상.
create or replace function public.accept_invitation(p_token_hash text, p_user_id uuid)
returns table (target_role text, tenant_id uuid, operator_flag boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv invitations;
begin
  update invitations
    set status = 'accepted', accepted_at = now(), accepted_user_id = p_user_id, updated_at = now()
    where token_hash = p_token_hash
      and status = 'pending'
      and accepted_at is null
      and expires_at > now()
    returning * into v_inv;

  if not found then
    raise exception 'invitation not claimable' using errcode = 'P0001';
  end if;

  insert into public.users (id, role, tenant_id, employee_id, locale)
    values (p_user_id, v_inv.target_role, v_inv.tenant_id, v_inv.employee_id, 'ko');

  if v_inv.operator_flag then
    insert into public.operator_users (user_id, role, invited_at, activated_at, is_active)
      values (p_user_id, v_inv.target_role::operator_role, v_inv.created_at, now(), true);
  elsif v_inv.employee_id is not null then
    update public.employees
      set status = 'active', user_id = p_user_id, updated_at = now()
      where id = v_inv.employee_id;
  end if;

  return query select v_inv.target_role, v_inv.tenant_id, v_inv.operator_flag;
end;
$$;

revoke all on function public.get_invitation_by_token_hash(text) from public;
revoke all on function public.accept_invitation(text, uuid) from public;
grant execute on function public.get_invitation_by_token_hash(text) to anon, authenticated, service_role;
grant execute on function public.accept_invitation(text, uuid) to service_role;
