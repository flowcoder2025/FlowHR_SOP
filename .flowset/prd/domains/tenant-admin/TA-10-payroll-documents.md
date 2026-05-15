---
screen_id: TA-10
screen_name: 급여 / 문서 관리
role: [tenant_super, tenant_hr_admin, employee]
entities: [Document, Employee, DocumentTemplate]
platforms: [web, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-10
---

# TA-10 급여 / 문서 관리

## 1. 목적

급여명세서·계약서·인사문서·증명서·회사문서를 단일 화면에서 관리. **급여명세서는 근로기준법 §17 의무 게시**.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | CRUD/E/N |
| tenant_hr_admin | CRU/E/N (삭제 불가) |
| tenant_manager | X (본 화면 비표시) |
| employee | R 본인 일부 (EM-06 / EM-07에서 진입) |

## 3. UI 요소

### 3-1. 탭 5개
| 탭 | 내용 |
|----|------|
| 급여명세서 | 월별 일괄 업로드/발송/열람 모니터링 |
| 계약서 | 근로계약서 + 변경 계약 |
| 인사문서 | 발령서 / 평가서 / 교육 이수 등 |
| 증명서 | 발급 완료된 재직/경력 증명서 |
| 회사문서 | 전체 직원에게 공지하는 문서 (취업규칙 등) |

### 3-2. 테이블 공통 (8 컬럼)
| 컬럼 | 정렬 |
|------|-----|
| 문서명 | ✓ |
| 유형 | ✓ |
| 대상자 (이름 또는 "전체") | — |
| 지급월 (급여만) | ✓ |
| 발송상태 | ✓ |
| 열람상태 | ✓ (배지 + 카운트) |
| 생성일 | ✓ |
| 액션 | — |

### 3-3. 급여명세서 탭 — 일괄 업로드 흐름
1. "양식 다운로드" → 표준 Excel (직원목록 자동 채움 + 지급/공제 항목 컬럼)
2. 정인사 입력
3. "업로드" → 서버 검증 (직원 매칭, 숫자 검증)
4. 미리보기 (PDF 생성 후 샘플 5명)
5. "일괄 발송" → 직원별 PDF + 알림
6. 발송 후 열람율 모니터링 (시간 경과별)

### 3-4. 액션
- "업로드" (탭별 양식 다름)
- "발송" (생성된 문서 일괄 또는 개별)
- "미리보기" (PDF)
- "다운로드" (단건 PDF, 일괄 ZIP)
- "삭제" (super만, 사유 필수)
- "권한 설정" (개별 문서 열람 권한 조정)
- "재발송" (미열람자 대상)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 업로드 | `onUpload` (CM-09 + CM-11) |
| 발송 | `onSend` (일괄 또는 개별) |
| 미리보기 | `onPreview` (CM-10) |
| 다운로드 | `onDownload` (CM-13) |
| 삭제 | `onDelete` (사유 필수) |
| 권한 설정 | `onSetVisibility` |
| 재발송 | `onResend` (미열람자) |

## 5. 상태값

| Document.status | 색상 |
|---------------|------|
| draft | text-muted (작성 중) |
| created | info (생성됨) |
| sent | info (발송 완료) |
| viewed | success (대상자 열람) |
| acknowledged | success (수령 확인 클릭) |
| expired | text-muted (유효기간 만료) |

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Document | CRUD |
| DocumentTemplate | R |
| Employee | R (대상자 매칭) |
| Notification | C (발송) |

## 7. 연관 API

```
GET   /api/v1/tenant/documents?type&status&from&to&page
POST  /api/v1/tenant/documents                            # 단건 업로드
POST  /api/v1/tenant/documents/bulk-payroll               # 급여 일괄 (Excel)
POST  /api/v1/tenant/documents/:id/send
POST  /api/v1/tenant/documents/bulk-send
POST  /api/v1/tenant/documents/:id/resend
GET   /api/v1/tenant/documents/:id/preview                # PDF
GET   /api/v1/tenant/documents/:id/download
DELETE /api/v1/tenant/documents/:id                       # 사유 필수
PATCH /api/v1/tenant/documents/:id/visibility
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 급여명세서 관리
  Background:
    Given tenant_hr_admin 정인사 로그인
    And 회사에 직원 30명

  Scenario: 양식 다운로드 + 업로드 + 미리보기 + 발송
    When "급여명세서 탭" → "양식 다운로드"
    Then 30명 직원이 포함된 Excel 양식 다운로드
    When 정인사가 지급/공제 항목 입력 후 "업로드"
    Then 서버 검증 통과, 30 PDF 생성 (백그라운드)
    When "미리보기" 5명 샘플 확인 후 "일괄 발송"
    Then documents.status=sent, 30명에게 알림
    And 발송 후 24시간 열람율 KPI 카드에 표시

  Scenario: 미열람자 재발송
    Given 30명 중 5명 미열람 (발송 후 7일 경과)
    When "재발송 (미열람자)" 클릭
    Then 5명에게 알림 재발송 (카카오 알림톡 + SMS 폴백)
    And documents.last_resent_at 기록

  Scenario: 급여 일괄 — 직원 매칭 실패
    Given Excel에 사번이 잘못된 행 3건
    When 업로드
    Then 27건 성공 + 3건 실패 + 실패 사유 표시
    And 27건만 일괄 발송 가능, 3건은 수정 후 재시도

  Scenario: 삭제 — 사유 필수
    Given tenant_super 로그인
    When 임의 급여명세서 "삭제" 클릭, 사유 비워둠
    Then "사유는 필수입니다" 에러
    When 사유 입력 후 삭제
    Then documents.deleted_at 기록 (soft delete)
    And audit_logs

  Scenario: 권한 음성 — manager
    Given tenant_manager 로그인
    When /tenant/payroll-documents URL 접근
    Then 403 또는 사이드바에 메뉴 비표시
```

## 9. 의존성

- **선행**: TA-02 (직원 매핑), TA-13 (문서 양식 정의)
- **연계**: EM-06 (직원 본인 조회), EM-07 (문서 조회), TA-11 (계약서 별도)
- **외부**: PDF 생성 (Puppeteer 또는 React-PDF), Supabase Storage
- **자동**: 발송 후 7일 미열람 → 자동 재발송 알림 (cron)
