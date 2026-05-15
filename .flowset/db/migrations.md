# 마이그레이션 순서 + Supabase CLI

> Phase 7 개발 착수 시 본 문서를 그대로 `supabase/migrations/*.sql`로 변환.

## 1. 마이그레이션 파일 순서

```
supabase/migrations/
├── 00000000000001_extensions.sql              # uuid-ossp, pgcrypto, pg_trgm, postgis(선택)
├── 00000000000002_enums.sql                   # 모든 CREATE TYPE (db/enums.md)
├── 00000000000003_rls_helpers.sql             # current_tenant_id() 등 SQL 함수 (db/rls.md §1)
├── 00000000000004_global_tables.sql           # plans, feature_flags, roles, system_settings, maintenance_windows, backup_jobs
├── 00000000000005_tenants.sql                 # tenants, tenant_drafts, operator_users
├── 00000000000006_users.sql                   # users (auth.users 확장 view 또는 trigger)
├── 00000000000007_subscriptions_invoices.sql  # subscriptions, invoices
├── 00000000000008_features.sql                # feature_flag_overrides
├── 00000000000009_tickets.sql                 # tickets, ticket_messages
├── 00000000000010_org.sql                     # departments, employees
├── 00000000000011_settings.sql                # tenant_settings, work_policies, leave_types, approval_lines, document_templates
├── 00000000000012_attendance.sql              # attendances, attendance_modifications
├── 00000000000013_leave.sql                   # leaves, leave_balances
├── 00000000000014_approval.sql                # approvals, approval_steps
├── 00000000000015_documents.sql               # documents, certificate_requests, signatures (v1.2 슬롯)
├── 00000000000016_notifications.sql           # notifications
├── 00000000000017_audit.sql                   # audit_logs + 트리거
├── 00000000000018_integrations.sql            # integrations, integration_logs, api_keys
├── 00000000000019_change_requests.sql         # employee_change_requests
├── 00000000000020_legal.sql                   # legal_documents, user_consents (KI-030 batch-003)
├── 00000000000021_rls_policies.sql            # 모든 RLS 정책 (db/rls.md §3 + §6-1)
├── 00000000000022_indexes.sql                 # 모든 인덱스 (db/indexes.md)
├── 00000000000023_seed.sql                    # 기본 시드 (roles, plans, leave_types defaults, legal v1.0.0)
└── 00000000000024_realtime.sql                # Realtime publication (notifications, approvals, approval_steps)
```

## 2. 의존 관계

- 4 (globals) → 5 (tenants) → 6 (users) → 10 (employees, users.employee_id FK)
- 5 → 7 (invoices.tenant_id, subscription_id FK)
- 10 → 11 (work_policies, leave_types) → 12 (attendances) → 13 (leaves)
- 14 (approvals) ← 12/13/15/19 (polymorphic FK)
- 20 (legal_documents 글로벌, user_consents → users) → 6 이후 + 1 트랜잭션
- 21 (RLS) → 마지막 (모든 테이블 존재 후)
- 22 (인덱스) → 마지막
- 24 (Realtime) → 마지막

## 3. Supabase CLI 명령

```bash
# 새 마이그레이션 생성
supabase migration new {name}

# 로컬 적용
supabase db reset       # 모든 마이그레이션 + seed 재실행
supabase db push        # staging/production에 push (dry-run 후)

# 차이 검사
supabase db diff --use-migra

# 타입 자동 생성
supabase gen types typescript --local > packages/types/database.ts
```

## 4. 트랜잭션 / 롤백 정책

- 단일 마이그레이션 파일 = 1 트랜잭션 (Supabase 기본)
- 데이터 변환 마이그레이션은 별도 파일 + `BEGIN/COMMIT` 명시
- 실패 시 롤백 가능 (CI에서 dry-run 후 prod 적용)

## 5. v1.x 후속 마이그레이션 정책

- `000000000000{NN}_v1_1_{name}.sql` 형식 (NN 증가)
- breaking change는 dual-run (양 컬럼 유지 → 데이터 마이그레이션 → 구컬럼 제거 3단계)
- 인덱스 추가는 `CREATE INDEX CONCURRENTLY` (운영 lock 최소화)

## 6. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 23개 마이그레이션 파일 순서 + Supabase CLI | Phase 3 진입 |
| 2026-05-15 | 24개로 확장 (00000000000020_legal.sql 삽입, 이후 번호 +1) | KI-030 batch-003 |
