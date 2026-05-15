# 시드 데이터

> 모든 신규 환경 (local/preview/staging/production) 셋업 시 자동 INSERT.

## 1. roles (글로벌 6 역할)

```sql
INSERT INTO roles (key, label_ko, is_system, default_permissions) VALUES
  ('operator_super', '운영사 최고관리자', true, '{"all_tenants":"crud","operator_users":"crud","system":"crud"}'),
  ('operator_staff', '운영사 일반관리자', true, '{"all_tenants":"r","tickets":"crud","operator_users":"r"}'),
  ('tenant_super', '테넌트 최고관리자', true, '{"own_tenant":"crud","settings":"crud","employees":"crud","payroll":"crud"}'),
  ('tenant_hr_admin', 'HR 관리자', true, '{"employees":"cru","attendance":"crud","leave":"crud","documents":"cru"}'),
  ('tenant_manager', '팀장/결재권자', true, '{"own_team":"r","approval":"a"}'),
  ('employee', '직원', true, '{"self":"ru","attendance":"c","leave":"cr","documents":"r"}')
ON CONFLICT (key) DO UPDATE SET label_ko = EXCLUDED.label_ko, default_permissions = EXCLUDED.default_permissions;
```

## 2. plans (3 기본 요금제)

```sql
INSERT INTO plans (slug, name, base_price_krw, per_user_price_krw, included_users, modules, status, is_public, sort_order)
VALUES
  ('basic', '기본', 0, 2500, 0, ARRAY['attendance','leave','approval','payroll_view'], 'active', true, 1),
  ('premium', '프리미엄', 500000, 3500, 10, ARRAY['attendance','leave','approval','payroll_view','documents','reports','integrations','audit'], 'active', true, 2),
  ('custom', '커스텀', 0, 0, 0, ARRAY['*'], 'custom', false, 99)
ON CONFLICT (slug) DO NOTHING;
```

## 3. feature_flags (글로벌 + 베타)

```sql
INSERT INTO feature_flags (key, label_ko, description, module, global_state, is_beta) VALUES
  ('attendance', '근태', '직원 출퇴근 기록', 'attendance', 'active', false),
  ('leave', '휴가', '휴가 신청·승인', 'leave', 'active', false),
  ('approval', '결재', '결재 통합 인박스', 'approval', 'active', false),
  ('payroll', '급여명세서', '급여명세서 발송', 'payroll', 'active', false),
  ('documents', '문서함', '인사 문서 관리', 'documents', 'active', false),
  ('integrations', '외부 연동', '카카오/SMS/SSO 등', 'integrations', 'active', false),
  ('reports', '리포트', '운영 리포트', 'reports', 'active', false),
  ('audit', '감사 로그', '감사 로그 조회', 'audit', 'active', false),
  ('e_contract', '전자계약', '전자서명 (v1.2)', 'documents', 'inactive', true),
  ('sso_saml', 'SSO (SAML)', '싱글 사인온 (v1.2)', 'integrations', 'inactive', true),
  ('reports_custom', '커스텀 리포트 빌더', '사용자 정의 리포트 (v1.3)', 'reports', 'inactive', true),
  ('webhook', 'Webhook', '외부 이벤트 발송 (v1.3)', 'integrations', 'inactive', true),
  ('dark_mode', '다크 모드', 'UI 테마 (v1.2)', 'system', 'inactive', true)
ON CONFLICT (key) DO NOTHING;
```

## 4. 신규 테넌트 가입 시 자동 시드 (OP-04 트랜잭션 일부)

테넌트 등록 시 다음 데이터를 함께 INSERT:

### 4-1. 기본 부서 (1개)
```sql
INSERT INTO departments (tenant_id, name, code, is_active)
VALUES (NEW_TENANT_ID, '본사', 'HQ', true);
```

### 4-2. 기본 work_policy
```sql
INSERT INTO work_policies (tenant_id, name, standard_clock_in, standard_clock_out, late_threshold, break_minutes_default, weekly_max_hours, is_default, applied_from)
VALUES (NEW_TENANT_ID, '기본 근무', '09:00', '18:00', '09:01', 60, 52, true, CURRENT_DATE);
```

### 4-3. 기본 leave_types (5종)
```sql
INSERT INTO leave_types (tenant_id, key, label_ko, default_days, evidence_required, carryover_allowed, is_paid, sort_order) VALUES
  (NEW_TENANT_ID, 'annual', '연차', 15, false, true, true, 1),
  (NEW_TENANT_ID, 'sick', '병가', 3, true, false, true, 2),
  (NEW_TENANT_ID, 'family_event', '경조사', 5, true, false, true, 3),
  (NEW_TENANT_ID, 'maternity', '출산휴가', 90, true, false, true, 4),
  (NEW_TENANT_ID, 'unpaid', '무급휴가', 0, false, false, false, 99);
```

### 4-4. 기본 approval_lines (4종)
```sql
INSERT INTO approval_lines (tenant_id, name, request_type, default_line, is_active) VALUES
  (NEW_TENANT_ID, '기본 휴가 라인', 'leave',
    '[{"order":1,"approver_role":"tenant_manager","dept_scope":"own_team"},{"order":2,"approver_role":"tenant_super","dept_scope":"all"}]', true),
  (NEW_TENANT_ID, '기본 근태 수정', 'attendance_mod',
    '[{"order":1,"approver_role":"tenant_manager","dept_scope":"own_team"},{"order":2,"approver_role":"tenant_hr_admin","dept_scope":"all"}]', true),
  (NEW_TENANT_ID, '기본 증명서', 'certificate',
    '[{"order":1,"approver_role":"tenant_hr_admin","dept_scope":"all"}]', true),
  (NEW_TENANT_ID, '기본 정보 변경', 'change_request',
    '[{"order":1,"approver_role":"tenant_hr_admin","dept_scope":"all"}]', true);
```

### 4-5. 기본 document_templates (2종)
```sql
INSERT INTO document_templates (tenant_id, key, label_ko, template_body, variables, template_format) VALUES
  (NEW_TENANT_ID, 'labor_contract', '표준 근로계약서',
    '근로계약서\n\n회사: {{company_name}}\n근로자: {{employee_name}}\n직급: {{position}}\n연봉: {{salary}}원\n입사일: {{joined_at}}\n...',
    ARRAY['company_name','employee_name','position','salary','joined_at'], 'pdf'),
  (NEW_TENANT_ID, 'employment_cert', '재직증명서',
    '재직증명서\n\n위 {{employee_name}}은(는) {{company_name}}에 {{joined_at}}부터 현재까지 재직 중임을 증명합니다.\n발급일: {{issued_at}}',
    ARRAY['employee_name','company_name','joined_at','issued_at'], 'pdf');
```

### 4-6. 신입 직원 자동 leave_balances
```sql
-- 직원 등록 시 active 직원 모두에 대해 연차 자동 부여
INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, year, granted, used, scheduled, remaining, expires_at)
SELECT NEW_EMPLOYEE_TENANT_ID, NEW_EMPLOYEE_ID, lt.id, EXTRACT(YEAR FROM CURRENT_DATE), lt.default_days, 0, 0, lt.default_days,
  (CURRENT_DATE + INTERVAL '1 year')
FROM leave_types lt WHERE lt.tenant_id = NEW_EMPLOYEE_TENANT_ID AND lt.default_days > 0;
```

## 5. 개발/베타 환경 데모 시드 (선택)

베타 진입 전 staging 환경에 데모 테넌트 1사 + 직원 30명 + 임의 근태/휴가/문서 — 사용자 데모용. `supabase/seed.sql`에 선택 적용.

## 6. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — roles/plans/feature_flags 글로벌 시드 + 신규 테넌트 자동 시드 + 직원 leave_balances 자동 | Phase 3 진입 |
