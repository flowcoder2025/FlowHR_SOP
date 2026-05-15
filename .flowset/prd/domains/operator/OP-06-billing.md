---
screen_id: OP-06
screen_name: 청구/정산 관리
role: [operator_super, operator_staff]
entities: [Invoice, Tenant, Subscription]
platforms: [web, desktop_tauri]
mvp: partial
mvp_note: "MVP는 청구내역 조회 + 수동 발행 + 결제완료 처리만. 자동 PG 결제는 v1.1"
spec_ref: docs/FlowHR_screen_spec_v_1.md#6-6
---

# OP-06 청구/정산 관리

## 1. 목적

테넌트별 청구·수납·미수금을 단일 화면에서 관리. MVP는 수동 청구 + 사업자 입금 확인 후 "결제완료 처리". 자동 PG 결제는 v1.1.

## 2. 사용자·권한

| 역할 | 권한 | 본 화면에서 |
|------|------|------------|
| operator_super | C/R/U/E | 전권 + 환불 + 세금계산서 발행 |
| operator_staff | R/U/E | 조회 + 결제완료 처리 + 내보내기 (환불 불가) |
| tenant_super | R 일부 | 자기 테넌트 청구만 (TA에서 별도 화면) |

## 3. UI 요소

### 3-1. KPI 카드 (상단 5개)
| 카드 | 표시 |
|------|------|
| 이번달 청구액 | 합계 + 전월 ±% |
| 이번달 수납액 | 합계 + 수납율 |
| 미수금 | 합계 + 미수 테넌트 수 |
| 결제 실패 | 자동 결제 실패 (v1.1) |
| 세금계산서 대기 | 발행 필요 건수 |

### 3-2. 필터
- 청구월: 이번달 / 지난달 / 분기 / 커스텀
- 결제상태: 정상 / 미납 / 결제실패 / 환불
- 요금제: 기본 / 프리미엄 / 커스텀
- 미수 여부: 전체 / 미수만

### 3-3. 테이블 (11 컬럼)
| 컬럼 | 정렬 |
|------|-----|
| 청구월 (YYYY-MM) | ✓ |
| 회사명 | ✓ |
| 플랜 | — |
| 인원 (계약/실사용) | — |
| 공급가 | ✓ |
| 부가세 (10%) | ✓ |
| 합계 | ✓ |
| 결제상태 | ✓ |
| 세금계산서 | — |
| 결제일 | ✓ |
| 액션 | — |

### 3-4. 행 액션
- 인보이스 보기 (PDF)
- 세금계산서 발행 (외부 세무 시스템 연동 v1.2, MVP는 PDF 다운로드)
- 결제완료 처리 (수동)
- 환불 (operator_super만)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 청구 일괄 발행 | `onBatchIssueInvoices` (월 1회, 운영사가 트리거) |
| 인보이스 발행 | `onIssueInvoice` (개별 재발행) |
| 결제완료 처리 | `onMarkPaid` (입금 확인 후) |
| 환불 | `onRefund` (사유 + 환불 금액 입력) |
| 내보내기 | `onExport` (Excel) |

## 5. 상태값

| Invoice.status | 색상 | 설명 |
|--------------|------|------|
| draft | text-muted | 작성 중 (자동 생성 후 검토) |
| issued | info | 발행됨, 수납 대기 |
| paid | success | 수납 완료 |
| overdue | warning | 결제 기한 초과 (15일) |
| failed | danger | 자동 결제 실패 (v1.1) |
| refunded | text-muted | 환불됨 |

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Invoice | CRUD |
| Tenant | R |
| Subscription | R (인원/플랜 계산용) |

## 7. 연관 API

```
GET   /api/v1/operator/invoices?page&sort&filter
POST  /api/v1/operator/invoices/batch-issue          # 월 1회 일괄
POST  /api/v1/operator/invoices/:id/issue            # 개별 재발행
POST  /api/v1/operator/invoices/:id/mark-paid        # 수동 결제완료
POST  /api/v1/operator/invoices/:id/refund           # 환불 (super만)
GET   /api/v1/operator/invoices/:id/pdf              # PDF 다운로드
POST  /api/v1/operator/invoices/export
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 청구/정산
  Background:
    Given operator_super 로그인
    And 2026-05 청구가 일괄 발행됨

  Scenario: 미수금 필터링 + 내보내기
    When 결제상태="미납" 필터 적용
    Then 미납 행만 표시
    When "내보내기" 클릭
    Then 미납 인보이스 xlsx 다운로드 제공

  Scenario: 결제완료 처리
    Given 임의의 issued 인보이스
    When 행 액션 "결제완료 처리" 클릭, 결제일/방법 입력
    Then status=paid, 결제일 기록
    And audit_logs에 actor + 사유 기록

  Scenario: 환불 — operator_staff는 불가
    Given operator_staff 로그인
    When paid 인보이스 행 액션 메뉴 열기
    Then "환불" 항목이 비활성화

  Scenario: 자동 미납 전환
    Given issued 인보이스 + 결제기한 = 2026-05-01
    When 2026-05-16 00:00 (15일 경과)
    Then Edge Function 또는 cron이 status=overdue로 자동 전환
    And 운영사 + 테넌트 관리자에게 알림 발송
```

## 9. 의존성

- **선행**: OP-02 / OP-03
- **연계**: OP-05 (플랜 가격), OP-09 (감사 로그)
- **외부**: 세무 시스템 (v1.2), 카카오 알림톡 (미납 알림)
- **자동 작업**: 매월 1일 00:00 일괄 청구 발행 (cron via Edge Function)
