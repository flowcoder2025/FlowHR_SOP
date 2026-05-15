---
screen_id: EM-03
screen_name: 휴가 신청
role: [employee]
entities: [Leave, LeaveBalance, LeaveType, ApprovalLine]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#8-3
---

# EM-03 휴가 신청

## 1. 목적

직원이 휴가를 신청하고 결재 흐름을 시작. **PWA 모바일 30초 내 완료 목표**.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| employee | CRU/Cancel 본인 |

## 3. UI 요소

### 3-1. 입력 필드 (위에서 아래)
- 휴가유형 (leave_types) — 드롭다운
- 시작일 (캘린더 선택)
- 종료일 (캘린더 선택, 자동 = 시작일)
- 반차 구분 (시작일 반차 / 종료일 반차 / 없음) — 자동 활성화
- 사용일수 (자동 계산, read-only)
- 사유 (textarea, 일부 유형은 필수)
- 대체근무자 (직원 자동완성, 선택)
- 첨부파일 (증빙 — 진단서 등, 유형별 필수)

### 3-2. 자동 계산 영역
- 사용일수 (시작~종료, 주말/공휴일 제외 룰은 회사 설정)
- 신청 후 잔여일수 (잔여 - 사용일수)
- 결재라인 (회사 설정 + 조건 분기 자동 적용 — 예: 5일 이상 = [팀장 → 대표])

### 3-3. 액션
- 임시저장 (브라우저 + 서버 draft)
- 신청 제출 (검증 통과 시)
- 취소 (현재 입력 폐기)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 임시저장 | `onSaveDraft` |
| 신청 제출 | `onSubmit` (잔여 검증 + INSERT + 결재 시작) |
| 취소 | `onDiscard` |

## 5. 상태값

`Leave.status` 흐름: draft → pending → in_progress → approved/rejected/cancelled

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Leave | C 본인 |
| LeaveBalance | R 본인 |
| LeaveType | R |
| ApprovalLine | R (라인 결정) |

## 7. 연관 API

```
GET  /api/v1/me/leave-balances                   # 유형별 잔여
GET  /api/v1/tenant/leave-types                  # 가용 유형
POST /api/v1/me/leaves/calculate-days            # 사용일수 자동 계산
POST /api/v1/me/leaves/preview-approval-line     # 결재라인 미리보기
POST /api/v1/me/leaves                           # 신청 제출
POST /api/v1/me/leaves/draft
GET  /api/v1/me/leaves/draft
DELETE /api/v1/me/leaves/draft
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 휴가 신청 (PWA)
  Background:
    Given employee 한직원 로그인
    And 연차 잔여 = 10일

  Scenario: 정상 신청 (3일)
    When EM-03 진입
    And 유형=연차, 시작=2026-06-01, 종료=2026-06-03, 사유 입력
    Then 사용일수 = 3 (자동 계산)
    And 신청 후 잔여 = 7 (자동 표시)
    And 결재라인 자동 표시 [최팀장 → 이대표]
    When "신청 제출"
    Then leaves INSERT (status=pending), approvals + approval_steps INSERT
    And 최팀장에게 알림

  Scenario: 반차 신청
    When 시작=2026-06-01, 종료=2026-06-01, 반차구분=종료일 반차
    Then 사용일수 = 0.5 (자동)

  Scenario: 잔여 부족
    Given 연차 잔여 = 2
    When 시작/종료 = 3일 신청
    Then "잔여 휴가가 부족합니다. 2일까지 신청 가능" 에러 (제출 차단)

  Scenario: 증빙 필수 — 병가
    Given 휴가 유형 "병가" (증빙 필수 설정)
    When 병가 + 1일 신청 + 증빙 미첨부
    Then "병가는 증빙 필수입니다" 에러

  Scenario: 5일 이상 결재라인 분기
    Given 회사 결재라인: 4일 이하 [팀장], 5일 이상 [팀장 → 대표]
    When 5일 신청
    Then 결재라인 미리보기에 [팀장 → 대표] 표시

  Scenario: 중복 신청 차단
    Given 이미 2026-06-01 ~ 2026-06-03 승인된 휴가 존재
    When 같은 날짜로 새 신청
    Then "기존 신청과 기간이 겹칩니다" 에러

  Scenario: 임시저장 → 재진입
    When 입력 중 "임시저장"
    Then leaves_drafts INSERT
    When 페이지 이탈 후 EM-01 재진입
    Then "임시저장된 휴가 신청 1건" 알림 + 클릭 시 EM-03 복원
```

## 9. 의존성

- **선행**: TA-13 (leave_types + approval_lines + work_policy 주말/공휴일)
- **연계**: TA-07 (관리자 모니터링), TA-08 (결재 상세), EM-05 (진행 현황)
- **이벤트**: 제출 시 1차 결재자에게 즉시 알림 (PWA 푸시 + 폴백)
