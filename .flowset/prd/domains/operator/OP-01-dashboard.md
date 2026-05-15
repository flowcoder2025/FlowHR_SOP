---
screen_id: OP-01
screen_name: 운영사 대시보드
role: [operator_super, operator_staff]
entities: [Tenant, Subscription, Invoice, Ticket, AuditLog, Plan]
platforms: [web, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#6-1
---

# OP-01 운영사 대시보드

## 1. 목적

운영사가 매일 아침 처음 보는 화면. 플랫폼 전체 운영 상태를 한눈에 파악하여 신규 가입·해지·미수금·티켓·시스템 장애를 즉시 인지하고 액션 진입.

## 2. 사용자·권한

| 역할 | 권한 (spec §9-2) | 본 화면에서 |
|------|----------------|------------|
| operator_super | R/E | 전체 KPI 조회 + Excel/PDF 내보내기 |
| operator_staff | R | 전체 KPI 조회 (내보내기 불가) |

## 3. UI 요소

### 3-1. KPI 카드 (상단 7개)
| 카드 | 표시 |
|------|------|
| 전체 테넌트 | 전체 수 + 활성/비활성/만료 breakdown |
| 활성 테넌트 | 활성 수 + 전월 대비 ±% |
| 총 사용자 | 활성 employees 합계 + 전월 대비 ±% |
| MRR | 이번달 월매출 + 전월 대비 ±% |
| 미수금 | 미수 금액 + 미수 테넌트 수 |
| 오픈 티켓 | 오픈 + 진행중 합계 + SLA 임박 카운트 |
| 시스템 상태 | 정상/점검중/오류 + Supabase/Vercel 상태 (UptimeRobot API) |

### 3-2. 차트 (중단 4개)
| 차트 | 유형 | 데이터 |
|------|------|------|
| 월별 MRR 추이 | Line | 최근 12개월 |
| 신규/해지 테넌트 추이 | Bar (양방향) | 최근 6개월 |
| 요금제 분포 | Donut | 활성 테넌트의 플랜별 비율 |
| 티켓 유형 분포 | Donut | 최근 30일 |

### 3-3. 최근 활동 테이블 (하단 3섹션)
| 테이블 | 컬럼 |
|--------|------|
| 최근 가입 테넌트 (10개) | 회사명, 플랜, 가입일, 활성 직원수, 상태 |
| 최근 티켓 (10개) | 티켓번호, 회사명, 제목, 우선순위, 상태, SLA, 담당자 |
| 최근 시스템 이벤트 (10개) | 발생일시, 이벤트, 영향 테넌트, 결과 |

### 3-4. 필터 (헤더)
- 기간: 오늘 / 이번주 / 이번달 / 분기 / 커스텀
- 요금제: 전체 / 기본 / 프리미엄 / 커스텀
- 테넌트 상태: 전체 / 활성 / 비활성 / 만료예정

## 4. 액션

| 라벨 | 핸들러 | 이동 |
|------|--------|------|
| 신규 테넌트 등록 | `onCreateTenant` | OP-04 |
| 리포트 다운로드 | `onExportDashboard` | PDF/Excel 생성 |
| 티켓 보기 | `onViewTickets` | OP-08 |
| 청구 보기 | `onViewBilling` | OP-06 |
| KPI 카드 클릭 | `onDrillDown` | 해당 도메인 화면 |

## 5. 상태값

화면 자체 상태: `loading | ready | error | partial`. KPI 카드별 개별 로딩 상태 지원 (병렬 fetch).

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Tenant | R (count, status breakdown) |
| Subscription | R (MRR 계산용) |
| Invoice | R (미수금) |
| Ticket | R (오픈 카운트) |
| AuditLog | R (최근 시스템 이벤트) |
| Plan | R (요금제 분포) |

## 7. 연관 API

```
GET /api/v1/operator/dashboard/kpis            # 7개 KPI 한 번에
GET /api/v1/operator/dashboard/charts/mrr      # 월별 MRR
GET /api/v1/operator/dashboard/charts/tenants  # 신규/해지 추이
GET /api/v1/operator/dashboard/charts/plans    # 플랜 분포
GET /api/v1/operator/dashboard/charts/tickets  # 티켓 유형
GET /api/v1/operator/dashboard/recent/tenants  # 최근 가입 10
GET /api/v1/operator/dashboard/recent/tickets  # 최근 티켓 10
GET /api/v1/operator/dashboard/recent/events   # 최근 이벤트 10
POST /api/v1/operator/dashboard/export         # PDF/Excel
```

응답 형식은 `api-standard.md` envelope 준수.

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 운영사 대시보드
  Background:
    Given operator_super 역할로 로그인되어 있다

  Scenario: 대시보드 진입 시 KPI 표시
    When 운영사 대시보드 페이지를 연다
    Then 7개 KPI 카드가 2초 이내에 렌더된다
    And "전체 테넌트", "활성 테넌트", "MRR" 카드가 정확한 수치를 표시한다

  Scenario: 기간 필터 변경
    Given 대시보드가 로드됨
    When 기간 필터를 "이번달"에서 "분기"로 변경
    Then 4개 차트가 다시 렌더되고 데이터가 갱신된다

  Scenario: 권한 음성 — operator_staff는 내보내기 불가
    Given operator_staff 역할로 로그인되어 있다
    When 대시보드 페이지를 연다
    Then "리포트 다운로드" 버튼이 비활성화되어 있다

  Scenario: 권한 음성 — 테넌트 사용자는 접근 불가
    Given tenant_super 역할로 로그인되어 있다
    When /operator/dashboard URL에 직접 접근한다
    Then HTTP 403이 반환되거나 권한 없음 화면으로 이동한다
```

## 9. 의존성

- **선행 화면**: CM-01 로그인
- **참조 데이터**: OP-02 테넌트 / OP-06 청구 / OP-08 티켓의 집계
- **외부**: UptimeRobot API (시스템 상태 카드)
- **이벤트**: Supabase Realtime broadcast — 신규 가입/해지 시 카운트 즉시 갱신
