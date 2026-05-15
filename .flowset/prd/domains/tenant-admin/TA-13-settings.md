---
screen_id: TA-13
screen_name: 회사 설정
role: [tenant_super, tenant_hr_admin, tenant_manager, employee]
entities: [TenantSetting, WorkPolicy, LeaveType, ApprovalLine, DocumentTemplate, Role, AuditLog]
platforms: [web, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-13
---

# TA-13 회사 설정

## 1. 목적

고객사의 HR 정책·권한·문서양식을 마스터 관리. 초기에 운영사가 OP-04에서 세팅하고, 이후 tenant_super가 운영.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | CRUS/L (전권) |
| tenant_hr_admin | R/U 일부 (회사정보·휴가정책·문서양식 수정, 권한/보안 read-only) |
| tenant_manager | R 일부 (조회만) |
| employee | R 일부 (취업규칙·휴가정책 등 공개 정보만) |

## 3. UI 요소

### 3-1. 탭 9개
| 탭 | 내용 |
|----|------|
| 회사정보 | 회사명·로고·연락처·주소·대표자·업종·도메인 |
| 근무정책 | 근무시간·휴게시간·표준 출퇴근·지각 기준·근무제(고정/시차/유연) |
| 휴가정책 | leave_types 마스터 (연차/병가/경조사 정의 + 부여 룰 + 회계 기준) |
| 결재라인 | approval_lines 마스터 (휴가/근태/증명서 결재 단계 템플릿) |
| 역할권한 | 운영사/super/hr_admin/manager/employee 별 권한 매트릭스 (대부분 read-only, 일부 커스텀) |
| 알림 | 알림 채널 우선순위 (인앱/푸시/카카오/SMS/이메일), 템플릿 |
| 문서양식 | document_templates 마스터 (계약서/증명서) |
| 보안 | 비밀번호 정책·세션 만료·2FA 강제 |
| 감사로그 | OP-09 필터 뷰 (본 테넌트만) |

### 3-2. 근무정책 폼
- 표준 근무시간 (예: 09:00 ~ 18:00)
- 휴게시간 (예: 12:00 ~ 13:00)
- 지각 기준 (예: 09:01)
- 근무제 (고정 / 시차 / 유연 / 재택 옵션)
- 주 52시간 알림 임계

### 3-3. 휴가정책 폼
- 연차 부여 기준 (입사일 기준 / 회계연도 기준)
- 1년 미만 입사자 정책
- 유형 추가 (병가·경조사·출산 등) — 유형명·일수·이월 가능 여부·증빙 필수 여부

### 3-4. 결재라인 폼
- 결재 종류 (휴가·근태수정·증명서·문서)
- 단계 정의 (직원의 직급/부서장/HR/대표 등)
- 조건 분기 (예: 5일 이상 휴가는 대표 결재)

### 3-5. 액션
- 저장 (탭별, 변경 시 적용예정으로 표시 + 적용일 선택)
- "정책 추가" / "정책 복제"
- "결재라인 수정" / "권한 수정"
- "양식 업로드"

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 저장 | `onSaveSetting` |
| 정책 추가 | `onAddPolicy` |
| 결재라인 수정 | `onEditApprovalLine` |
| 권한 수정 | `onEditRole` (커스텀 권한, MVP 후순위) |
| 양식 업로드 | `onUploadTemplate` |

## 5. 상태값

| TenantSetting.status |
|---------------------|
| active / inactive / scheduled (적용 예정) |

변경 시 audit_logs 강제 기록.

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| TenantSetting | CRUDS |
| WorkPolicy | CRUD |
| LeaveType | CRUD |
| ApprovalLine | CRUD |
| DocumentTemplate | CRUD |
| Role | RU |
| AuditLog | R (탭 임베드) |

## 7. 연관 API

```
GET   /api/v1/tenant/settings                                  # 모든 탭 메타
PATCH /api/v1/tenant/settings/{tab}                            # 탭별 저장
GET   /api/v1/tenant/work-policies
POST  /api/v1/tenant/work-policies
PATCH /api/v1/tenant/work-policies/:id
GET   /api/v1/tenant/leave-types
POST  /api/v1/tenant/leave-types
GET   /api/v1/tenant/approval-lines
POST  /api/v1/tenant/approval-lines
GET   /api/v1/tenant/document-templates
POST  /api/v1/tenant/document-templates                        # 업로드 PDF/Word
GET   /api/v1/tenant/audit-logs                                # 본 테넌트만
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 회사 설정
  Background:
    Given tenant_super 로그인

  Scenario: 근무정책 변경
    When 근무정책 탭 진입, 표준 출근 = 08:30, 지각 = 08:31, 저장
    Then work_policies 갱신, 적용일=내일부터 옵션
    And audit_logs 기록

  Scenario: 휴가 유형 추가
    When 휴가정책 탭 → "유형 추가" → 이름="출산휴가", 일수=90, 증빙=필수
    Then leave_types INSERT
    And 직원 EM-03 휴가 신청 화면에 새 유형 표시

  Scenario: 결재라인 — 5일 이상 휴가 대표 결재
    When 결재라인 탭 → "휴가" → 조건: 5일 이상 = [팀장 → 대표]
    Then approval_lines INSERT with condition rule
    And 직원이 6일 휴가 신청 시 자동으로 [팀장 → 대표] 라인 적용

  Scenario: 권한 — hr_admin은 보안 탭 read-only
    Given tenant_hr_admin 로그인
    When 보안 탭 진입
    Then 설정 표시되나 모든 입력 disabled
    And "수정 권한이 없습니다" 안내

  Scenario: 권한 — employee 일부 조회
    Given employee 로그인
    When TA-13 URL 진입
    Then 휴가정책·취업규칙 등 공개 정보 탭만 표시
    And 보안·결재라인·역할권한 탭 비표시
```

## 9. 의존성

- **선행**: OP-04 (초기 세팅 완료)
- **연계**: TA-02 (직원 권한), TA-05 (work_policy), TA-07 (leave_types), TA-09 (approval_lines), TA-10/11 (templates), CM-15 (알림)
- **이벤트**: 정책 변경 시 영향 받는 화면 즉시 갱신 + 직원 알림 (예: "근무정책이 변경되었습니다")
