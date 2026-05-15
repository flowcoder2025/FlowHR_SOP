---
screen_id: OP-05
screen_name: 구독/요금제 관리
role: [operator_super, operator_staff]
entities: [Plan, Subscription, FeatureFlag]
platforms: [web, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#6-5
---

# OP-05 구독/요금제 관리

## 1. 목적

운영사가 판매하는 요금제(Plan)와 각 플랜의 모듈 제공 범위를 마스터 관리. 테넌트별 구독(Subscription)은 OP-03에서 변경하지만, 플랜 자체는 본 화면에서.

## 2. 사용자·권한

| 역할 | 권한 | 본 화면에서 |
|------|------|------------|
| operator_super | C/R/U/D/S | 전권 |
| operator_staff | R | 조회만 |

## 3. UI 요소

### 3-1. 테이블 (Plan 목록)
| 컬럼 | 정렬 |
|------|-----|
| 요금제명 | ✓ |
| 기본요금 (월) | ✓ |
| 인당요금 (월) | ✓ |
| 포함 인원 (기본요금에 포함된 인원) | — |
| 제공 모듈 | — (배지 나열: 근태/휴가/결재/급여/문서/외부연동) |
| 사용 테넌트 수 | ✓ |
| 상태 | ✓ (활성/비활성/판매중지/커스텀) |
| 액션 | — (수정/복제/비활성화) |

### 3-2. 필터
- 상태: 활성 / 비활성 / 판매중지 / 커스텀
- 공개여부: 일반 공개 / 비공개 (영업 전용)
- 요금제 유형: 표준 / 커스텀

### 3-3. 액션 버튼
- "요금제 생성" CTA
- "모듈 권한 설정" (글로벌 — OP-07로 이동)

### 3-4. 플랜 생성/수정 모달
- 입력: 요금제명, 슬러그(URL용), 기본요금, 인당요금, 포함 인원, 모듈 토글, 공개 여부, 정렬 순서
- 모듈 토글: 근태/휴가/결재/급여/문서/외부연동/리포트/감사로그
- 검증: 슬러그 중복, 가격 ≥ 0, 인원 ≥ 1

## 4. 액션

| 라벨 | 핸들러 | 비고 |
|------|--------|------|
| 요금제 생성 | `onCreatePlan` | 모달 → POST |
| 복제 | `onClonePlan` | 기존 플랜 복사 + 이름에 "(복사)" 접미 |
| 수정 | `onUpdatePlan` | 모달 → PATCH (사용 중인 플랜은 가격 변경 시 다음 청구일부터 적용 안내) |
| 비활성화 | `onDeactivate` | 새 구독 막음, 기존 구독은 유지 |
| 커스텀 플랜 생성 | `onCreateCustom` | OP-04 등록 중 호출되며 본 화면에 노출 |

## 5. 상태값

| Plan.status | 설명 |
|-----------|------|
| active | 활성 — 신규 구독 가능 |
| inactive | 비활성 — 새 구독 불가, 기존 구독 유지 |
| sales_stopped | 판매중지 — 비공개 + 새 구독 불가 |
| custom | 커스텀 — 특정 테넌트 전용 |

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Plan | CRUD |
| Subscription | R (사용 테넌트 수 카운트) |
| FeatureFlag | R (플랜별 제공 모듈) |

## 7. 연관 API

```
GET    /api/v1/operator/plans?filter[status]
POST   /api/v1/operator/plans
PATCH  /api/v1/operator/plans/:id
DELETE /api/v1/operator/plans/:id          # = soft delete (status=inactive)
POST   /api/v1/operator/plans/:id/clone
GET    /api/v1/operator/plans/:id/usage    # 사용 테넌트 수 + 직원 합계
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 구독/요금제 관리
  Background:
    Given operator_super 로그인

  Scenario: 신규 플랜 생성
    When "요금제 생성" 클릭
    And 이름="프리미엄", 기본요금=500000, 인당요금=3500, 포함인원=10, 모듈=전체 입력
    And 저장
    Then plans INSERT 성공, 목록에 표시

  Scenario: 사용 중인 플랜 가격 변경
    Given "기본" 플랜이 10개 테넌트에 적용 중
    When 인당요금을 2500 → 3000으로 변경
    Then 모달에 "다음 청구일부터 적용됩니다" 경고 표시
    And 저장 후 plans.price 갱신, 기존 subscriptions의 latched_price는 변경 안 됨

  Scenario: 플랜 비활성화
    When 사용 중인 플랜의 액션 메뉴에서 "비활성화"
    Then status=inactive
    And 기존 구독은 유지되나 OP-04에서 신규 선택 불가

  Scenario: 권한 음성 — operator_staff
    Given operator_staff 로그인
    Then "요금제 생성" 버튼이 표시되지 않음
```

## 9. 의존성

- **선행**: OP-01, OP-02
- **연계**: OP-04 (등록 시 플랜 선택), OP-03 (테넌트별 변경), OP-07 (모듈 권한 토글), OP-06 (청구 계산)
