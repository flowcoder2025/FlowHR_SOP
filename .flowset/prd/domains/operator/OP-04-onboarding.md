---
screen_id: OP-04
screen_name: 신규 테넌트 등록/온보딩
role: [operator_super, operator_staff]
entities: [Tenant, Subscription, Plan, User, FeatureFlag, TenantSetting]
platforms: [web, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#6-4
---

# OP-04 신규 테넌트 등록 / 온보딩

## 1. 목적

신규 고객사를 7단계 마법사로 생성 + 최초 운영 세팅(조직도/근무제/휴가/결재라인/문서양식)까지 완료. 운영사 핵심 가치 제안의 시작점.

## 2. 사용자·권한

| 역할 | 권한 | 본 화면에서 |
|------|------|------------|
| operator_super | C/R/U/N | 전 단계 + 초대 발송 |
| operator_staff | C/R/U/N | 전 단계 + 초대 발송 |

## 3. UI 요소

### 3-1. 마법사 7단계 (좌측 stepper)

| # | 단계 | 입력 / 액션 |
|---|------|-----------|
| 1 | 회사정보 | 회사명, 사업자번호, 대표자, 업종, 주소, 연락처, 로고 업로드 |
| 2 | 도메인 | `{slug}.flowhr.kr` 슬러그 선택 (실시간 중복 검증) |
| 3 | 요금제 | 플랜 선택 (기본/프리미엄/커스텀), 계약 시작/종료일, 계약 인원 |
| 4 | 관리자 계정 | 대표관리자 이름, 이메일, 연락처, 추가 관리자 (최대 3명) |
| 5 | 모듈 선택 | 사용할 모듈 토글 (근태/휴가/결재/급여/문서/외부연동) |
| 6 | 초기 데이터 | 부서 트리, 근무정책, 휴가정책, 결재라인, 문서양식 입력/업로드 |
| 7 | 완료 / 검토 | 모든 입력 요약 + 등록 완료 버튼 + 초대 발송 |

### 3-2. 검증 (실시간)
- 사업자번호: 형식 (`\d{3}-\d{2}-\d{5}`) + 중복 검사
- 도메인 슬러그: 형식 (`[a-z0-9-]{3,30}`) + 중복 + 예약어 차단 (admin, api, www 등)
- 관리자 이메일: 형식 + 중복 (다른 테넌트의 관리자와 동일 이메일 차단)
- 계약 인원: ≥ 1, 계약 시작일 < 종료일
- 필수값 누락: 다음 단계 버튼 비활성

### 3-3. 액션
- 이전 / 다음 (단계 이동)
- 임시저장 (브라우저 localStorage + 서버 draft)
- 검증 (현재 단계 즉시 검증)
- 등록 완료 (마지막 단계)
- 초대 발송 (관리자 이메일로)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 임시저장 | `onSaveDraft` — 단계 정보 → tenants_drafts 테이블 |
| 다음 | `onNext` — 현재 단계 검증 통과 시 |
| 등록 완료 | `onSubmit` — 트랜잭션: tenants INSERT + subscription INSERT + admin user INVITE + tenant_settings INSERT |
| 초대 발송 | `onSendInvite` — Supabase Auth admin invite |

## 5. 상태값

마법사 자체 상태:
- `step`: 1~7
- `draftId`: 임시저장 시 부여, 재진입 시 복원
- `submitting`: true/false
- 최종 결과: `success | partial (감사 로그에 부분 실패 기록) | failed`

`tenants.status` 생성 시 = `active` (기본). 계약 시작일이 미래면 = `scheduled`.

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Tenant | C |
| Subscription | C |
| Plan | R |
| User | C (관리자 초대) |
| FeatureFlag | C (모듈 선택 결과) |
| TenantSetting | C (초기 데이터) |
| Department | C (부서 트리) |
| WorkPolicy | C |
| LeaveType | C |
| ApprovalLine | C |
| DocumentTemplate | C |

## 7. 연관 API

```
GET    /api/v1/operator/plans                              # 플랜 목록
POST   /api/v1/operator/tenants/check-domain               # 슬러그 중복 검증
POST   /api/v1/operator/tenants/check-business-number      # 사업자번호 중복
POST   /api/v1/operator/tenants/drafts                     # 임시저장 (upsert)
GET    /api/v1/operator/tenants/drafts/:draftId
DELETE /api/v1/operator/tenants/drafts/:draftId
POST   /api/v1/operator/tenants                            # 최종 등록 (트랜잭션)
POST   /api/v1/operator/tenants/:id/send-invite            # 추가 초대 발송
```

응답 envelope + 검증 실패 시 `fields` 객체로 필드별 오류 반환.

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 신규 테넌트 등록 7단계 마법사
  Background:
    Given operator_super 로그인

  Scenario: 정상 7단계 완료
    When 1단계에서 회사정보 입력 + 다음
    And 2단계에서 슬러그 "chicken-shop" 입력 (중복 없음) + 다음
    And 3단계에서 기본 플랜 + 12개월 계약 + 30명 + 다음
    And 4단계에서 관리자 이름·이메일·연락처 + 다음
    And 5단계에서 근태/휴가/결재/급여 모듈 선택 + 다음
    And 6단계에서 부서 3개·근무정책·휴가정책·결재라인·문서양식 입력 + 다음
    And 7단계에서 검토 후 "등록 완료" 클릭
    Then 트랜잭션 성공, tenants/subscriptions/tenant_settings/users INSERT
    And 관리자 이메일로 초대 메일 발송
    And OP-02 테넌트 목록으로 이동 + 신규 행 노출

  Scenario: 슬러그 중복
    Given 2단계 진입
    When 슬러그 "existing-tenant" 입력 (이미 존재)
    Then 입력창 아래 "이미 사용 중인 도메인입니다" 즉시 표시
    And "다음" 버튼 비활성

  Scenario: 사업자번호 형식 오류
    Given 1단계 진입
    When 사업자번호에 "123456" (형식 위반) 입력
    Then "사업자등록번호 형식이 올바르지 않습니다" 표시

  Scenario: 임시저장 → 재진입
    Given 3단계까지 입력 후 "임시저장" 클릭
    When 페이지 이탈 후 OP-02에서 "임시저장 1건" 알림 클릭
    Then OP-04 3단계부터 복원되어 진입

  Scenario: 등록 도중 트랜잭션 실패 (관리자 이메일 발송 실패)
    Given 7단계에서 모든 입력 완료
    When "등록 완료" 클릭, 이메일 발송 단계에서 실패
    Then tenants는 INSERT됐지만 status=pending_invite로 설정
    And 사용자에게 "테넌트는 생성되었으나 초대 메일 발송 실패. 재시도 버튼을 누르세요" 안내
    And 7단계 "초대 발송" 버튼이 표시되어 재시도 가능

  Scenario: 권한 음성 — tenant 사용자 접근
    Given tenant_super 로그인
    When /operator/tenants/new URL 직접 접근
    Then 403 응답
```

## 9. 의존성

- **선행**: OP-02 ("신규 테넌트 등록" CTA)
- **후행**: 등록 완료 시 OP-02 (목록), CM-03 (초대받은 관리자가 활성화)
- **외부**: Supabase Auth admin API (초대 발송), 이메일 SMTP (Supabase 기본)
- **이벤트**: 트랜잭션 완료 시 broadcast → OP-01 KPI 갱신
