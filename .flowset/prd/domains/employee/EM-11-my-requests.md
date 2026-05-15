---
screen_id: EM-11
screen_name: 요청 내역
role: [employee]
entities: [Approval, Leave, AttendanceModification, CertificateRequest, EmployeeChangeRequest]
platforms: [web, pwa, desktop_tauri]
mvp: partial
mvp_note: "MVP는 EM-05와 통합 운영. 별도 화면은 v1.1"
spec_ref: docs/FlowHR_screen_spec_v_1.md#8-11
---

# EM-11 요청 내역

## 1. 목적

본인이 제출한 모든 요청(휴가/근태수정/증명서/정보변경)을 단일 화면에서 통합 조회. **MVP는 EM-05로 통합**, v1.1에서 별도 화면 분리.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| employee | R/Cancel/Resubmit 본인 |

## 3. UI 요소 (v1.1 기준)

### 3-1. 필터
- 유형: 휴가 / 근태수정 / 증명서 / 정보변경 / 문서
- 상태: 전체 / 진행중 / 완료 / 반려 / 취소
- 기간

### 3-2. 테이블 (7 컬럼)
| 컬럼 | 정렬 |
|------|-----|
| 요청일 | ✓ |
| 유형 | ✓ |
| 제목 | — |
| 상태 | ✓ |
| 처리자 | — |
| 완료일 | ✓ |
| 액션 | — |

### 3-3. 액션
- 상세 보기
- 취소
- 재요청 (반려된 건)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 상세 보기 | `onView` |
| 취소 | `onCancel` |
| 재요청 | `onResubmit` |

## 5. 상태값

각 요청 유형의 상태값 매핑 (Leave / AttendanceModification / CertificateRequest / EmployeeChangeRequest).

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Approval | R 본인 |
| Leave / AttendanceModification / CertificateRequest / EmployeeChangeRequest | R 본인 |

## 7. 연관 API

```
GET /api/v1/me/requests?type&status&from&to&page    # 통합 조회
```

(개별 API는 EM-03/EM-08/EM-09 등에서 정의)

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 요청 내역 통합 조회 (v1.1)
  Background:
    Given employee 한직원 로그인 (v1.1)

  Scenario: 통합 조회
    When EM-11 진입
    Then 본인의 휴가/근태수정/증명서/정보변경 요청이 모두 단일 테이블에 표시
    And 유형 필터 동작 정상

  Scenario: MVP 단계 — EM-11 비활성
    Given MVP 빌드
    When EM-11 URL 접근
    Then EM-05로 자동 리다이렉트
    And 사이드바에 EM-11 메뉴 비표시
```

## 9. 의존성

- **선행**: EM-05 (MVP), 모든 요청 화면 (EM-03/EM-08/EM-09/TA-06)
- **연계**: v1.1 도입 시 EM-05와 카테고리 분리
- **MVP**: 본 화면은 v1.1로 미루고, MVP에서는 EM-05로 통합 — 사이드바 비표시
