---
screen_id: TA-06
screen_name: 근태 수정 요청
role: [tenant_super, tenant_hr_admin, tenant_manager, employee]
entities: [AttendanceModification, Attendance, Approval]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-6
---

# TA-06 근태 수정 요청

## 1. 목적

직원이 본인 출퇴근 기록의 수정을 요청 → 관리자/팀장 승인. 단말 오류·외근 등으로 인한 누락/오기 정정.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | R/A/E/N (전체 승인) |
| tenant_hr_admin | R/A/E/N (전체 승인) |
| tenant_manager | R/A 소속팀 (1차 승인) |
| employee | C/R/Cancel 본인 |

## 3. UI 요소

### 3-1. 테이블 (10 컬럼)
| 컬럼 | 정렬 |
|------|-----|
| 요청일 | ✓ |
| 직원 | ✓ |
| 부서 | ✓ |
| 대상일 | ✓ |
| 요청유형 (출근/퇴근/휴게/외근) | ✓ |
| 원기록 | — |
| 수정요청값 | — |
| 상태 | ✓ |
| 결재자 | — |
| 액션 | — |

### 3-2. 필터
- 상태 (대기/승인/반려)
- 요청유형
- 부서
- 기간

### 3-3. 상세 패널 / 모달
- 직원 정보
- 원기록 vs 요청값 (diff)
- 사유 (직원 작성)
- 증빙 첨부 (사진 / 문서)
- 처리 이력 (단계별 결재자·시각·코멘트)
- 액션: 승인 / 반려 / 의견 작성

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 상세 보기 | `onViewDetail` |
| 승인 | `onApprove` |
| 반려 | `onReject` (사유 필수) |
| 의견 작성 | `onComment` |
| 요청 생성 (직원) | `onCreateRequest` (EM-02에서 진입) |
| 요청 취소 (직원) | `onCancel` (승인 전만) |

## 5. 상태값

| AttendanceModification.status | 색상 |
|----------------------------|------|
| pending | info |
| in_progress | info (다단계 결재) |
| approved | success |
| rejected | danger |
| cancelled | text-muted |

승인 시 → 원본 `attendances` 레코드가 수정값으로 갱신 + `modifications` 이력 보존.

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| AttendanceModification | CRUD/A |
| Attendance | RU (승인 시) |
| Approval | C (결재 흐름 활용) |
| Notification | C |

## 7. 연관 API

```
GET   /api/v1/tenant/attendance-modifications?status&type&dept&from&to
GET   /api/v1/tenant/attendance-modifications/:id
POST  /api/v1/tenant/attendance-modifications              # 직원이 요청
POST  /api/v1/tenant/attendance-modifications/:id/approve
POST  /api/v1/tenant/attendance-modifications/:id/reject
POST  /api/v1/tenant/attendance-modifications/:id/comment
POST  /api/v1/tenant/attendance-modifications/:id/cancel   # 직원 취소
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 근태 수정 요청
  Background:
    Given 직원 A가 어제 출근 09:30 기록 (지각)

  Scenario: 직원의 수정 요청
    Given 직원 A 로그인 (PWA)
    When EM-02에서 어제 출근의 "수정 요청" 클릭, 09:00 + 사유="실제 09:00 도착, 단말 인식 실패" + 증빙 사진 입력
    Then attendance_modifications INSERT (status=pending)
    And 1차 결재자(최팀장)에게 알림

  Scenario: 팀장 승인 → 관리자 최종 승인
    Given 결재라인이 [팀장 → HR관리자]
    When 최팀장이 TA-06에서 승인
    Then status=in_progress, HR관리자에게 알림
    When 정인사 HR관리자가 승인
    Then status=approved
    And attendances.clock_in_at = 09:00으로 갱신
    And attendances.status = 정상 (재계산)
    And 직원 A에게 승인 알림

  Scenario: 반려
    When 결재자가 "반려" + 사유 입력
    Then status=rejected, 직원에게 알림 + 사유 표시
    And attendances는 변경되지 않음

  Scenario: 직원 본인 취소
    Given status=pending 요청
    When 직원이 "취소"
    Then status=cancelled

  Scenario: 권한 — manager는 자기 팀만 승인
    Given tenant_manager (영업팀)
    When 마케팅팀 직원의 수정 요청 PATCH /approve
    Then 403

  Scenario: 증빙 첨부 — 정책별 분기
    Given 회사 설정 "근태 수정 증빙 필수 여부" = true
    When 직원이 수정 요청 시 증빙 미첨부
    Then "증빙 첨부는 필수입니다" 에러 + 제출 차단
    When 회사 설정이 false (선택적 증빙)
    Then 증빙 없이 제출 가능, 단 결재자에게 "증빙 없음" 표시
```

## 9. 의존성

- **선행**: EM-02 (직원이 요청 생성), TA-13 (결재라인 정의)
- **연계**: TA-05 (원본 갱신), TA-09 (전체 결재 화면)
- **이벤트**: 단계별 결재 시 알림 (PWA 푸시 + 카카오 알림톡 폴백)
