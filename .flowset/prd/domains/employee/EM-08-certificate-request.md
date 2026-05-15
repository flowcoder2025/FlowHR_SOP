---
screen_id: EM-08
screen_name: 증명서 요청
role: [employee]
entities: [CertificateRequest, Approval, Document]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#8-8
---

# EM-08 증명서 요청

## 1. 목적

재직증명서·경력증명서 등 발급 요청 → HR 처리 → 발급 완료 후 EM-07에서 다운로드.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| employee | C/R/Cancel 본인 |

## 3. UI 요소

### 3-1. 입력 필드
- 증명서 종류: 재직증명서 / 경력증명서 / 퇴직증명서 / 원천징수영수증 / 갑근세납입증명서 등
- 제출처 (예: "은행 대출용", "비자 신청용")
- 용도
- 발급 매수 (1~5)
- 수령 방식 (이메일 / 인앱 다운로드 / 우편 / 직접 수령)
- 요청 메모 (선택)

### 3-2. 요청 이력 테이블
| 컬럼 | 정렬 |
|------|-----|
| 요청일 | ✓ |
| 증명서 종류 | — |
| 매수 | — |
| 수령방식 | — |
| 상태 | ✓ |
| 처리자 | — |
| 완료일 | ✓ |
| 액션 | — |

### 3-3. 액션
- "요청 제출" → HR 결재 / 처리
- "임시저장"
- "요청 취소" (처리 전만)
- "완료 파일 다운로드" (status=issued)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 요청 제출 | `onSubmit` |
| 임시저장 | `onSaveDraft` |
| 취소 | `onCancel` (요청대기 상태만) |
| 다운로드 | `onDownload` (완료된 PDF) |

## 5. 상태값

| CertificateRequest.status | 의미 |
|-------------------------|------|
| pending | 요청 대기 |
| in_progress | 처리 중 |
| issued | 발급 완료 (다운로드 가능) |
| rejected | 반려 (사유 포함) |
| cancelled | 직원 취소 |

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| CertificateRequest | CRUD 본인 |
| Approval | C (결재 흐름 사용) |
| Document | R (발급된 PDF) |

## 7. 연관 API

```
GET  /api/v1/me/certificate-requests?status&page
POST /api/v1/me/certificate-requests
GET  /api/v1/me/certificate-requests/:id
POST /api/v1/me/certificate-requests/:id/cancel
GET  /api/v1/me/certificate-requests/:id/download   # 발급된 PDF
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 증명서 요청
  Background:
    Given employee 한직원 로그인

  Scenario: 재직증명서 요청
    When EM-08 진입, 종류=재직증명서, 제출처="국민은행", 매수=1, 수령=인앱 입력
    And "요청 제출"
    Then certificate_requests INSERT (status=pending)
    And HR 관리자에게 알림

  Scenario: HR 처리 → 발급 완료
    Given HR 정인사가 처리
    When 정인사가 PDF 발급 + status=issued 변경
    Then 직원에게 알림: "재직증명서 발급 완료"
    And EM-08 행에 "다운로드" 버튼 활성

  Scenario: 반려
    Given HR가 반려 + 사유 입력
    Then status=rejected, 직원에게 사유 표시

  Scenario: 권한 — 다른 사람 요청 조회
    Given 다른 직원의 cert_id로 GET
    Then 403
```

## 9. 의존성

- **선행**: TA-13 (증명서 양식 정의)
- **연계**: TA-09 (HR 처리), EM-07 (발급 후 조회), CM-13 (PDF 생성)
- **외부**: PDF 워터마크 + 발행 일자 자동 포함
