# Phase 3 — DB ERD 설계

> SSOT: `.flowset/spec/matrix.json` (39 엔티티). 본 Phase는 엔티티를 PostgreSQL 스키마로 정밀화.
> 산출물 디렉토리: `.flowset/db/`. Phase 7 개발 착수 시 `supabase/migrations/*.sql`로 변환.
> 2026-05-15 (KI-030 batch-003): 37 → 39 엔티티 (LegalDocument, UserConsent), 23 → 24 마이그레이션 파일.

## 파일 인덱스

| 파일 | 내용 |
|------|------|
| [erd.md](erd.md) | 전체 ERD Mermaid 다이어그램 + **39 엔티티 컬럼 명세 (도메인별 5분할: 운영사·HR·설정/연동·v1.2·컴플라이언스)** |
| [enums.md](enums.md) | enum 타입 + 상태값 (영문 통일, KI-004 해소 + KI-030 legal_document_type/consent_source) |
| [rls.md](rls.md) | Row Level Security 정책 (39 엔티티 × 6 역할, KI-014 routing + KI-030 §6-1 컴플라이언스) |
| [indexes.md](indexes.md) | 인덱스 설계 (쿼리 패턴 기반, KI-030 legal/consent 6 인덱스) |
| [migrations.md](migrations.md) | 마이그레이션 순서 + Supabase CLI 명령 (24 파일) |
| [seed.md](seed.md) | 시드 데이터 (roles, plans, feature_flags, legal v1.0.0, 신규 테넌트 자동 시드) |

> erd.md가 컬럼 명세까지 포함하여 SSOT 역할. 별도 schema-*.md 분할 생략 (라이트 원칙).

## 핵심 설계 원칙

### 1. 멀티테넌트 격리 (PRD 04-data-model.md §4)
- 모든 도메인 테이블에 `tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`
- 예외: `tenants`, `plans`, `feature_flags`, `audit_logs` (audit는 cross-tenant 조회 필요)
- RLS 정책: `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid` + 운영사 우회

### 2. PK / FK 규칙
- **기본 PK**: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` — 대부분 도메인 엔티티 적용
- **자연키 PK (예외)**: 글로벌 시드 테이블은 의미 있는 텍스트 키 사용 — `feature_flags.key text PK`, `roles.key text PK`. `INSERT ... ON CONFLICT (key) DO ...` 멱등 시드 패턴 적용
- **복합 PK**: `(parent_id, child_id)` 패턴 — `feature_flag_overrides (flag_key, tenant_id)`, `operator_users (user_id)` 단일 FK PK
- **FK**: `ON DELETE CASCADE` (테넌트 삭제 시 자식 모두 삭제) 또는 `ON DELETE RESTRICT` (직원 삭제 차단)

### 3. 타임스탬프
- 모든 테이블: `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`
- soft delete: `deleted_at timestamptz NULL` (운영사 보관 기능, 직원 퇴사 등)
- `updated_at` 자동 갱신 trigger 통일

### 4. enum 정책 (KI-004 해소)
- 모든 enum은 **영문 snake_case** 통일 (예: `attendance_status_enum`: `normal`, `late`, `early_leave`, `absent`)
- 화면 표시(한글)는 클라이언트 측 i18n 매핑
- 마이그레이션은 `CREATE TYPE` 사용

### 5. 인덱스 전략
- 모든 `tenant_id` 컬럼에 인덱스
- 필터/정렬 빈번 컬럼 복합 인덱스 (예: `(tenant_id, status, created_at DESC)`)
- 부분 인덱스 `WHERE` 절로 활성 행만 (예: `WHERE deleted_at IS NULL`)

### 6. JSONB 정책
- 변경 잦은 메타 (예: `tenant_settings.work_policy`, `integrations.config`)는 jsonb
- GIN 인덱스 (`USING gin (config jsonb_path_ops)`)
- 스키마 검증은 애플리케이션 레벨 (zod)

### 7. 감사 (audit_logs)
- 핵심 테이블 11개에 after-trigger (employees/leaves/approvals/attendances/documents/users/tenants/subscriptions/invoices/feature_flags/tenant_settings)
- 애플리케이션 레벨에서도 명시 INSERT (이중 — 트리거가 잡지 못한 비즈니스 액션 보강)

## Phase 3 진입 시 동반 KI 해소

| KI | 처리 위치 |
|----|---------|
| KI-002 (tenant_drafts ERD 스키마 확정) | schema-operator.md TenantDraft 절 |
| KI-004 (Attendance.status enum 영문 통일) | enums.md + schema-hr.md Attendance |
| KI-014 (AttendanceModification EP-07/08 경계 routing) | schema-hr.md AttendanceModification.approval_id FK + rls.md cross-Epic 권한 |

## 진행 흐름

| Step | 산출물 | evaluator |
|------|--------|----------|
| 3.0 | README + erd.md (Mermaid 전체) | — |
| 3.1 | schema-operator.md + schema-hr.md + schema-settings.md | — |
| 3.2 | enums.md (KI-004 해소) | — |
| 3.3 | rls.md (KI-014 routing) | — |
| 3.4 | indexes.md + migrations.md + seed.md | — |
| 3.5 | 전체 ERD evaluator (doc 모드) | doc |
