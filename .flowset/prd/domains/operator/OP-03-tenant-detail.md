---
screen_id: OP-03
screen_name: 테넌트 상세
role: [operator_super, operator_staff]
entities: [Tenant, Subscription, Invoice, Employee, FeatureFlag, AuditLog, Ticket]
platforms: [web, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#6-3
---

# OP-03 테넌트 상세

## 1. 목적

특정 고객사의 전체 정보를 단일 화면에서 통합 관리 — 계약/사용량/권한/결제/로그/티켓.

## 2. 사용자·권한

| 역할 | 권한 | 본 화면에서 |
|------|------|------------|
| operator_super | R/U/D/L | 모든 탭 + 비활성화 + 로그 조회 |
| operator_staff | R/U/L | 조회 + 일부 수정 (비활성화 불가) |

## 3. UI 요소

### 3-1. 헤더 영역 (모든 탭 공통)
- 회사명 + 도메인 (`{slug}.flowhr.kr`) + 상태 배지
- 핵심 카드 3개: 대표관리자 (이름/이메일/연락처), 계약 정보 (시작/종료/플랜), 사용량 (활성 직원 N/계약 N)
- 액션 버튼 그룹: 관리자 변경 / 요금제 변경 / 기능권한 수정 / 비활성화 / 청구내역 보기

### 3-2. 탭 (8개)
| 탭 | 내용 |
|----|------|
| 기본정보 | 회사명·사업자번호·대표자·업종·주소·도메인 (수정 가능, 감사 로그) |
| 사용자/조직 | 직원 수 + 부서 수 + 활성/비활성 분포 차트. 상세는 테넌트 화면에서 |
| 구독/요금제 | 현재 플랜 + 변경 이력 + 다음 갱신일 |
| 청구 | 최근 12개월 청구·수납 (OP-06 단일 테넌트 필터 뷰) |
| 기능권한 | 본 테넌트의 feature_flags (OP-07 일부 임베드) |
| 사용량 | 월별 활성 사용자 수, 출퇴근 기록 수, 휴가 신청 수 (차트) |
| 감사로그 | 본 테넌트의 audit_logs 필터 뷰 |
| 티켓 | 본 테넌트의 OP-08 티켓 필터 뷰 |

## 4. 액션

| 라벨 | 핸들러 | 비고 |
|------|--------|------|
| 관리자 변경 | `onChangeAdmin` | 새 이메일 입력 → 초대 |
| 요금제 변경 | `onChangePlan` | OP-05 플랜 선택 모달 |
| 기능권한 수정 | `onEditFeatureFlags` | 본 테넌트 예외 규칙 추가 (OP-07 일부 위임) |
| 비활성화 | `onDeactivate` | 사유 필수, 즉시 해당 테넌트 사용자 세션 무효화 |
| 청구내역 보기 | `onViewBilling` | OP-06 필터 진입 |
| 회사명 수정 | `onEditCompany` | 모달 → API |

## 5. 상태값

`tenants.status`는 OP-02와 동일. 본 화면에서 탭 전환은 `searchParams.tab` 사용 (브라우저 뒤로가기 보존).

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Tenant | R/U |
| Subscription | R/U |
| Invoice | R |
| Employee | R (count + breakdown) |
| FeatureFlag | R/U (테넌트 예외) |
| AuditLog | R (필터: tenant_id) |
| Ticket | R (필터: tenant_id) |

## 7. 연관 API

```
GET   /api/v1/operator/tenants/:id
PATCH /api/v1/operator/tenants/:id                          # 기본 정보 수정
GET   /api/v1/operator/tenants/:id/usage?period=12months
GET   /api/v1/operator/tenants/:id/feature-flags
PATCH /api/v1/operator/tenants/:id/feature-flags/:flagId    # 예외 토글
GET   /api/v1/operator/tenants/:id/audit-logs?page&filter
GET   /api/v1/operator/tenants/:id/tickets
POST  /api/v1/operator/tenants/:id/deactivate               # 사유 + 즉시 세션 무효화
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 테넌트 상세
  Background:
    Given operator_super 로그인
    And 임의의 활성 테넌트 T가 존재

  Scenario: 기본정보 탭 진입
    When /operator/tenants/T URL에 접근
    Then 헤더에 회사명·도메인·상태 + 3개 핵심 카드가 표시된다

  Scenario: 탭 전환 — 사용량
    Given 기본정보 탭을 보고 있다
    When "사용량" 탭 클릭
    Then URL이 ?tab=usage로 갱신되고 차트가 렌더된다
    And 브라우저 뒤로가기 시 기본정보 탭으로 복귀

  Scenario: 회사명 수정 + 감사 로그
    When 기본정보 탭에서 회사명 "AA → BB"로 변경 + 저장
    Then API PATCH 호출, tenants.name = BB
    And audit_logs에 actor + before=AA + after=BB 기록

  Scenario: 비활성화 → 즉시 세션 무효화
    When "비활성화" 클릭, 사유 "결제 미납" 입력, 확인
    Then tenants.status = inactive
    And 해당 테넌트의 모든 활성 세션이 무효화되어 로그인 페이지로 리다이렉트된다

  Scenario: 권한 음성 — operator_staff는 비활성화 비활성
    Given operator_staff 로그인
    When 테넌트 상세 진입
    Then "비활성화" 버튼이 비활성화되어 있다
```

## 9. 의존성

- **선행**: OP-02 (행 클릭)
- **참조**: OP-05 (요금제), OP-06 (청구), OP-07 (기능권한), OP-08 (티켓), OP-09 (감사로그)
- **이벤트**: 비활성화 시 Realtime broadcast → 해당 테넌트 사용자 세션 강제 종료
