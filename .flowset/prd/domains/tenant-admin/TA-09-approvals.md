---
screen_id: TA-09
screen_name: 결재 / 승인
role: [tenant_super, tenant_hr_admin, tenant_manager, employee]
entities: [Approval, ApprovalStep, Leave, AttendanceModification, CertificateRequest]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-9
---

# TA-09 결재 / 승인

## 1. 목적

휴가 / 근태 / 증명서 / 문서 요청을 단일 인박스에서 통합 결재. **PWA 모바일 결재 핵심 화면**.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | R/A/N (전체) |
| tenant_hr_admin | R/A/N (전체) |
| tenant_manager | R/A 지정건 (자기 단계의 결재) |
| employee | C/R/Cancel 본인 |

## 3. UI 요소

### 3-1. 인박스 사이드바
- 받은 결재 (내 단계인 것)
- 보낸 결재 (내가 신청)
- 위임받은 결재 (선택, v1.1)
- 처리 완료 (필터)

### 3-2. 테이블 (9 컬럼)
| 컬럼 | 정렬 |
|------|-----|
| 유형 (휴가/근태수정/증명서/문서) | ✓ |
| 제목 (자동 생성: "{직원명} - {유형} - {기간 or 항목}") | — |
| 요청자 | ✓ |
| 부서 | ✓ |
| 결재단계 (`{현재}/{전체}`) | — |
| 상태 | ✓ |
| 요청일 | ✓ |
| 처리자 (현재 단계) | — |
| 액션 | — |

### 3-3. 필터
- 상태: 전체 / 대기 / 진행중 / 승인완료 / 반려 / 취소
- 유형
- 부서
- 요청자
- 기간

### 3-4. 일괄 처리 (다중 선택)
- 같은 유형만 일괄 승인 (예: 휴가 5건 동시 승인)
- 반려는 개별 처리 (사유 다름)

### 3-5. PWA 최적화
- 카드형 리스트 (테이블 대신)
- 스와이프 액션: 좌측 스와이프 = 승인, 우측 스와이프 = 반려 (확인 모달)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 상세 보기 | `onViewDetail` (유형별 화면으로) |
| 승인 | `onApprove` (단건 또는 일괄) |
| 반려 | `onReject` (사유 필수) |
| 위임 | `onDelegate` (다른 결재자에게 임시 위임, v1.1) |
| 의견 작성 | `onComment` |

## 5. 상태값

| Approval.status |
|----------------|
| draft / pending / in_progress / approved / rejected / cancelled |

| ApprovalStep.status (단계별) |
|---------------------------|
| pending / approved / rejected / skipped |

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Approval | CRUA |
| ApprovalStep | RU |
| Leave | RU (휴가 결재) |
| AttendanceModification | RU |
| CertificateRequest | RU |
| Notification | C |

## 7. 연관 API

```
GET  /api/v1/tenant/approvals/inbox?type&status&page
GET  /api/v1/tenant/approvals/sent?type&status&page
GET  /api/v1/tenant/approvals/:id                       # 종합
POST /api/v1/tenant/approvals/:id/approve
POST /api/v1/tenant/approvals/:id/reject
POST /api/v1/tenant/approvals/:id/comment
POST /api/v1/tenant/approvals/:id/cancel                # 요청자
POST /api/v1/tenant/approvals/batch-approve             # 일괄 (같은 type만)
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 결재 통합 인박스
  Background:
    Given tenant_manager 최팀장 PWA 로그인
    And 받은 결재 5건 (휴가 3, 근태 2)

  Scenario: 받은 결재 진입
    When TA-09 받은 결재 탭
    Then 5건이 카드형 리스트로 표시 (PWA)
    And 우선순위/SLA 임박순 정렬

  Scenario: 단건 승인 (PWA 스와이프)
    Given 카드 1건 표시 중
    When 카드를 왼쪽 스와이프 → 확인 모달 → "승인"
    Then 해당 결재 step.status = approved
    And 다음 단계 결재자 알림

  Scenario: 일괄 승인 (휴가 3건)
    Given 휴가 3건 체크박스 선택
    When "일괄 승인" 클릭
    Then 3건 모두 승인 처리, 단일 트랜잭션
    And 각각 다음 결재자 알림 (또는 최종 승인)

  Scenario: 반려 — 사유 필수
    Given 임의 결재 1건
    When "반려" 클릭, 사유 비워둠
    Then "사유는 필수입니다" 에러
    When 사유 입력 후 확인
    Then 반려 처리

  Scenario: 권한 — 위임받은 결재 (v1.1)
    Given 최팀장이 박과장에게 위임 (이번주)
    When 박과장 PWA 진입
    Then "위임받은" 탭에 최팀장의 받은 결재가 표시

  Scenario: 요청자 취소 — 일부 진행 후
    Given 한직원의 휴가 신청 (단계 2/3 진행 중)
    When 한직원이 "취소" + 사유="일정 변경" 입력
    Then 모든 단계 step.status = skipped
    And approval.status = cancelled
    And 결재자들에게 취소 알림

  Scenario: SLA 임박 알림
    Given 결재 도착 후 1시간 50분 경과 (P1 = 2시간 SLA)
    Then 결재자에게 "10분 임박" 알림
```

## 9. 의존성

- **선행**: EM-03 / EM-08 / TA-06 (요청 생성)
- **연계**: TA-08 (휴가 상세), TA-06 (근태 수정 상세)
- **이벤트**: 단계 전이 / 신규 / SLA 임박 시 Realtime broadcast + 알림 채널 폴백
