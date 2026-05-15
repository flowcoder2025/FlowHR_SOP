---
screen_id: EM-06
screen_name: 급여명세서 조회
role: [employee]
entities: [Document]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#8-6
---

# EM-06 급여명세서 조회

## 1. 목적

월별 급여명세서 조회 + PDF 다운로드 + 열람 확인. **근로기준법 §17 임금명세서 교부 의무 이행**.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| employee | R/E 본인 |

## 3. UI 요소

### 3-1. 테이블 (6 컬럼)
| 컬럼 | 정렬 |
|------|-----|
| 지급월 (YYYY-MM) | ✓ |
| 총지급액 | ✓ |
| 공제액 | ✓ |
| 실지급액 | ✓ |
| 열람상태 | ✓ (배지: 미열람/열람완료) |
| 발행일 | ✓ |

### 3-2. 상세 모달 (행 클릭 시)
- 지급 항목 표 (기본급, 직책수당, 야간수당, 식대 등 — 회사별)
- 공제 항목 표 (소득세, 4대보험 등)
- 실지급액 (큰 글씨)
- 회사 안내문 (예: "지급일 5/25")
- PDF 다운로드 버튼
- "열람 확인" 버튼 (자동 + 수동)

### 3-3. 액션
- "상세 보기" (모달)
- "PDF 다운로드"
- "열람 확인" (수동, 자동 처리 외 추가 옵션)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 상세 보기 | `onViewPayslip` |
| PDF 다운로드 | `onDownloadPdf` (CM-13) |
| 열람 확인 | `onMarkViewed` (모달 진입 시 자동) |

## 5. 상태값

`Document.status`: created / sent / viewed / acknowledged

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Document | R 본인 (sub_type=payslip) |

## 7. 연관 API

```
GET  /api/v1/me/payslips?year                       # 연도별 목록
GET  /api/v1/me/payslips/:id                        # 상세 (지급/공제 내역)
GET  /api/v1/me/payslips/:id/download               # PDF (Signed URL)
POST /api/v1/me/payslips/:id/acknowledge            # 열람 확인
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 급여명세서 조회
  Background:
    Given employee 한직원 PWA 로그인
    And 2026-04 급여명세서 발송됨 (미열람)

  Scenario: 진입 시 미열람 강조
    When EM-06 진입
    Then 미열람 건이 상단 배지 또는 강조 표시
    And "미열람 1건" 알림 표시

  Scenario: 상세 보기 → 자동 열람 처리
    When 행 클릭, 상세 모달 열림
    Then documents.viewed_at 기록, 상태 = viewed
    And 다음 진입 시 미열람 표시 사라짐

  Scenario: PDF 다운로드
    When 상세 모달에서 "PDF 다운로드" 클릭
    Then Signed URL (15분) 발급, 다운로드 시작
    And 다운로드 이벤트 audit_logs 기록

  Scenario: 수동 열람 확인 (모달 진입 없이)
    When 행에서 직접 "열람 확인" 클릭
    Then status=acknowledged, viewed_at + acknowledged_at 기록

  Scenario: 권한 — 다른 사람 급여 조회
    Given 다른 직원의 payslip_id로 GET
    Then 403

  Scenario: 발송 7일 미열람 — 알림 재발송
    Given 발송 후 7일 미열람
    Then cron이 카카오 알림톡 재발송 + SMS 폴백
```

## 9. 의존성

- **선행**: TA-10 (HR 발행)
- **외부**: PDF 생성 (Puppeteer/React-PDF), Storage Signed URL
- **이벤트**: 발송 시 알림 → 7일 미열람 시 재발송
