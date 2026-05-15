# RLS (Row Level Security) 정책

> 39 엔티티 × 6 역할 × CRUD 매트릭스. matrix.json `entities[*].permissions` 기반.
> KI-014 해소: AttendanceModification + 다른 polymorphic 결재가 approvals 테이블을 통해 routing.
> KI-030 (2026-05-15): legal_documents/user_consents 정책 §6-1 추가, 컴플라이언스 도메인은 패턴 D로 분리.

## 1. 기본 헬퍼 함수

```sql
-- JWT에서 tenant_id 추출
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid
  LANGUAGE sql STABLE AS $$
    SELECT NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

-- JWT에서 role 추출
CREATE OR REPLACE FUNCTION current_role_key() RETURNS text
  LANGUAGE sql STABLE AS $$
    SELECT auth.jwt() ->> 'role'
$$;

-- 운영사 여부
CREATE OR REPLACE FUNCTION is_operator() RETURNS boolean
  LANGUAGE sql STABLE AS $$
    SELECT current_role_key() IN ('operator_super', 'operator_staff')
$$;

-- 운영사 최고관리자
CREATE OR REPLACE FUNCTION is_operator_super() RETURNS boolean
  LANGUAGE sql STABLE AS $$
    SELECT current_role_key() = 'operator_super'
$$;

-- 테넌트 관리자(super/hr_admin) 여부
CREATE OR REPLACE FUNCTION is_tenant_admin() RETURNS boolean
  LANGUAGE sql STABLE AS $$
    SELECT current_role_key() IN ('tenant_super', 'tenant_hr_admin')
$$;

-- 현재 employee_id
CREATE OR REPLACE FUNCTION current_employee_id() RETURNS uuid
  LANGUAGE sql STABLE AS $$
    SELECT NULLIF(auth.jwt() ->> 'employee_id', '')::uuid
$$;

-- 매니저의 팀 직원 ID 집합 (자기 부서 + 하위)
CREATE OR REPLACE FUNCTION my_team_employee_ids() RETURNS SETOF uuid
  LANGUAGE sql STABLE AS $$
    WITH RECURSIVE my_subtree AS (
      SELECT d.id FROM departments d
        JOIN employees e ON e.department_id = d.id
        WHERE e.id = current_employee_id() AND e.role = 'tenant_manager'
      UNION ALL
      SELECT d.id FROM departments d JOIN my_subtree ms ON d.parent_id = ms.id
    )
    SELECT e.id FROM employees e WHERE e.department_id IN (SELECT id FROM my_subtree)
$$;
```

## 2. 정책 패턴 (3 유형)

### 패턴 A: 테넌트 격리 (가장 흔함)
```sql
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_select ON {table} FOR SELECT
  USING (tenant_id = current_tenant_id() OR is_operator());

CREATE POLICY tenant_isolation_modify ON {table} FOR ALL
  USING (tenant_id = current_tenant_id() OR is_operator_super())
  WITH CHECK (tenant_id = current_tenant_id() OR is_operator_super());
```

### 패턴 B: 본인만 (직원 셀프 서비스)
```sql
CREATE POLICY self_only_select ON {table} FOR SELECT
  USING (
    employee_id = current_employee_id()
    OR is_tenant_admin()
    OR is_operator()  -- audit 조회
  );

CREATE POLICY self_only_modify ON {table} FOR INSERT, UPDATE
  WITH CHECK (employee_id = current_employee_id() OR is_tenant_admin());
```

### 패턴 C: 매니저 팀 범위
```sql
CREATE POLICY manager_team_select ON {table} FOR SELECT
  USING (
    employee_id = current_employee_id()
    OR (current_role_key() = 'tenant_manager' AND employee_id IN (SELECT my_team_employee_ids()))
    OR is_tenant_admin()
    OR is_operator()
  );
```

### 패턴 D: 글로벌 정적 콘텐츠 + 불변 동의 이력 (KI-030 컴플라이언스)
```sql
-- 글로벌 (anonymous read 허용 + operator modify)
CREATE POLICY global_active_read ON {table} FOR SELECT
  USING (is_active = true OR is_operator());

CREATE POLICY operator_modify ON {table} FOR INSERT|UPDATE
  WITH CHECK (is_operator());

-- 불변 이력 (INSERT만, UPDATE/DELETE 명시 차단)
CREATE POLICY immutable_no_update ON {table} FOR UPDATE USING (false);
CREATE POLICY immutable_no_delete ON {table} FOR DELETE USING (false);
```

## 3. 엔티티별 정책 (39개)

### 운영사 도메인
| 테이블 | RLS | 핵심 정책 |
|--------|-----|---------|
| `plans` | ON | SELECT: 전체 공개, MODIFY: `is_operator_super()` |
| `tenants` | ON | SELECT: `is_operator() OR id = current_tenant_id()`, MODIFY: `is_operator()` |
| `tenant_drafts` | ON | `created_by = auth.uid() AND is_operator()` |
| `subscriptions` | ON | 패턴 A + 테넌트는 own_tenant SELECT만 |
| `invoices` | ON | 패턴 A + 테넌트 SELECT만 |
| `feature_flags` | ON | SELECT: 전체 공개, MODIFY: `is_operator()` |
| `feature_flag_overrides` | ON | MODIFY: `is_operator()`, SELECT: 패턴 A |
| `tickets` | ON | 패턴 A + employee는 `requester_id = current_employee_id()` |
| `ticket_messages` | ON | ticket.tenant_id 또는 ticket.requester_id, `is_internal=true` 행은 `is_operator() OR is_tenant_admin()` |
| `system_settings` | ON | SELECT: `is_operator()`, MODIFY: `is_operator_super()` |
| `maintenance_windows` | ON | SELECT: 전체 공개 (현재 상태), MODIFY: `is_operator()` |
| `backup_jobs` | ON | `is_operator()` |
| `operator_users` | ON | `is_operator()` |

### HR 도메인
| 테이블 | RLS | 핵심 정책 |
|--------|-----|---------|
| `departments` | ON | 패턴 A + 매니저는 `id IN (own_subtree)` |
| `employees` | ON | 패턴 C (매니저 팀 범위) + employee는 본인만 |
| `users` | ON | 본인만 (`id = auth.uid()`) + `is_tenant_admin()` 자기 테넌트 SELECT + 운영사 |
| `roles` | ON | SELECT: 전체 공개, MODIFY: `is_operator_super()` |
| `attendances` | ON | 패턴 C |
| `attendance_modifications` | ON | 패턴 C + employee CREATE 본인만 |
| `leave_types` | ON | SELECT: 패턴 A 전 직원 가능, MODIFY: `is_tenant_admin()` |
| `leaves` | ON | 패턴 C + employee CREATE 본인만 + Cancel 본인 |
| `leave_balances` | ON | 패턴 C + MODIFY: `is_tenant_admin()` |
| `approval_lines` | ON | SELECT: 패턴 A 전 직원, MODIFY: `is_tenant_admin()` |
| `approvals` | ON | (KI-014) 패턴 — `requester_id = current_employee_id()` OR `EXISTS (SELECT 1 FROM approval_steps s WHERE s.approval_id = approvals.id AND s.approver_id = current_employee_id())` OR `is_tenant_admin()` OR `is_operator()` |
| `approval_steps` | ON | approval.tenant_id 격리 + `approver_id = current_employee_id() OR is_tenant_admin()` |
| `documents` | ON | 패턴 A + 본인 또는 `visibility='company_wide'` 또는 `is_tenant_admin()` |
| `certificate_requests` | ON | 패턴 B + `is_tenant_admin()` |
| `notifications` | ON | 본인만 (`user_id = auth.uid()`) |
| `audit_logs` | ON | SELECT: `is_operator()` (전체) + `is_tenant_admin()` (own_tenant) + employee 본인 일부 (actor=self), INSERT: 시스템 (`bypass`) |
| `employee_change_requests` | ON | 패턴 B + `is_tenant_admin()` 승인 |

### 설정 / 연동 / v1.2
| 테이블 | RLS | 핵심 정책 |
|--------|-----|---------|
| `tenant_settings` | ON | 패턴 A + employee SELECT 일부 (공개 정책만) |
| `work_policies` | ON | 패턴 A + MODIFY: `is_tenant_admin()` |
| `document_templates` | ON | 패턴 A + MODIFY: `is_tenant_admin()` |
| `integrations` | ON | 패턴 A + MODIFY: `tenant_super` only (credentials 민감) |
| `integration_logs` | ON | 패턴 A SELECT만 |
| `api_keys` | ON | `is_operator_super()` (운영사 키) OR `tenant_super` AND `owner_type='tenant'` AND tenant_id 격리 |
| `signatures` | ON | document 테이블 격리 상속 |

## 4. KI-014 해소 — Approval Polymorphic Routing

`approvals` 테이블이 휴가/근태수정/증명서/정보변경/문서 5종을 통합. RLS에서 다음 규칙으로 routing:

```sql
CREATE POLICY approval_unified_access ON approvals FOR SELECT
  USING (
    tenant_id = current_tenant_id() AND (
      requester_id = current_employee_id()  -- 본인이 제출
      OR EXISTS (
        SELECT 1 FROM approval_steps s
        WHERE s.approval_id = approvals.id AND s.approver_id = current_employee_id()
      )  -- 결재자로 지정
      OR (current_role_key() = 'tenant_manager' AND requester_id IN (SELECT my_team_employee_ids()))
      OR is_tenant_admin()
    )
  );

CREATE POLICY approval_update_processor ON approvals FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND (
      is_tenant_admin()
      OR EXISTS (
        SELECT 1 FROM approval_steps s
        WHERE s.approval_id = approvals.id
          AND s.approver_id = current_employee_id()
          AND s.status = 'pending'
      )  -- 현재 단계 결재자만
      OR (requester_id = current_employee_id() AND status IN ('pending', 'in_progress'))  -- 요청자 취소
    )
  );
```

## 5. 운영사 우회 정책

운영사(`operator_*`)는 audit 목적으로 cross-tenant SELECT 가능. INSERT/UPDATE/DELETE는 명시적 운영사 API를 통해서만 (예: 테넌트 비활성화).

```sql
-- 모든 테이블에 우회 정책 (audit 조회용)
CREATE POLICY operator_cross_tenant_read ON {sensitive_table} FOR SELECT
  USING (is_operator());
```

다만 `system_settings`, `operator_users`, `backup_jobs`, `tenants`(MODIFY)는 운영사 전용 — `is_operator()` 검사가 SELECT뿐 아니라 MODIFY까지.

## 6. RLS 미적용 예외

- **`audit_logs`** INSERT: 모든 액션이 자동 기록되어야 하므로 RLS bypass. 단 SELECT는 위 매트릭스대로 제한.
- **시드 데이터** 마이그레이션: `service_role` 키로 bypass.
- **`legal_documents` SELECT**: 비로그인 사용자도 푸터 링크로 active 버전 조회 가능 — `is_active=true` 행에 대해 anonymous SELECT 허용 (USING (is_active = true OR is_operator())).

## 6-1. 컴플라이언스 도메인 RLS (KI-030 batch-003)

```sql
-- legal_documents (글로벌 — tenant_id 없음)
CREATE POLICY legal_docs_anonymous_read ON legal_documents FOR SELECT
  USING (is_active = true OR is_operator());

CREATE POLICY legal_docs_operator_modify ON legal_documents FOR INSERT
  WITH CHECK (is_operator());

CREATE POLICY legal_docs_operator_update ON legal_documents FOR UPDATE
  USING (is_operator())
  WITH CHECK (is_operator());

-- user_consents (자기 자신 + 운영사 감사)
CREATE POLICY consents_self_insert ON user_consents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY consents_self_read ON user_consents FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_operator()  -- 감사 (운영사 user의 tenant_id IS NULL row도 포함)
    OR (auth.jwt() ->> 'role' = 'tenant_super' AND tenant_id = current_tenant_id())  -- 본인 회사 동의 이력
  );

-- 불변성 명시 차단 (Phase 7 마이그레이션 시 패턴 D 적용)
CREATE POLICY consents_no_update ON user_consents FOR UPDATE
  USING (false);

CREATE POLICY consents_no_delete ON user_consents FOR DELETE
  USING (false);

-- 추가 안전망: BEFORE UPDATE/DELETE trigger로 RAISE EXCEPTION
CREATE OR REPLACE FUNCTION user_consents_block_modify() RETURNS trigger
  LANGUAGE plpgsql AS $$
  BEGIN
    RAISE EXCEPTION 'user_consents are immutable (compliance log)';
  END;
$$;

CREATE TRIGGER user_consents_block_update
  BEFORE UPDATE OR DELETE ON user_consents
  FOR EACH ROW EXECUTE FUNCTION user_consents_block_modify();
```

### legal_documents `is_active` 단일 보장 트리거 (language 차원 포함, i18n batch-005)

```sql
-- 같은 (type, language) 내 is_active=true는 항상 최대 1행 (INSERT/UPDATE 시 자동 false 전환)
CREATE OR REPLACE FUNCTION legal_documents_ensure_single_active() RETURNS trigger
  LANGUAGE plpgsql AS $$
  BEGIN
    IF NEW.is_active = true THEN
      UPDATE legal_documents
        SET is_active = false, updated_at = now()
        WHERE type = NEW.type
          AND language = NEW.language       -- i18n: ko/en 별도 active 유지
          AND id <> NEW.id
          AND is_active = true;
    END IF;
    RETURN NEW;
  END;
$$;

CREATE TRIGGER legal_documents_single_active
  BEFORE INSERT OR UPDATE ON legal_documents
  FOR EACH ROW EXECUTE FUNCTION legal_documents_ensure_single_active();
```

partial unique index(`idx_legal_docs_active_per_type_lang`)와 이중 보호: 트리거가 기존 (type, language) active를 자동 false 전환 + index가 race condition 시 INSERT 차단.

**i18n 게시 정책 (batch-005)**: 새 약관 버전 게시 시 ko + en **둘 다 동시 게시 의무** (운영사 OP-11 또는 별도 화면에서 양 언어 페어 검증). 한쪽만 게시하면 application 레벨에서 거부.

## 7. 정책 테스트 의무 (Phase 7 ST-021)

권한 매트릭스 음성/양성 케이스 자동 테스트 — 6 역할 × 핵심 엔티티 × CRUD = 약 800 케이스. matrix.json `permissions` 표를 SSOT로 fixture 생성.

## 8. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 37 테이블 RLS 정책 + 6 헬퍼 함수 + Approval polymorphic routing (KI-014 해소) | Phase 3 진입 |
| 2026-05-15 | legal_documents / user_consents RLS 추가 (§6-1) | KI-030 batch-003 |
| 2026-05-16 | i18n: legal_documents trigger language 차원 추가 + ko/en 동시 게시 의무 정책 | 사용자 결정 batch-005 |
