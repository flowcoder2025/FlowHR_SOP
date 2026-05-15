# 인덱스 설계

> 쿼리 패턴 기반. PRD §5 NFR 성능 목표 (p95 ≤ 500ms, 1000명 직원 목록 ≤ 1s) 달성 보장.

## 1. 공통 규칙

- 모든 도메인 테이블의 `tenant_id` 컬럼은 인덱스 필수 (`btree`)
- 페이지네이션 키 `(tenant_id, created_at DESC, id)` 패턴
- 부분 인덱스 `WHERE deleted_at IS NULL` 활용 (soft delete 행 제외)
- jsonb는 `GIN (config jsonb_path_ops)` (필요한 경우만)

## 2. 핵심 쿼리 패턴 × 인덱스

### Tenants / Subscriptions / Invoices
```sql
CREATE INDEX idx_tenants_status ON tenants (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_plan ON tenants (plan_id);
CREATE UNIQUE INDEX idx_tenants_business_number ON tenants (business_number);
CREATE UNIQUE INDEX idx_tenants_slug ON tenants (slug);

CREATE INDEX idx_subscriptions_tenant ON subscriptions (tenant_id);
CREATE INDEX idx_subscriptions_period ON subscriptions (period_end) WHERE period_end > now();

CREATE INDEX idx_invoices_tenant_month ON invoices (tenant_id, period_month DESC);
CREATE INDEX idx_invoices_status_due ON invoices (status, due_date) WHERE status IN ('issued', 'overdue');
CREATE UNIQUE INDEX idx_invoices_number ON invoices (invoice_number);
```

### Tickets / Audit Logs
```sql
CREATE INDEX idx_tickets_tenant_status_created ON tickets (tenant_id, status, created_at DESC);
CREATE INDEX idx_tickets_assigned_sla ON tickets (assigned_to, sla_deadline) WHERE status IN ('open', 'in_progress', 'waiting_user');
CREATE INDEX idx_tickets_priority ON tickets (priority, sla_deadline) WHERE status != 'closed';

CREATE INDEX idx_audit_tenant_created ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs (actor_id, created_at DESC);
CREATE INDEX idx_audit_target ON audit_logs (target_type, target_id);
CREATE INDEX idx_audit_action ON audit_logs (action, created_at DESC);
```

### Employees / Departments
```sql
CREATE INDEX idx_employees_tenant_dept_status ON employees (tenant_id, department_id, status);
CREATE INDEX idx_employees_user ON employees (user_id);
CREATE UNIQUE INDEX idx_employees_email ON employees (email);
CREATE UNIQUE INDEX idx_employees_tenant_employee_number ON employees (tenant_id, employee_number);
CREATE INDEX idx_employees_role ON employees (tenant_id, role) WHERE role != 'employee';

CREATE INDEX idx_departments_tenant_parent ON departments (tenant_id, parent_id);
```

### Attendances (가장 큰 테이블)
```sql
-- 직원 본인 조회: GET /api/v1/me/attendances
CREATE INDEX idx_attendances_employee_date ON attendances (employee_id, work_date DESC);

-- 회사 모니터링: GET /api/v1/tenant/attendances?from&to
CREATE INDEX idx_attendances_tenant_date ON attendances (tenant_id, work_date DESC);

-- 부서 필터: 추가 인덱스 (TA-05 부서 필터 빈번)
CREATE INDEX idx_attendances_tenant_dept_date ON attendances (tenant_id, work_date DESC) INCLUDE (employee_id);

-- 누락 자동 처리 cron (23:59): 오늘 출근 있고 퇴근 없는 행
CREATE INDEX idx_attendances_missing_check ON attendances (work_date, clock_out_at) WHERE clock_out_at IS NULL;

-- 파티셔닝 검토 (v1.1+): 월 단위 파티션 (`work_date`) — 직원 10만 × 1만 출퇴근/일 시점
```

### Leaves / Leave Balances
```sql
CREATE INDEX idx_leaves_employee_date ON leaves (employee_id, start_date DESC);
CREATE INDEX idx_leaves_tenant_status_requested ON leaves (tenant_id, status, requested_at DESC);
CREATE INDEX idx_leaves_pending_approver ON leaves (status) WHERE status IN ('pending', 'in_progress');

CREATE INDEX idx_leave_balances_employee_type ON leave_balances (employee_id, leave_type_id);
CREATE INDEX idx_leave_balances_expires ON leave_balances (expires_at) WHERE remaining > 0;
```

### Approvals / Approval Steps
```sql
CREATE INDEX idx_approvals_tenant_status ON approvals (tenant_id, status, requested_at DESC);
CREATE INDEX idx_approvals_requester ON approvals (requester_id, requested_at DESC);
CREATE INDEX idx_approvals_request_object ON approvals (request_type, request_object_id);

-- 결재자 인박스 핵심 쿼리
CREATE INDEX idx_approval_steps_approver_pending ON approval_steps (approver_id, status, created_at DESC)
  WHERE status = 'pending';
CREATE INDEX idx_approval_steps_approval ON approval_steps (approval_id, step_order);
```

### Documents
```sql
CREATE INDEX idx_documents_tenant_owner ON documents (tenant_id, owner_id);
CREATE INDEX idx_documents_subtype_status ON documents (tenant_id, sub_type, status);
CREATE INDEX idx_documents_unread ON documents (owner_id, status) WHERE status IN ('sent', 'created');
CREATE INDEX idx_documents_company_wide ON documents (tenant_id, sub_type) WHERE visibility = 'company_wide';
```

### Notifications
```sql
-- 헤더 배지: 미열람 카운트
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, read_status, created_at DESC)
  WHERE read_status = false;
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);
```

### Feature Flags / Settings
```sql
CREATE INDEX idx_feature_flag_overrides_tenant ON feature_flag_overrides (tenant_id);
CREATE UNIQUE INDEX idx_tenant_settings_tenant ON tenant_settings (tenant_id);
CREATE INDEX idx_work_policies_tenant_default ON work_policies (tenant_id, is_default) WHERE is_default = true;
```

### Integrations / API Keys
```sql
CREATE INDEX idx_integrations_tenant_type ON integrations (tenant_id, type);
CREATE INDEX idx_integration_logs_tenant_created ON integration_logs (tenant_id, created_at DESC);
CREATE INDEX idx_api_keys_owner ON api_keys (owner_type, tenant_id) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX idx_api_keys_hash ON api_keys (key_hash);
```

## 3. 인덱스 운영 전략

### 모니터링
- Supabase Dashboard에서 `pg_stat_user_indexes` 주간 점검
- 사용률 0인 인덱스 제거 후보
- 사용률 높지만 큰 인덱스는 `EXPLAIN ANALYZE`로 효율 확인

### v1.1+ 확장
- `attendances` 월 단위 파티셔닝 (직원 10만+ 시점)
- `audit_logs` 6개월 단위 파티셔닝 (조회 거의 안 되는 오래된 로그)
- 머터리얼라이즈드 뷰: `dashboard_kpis_daily` (OP-10/TA-12 리포트 가속)

## 4. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 37 엔티티 핵심 인덱스 + 파티셔닝 검토 | Phase 3 진입 |
