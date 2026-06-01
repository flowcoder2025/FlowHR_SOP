-- Sprint 2 — 테넌트 라이프사이클/회사설정 하드닝 (WI-031)
-- SSOT: .flowset/sprints/sprint-002.md (DoD + R-위험) + .flowset/db/erd.md §2/§3
-- 기존 테이블(mig 5/7/11)에 대한 delta — 신규 생성 아님. 전부 idempotent(if not exists / on conflict 없음은 가드).
-- gin_trgm_ops 해석을 위해 extensions 스키마를 search_path에 포함(pg_trgm은 mig 1에서 extensions 스키마 설치).

set search_path = public, extensions;

-- ── tenant_drafts: 임시저장 충돌 방지(R-마법사) + 단계 무결성 ───────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tenant_draft_status') then
    create type tenant_draft_status as enum ('draft', 'submitting', 'completed', 'abandoned');
  end if;
end
$$;

alter table tenant_drafts
  add column if not exists status tenant_draft_status not null default 'draft',
  add column if not exists submitted_tenant_id uuid references tenants (id) on delete set null,
  add column if not exists completed_at timestamptz,
  add column if not exists abandoned_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tenant_drafts_current_step_range'
      and conrelid = 'tenant_drafts'::regclass
  ) then
    alter table tenant_drafts
      add constraint tenant_drafts_current_step_range check (current_step between 1 and 7);
  end if;
end
$$;

-- 기존 staging에 같은 운영자의 열린 draft가 복수면 최신 1개만 유지(나머지 abandoned).
with ranked as (
  select id,
         row_number() over (
           partition by created_by
           order by updated_at desc, created_at desc, id desc
         ) as rn
  from tenant_drafts
  where created_by is not null and status in ('draft', 'submitting')
)
update tenant_drafts d
   set status = 'abandoned',
       abandoned_at = coalesce(d.abandoned_at, now()),
       updated_at = now()
  from ranked r
 where d.id = r.id
   and r.rn > 1;

-- 운영자당 열린 draft 1개만 허용(임시저장 재진입 = 이 1개를 복원).
create unique index if not exists ux_tenant_drafts_one_open_per_operator
  on tenant_drafts (created_by)
  where created_by is not null and status in ('draft', 'submitting');

create index if not exists idx_tenant_drafts_created_by_status_updated_at
  on tenant_drafts (created_by, status, updated_at desc);

-- ── tenants: OP-02 목록 검색/필터/정렬 + 슬러그 대소문자 무관 무결성 ──────────────
-- slug는 이미 unique(대소문자 구분). 도메인 슬러그는 대소문자 무관이어야 하므로 추가 보강.
create unique index if not exists ux_tenants_slug_lower
  on tenants (lower(slug));

-- 회사명 부분일치 검색(ILIKE %term%) — trigram GIN.
create index if not exists idx_tenants_name_trgm
  on tenants using gin (name extensions.gin_trgm_ops);

-- 상태/요금제 필터 + 최근활동(updated_at) 정렬.
create index if not exists idx_tenants_status_plan_updated_at
  on tenants (status, plan_id, updated_at desc);

create index if not exists idx_tenants_plan_updated_at
  on tenants (plan_id, updated_at desc);

create index if not exists idx_tenants_updated_at_desc
  on tenants (updated_at desc);

-- ── 결제/구독: OP-02 결제상태 컬럼 + OP-03 현재 구독 조회 ─────────────────────────
create index if not exists idx_subscriptions_tenant_period_end_desc
  on subscriptions (tenant_id, period_end desc, period_start desc);

create index if not exists idx_invoices_tenant_period_month_desc
  on invoices (tenant_id, period_month desc, created_at desc);

-- ── work_policies: 기본 근무정책 테넌트당 1개 + 적용일 정렬 ───────────────────────
with ranked_defaults as (
  select id,
         row_number() over (
           partition by tenant_id
           order by updated_at desc, created_at desc, id desc
         ) as rn
  from work_policies
  where is_default = true
)
update work_policies wp
   set is_default = false,
       updated_at = now()
  from ranked_defaults r
 where wp.id = r.id
   and r.rn > 1;

create unique index if not exists ux_work_policies_one_default_per_tenant
  on work_policies (tenant_id)
  where is_default = true;

create index if not exists idx_work_policies_tenant_applied_from
  on work_policies (tenant_id, applied_from desc);

-- ── document_templates: leave_types와 동일하게 (tenant_id, key) 유일성 보강 ────────
create unique index if not exists ux_document_templates_tenant_key
  on document_templates (tenant_id, key);

-- ── approval_lines: 결재라인 조회(WI-034 조건 엔진) ──────────────────────────────
create index if not exists idx_approval_lines_tenant_type_active
  on approval_lines (tenant_id, request_type, is_active);
