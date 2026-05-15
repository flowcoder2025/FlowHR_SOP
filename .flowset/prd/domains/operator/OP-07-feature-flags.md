---
screen_id: OP-07
screen_name: 기능 플래그 / 모듈 권한
role: [operator_super, operator_staff]
entities: [FeatureFlag, Tenant, Plan]
platforms: [web, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#6-7
---

# OP-07 기능 플래그 / 모듈 권한

## 1. 목적

전체/요금제/테넌트별로 기능 사용 권한을 토글. 베타 기능 점진 출시, 특정 테넌트 임시 예외, 모듈별 ON/OFF.

## 2. 사용자·권한

| 역할 | 권한 | 본 화면에서 |
|------|------|------------|
| operator_super | C/R/U/D/S/L | 전권 + 변경 이력 |
| operator_staff | R/U/L | 조회 + 토글 (생성·삭제 불가) |
| tenant_super | R 일부 | 자기 테넌트에 적용된 플래그만 조회 (TA-13에서) |

## 3. UI 요소

### 3-1. 테이블 (8 컬럼)
| 컬럼 |
|------|
| 기능명 (한글 라벨) |
| 모듈 (근태/휴가/결재/급여/문서/외부연동/시스템) |
| 글로벌 상태 (ON/OFF/베타) |
| 제공 플랜 (배지) |
| 예외 테넌트 수 |
| 베타 여부 |
| 적용일 |
| 액션 |

### 3-2. 필터
- 모듈
- 상태 (활성/비활성/베타/제한)
- 베타 여부

### 3-3. 액션
- "기능 추가" CTA (operator_super만)
- 글로벌 ON/OFF 토글
- 예외 설정 모달 (특정 테넌트 강제 ON/OFF)
- 변경 이력 보기

### 3-4. 기능 추가/수정 모달
- 키 (slug, 영문 snake_case, 예: `electronic_contract`)
- 한글 라벨
- 설명
- 모듈
- 글로벌 기본값 (ON/OFF/베타)
- 제공 플랜 (멀티 선택)
- 베타 표시

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 기능 추가 | `onCreateFlag` |
| 글로벌 토글 | `onToggleGlobal` |
| 예외 설정 | `onSetException` (테넌트 선택 + ON/OFF) |
| 변경 이력 | `onViewHistory` |

## 5. 상태값

| FeatureFlag.global_state | 의미 |
|------------------------|------|
| active | 전 테넌트 (지원 플랜 한정) 사용 가능 |
| inactive | 모두 비활성 |
| beta | 명시 옵트인한 테넌트만 |
| restricted | 일부 플랜만 |

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| FeatureFlag | CRUD |
| Tenant | R (예외 설정 대상) |
| Plan | R (제공 플랜 매핑) |
| FeatureFlagOverride | CRUD (테넌트별 예외) |

## 7. 연관 API

```
GET   /api/v1/operator/feature-flags
POST  /api/v1/operator/feature-flags
PATCH /api/v1/operator/feature-flags/:key                  # 글로벌 상태/플랜 변경
DELETE /api/v1/operator/feature-flags/:key                 # 삭제 (사용 중이면 차단)
POST  /api/v1/operator/feature-flags/:key/overrides        # 테넌트 예외 추가
DELETE /api/v1/operator/feature-flags/:key/overrides/:tid
GET   /api/v1/operator/feature-flags/:key/history          # 변경 이력
GET   /api/v1/feature-flags?context=tenant_id              # 클라이언트 평가용 (공개)
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 기능 플래그
  Background:
    Given operator_super 로그인

  Scenario: 신규 기능 추가
    When "기능 추가" 클릭, key="dark_mode", 라벨="다크 모드", 글로벌=베타, 플랜=프리미엄 입력
    And 저장
    Then feature_flags INSERT 성공, 프리미엄 플랜 테넌트 중 베타 옵트인 테넌트만 사용 가능

  Scenario: 테넌트 예외 설정
    Given dark_mode 플래그가 글로벌=비활성
    When 예외 설정에서 테넌트 T 선택, ON 적용
    Then feature_flag_overrides에 (key, tenant_id=T, value=true) 행 추가
    And T의 클라이언트가 다크 모드 기능 사용 가능

  Scenario: 변경 이력 추적
    Given dark_mode 글로벌을 active → inactive로 변경
    When 변경 이력 보기 클릭
    Then 이전 값/새 값/변경자/시각이 표시된다

  Scenario: 권한 음성 — staff는 생성 불가
    Given operator_staff 로그인
    Then "기능 추가" 버튼 비활성

  Scenario: 클라이언트 평가
    Given 테넌트 T가 로그인
    When 클라이언트가 GET /api/v1/feature-flags 호출
    Then T에 적용되는 플래그 목록 (글로벌 + 플랜 + 예외 머지) 반환
```

## 9. 의존성

- **선행**: OP-01
- **연계**: OP-03 (테넌트별 예외), OP-05 (플랜 모듈), 모든 클라이언트(런타임 평가)
- **이벤트**: 플래그 변경 시 broadcast → 영향 테넌트 클라이언트가 다음 액션에서 즉시 반영
