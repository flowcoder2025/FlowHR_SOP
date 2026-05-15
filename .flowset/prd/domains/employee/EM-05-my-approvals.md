---
screen_id: EM-05
screen_name: 내 결재 / 진행현황
role: [employee]
entities: [Approval, ApprovalStep, Leave, AttendanceModification, CertificateRequest]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#8-5
---

# EM-05 내 결재 / 진행현황

## 1. 목적

본인이 제출한 모든 결재(휴가/근태수정/증명서/문서)의 진행 상태를 통합 조회.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| employee | R/Cancel/Resubmit 본인 |
| tenant_manager / hr_admin / super는 별도 화면 (TA-09) |

## 3. UI 요소

### 3-1. 필터 (상단 탭)
- 전체 / 진행중 / 승인완료 / 반려 / 취소

### 3-2. 테이블 (7 컬럼)
| 컬럼 | 정렬 |
|------|-----|
| 요청유형 (휴가/근태/증명서/문서) | ✓ |
| 제목 | — |
| 신청일 | ✓ |
| 현재단계 (`{n}/{total}`) | — |
| 상태 | ✓ |
| 처리자 (현재 단계) | — |
| 액션 | — |

### 3-3. 행 액션
- 상세 보기 (유형별 read-only 화면 또는 모달)
- 요청 취소 (가능한 상태에서만)
- 재신청 (반려된 건 → 새로 신청)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 상세 보기 | `onViewApproval` |
| 취소 | `onCancel` |
| 재신청 | `onResubmit` (반려된 데이터 복사 + EM-03 등으로 진입) |

## 5. 상태값

`Approval.status`: pending / in_progress / approved / rejected / cancelled

각 단계는 `ApprovalStep.status`: pending / approved / rejected / skipped

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Approval | R 본인 |
| ApprovalStep | R |
| Leave / AttendanceModification / CertificateRequest | R 본인 (해당 유형) |

## 7. 연관 API

```
GET  /api/v1/me/approvals?status&type&page
GET  /api/v1/me/approvals/:id
POST /api/v1/me/approvals/:id/cancel
POST /api/v1/me/approvals/:id/resubmit              # 반려된 건 복사
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 내 결재/진행현황
  Background:
    Given employee 한직원 로그인
    And 본인이 제출한 결재 5건 (휴가 3, 근태수정 1, 증명서 1)

  Scenario: 전체 탭 진입
    When EM-05 진입
    Then 5건 모두 표시, 신청일 내림차순

  Scenario: 진행중 필터
    When "진행중" 탭 클릭
    Then status in [pending, in_progress] 행만 표시

  Scenario: 단계 진척 표시
    Given 휴가 신청 결재라인 [팀장 → 대표], 팀장 승인 완료
    Then 현재단계 = "2/2" (대표 결재 대기)
    And 상태 = "진행중"

  Scenario: 취소 (pending)
    Given pending 휴가 1건
    When "취소" 클릭
    Then approval.status=cancelled, 결재자 알림

  Scenario: 재신청 (반려)
    Given 반려된 휴가
    When "재신청" 클릭
    Then 반려된 입력값이 EM-03에 prefill 되어 진입
    And 직원이 수정 후 다시 제출

  Scenario: 권한 — 다른 사람 결재 조회
    Given 다른 직원의 approval_id로 GET 시도
    Then 403
```

## 9. 의존성

- **선행**: EM-03, EM-08 (요청 생성)
- **연계**: EM-10 (알림에서 진입), TA-09 (관리자 결재)
