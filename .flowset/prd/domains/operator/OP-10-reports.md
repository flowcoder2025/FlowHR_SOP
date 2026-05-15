---
screen_id: OP-10
screen_name: 운영 리포트
role: [operator_super, operator_staff]
entities: [Tenant, Subscription, Invoice, Employee, AuditLog]
platforms: [web, desktop_tauri]
mvp: partial
mvp_note: "MVP는 KPI 카드 + 4종 기본 차트만. 커스텀 리포트 빌더는 v1.3"
spec_ref: docs/FlowHR_screen_spec_v_1.md#6-10
---

# OP-10 운영 리포트

## 1. 목적

플랫폼 매출·성장·사용량 분석. MVP는 기본 KPI 차트만, 커스텀 빌더는 v1.3.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| operator_super | R/E |
| operator_staff | R/E |

## 3. UI 요소

### 3-1. KPI 카드 (상단 6개)
| 카드 |
|------|
| MRR (월간 반복 매출) |
| ARR (연간 반복 매출 = MRR × 12) |
| ARPU (사용자당 평균 매출) |
| 신규 테넌트 (이번달) |
| 해지율 (월간 Churn) |
| 활성 사용자율 (WAE/MAE) |

### 3-2. 차트 (4종, MVP)
| 차트 | 유형 | 데이터 |
|------|------|------|
| 매출 추이 | Line | 최근 12개월 MRR |
| 가입/해지 추이 | Bar (양방향) | 최근 12개월 |
| 요금제별 매출 | Donut | 현재 |
| 기능 사용량 Top 10 | Horizontal Bar | 최근 30일 audit_logs 기반 |

### 3-3. 필터
- 기간: 이번달 / 분기 / 작년 / 커스텀
- 요금제
- 산업군
- 테넌트 상태

### 3-4. 액션
- PDF 다운로드 (현재 필터 결과 → 리포트 PDF)
- Excel 다운로드 (raw 데이터)
- 기간 비교 (전년 동기 vs 현재)
- 커스텀 리포트 (v1.3 — 비활성, 'Coming soon' 표시)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| PDF 다운로드 | `onExportPdf` (서버 렌더링 PDF) |
| Excel 다운로드 | `onExportExcel` (raw 데이터) |
| 기간 비교 토글 | `onComparePeriod` |

## 5. 상태값

화면 자체: `loading | ready | exporting | error`

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Tenant | R (집계) |
| Subscription | R (MRR 계산) |
| Invoice | R (실수납 매출) |
| Employee | R (활성 사용자 카운트) |
| AuditLog | R (기능 사용량 집계) |

## 7. 연관 API

```
GET   /api/v1/operator/reports/kpis?from&to
GET   /api/v1/operator/reports/charts/revenue
GET   /api/v1/operator/reports/charts/tenants
GET   /api/v1/operator/reports/charts/plans
GET   /api/v1/operator/reports/charts/feature-usage
POST  /api/v1/operator/reports/export/pdf
POST  /api/v1/operator/reports/export/excel
GET   /api/v1/operator/reports/compare?baseFrom&baseTo&compareFrom&compareTo
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 운영 리포트
  Background:
    Given operator_super 로그인

  Scenario: 진입 + KPI 카드 표시
    When 운영 리포트 페이지 진입 (기본 = 이번달)
    Then 6개 KPI 카드가 표시
    And 4개 차트가 렌더된다

  Scenario: 기간 변경
    When 기간 = "분기" 선택
    Then 모든 KPI 카드와 차트가 분기 데이터로 갱신된다

  Scenario: PDF 다운로드
    When "PDF 다운로드" 클릭
    Then 비동기 작업 → 완료 시 다운로드 링크 응답

  Scenario: 기간 비교
    When "전년 동기 비교" 토글 ON
    Then 매출 추이 차트에 작년 동월 라인이 추가로 표시된다
    And KPI 카드에 ±% 인디케이터가 표시된다

  Scenario: 커스텀 리포트 - MVP 안내
    When "커스텀 리포트" 버튼 hover
    Then "v1.3에서 제공 예정" 툴팁 표시
    And 버튼 비활성
```

## 9. 의존성

- **선행**: OP-01
- **데이터**: subscriptions, invoices, employees, tenants, audit_logs 집계
- **외부**: PDF 생성 (Puppeteer 또는 React-PDF)
- **성능**: 대량 집계 쿼리 — 사전 집계 머터리얼라이즈드 뷰 또는 일일 cron 검토 (MVP 후순위 — 단순 쿼리로 시작, 부하 시 최적화)
