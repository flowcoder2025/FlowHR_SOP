---
screen_id: TA-04
screen_name: 조직도 / 부서 관리
role: [tenant_super, tenant_hr_admin, tenant_manager, employee]
entities: [Department, Employee]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-4
---

# TA-04 조직도 / 부서 관리

## 1. 목적

회사 조직 구조를 트리로 관리. 부서 생성·수정·삭제·이동, 부서장 지정, 구성원 배치.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | CRUD/E |
| tenant_hr_admin | CRU/E (삭제는 자식 부서 없을 때만) |
| tenant_manager | R 소속 조직 (자기 부서 + 하위) |
| employee | R (전체 조회) |

## 3. UI 요소

### 3-1. 3분할 레이아웃
- **좌측 (조직 트리)**: 부서 계층 트리 (드래그앤드롭 이동 — HR 이상)
- **중앙 (부서 상세)**: 선택 부서 정보 (이름, 부서장, 설명, 코드, 활성 여부) + 통계 (직원 수)
- **우측 (구성원 목록)**: 선택 부서 직원 테이블

### 3-2. 부서 상세 폼
- 이름, 부서 코드, 부서장 (직원 자동완성), 상위 부서, 활성 여부, 설명

### 3-3. 구성원 테이블
| 컬럼 |
|------|
| 이름, 직급, 이메일, 입사일, 상태, 액션(이동/제거) |

### 3-4. 액션
- "부서 생성" CTA (현재 선택 부서의 하위로)
- "수정" / "삭제" (자식 부서·소속 직원 있으면 차단)
- "구성원 이동" (다중 선택 → 다른 부서로)
- "조직도 내보내기" (PDF/PNG)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 부서 생성 | `onCreateDept` |
| 부서 수정 | `onUpdateDept` |
| 부서 삭제 | `onDeleteDept` (자식·직원 0건 확인) |
| 부서장 지정 | `onAssignHead` |
| 구성원 이동 | `onMoveMembers` |
| 부서 이동 (트리 드래그) | `onMoveDept` (parent_id 변경) |
| 내보내기 | `onExport` |

## 5. 상태값

`Department.is_active`: true/false. 비활성 부서는 신규 직원 배치 불가, 기존 직원은 유지.

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Department | CRUD |
| Employee | R/U (department_id 변경) |
| AuditLog | C |

## 7. 연관 API

```
GET    /api/v1/tenant/departments                       # 트리 형태
GET    /api/v1/tenant/departments/:id
POST   /api/v1/tenant/departments
PATCH  /api/v1/tenant/departments/:id
DELETE /api/v1/tenant/departments/:id                   # 자식·직원 0건 검증
POST   /api/v1/tenant/departments/:id/move              # parent 변경
POST   /api/v1/tenant/departments/:id/assign-head
POST   /api/v1/tenant/departments/:id/members/move      # 구성원 이동
GET    /api/v1/tenant/departments/export                # PDF/PNG
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 조직도 관리
  Background:
    Given tenant_hr_admin 로그인

  Scenario: 부서 생성
    Given 회사가 "본사" 1개 부서만 있음
    When 본사 선택 → "부서 생성" → 이름="영업팀" 입력 → 저장
    Then departments INSERT (parent_id=본사.id)
    And 트리에 "본사 > 영업팀" 표시

  Scenario: 구성원 이동
    Given 영업팀에 직원 3명
    When 3명 선택 → "다른 부서로 이동" → 마케팅팀 선택
    Then 3명의 department_id 갱신
    And audit_logs 3건 INSERT

  Scenario: 부서 삭제 — 자식 있어서 차단
    Given 본사 아래 영업팀이 있음
    When 본사 삭제 시도
    Then "하위 부서 또는 소속 직원이 있어 삭제할 수 없습니다" 에러

  Scenario: 부서 드래그 이동
    Given tenant_super 로그인
    When 영업팀을 마케팅팀 아래로 드래그
    Then 영업팀.parent_id = 마케팅팀.id
    And 영업팀 하위 부서·직원의 경로 모두 갱신

  Scenario: 권한 — manager는 조회만
    Given tenant_manager 로그인
    When TA-04 진입
    Then 트리는 표시되나 "부서 생성/수정/삭제" 버튼 비활성

  Scenario: 권한 — employee 조회
    Given employee 로그인
    When TA-04 진입
    Then 전체 조직도 트리 + 구성원 표시 (read-only)
    And 수정 액션 모두 비활성
```

## 9. 의존성

- **선행**: 신규 테넌트의 경우 OP-04 6단계에서 초기 부서 트리 생성
- **연계**: TA-02 (직원의 부서 필드 참조), TA-03 (직원 상세에서 부서 변경)
- **이벤트**: 부서 변경 시 영향 받는 직원의 사이드바/메뉴 즉시 갱신
