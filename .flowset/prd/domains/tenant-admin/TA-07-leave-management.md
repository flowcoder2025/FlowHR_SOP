---
screen_id: TA-07
screen_name: 휴가 관리
role: [tenant_super, tenant_hr_admin, tenant_manager, employee]
entities: [Leave, LeaveBalance, LeaveType, Employee]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-7
---

# TA-07 휴가 관리

## 1. 목적

회사 휴가 현황 + 잔여휴가 관리. 캘린더 뷰 + 목록 뷰 + 잔여 현황. HR 관리자가 휴가 부여/차감/조정.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | CRUA/E/N |
| tenant_hr_admin | CRUA/E/N |
| tenant_manager | R/A 소속팀 |
| employee | R 본인 |

## 3. UI 요소

### 3-1. KPI 카드 (5개)
| 카드 |
|------|
| 오늘 휴가 사용자 |
| 이번달 휴가 사용 (인일) |
| 평균 잔여연차 |
| 승인 대기 |
| 사용률 낮은 직원 (잔여 ≥ 80%) |

### 3-2. 휴가 캘린더
- 월/주 뷰 전환
- 직원별 색상 (또는 휴가 유형별)
- 행: 직원 (정렬: 부서 → 이름)
- 셀: 휴가 유형 배지 (반차 = 반쪽 셀)
- 클릭 → 상세 (TA-08)

### 3-3. 신청 목록 테이블
| 컬럼 | 정렬 |
|------|-----|
| 신청일 | ✓ |
| 직원 | ✓ |
| 부서 | ✓ |
| 유형 | ✓ |
| 기간 (시작~종료) | — |
| 사용일수 | ✓ |
| 상태 | ✓ |
| 승인자 | — |
| 액션 | — |

### 3-4. 잔여 현황 테이블 (직원별)
| 컬럼 |
|------|
| 직원, 부서, 유형별 (총부여/사용/잔여/예정) |

### 3-5. 액션
- "휴가 부여" — 직원 선택 + 유형 + 일수 + 사유
- "차감/조정" — 잔여 직접 수정 (사유 필수)
- "신청 상세" → TA-08
- "내보내기"

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 휴가 부여 | `onGrantLeave` (단건 또는 일괄) |
| 차감/조정 | `onAdjustBalance` (사유 필수) |
| 신청 상세 | → TA-08 |
| 내보내기 | `onExport` |

## 5. 상태값

`Leave.status`: draft / pending / in_progress / approved / rejected / cancelled
`LeaveBalance` 변경 사유: `granted | used | expired | adjusted | carried_over`

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Leave | CRUDA |
| LeaveBalance | CRU |
| LeaveType | R |
| Employee | R |

## 7. 연관 API

```
GET  /api/v1/tenant/leaves?from&to&dept&status&type&page
GET  /api/v1/tenant/leaves/calendar?from&to&dept
GET  /api/v1/tenant/leaves/balances?dept&type
POST /api/v1/tenant/leaves/balances/grant            # 휴가 부여
PATCH /api/v1/tenant/leaves/balances/:id             # 차감/조정 (사유 필수)
GET  /api/v1/tenant/leaves/kpis
POST /api/v1/tenant/leaves/export
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 휴가 관리
  Background:
    Given tenant_hr_admin 로그인

  Scenario: 캘린더 뷰 진입
    When TA-07 진입 → 캘린더 뷰
    Then 이번달 모든 휴가가 직원별 행에 배지로 표시

  Scenario: 휴가 부여 — 신입사원 연차 15일
    Given 신입사원 D 가입 후
    When "휴가 부여" → 직원=D, 유형=연차, 일수=15, 사유="신규 입사 부여"
    Then LeaveBalance INSERT (employee=D, type=연차, granted=15, used=0, remaining=15)
    And 직원 D에게 알림

  Scenario: 차감 조정 — 사유 필수
    Given 직원 E의 연차 잔여 = 10
    When "차감/조정" → 잔여 = 8 변경, 사유 미입력
    Then "사유는 필수입니다" 에러
    When 사유 = "선차감 합의" 입력 후 저장
    Then LeaveBalance.remaining = 8, audit_logs 기록

  Scenario: 권한 — manager는 자기 팀만
    Given tenant_manager (영업팀)
    When TA-07 진입
    Then 영업팀 직원의 휴가만 표시 + 휴가 부여 버튼 비활성 (조회·승인만)

  Scenario: 만료 처리 (자동)
    Given 직원 F의 연차 잔여 = 3, 만료일 = 2026-12-31
    When 2027-01-01 cron 실행
    Then LeaveBalance의 잔여가 0으로 차감 + 사유=expired 기록
    And 직원 F에게 만료 알림 (사전 30일 + 만료일)
```

## 9. 의존성

- **선행**: TA-13 (휴가 정책 정의 — leave_types), TA-02 (직원 존재)
- **연계**: TA-08 (신청 상세 / 승인), EM-03 (직원이 신청), EM-04 (직원이 현황 조회)
- **자동 작업**: 연 1회 자동 부여 (입사일 기준 또는 회계년도 기준 — 회사 설정), 만료 30일 전 알림, 만료일 자동 차감
