---
screen_id: TA-12
screen_name: 리포트
role: [tenant_super, tenant_hr_admin, tenant_manager, employee]
entities: [Employee, Attendance, Leave, Department]
platforms: [web, desktop_tauri]
mvp: partial
mvp_note: "MVP는 기본 5종 리포트만. 커스텀 빌더는 v1.3"
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-12
---

# TA-12 리포트

## 1. 목적

인력·근태·휴가·초과근무·급여 데이터를 분석. MVP는 기본 5종 리포트, 커스텀 리포트 빌더는 v1.3.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | R/E |
| tenant_hr_admin | R/E |
| tenant_manager | R 소속팀 일부 |
| employee | R 개인 일부 (EM-04 잔여만) |

## 3. UI 요소

### 3-1. 리포트 유형 선택 (좌측 카드)
| 리포트 |
|------|
| 인력 (현황·증감) |
| 근태 (출근율·지각·결근) |
| 휴가 (사용량·잔여·만료) |
| 초과근무 (주 52시간 모니터링) |
| 부서별 비교 |

### 3-2. 필터 (상단)
- 기간
- 부서
- 직급
- 고용형태

### 3-3. 차트 (리포트별)
| 리포트 | 차트 |
|--------|------|
| 인력 | 인원 추이 Line + 부서 분포 Donut |
| 근태 | 일별 출근율 Line + 지각/결근 Stacked Bar |
| 휴가 | 직원별 사용량 Bar + 유형별 사용 Donut |
| 초과근무 | 주별 평균 시간 Line + 52h 초과자 카운트 |
| 부서비교 | 부서별 KPI 다축 Radar |

### 3-4. 액션
- PDF 다운로드 (리포트 인쇄용)
- Excel 내보내기 (raw 데이터)
- 기간 비교 (전월/전년 동기)
- "커스텀 리포트" (v1.3, 비활성 + Coming soon)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 리포트 선택 | `onSelectReport` |
| PDF 다운로드 | `onExportPdf` |
| Excel 내보내기 | `onExportExcel` |
| 기간 비교 | `onCompare` |

## 5. 상태값

화면 자체: `loading | ready | exporting | error`

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Employee | R |
| Attendance | R (집계) |
| Leave | R (집계) |
| Department | R |

## 7. 연관 API

```
GET  /api/v1/tenant/reports/headcount?from&to&dept
GET  /api/v1/tenant/reports/attendance?from&to&dept
GET  /api/v1/tenant/reports/leaves?from&to&dept&type
GET  /api/v1/tenant/reports/overtime?from&to&dept
GET  /api/v1/tenant/reports/department-comparison?from&to
POST /api/v1/tenant/reports/export/pdf?type
POST /api/v1/tenant/reports/export/excel?type
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 리포트
  Background:
    Given tenant_hr_admin 로그인

  Scenario: 인력 리포트
    When "인력" 리포트 + 기간=이번분기 선택
    Then 인원 추이 Line + 부서 분포 Donut 표시

  Scenario: 주 52시간 초과 모니터링
    When "초과근무" 리포트 + 기간=지난주
    Then 주별 평균 시간 Line + 52h 초과자 명단 표시
    And 초과자에게 알림 발송 옵션 버튼

  Scenario: PDF 다운로드
    When "PDF 다운로드" 클릭
    Then 비동기 작업 + 완료 시 다운로드 링크

  Scenario: 권한 — manager 자기 팀 일부
    Given tenant_manager (영업팀)
    When 리포트 진입
    Then 영업팀 데이터만 집계 + 부서 필터 자동 고정
    And "부서비교" 리포트는 비활성

  Scenario: 커스텀 리포트 — Coming soon
    When "커스텀 리포트" hover
    Then "v1.3 예정" 툴팁
```

## 9. 의존성

- **선행**: TA-02, TA-05, TA-07
- **연계**: OP-10 (운영사 리포트는 별도)
- **성능**: 부서별 집계 쿼리 최적화 필요 (사전 집계 머터리얼라이즈드 뷰 검토)
