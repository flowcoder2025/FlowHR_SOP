---
screen_id: TA-05
screen_name: 근태 관리
role: [tenant_super, tenant_hr_admin, tenant_manager, employee]
entities: [Attendance, Employee, WorkPolicy]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-5
---

# TA-05 근태 관리

## 1. 목적

회사 전체 직원의 출퇴근 / 근무상태 모니터링 + 수동 등록·수정. 지각·결근·누락 즉시 인지.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | CRU/E (전체) |
| tenant_hr_admin | CRU/E (전체) |
| tenant_manager | RU 소속팀 |
| employee | R 본인 (EM-02에서 진입) |

## 3. UI 요소

### 3-1. 필터
- 기간: 오늘 / 이번주 / 이번달 / 커스텀
- 부서
- 직원 (자동완성)
- 상태: 정상 / 지각 / 조퇴 / 결근 / 휴가 / 재택 / 외근 / 출장
- 근무형태

### 3-2. KPI 카드 (4개)
| 카드 |
|------|
| 오늘 출근율 |
| 지각자 수 |
| 결근자 수 |
| 휴가/외근 수 |

### 3-3. 테이블 (9 컬럼)
| 컬럼 | 정렬 |
|------|-----|
| 날짜 | ✓ |
| 직원명 | ✓ |
| 부서 | ✓ |
| 출근 (HH:MM) | — |
| 퇴근 (HH:MM) | — |
| 휴게 (분) | — |
| 근무시간 (시간) | ✓ |
| 상태 | ✓ (배지) |
| 근무형태 | — |

### 3-4. 액션
- "근태 수동 등록" — 직원·날짜·출퇴근 시각 입력 (사유 필수, 감사 로그)
- "기록 수정" — 기존 행 수정 (사유 필수)
- "상세 보기" — 그날의 위치·디바이스·수정 이력
- "다운로드" — 현재 필터 Excel

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 근태 수동 등록 | `onCreateManual` (HR 이상, 사유 필수) |
| 기록 수정 | `onUpdate` (HR 이상, 사유 필수) |
| 상세 보기 | `onViewDetail` |
| 다운로드 | `onExport` |

## 5. 상태값

| Attendance.status |
|------------------|
| 정상 / 지각 / 조퇴 / 결근 / 휴가 / 재택 / 외근 / 출장 / 누락 / 수정요청중 / 수정완료 |

`work_policies`의 표준 출퇴근 시각 기준으로 자동 상태 결정 (예: 09:00 표준, 09:10 출근 = 지각).

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Attendance | CRUD |
| Employee | R |
| WorkPolicy | R (지각 기준) |
| AttendanceModification | C/R (TA-06과 연계) |

## 7. 연관 API

```
GET   /api/v1/tenant/attendances?from&to&dept&employee&status&workType&page
POST  /api/v1/tenant/attendances                   # 수동 등록 (사유 필수)
PATCH /api/v1/tenant/attendances/:id               # 수정 (사유 필수)
GET   /api/v1/tenant/attendances/:id/detail        # 위치/디바이스/수정이력
POST  /api/v1/tenant/attendances/export
GET   /api/v1/tenant/attendances/kpis              # 오늘 출근율 등
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 근태 관리
  Background:
    Given tenant_hr_admin 로그인
    And 회사 표준 출근시간 = 09:00, 지각 기준 = 09:01

  Scenario: 지각 자동 분류
    Given 직원 A가 09:15에 출근 기록
    Then attendances.status = 지각

  Scenario: 수동 등록
    Given 직원 B가 출근 기록 누락 (어제)
    When TA-05에서 "수동 등록" → 직원 B, 어제 09:00 출근 / 18:00 퇴근, 사유="단말 오류"
    Then attendances INSERT (modified_by=HR 관리자)
    And audit_logs 기록

  Scenario: 수정 — 사유 필수
    Given 직원 C의 출근 09:30 기록
    When 출근 시각을 09:00으로 수정 시도, 사유 비워둠
    Then "사유는 필수입니다" 에러
    When 사유 입력 후 저장
    Then 수정 성공, audit_logs에 before/after + 사유 기록

  Scenario: 권한 — manager는 자기 팀만
    Given tenant_manager 로그인 (영업팀장)
    When TA-05 진입
    Then 영업팀 직원의 근태만 조회/수정 가능

  Scenario: 권한 음성 — 다른 부서 직접 시도
    Given tenant_manager (영업팀) 로그인
    When 마케팅팀 직원의 근태 ID로 PATCH
    Then 403
```

## 9. 의존성

- **선행**: TA-13 (work_policies 정의), TA-02 (직원 존재)
- **연계**: TA-06 (수정 요청), EM-02 (직원 본인 출퇴근 기록)
- **자동 작업**: 매일 23:59 — 출근 기록은 있고 퇴근 없는 행 → status=누락 자동 전환 (사용자 +1일 차 알림)
