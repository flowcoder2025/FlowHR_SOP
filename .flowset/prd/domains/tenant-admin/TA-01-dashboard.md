---
screen_id: TA-01
screen_name: 관리자 대시보드
role: [tenant_super, tenant_hr_admin, tenant_manager]
entities: [Employee, Attendance, Leave, Approval, Notification]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-1
---

# TA-01 관리자 대시보드

## 1. 목적

테넌트 관리자가 매일 처음 보는 회사 HR 현황 요약 — 오늘 출근/지각/결근/휴가자, 결재 대기, 미열람 급여명세서.

## 2. 사용자·권한

| 역할 | 권한 | 본 화면 |
|------|------|--------|
| tenant_super | R/E | 회사 전체 + 내보내기 |
| tenant_hr_admin | R/E | 회사 전체 + 내보내기 |
| tenant_manager | R (부분) | 자기 팀 KPI만 (소속팀 employees 필터) |
| employee | X | 접근 불가 (EM-01로 리다이렉트) |

## 3. UI 요소

### 3-1. KPI 카드 (6개)
| 카드 |
|------|
| 전체 직원 (재직 / 휴직 / 퇴사) |
| 오늘 출근 (출근 / 전체 × 100%) |
| 지각/결근 (지각 N / 결근 M) |
| 휴가자 (오늘 휴가 사용 중 직원 수) |
| 결재 대기 (본인이 처리해야 할 결재 수) |
| 미열람 급여명세서 (지난달 발송 중 미열람) |

### 3-2. 차트 (4종, MVP)
| 차트 | 유형 |
|------|------|
| 월별 출근율 | Line (최근 6개월) |
| 휴가 사용량 | Bar (직원별 Top 10) |
| 부서별 인원 | Donut |
| 요청 처리 추이 | Stacked Bar (승인/반려/대기) |

### 3-3. 테이블 (3섹션)
| 섹션 | 컬럼 |
|------|------|
| 최근 요청 (10건) | 유형, 요청자, 제목, 상태, 요청일, 액션 |
| 결재 대기 (10건) | 유형, 요청자, 제목, 단계, 요청일, 액션 |
| 오늘 근태 이상자 | 이름, 부서, 상태(지각/결근/누락), 액션 |
| 공지사항 (5건) | 제목, 작성자, 게시일 |

### 3-4. 액션
- 직원 등록 → TA-02
- 근태 관리 → TA-05
- 휴가 승인 → TA-08
- 공지 작성 (v1.1 후순위)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| KPI 클릭 | `onDrillDown` (각 화면) |
| 결재 처리 (행) | `onProcessApproval` → TA-08/TA-09 |
| 근태 이상자 행 | `onViewAttendance` → TA-05 (직원 필터) |

## 5. 상태값

화면 로딩 상태: KPI는 병렬 fetch, 차트는 순차. 데이터 없음 시 빈 상태 안내.

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Employee | R (count + breakdown) |
| Attendance | R (오늘 상태 집계) |
| Leave | R (휴가자 집계) |
| Approval | R (대기 카운트) |
| Document | R (미열람 급여명세서) |
| Notification | R |

## 7. 연관 API

```
GET /api/v1/tenant/dashboard/kpis           # 6 KPI 한 번에
GET /api/v1/tenant/dashboard/charts/attendance-rate
GET /api/v1/tenant/dashboard/charts/leave-usage
GET /api/v1/tenant/dashboard/charts/department-headcount
GET /api/v1/tenant/dashboard/charts/request-trends
GET /api/v1/tenant/dashboard/recent/requests
GET /api/v1/tenant/dashboard/pending/approvals
GET /api/v1/tenant/dashboard/today/abnormal-attendance
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 관리자 대시보드
  Background:
    Given tenant_hr_admin 로그인

  Scenario: 진입 시 KPI 표시
    When 대시보드 진입
    Then 6 KPI 카드가 2초 이내 렌더
    And 차트 4개가 순차 렌더

  Scenario: 권한 — tenant_manager는 팀 KPI
    Given tenant_manager 로그인
    When 대시보드 진입
    Then KPI는 자기 팀 직원만 집계
    And 차트도 자기 팀 데이터만 표시

  Scenario: 권한 음성 — employee
    Given employee 로그인
    When /tenant/dashboard URL 직접 접근
    Then EM-01로 리다이렉트

  Scenario: PWA 모바일 진입
    Given 모바일 PWA로 tenant_super 로그인
    When 대시보드 진입
    Then KPI 카드만 표시 (차트는 축소 또는 스크롤)
    And 결재 대기 행 클릭 → TA-08 직행
```

## 9. 의존성

- **선행**: CM-01
- **연계**: TA-02, TA-05, TA-08, TA-09
- **이벤트**: 결재 / 근태 / 휴가 변경 시 Realtime broadcast → KPI 카드 즉시 갱신
