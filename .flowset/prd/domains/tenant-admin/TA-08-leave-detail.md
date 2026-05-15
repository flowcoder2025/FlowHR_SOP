---
screen_id: TA-08
screen_name: 휴가 신청 상세 / 승인
role: [tenant_super, tenant_hr_admin, tenant_manager, employee]
entities: [Leave, LeaveBalance, Approval, ApprovalStep, Employee]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-8
---

# TA-08 휴가 신청 상세 / 승인

## 1. 목적

특정 휴가 신청을 검토 + 승인/반려 + 의견 작성. **PWA 모바일 결재의 핵심 화면**.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | R/A/N |
| tenant_hr_admin | R/A/N |
| tenant_manager | R/A 소속팀 |
| employee | R 본인 |

## 3. UI 요소

### 3-1. 카드 (상단 5개)
| 카드 |
|------|
| 신청자 정보 (이름·부서·직급·연락처) |
| 휴가 정보 (유형·기간·시작·종료·반차 구분·사용일수·사유) |
| 잔여휴가 (현재 잔여 + 신청 후 잔여) |
| 결재라인 (단계별 결재자 + 상태) |
| 처리 이력 (시각·결재자·액션·코멘트) |

### 3-2. 본문
- 사유 (전문)
- 대체근무자 (선택)
- 첨부 파일 (진단서 등)

### 3-3. 액션 (결재자만 표시)
- 승인
- 반려 (사유 필수)
- 의견 작성 (승인/반려 전 코멘트만)
- (요청자) 취소 (승인 전 / 일부 후도 사유 입력 시)

### 3-4. PWA 모바일 최적화
- 카드 세로 스택
- 승인/반려 버튼이 화면 하단 고정 (sticky)
- 첨부는 인라인 미리보기

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 승인 | `onApprove` |
| 반려 | `onReject` (사유 필수) |
| 의견 작성 | `onComment` |
| 취소 (요청자) | `onCancel` |

## 5. 상태값

`Leave.status`: draft / pending / in_progress / approved / rejected / cancelled / completed (휴가 종료 후 자동)

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Leave | RUA |
| LeaveBalance | RU (승인 시 사용 처리) |
| Approval | RUA |
| ApprovalStep | RU |
| Employee | R |

## 7. 연관 API

```
GET  /api/v1/tenant/leaves/:id                          # 종합 (요청자·휴가·잔여·결재라인·이력)
POST /api/v1/tenant/leaves/:id/approve                  # 본인 단계 승인
POST /api/v1/tenant/leaves/:id/reject                   # 사유 필수
POST /api/v1/tenant/leaves/:id/comment
POST /api/v1/tenant/leaves/:id/cancel                   # 요청자만, 일부 후는 사유 필수
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 휴가 신청 상세/승인
  Background:
    Given 직원 한직원이 어제 휴가 신청 (시작 2026-06-01, 종료 2026-06-03, 3일)
    And 결재라인: [최팀장 → 이대표]
    And 한직원 잔여연차 = 10

  Scenario: 팀장 승인
    Given 최팀장 (PWA) 로그인
    When TA-08 진입, "승인" 클릭
    Then approval_steps의 최팀장 step.status = approved
    And leaves.status = in_progress
    And 다음 단계 이대표에게 알림

  Scenario: 최종 승인 → 잔여 차감
    Given in_progress, 이대표 결재 대기
    When 이대표 (PWA) "승인"
    Then leaves.status = approved
    And LeaveBalance.used += 3, remaining = 7
    And 한직원에게 알림: "휴가 승인 완료. 잔여 7일"

  Scenario: 반려
    Given pending 또는 in_progress
    When 결재자가 "반려" + 사유="해당 기간 매장 가동 인원 부족" 입력
    Then leaves.status = rejected
    And 한직원에게 알림 + 사유 표시
    And LeaveBalance 변경 없음

  Scenario: 요청자 취소 — 승인 전
    Given pending
    When 한직원이 "취소" 클릭
    Then leaves.status = cancelled
    And 결재자에게 취소 알림

  Scenario: 권한 — manager는 자기 팀만
    Given tenant_manager (마케팅팀)
    When 영업팀 직원의 휴가 PATCH /approve
    Then 403

  Scenario: 잔여 부족 안내 — 신청 시점
    Given 한직원 잔여 = 1, 신청 = 3일
    When EM-03에서 신청
    Then "잔여 휴가가 부족합니다. 1일까지만 신청 가능" 에러 (EM-03 단계)

  Scenario: PWA 모바일 — sticky 액션 버튼
    Given 최팀장이 PWA에서 TA-08 진입
    Then 페이지 스크롤 시에도 하단에 "승인 / 반려" 버튼이 고정 표시
```

## 9. 의존성

- **선행**: EM-03 (직원이 신청)
- **연계**: TA-07 (목록), TA-09 (전체 결재)
- **이벤트**: 단계별 결재 → Realtime broadcast → 다음 결재자 / 요청자에게 알림 (PWA 푸시 + 카카오 알림톡 폴백)
