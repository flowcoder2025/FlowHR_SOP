---
screen_id: TA-02
screen_name: 직원 관리
role: [tenant_super, tenant_hr_admin, tenant_manager]
entities: [Employee, User, Department]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-2
---

# TA-02 직원 관리

## 1. 목적

직원 마스터 — 등록·수정·상태 변경·일괄 업로드·초대 발송. HR 관리자의 일상 업무 진입점.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | CRUD/E/N |
| tenant_hr_admin | CRU/E/N (삭제 = 퇴사 처리만) |
| tenant_manager | R 소속팀만 |
| employee | R 본인만 |

## 3. UI 요소

### 3-1. 헤더
- 검색: 이름 / 사번 / 이메일 / 연락처 (실시간)
- "직원 등록" CTA
- "일괄 업로드" CTA (Excel)
- "내보내기" CTA

### 3-2. 필터
- 부서 (트리 선택 또는 자동완성)
- 직급
- 고용형태 (정규/계약/파트타임/프리랜서)
- 재직상태 (초대대기/재직/수습/휴직/퇴사/비활성)
- 입사일 범위

### 3-3. 테이블 (9 컬럼, 20/페이지)
| 컬럼 | 정렬 |
|------|-----|
| 사번 | ✓ |
| 이름 | ✓ |
| 부서 | ✓ |
| 직급 | ✓ |
| 이메일 | — |
| 입사일 | ✓ |
| 고용형태 | ✓ |
| 상태 | ✓ (배지) |
| 액션 | — |

### 3-4. 행 액션
- 상세 보기 → TA-03
- 수정 (간단 모달)
- 상태 변경 (수습 종료 / 휴직 / 퇴사 / 재활성화)
- 초대 발송 (status=초대대기인 경우)

### 3-5. 직원 등록 모달
- 필수: 이름, 사번, 이메일, 부서, 직급, 입사일, 고용형태
- 선택: 연락처, 직무 설명, 권한 (역할)
- 검증: 사번 중복, 이메일 중복, 부서 존재

### 3-6. 일괄 업로드 (Excel)
- 양식 다운로드 → 입력 → 업로드 → 서버 검증 → 오류 행 표시 + 재시도
- 행별 검증: 필수값, 형식, 중복(이메일·사번), FK(부서명)
- 성공 행만 INSERT + 실패 행 다운로드

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 직원 등록 | `onCreateEmployee` |
| 일괄 업로드 | `onBulkUpload` → CM-11 |
| 내보내기 | `onExport` → CM-12 |
| 수정 | `onUpdate` |
| 상태 변경 | `onChangeStatus` (사유 필수) |
| 초대 발송 | `onSendInvite` |

## 5. 상태값

| Employee.status | 색상 |
|---------------|------|
| invited | info |
| probation | info |
| active (재직) | success |
| on_leave (휴직) | text-muted |
| resigned (퇴사) | text-muted |
| inactive (비활성) | danger |

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Employee | CRUD |
| User | CR (auth.users 생성, 초대) |
| Department | R |
| Role | RU (권한 부여) |
| AuditLog | C |

## 7. 연관 API

```
GET    /api/v1/tenant/employees?page&sort&filter&q
POST   /api/v1/tenant/employees                            # 단건 등록
POST   /api/v1/tenant/employees/bulk                       # 일괄 (Excel parsed)
PATCH  /api/v1/tenant/employees/:id
POST   /api/v1/tenant/employees/:id/change-status          # 사유 필수
POST   /api/v1/tenant/employees/:id/send-invite
POST   /api/v1/tenant/employees/export
GET    /api/v1/tenant/employees/bulk-template              # Excel 양식
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 직원 관리
  Background:
    Given tenant_hr_admin 로그인 (회사 T)

  Scenario: 단건 등록
    When "직원 등록" 클릭, 필수 입력 후 저장
    Then employees + users INSERT, 초대 메일 발송
    And employees.status = invited

  Scenario: 일괄 업로드 — 부분 실패
    Given Excel 100행 (이메일 중복 5행 포함)
    When 업로드
    Then 95행 성공, 5행 실패 + 실패 사유 표시
    And "실패 행 다운로드" 버튼으로 재시도 가능

  Scenario: 상태 변경 — 휴직
    Given 활성 직원
    When "상태 변경 > 휴직" 사유 입력
    Then status=on_leave, 휴직 시작일 기록
    And 휴직 동안 해당 직원의 PWA 출퇴근 화면이 비활성화

  Scenario: 권한 — manager는 팀원만 조회
    Given tenant_manager 한 명, 팀원 5명
    When TA-02 진입
    Then 5명 팀원만 표시
    And "직원 등록" 버튼이 비표시

  Scenario: 권한 음성 — employee는 본인만
    Given employee 로그인
    When TA-02 URL 접근
    Then 본인 1명만 표시 (사실상 EM-09 프로필로 리다이렉트 권장)

  Scenario: 권한 음성 — 타 테넌트
    Given 테넌트 A의 hr_admin
    When 테넌트 B의 직원 ID로 PATCH 시도
    Then RLS가 차단, 403
```

## 9. 의존성

- **선행**: CM-01, TA-04 (부서 트리 존재)
- **후행**: TA-03 (상세), TA-13 회사 설정 (역할 정의)
- **외부**: 이메일 발송 (초대), 알림톡 (상태 변경)
