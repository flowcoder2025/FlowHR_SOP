-- 컴플라이언스: 약관/동의 (SSOT: .flowset/db/erd.md §5, rls.md §6-1, KI-030 batch-003)
-- 단일-active 트리거(legal_documents_ensure_single_active) + 불변 트리거(user_consents_block_modify)는
-- ST-078(Sprint 1 Day 11~12)에서 RLS 정책과 함께 추가. 본 파일은 스키마 + 제약만.

create table legal_documents (
  id uuid primary key default gen_random_uuid(),
  type legal_document_type not null,
  version text not null,
  language text not null check (language in ('ko', 'en')),
  effective_date date,
  title text,
  content_md text,
  summary_md text,
  is_active boolean not null default false,
  published_by uuid references users (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, version, language)
);

-- 동일 (type, language)에서 is_active=true는 최대 1행 (트리거와 이중 보호).
create unique index idx_legal_docs_active_per_type_lang
  on legal_documents (type, language)
  where is_active;

create table user_consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete set null,
  user_id uuid not null references users (id) on delete cascade,
  document_id uuid not null references legal_documents (id) on delete restrict,
  document_type text not null,
  version text not null,
  consented_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  source consent_source not null,
  unique (user_id, document_id)
);

create index idx_user_consents_user_id on user_consents (user_id);
create index idx_user_consents_document_id on user_consents (document_id);
