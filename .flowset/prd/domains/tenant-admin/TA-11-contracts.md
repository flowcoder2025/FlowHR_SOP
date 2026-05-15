---
screen_id: TA-11
screen_name: 문서함 / 전자계약
role: [tenant_super, tenant_hr_admin, tenant_manager, employee]
entities: [Document, DocumentTemplate, Signature]
platforms: [web, desktop_tauri]
mvp: partial
mvp_note: "MVP는 계약서 업로드/다운로드만. 전자서명은 v1.2"
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-11
---

# TA-11 문서함 / 전자계약

## 1. 목적

계약서 생성·서명 요청·서명 상태 관리. MVP는 PDF 업로드/직원 매핑/다운로드만, 전자서명은 v1.2 (전자서명 인증사업자 연동).

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | CRUD/E/N |
| tenant_hr_admin | CRU/E/N |
| tenant_manager | R (자기 팀 일부) |
| employee | R/Sign 본인 (v1.2 서명) |

## 3. UI 요소

### 3-1. 테이블 (7 컬럼)
| 컬럼 | 정렬 |
|------|-----|
| 계약서명 | ✓ |
| 대상자 (이름) | — |
| 템플릿 | — |
| 서명상태 (v1.2) / 발송상태 (MVP) | ✓ |
| 요청일 | ✓ |
| 완료일 | ✓ |
| 액션 | — |

### 3-2. 필터
- 서명상태 (v1.2: 대기/일부완료/완료/만료)
- 문서유형
- 대상자
- 기간

### 3-3. 액션 / 모달
- "계약서 생성" (템플릿 선택 → 변수 입력 → PDF 생성)
- "템플릿 선택" (DocumentTemplate)
- "서명 요청" (v1.2 — 전자서명 API 호출)
- "미리보기" / "다운로드"

### 3-4. 계약서 생성 흐름 (MVP)
1. 템플릿 선택 (TA-13에서 미리 등록된 양식)
2. 변수 입력 (직원 자동완성, 직급, 연봉, 입사일 등 — 직원 데이터에서 자동 채움)
3. PDF 미리보기
4. 발송 (대상자에게 알림 + 다운로드 링크 안내)
5. 직원 측에서 출력 → 서명 → 스캔 업로드 (수동, MVP)

### 3-5. 전자서명 (v1.2)
- 전자서명 인증사업자 연동 (모두싸인, 헬로싸인, 또는 자체 PAdES)
- 서명자 인증 (이메일 + 휴대폰 OTP)
- 서명 진행 상태 실시간 모니터링

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 계약서 생성 | `onCreateContract` |
| 템플릿 선택 | `onSelectTemplate` |
| 서명 요청 (v1.2) | `onRequestSign` |
| 미리보기 | `onPreview` |
| 다운로드 | `onDownload` |

## 5. 상태값

MVP:
- `Document.status`: created / sent / viewed / acknowledged

v1.2 (전자서명 도입 시 추가):
- `Document.signature_status`: pending / partial / completed / expired
- `Signature.status`: pending / signed / rejected

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Document | CRUD (계약서 sub-type) |
| DocumentTemplate | R |
| Employee | R |
| Signature (v1.2) | CRU |

## 7. 연관 API

```
GET   /api/v1/tenant/contracts?status&type&page
POST  /api/v1/tenant/contracts                              # 신규 (템플릿 + 변수)
GET   /api/v1/tenant/contracts/:id
POST  /api/v1/tenant/contracts/:id/send
POST  /api/v1/tenant/contracts/:id/preview                  # PDF
GET   /api/v1/tenant/contracts/:id/download
POST  /api/v1/tenant/contracts/:id/request-sign             # v1.2
POST  /api/v1/tenant/contracts/:id/sign                     # v1.2 (직원)
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 계약서 관리 (MVP)
  Background:
    Given tenant_hr_admin 로그인
    And DocumentTemplate "표준 근로계약서" 등록됨

  Scenario: 계약서 생성 - 변수 자동 채움
    When "계약서 생성" → 템플릿="표준 근로계약서" → 대상자=한직원 선택
    Then 한직원의 이름·직급·연봉·입사일이 변수에 자동 채워짐
    When "PDF 미리보기" 확인 후 "발송"
    Then documents INSERT (sub_type=contract), 한직원에게 알림
    And 한직원 EM-07에서 다운로드 가능

  Scenario: 전자서명 (v1.2) — Coming soon 안내
    When TA-11에서 "서명 요청" 클릭 (MVP 단계)
    Then "전자서명 기능은 v1.2 출시 예정입니다" 안내
    And 버튼은 표시되나 비활성

  Scenario: 권한 — manager 일부 조회
    Given tenant_manager (영업팀)
    When TA-11 진입
    Then 영업팀 직원의 계약서만 조회 가능 (메타만, 본문은 비표시)

  Scenario: 권한 — employee 본인
    Given employee
    When EM-07 → 계약서 항목 클릭
    Then 자기 계약서 PDF 다운로드 가능
```

## 9. 의존성

- **선행**: TA-13 (템플릿 등록), TA-02 (직원 존재)
- **연계**: TA-10 (전체 문서 관리), EM-07 (직원 조회)
- **외부 (v1.2)**: 전자서명 인증사업자 API
