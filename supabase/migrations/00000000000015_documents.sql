-- 문서/증명서/서명 (SSOT: .flowset/db/erd.md §3, §4 v1.2 슬롯)

create table documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  owner_id uuid references employees (id) on delete set null,
  sub_type document_sub_type not null,
  title text,
  file_url text,
  mime_type text,
  file_size_bytes bigint,
  template_id uuid references document_templates (id) on delete set null,
  metadata jsonb,
  status document_status not null default 'draft',
  visibility document_visibility not null default 'owner_only',
  sent_at timestamptz,
  viewed_at timestamptz,
  acknowledged_at timestamptz,
  expires_at date,
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table certificate_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  certificate_type text,
  submission_target text,
  purpose text,
  copies int not null default 1,
  delivery_method text,
  request_memo text,
  approval_id uuid references approvals (id) on delete set null,
  issued_document_id uuid references documents (id) on delete set null,
  status certificate_request_status not null default 'pending',
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table signatures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  document_id uuid not null references documents (id) on delete cascade,
  signer_employee_id uuid references employees (id) on delete set null,
  signer_method text,
  external_provider text,
  external_id text,
  signed_at timestamptz,
  signature_image_url text,
  evidence_payload jsonb,
  status signature_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index idx_documents_tenant_id on documents (tenant_id);
create index idx_documents_owner_id on documents (owner_id);
create index idx_certificate_requests_employee_id on certificate_requests (employee_id);
create index idx_signatures_document_id on signatures (document_id);
