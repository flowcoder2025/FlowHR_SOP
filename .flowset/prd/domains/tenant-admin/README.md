# Tenant Admin 도메인 (테넌트 관리자)

> spec §7 (TA-01 ~ TA-14). 고객사 측 HR 관리 / 결재 / 회사 설정. 14개 화면.

## 인덱스

| ID | 화면 | MVP | 우선순위 | 파일 |
|----|------|:---:|:--------:|------|
| TA-01 | 관리자 대시보드 | ✓ | P1 | [TA-01-dashboard.md](TA-01-dashboard.md) |
| TA-02 | 직원 관리 | ✓ | P1 | [TA-02-employees.md](TA-02-employees.md) |
| TA-03 | 직원 상세 | ✓ | P1 | [TA-03-employee-detail.md](TA-03-employee-detail.md) |
| TA-04 | 조직도/부서 | ✓ | P1 | [TA-04-org-chart.md](TA-04-org-chart.md) |
| TA-05 | 근태 관리 | ✓ | P1 | [TA-05-attendance.md](TA-05-attendance.md) |
| TA-06 | 근태 수정 요청 | ✓ | P1 | [TA-06-attendance-modifications.md](TA-06-attendance-modifications.md) |
| TA-07 | 휴가 관리 | ✓ | P1 | [TA-07-leave-management.md](TA-07-leave-management.md) |
| TA-08 | 휴가 신청 상세/승인 | ✓ | P1 | [TA-08-leave-detail.md](TA-08-leave-detail.md) |
| TA-09 | 결재/승인 | ✓ | P1 | [TA-09-approvals.md](TA-09-approvals.md) |
| TA-10 | 급여/문서 관리 | ✓ | P1 | [TA-10-payroll-documents.md](TA-10-payroll-documents.md) |
| TA-11 | 문서함/전자계약 | △ | P2 | [TA-11-contracts.md](TA-11-contracts.md) |
| TA-12 | 리포트 | △ | P2 | [TA-12-reports.md](TA-12-reports.md) |
| TA-13 | 회사 설정 | ✓ | P2 | [TA-13-settings.md](TA-13-settings.md) |
| TA-14 | 외부 연동 | △ | P2 | [TA-14-integrations.md](TA-14-integrations.md) |

## 권한 (spec §9-3 요약)

| 화면 | tenant_super | tenant_hr_admin | tenant_manager | employee |
|------|:------------:|:---------------:|:--------------:|:--------:|
| TA-01 | R/E | R/E | R 일부 | X |
| TA-02 | CRUD/E/N | CRU/E/N | R 팀 | R 본인 |
| TA-03 | R/U/D/L | R/U/L | R 팀 일부 | R 본인 일부 |
| TA-04 | CRUD/E | CRU/E | R 조직 | R |
| TA-05 | CRU/E | CRU/E | RU 팀 | R 본인 |
| TA-06 | R/A/E/N | R/A/E/N | R/A 팀 | C/R/Cancel 본인 |
| TA-07 | CRUA/E/N | CRUA/E/N | R/A 팀 | R 본인 |
| TA-08 | R/A/N | R/A/N | R/A 팀 | R 본인 |
| TA-09 | R/A/N | R/A/N | R/A 지정 | C/R/Cancel 본인 |
| TA-10 | CRUD/E/N | CRU/E/N | X | R 본인 일부 |
| TA-11 | CRUD/E/N | CRU/E/N | R 일부 | R/Sign 본인 |
| TA-12 | R/E | R/E | R 팀 일부 | R 개인 일부 |
| TA-13 | CRUS/L | R/U 일부 | R 일부 | R 일부 |
| TA-14 | CRUD/S/L | R/U 일부 | X | X |

## 사이드바 메뉴 구조

```
관리자 메뉴
├── 대시보드 (TA-01)
├── HR 운영
│   ├── 직원 (TA-02, TA-03)
│   ├── 조직도 (TA-04)
│   ├── 근태 (TA-05, TA-06)
│   └── 휴가 (TA-07, TA-08)
├── 결재 (TA-09)
├── 문서
│   ├── 급여/인사문서 (TA-10)
│   └── 계약/전자서명 (TA-11)
├── 리포트 (TA-12)
└── 설정
    ├── 회사 설정 (TA-13)
    └── 외부 연동 (TA-14)
```

## 도메인 의존성

- 사용 엔티티: `tenants, employees, users, departments, attendances, attendance_modifications, leaves, leave_balances, leave_types, approvals, approval_steps, approval_lines, documents, certificate_requests, document_templates, tenant_settings, work_policies, integrations, notifications, audit_logs`
- 외부:
  - 카카오 알림톡 / SMS / 이메일 (TA-14에서 연결)
  - SSO (v1.2 — SAML/OIDC)
  - 전자서명 (v1.2 — TA-11)
