---
screen_id: EM-04
screen_name: 내 휴가 현황
role: [employee]
entities: [Leave, LeaveBalance, LeaveType]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#8-4
---

# EM-04 내 휴가 현황

## 1. 목적

직원이 본인 휴가 잔여 + 사용 이력 + 예정 휴가를 한눈에 확인.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| employee | R 본인 |

## 3. UI 요소

### 3-1. KPI 카드 (4개)
| 카드 |
|------|
| 총 부여 (올해) |
| 사용 |
| 잔여 |
| 예정 (승인 완료, 미사용) |

### 3-2. 유형별 사용량 차트
- Donut 또는 Bar (연차/병가/경조사 등 유형별)

### 3-3. 신청 이력 테이블 (7 컬럼)
| 컬럼 | 정렬 |
|------|-----|
| 신청일 | ✓ |
| 유형 | ✓ |
| 기간 (시작~종료) | — |
| 사용일수 | ✓ |
| 상태 | ✓ (배지) |
| 승인자 | — |
| 액션 | — |

### 3-4. 액션
- "휴가 신청" CTA → EM-03
- 행 클릭 → 상세 (모달, TA-08 employee view)
- "취소 요청" (승인 전 또는 미사용 후 일부 후 사유 입력)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 휴가 신청 | → EM-03 |
| 상세 보기 | `onViewLeave` (모달 또는 TA-08 read-only) |
| 취소 요청 | `onCancel` (pending이면 즉시, 승인 후면 사유 필수) |

## 5. 상태값

`Leave.status`: pending / in_progress / approved / completed (휴가 사용 후) / rejected / cancelled

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Leave | R 본인 |
| LeaveBalance | R 본인 |
| LeaveType | R |

## 7. 연관 API

```
GET /api/v1/me/leaves?status&type&from&to&page
GET /api/v1/me/leave-balances                # 유형별 부여/사용/잔여/예정
GET /api/v1/me/leaves/:id
POST /api/v1/me/leaves/:id/cancel
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 내 휴가 현황
  Background:
    Given employee 한직원 로그인
    And 연차 부여=15, 사용=5, 잔여=10, 예정=3

  Scenario: KPI + 이력 표시
    When EM-04 진입
    Then 4 KPI 카드: 부여15 / 사용5 / 잔여10 / 예정3
    And 유형별 차트 표시
    And 신청 이력 테이블 (페이지네이션)

  Scenario: 승인 전 취소
    Given pending 휴가 1건
    When 행 액션 "취소" 클릭
    Then 즉시 leaves.status=cancelled
    And 결재자에게 알림

  Scenario: 승인 후 취소 — 사유 필수
    Given approved 휴가 (시작 1주일 후)
    When "취소 요청" 클릭, 사유 비워둠
    Then "사유는 필수입니다" 에러
    When 사유 입력 후 제출
    Then 취소 요청 결재 흐름 (관리자 승인 후 cancellation 처리)
    And 잔여 회복은 관리자 승인 후

  Scenario: 만료 임박 안내
    Given 잔여 5일 + 만료일 30일 이내
    When EM-04 진입
    Then 상단 배너 "5일이 30일 후 소멸됩니다. 빨리 사용하세요"

  Scenario: 권한 — 본인만
    Given 다른 직원의 leave_id로 GET 시도
    Then 403
```

## 9. 의존성

- **선행**: EM-03 (신청)
- **연계**: EM-05 (전체 결재 이력)
- **자동**: 만료 30일/7일 전 알림 cron
