---
screen_id: TA-03
screen_name: 직원 상세
role: [tenant_super, tenant_hr_admin, tenant_manager, employee]
entities: [Employee, User, Department, Attendance, Leave, Document, Approval, AuditLog]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-3
---

# TA-03 직원 상세

## 1. 목적

직원 한 명의 모든 정보 (인사·계약·근태·휴가·급여·문서·결재이력·변경이력)를 통합 조회·관리.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | R/U/D/L (전체 탭) |
| tenant_hr_admin | R/U/L (퇴사 불가, 변경 이력 조회) |
| tenant_manager | R 소속팀 일부 (기본정보·근태·휴가 탭만) |
| employee | R 본인 일부 (기본정보 + 본인 변경 이력만, 인사정보/계약 read-only) |

## 3. UI 요소

### 3-1. 헤더 카드 (모든 탭 공통)
- 프로필 사진 + 이름 + 사번
- 직급 / 부서 / 고용형태
- 재직상태 배지
- 잔여연차 (요약)
- 최근 근태 상태
- 액션 버튼: 정보 수정 / 휴직 처리 / 퇴사 처리 / 문서 업로드

### 3-2. 탭 9개
| 탭 | 내용 | 권한 |
|----|------|------|
| 기본정보 | 이름·이메일·연락처·주소·비상연락처·가족정보 | RU |
| 인사정보 | 사번·부서·직급·직책·고용형태·입사일·수습기간·근무지 | RU (HR 이상) |
| 계약정보 | 계약서 종류·계약 기간·계약 직급·연봉·계좌 | RU (super만 연봉) |
| 근태 | TA-05 직원 필터 뷰 (테이블 + 월 캘린더) | R |
| 휴가 | EM-04 임베드 (잔여 + 사용 이력) | R |
| 급여 | 지급 이력 + 명세서 링크 | R (HR 이상 / 본인) |
| 문서 | 계약서·증명서·인사문서·기타 | R |
| 결재이력 | 본인이 제출한 결재 + 처리한 결재 | R |
| 변경이력 | audit_logs 직원 단위 뷰 (이전/이후 diff) | R |

### 3-3. 기본정보 / 인사정보 수정 모드
- 변경 즉시 audit_logs 기록
- 일부 필드 (이메일, 사번) 변경 시 추가 확인 모달
- 민감 정보 (계좌번호) 변경은 2FA 재인증 필요

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 정보 수정 | `onEdit` (인라인 또는 모달) |
| 계정 비활성화 | `onDeactivate` (로그인 차단) |
| 휴직 처리 | `onLeaveOfAbsence` (시작일/예정 종료일 입력) |
| 퇴사 처리 | `onResign` (퇴사일/사유, 퇴직금 정산 안내) |
| 문서 업로드 | `onUploadDocument` (계약서/사인된 문서) |
| 권한 변경 | `onChangeRole` (employee → manager 등) |

## 5. 상태값

`Employee.status`와 `User.status` 동기화. 퇴사 처리 시 `employees.status=resigned` + `users.status=inactive` + 모든 활성 세션 종료.

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Employee | R/U/D |
| User | R/U |
| Department | R |
| Attendance | R |
| Leave | R |
| LeaveBalance | R |
| Document | R/C (업로드) |
| Approval | R |
| AuditLog | R |

## 7. 연관 API

```
GET   /api/v1/tenant/employees/:id                       # 종합
PATCH /api/v1/tenant/employees/:id                       # 기본/인사 수정
POST  /api/v1/tenant/employees/:id/leave-of-absence
POST  /api/v1/tenant/employees/:id/resign
POST  /api/v1/tenant/employees/:id/documents             # 업로드
GET   /api/v1/tenant/employees/:id/audit-logs            # 변경 이력
PATCH /api/v1/tenant/employees/:id/role
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 직원 상세
  Background:
    Given tenant_hr_admin 로그인
    And 임의의 직원 E 존재

  Scenario: 기본 진입
    When TA-03/E 진입
    Then 헤더 + 기본정보 탭이 표시된다

  Scenario: 탭 전환 — 근태
    When "근태" 탭 클릭
    Then URL ?tab=attendance
    And TA-05의 E 단일 필터 뷰가 임베드되어 표시

  Scenario: 인사정보 수정 — 부서 이동
    When 인사정보 탭에서 부서 = "영업팀 → 마케팅팀" 변경 + 저장
    Then employees.department_id 갱신
    And audit_logs INSERT (before/after diff)
    And 해당 직원의 사이드바·대시보드가 즉시 갱신 (Realtime)

  Scenario: 퇴사 처리
    When "퇴사 처리" 클릭, 퇴사일/사유 입력
    Then status=resigned, 활성 세션 강제 종료
    And 직원에게 알림: "퇴사 처리되었습니다. 마지막 출퇴근 가능일 ..."
    And 잔여연차 정산 안내

  Scenario: 권한 — manager는 일부 탭만
    Given tenant_manager 로그인
    When 팀원 직원 상세 진입
    Then 보이는 탭 = 기본정보 / 근태 / 휴가 (5개 비공개)
    And 급여 / 계약 / 문서 / 변경이력 탭은 표시되지 않음

  Scenario: 권한 — employee는 본인 일부
    Given employee 로그인
    When TA-03/{본인-id} 진입 (EM-09에서 리다이렉트 가능)
    Then 기본정보 read-only + 본인 변경 이력만
    And 인사정보·계약·급여(타인 정보 포함될 수 있는 합산)는 비표시
```

## 9. 의존성

- **선행**: TA-02 (목록에서 클릭)
- **연계**: TA-04 (부서 변경), TA-05/TA-07 (근태/휴가 탭), TA-10 (급여 탭), EM-09 (직원 본인 진입)
- **이벤트**: 변경 시 Realtime broadcast → 자기 자신 + 관련 권한자
