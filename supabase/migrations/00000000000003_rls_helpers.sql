-- RLS 헬퍼 함수 (SSOT: .flowset/db/rls.md §1)
-- 본 마이그레이션은 JWT 전용 헬퍼만 생성. departments/employees를 참조하는
-- my_team_employee_ids()는 해당 테이블 생성 후(Day 8, RLS 정책과 함께) 추가한다.

create or replace function current_tenant_id() returns uuid
  language sql stable as $$
    select nullif(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

create or replace function current_role_key() returns text
  language sql stable as $$
    select auth.jwt() ->> 'role'
$$;

create or replace function is_operator() returns boolean
  language sql stable as $$
    select current_role_key() in ('operator_super', 'operator_staff')
$$;

create or replace function is_operator_super() returns boolean
  language sql stable as $$
    select current_role_key() = 'operator_super'
$$;

create or replace function is_tenant_admin() returns boolean
  language sql stable as $$
    select current_role_key() in ('tenant_super', 'tenant_hr_admin')
$$;

create or replace function current_employee_id() returns uuid
  language sql stable as $$
    select nullif(auth.jwt() ->> 'employee_id', '')::uuid
$$;
