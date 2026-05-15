---
screen_id: EM-07
screen_name: 문서 조회
role: [employee]
entities: [Document]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#8-7
---

# EM-07 문서 조회

## 1. 목적

본인에게 발행된 인사 문서(계약서·증명서·발령서 등) + 회사 문서(취업규칙 등) 조회.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| employee | R/E 권한 문서 |

## 3. UI 요소

### 3-1. 탭
| 탭 |
|----|
| 내 문서 (개인 발행) |
| 회사 문서 (전체 공지) |

### 3-2. 테이블 (6 컬럼)
| 컬럼 | 정렬 |
|------|-----|
| 문서명 | ✓ |
| 유형 (계약서/증명서/발령서/회사문서) | ✓ |
| 발행일 | ✓ |
| 열람상태 | ✓ |
| 만료일 (있는 경우) | ✓ |
| 액션 |

### 3-3. 필터
- 유형
- 기간
- 열람상태

### 3-4. 액션
- "미리보기" (PDF 인라인 — CM-10)
- "다운로드"
- "열람 확인"

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 미리보기 | `onPreview` |
| 다운로드 | `onDownload` |
| 열람 확인 | `onAcknowledge` |

## 5. 상태값

`Document.status`: created / sent / viewed / acknowledged / expired

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Document | R 본인 또는 전체 공개 |

## 7. 연관 API

```
GET  /api/v1/me/documents?type&status&from&to&page
GET  /api/v1/me/documents/company-wide              # 회사 공지 문서
GET  /api/v1/me/documents/:id/preview
GET  /api/v1/me/documents/:id/download
POST /api/v1/me/documents/:id/acknowledge
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 문서 조회
  Background:
    Given employee 한직원 로그인

  Scenario: 내 문서 탭
    When EM-07 진입
    Then 본인에게 발행된 문서 목록 + 회사 문서 탭 표시

  Scenario: 회사 문서 탭
    When "회사 문서" 탭 클릭
    Then 회사 전체 공지 문서 (취업규칙, 공지사항 등) 표시

  Scenario: 미리보기 → 자동 열람
    When 문서 미리보기
    Then status=viewed 자동 갱신

  Scenario: 권한 — 다른 사람 문서
    Given 다른 직원의 document_id 직접 GET
    Then 403

  Scenario: 만료된 문서
    Given 만료일 지난 문서
    Then "만료됨" 배지 + 다운로드는 가능 (이력 보존)
```

## 9. 의존성

- **선행**: TA-10/TA-11 (HR 발행), TA-13 (회사 문서 등록)
- **연계**: EM-06 (급여명세서는 별도 화면), EM-08 (증명서)
