---
screen_id: OP-02
screen_name: 테넌트 관리
role: [operator_super, operator_staff]
entities: [Tenant, Subscription, Plan]
platforms: [web, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#6-2
---

# OP-02 테넌트 관리

## 1. 목적

운영사가 모든 고객사(테넌트)를 한 화면에서 조회·검색·상태 변경. 영업/CS/장애 대응의 시작점.

## 2. 사용자·권한

| 역할 | 권한 | 본 화면에서 |
|------|------|------------|
| operator_super | CRUD/E | 전체 + 삭제(보관) + Excel 내보내기 |
| operator_staff | CRU/E | 등록·수정·내보내기 (삭제 불가) |

## 3. UI 요소

### 3-1. 헤더
- 검색창: 회사명 / 사업자번호 / 도메인 / 관리자명 (단일 입력, 자동 분기)
- "신규 테넌트 등록" CTA → OP-04
- "내보내기" 버튼 (현재 필터 결과 Excel)

### 3-2. 필터 사이드 패널
- 상태: 활성 / 비활성 / 미납 / 만료예정 (30일 이내) / 만료 / 보관
- 요금제: 기본 / 프리미엄 / 커스텀
- 결제상태: 정상 / 미납 / 결제실패
- 계약만료: 이번달 / 다음달 / 3개월 내 / 전체
- 최근활동: 7일 / 30일 / 90일 / 비활성

### 3-3. 테이블 (10 컬럼, 페이지네이션 20/페이지)
| 컬럼 | 정렬 | 비고 |
|------|-----|------|
| 회사명 | ✓ | 클릭 → OP-03 |
| 도메인 | — | `{slug}.flowhr.kr` |
| 상태 | ✓ | 배지 (색상 매핑: 활성=success, 미납=warning, 만료=danger) |
| 요금제 | ✓ | — |
| 활성 사용자 | ✓ | / 계약인원 |
| 월요금 | ✓ | 정렬 |
| 결제상태 | ✓ | 배지 |
| 대표관리자 | — | 이름 + 이메일 |
| 최근활동 | ✓ | 상대시간 ("3시간 전") |
| 액션 | — | 점 3개 메뉴 |

### 3-4. 행별 액션 메뉴
- 상세 보기 (→ OP-03)
- 상태 변경 (모달: 활성 ↔ 비활성, 보관)
- 요금제 변경 (모달)
- 관리자 변경 (모달, 새 이메일로 초대)
- 청구내역 보기 (→ OP-06, 필터 적용)

## 4. 액션

| 라벨 | 핸들러 | 결과 |
|------|--------|------|
| 신규 테넌트 등록 | `onCreateTenant` | OP-04 7단계 마법사 |
| 내보내기 | `onExport` | 현재 필터/검색 결과 xlsx 생성 (CM-12) |
| 상태 변경 | `onChangeStatus` | 확인 모달 → API → 감사 로그 + 알림 |
| 요금제 변경 | `onChangePlan` | OP-05의 플랜 선택 모달 |
| 관리자 변경 | `onChangeAdmin` | 새 관리자 이메일 입력 → 초대 발송 |

## 5. 상태값

| Tenant.status | 색상 | 설명 |
|-------------|------|------|
| active | success | 정상 사용 |
| inactive | text-muted | 운영사가 비활성 |
| overdue | warning | 미납 (자동 전환) |
| expiring_soon | warning | 만료 30일 이내 |
| expired | danger | 계약 만료 |
| archived | text-muted | 보관 (1년 후 자동) |

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Tenant | CRUD (status, plan_id, archived_at) |
| Subscription | RU (활성 구독 변경 시) |
| Plan | R (요금제 선택 모달) |

## 7. 연관 API

```
GET    /api/v1/operator/tenants?page&pageSize&sort&filter[status]&filter[plan]&q
POST   /api/v1/operator/tenants                                  # OP-04에서 호출
PATCH  /api/v1/operator/tenants/:id                              # 상태/요금제/관리자 변경
DELETE /api/v1/operator/tenants/:id                              # = archived (soft delete)
POST   /api/v1/operator/tenants/export                           # Excel
POST   /api/v1/operator/tenants/:id/change-admin                 # 관리자 변경
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 테넌트 관리 목록
  Background:
    Given operator_super 로그인

  Scenario: 검색 기본 동작
    When 검색창에 "치킨"을 입력
    Then 회사명에 "치킨"이 포함된 테넌트만 표시된다
    And 페이지네이션 카운트가 갱신된다

  Scenario: 사업자번호 검색
    When 검색창에 "123-45-67890"을 입력
    Then businessNumber가 일치하는 테넌트만 표시된다

  Scenario: 미납 상태 일괄 필터 + 내보내기
    Given 사이드 필터에서 결제상태 = "미납" 선택
    When "내보내기" 버튼 클릭
    Then 미납 테넌트만 포함된 xlsx 다운로드 링크가 응답된다

  Scenario: 상태 변경 — 활성 → 비활성
    Given 임의의 활성 테넌트 행에서 액션 메뉴 열기
    When "상태 변경 > 비활성" 클릭, 확인 모달에서 사유 입력 후 확인
    Then API PATCH 호출, status가 inactive로 변경
    And audit_logs에 actor + before/after 기록
    And 해당 테넌트의 사용자 세션이 즉시 무효화된다

  Scenario: 권한 음성 — operator_staff는 archived 불가
    Given operator_staff 로그인
    When 행 액션 메뉴 열기
    Then "보관(삭제)" 항목이 표시되지 않거나 비활성화된다

  Scenario: 권한 음성 — tenant 사용자 직접 URL 접근
    Given tenant_hr_admin 로그인
    When /operator/tenants URL 직접 접근
    Then 403 응답
```

## 9. 의존성

- **선행**: OP-01 대시보드, CM-01 로그인
- **후행**: OP-03 (행 클릭), OP-04 (신규 등록 CTA), OP-06 (청구내역), OP-05 (요금제 변경)
- **이벤트**: 상태 변경 시 Realtime broadcast → OP-01 KPI 카드 갱신
