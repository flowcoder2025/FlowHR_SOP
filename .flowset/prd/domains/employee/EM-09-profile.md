---
screen_id: EM-09
screen_name: 내 정보 / 프로필
role: [employee]
entities: [Employee, User, EmployeeChangeRequest]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#8-9
---

# EM-09 내 정보 / 프로필

## 1. 목적

본인 정보 조회 + 변경 요청 (이름·연락처·주소·계좌 등). 보안 설정(비밀번호 변경, 2FA, 프로필 사진).

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| employee | R/U 요청 본인 |

(직원이 직접 수정할 수 있는 필드와 HR 승인이 필요한 필드를 구분.)

## 3. UI 요소

### 3-1. 탭 7개
| 탭 | 직접 수정 가능 | 변경 요청 필요 |
|----|:------------:|:-----------:|
| 기본정보 | 프로필 사진, 닉네임 | 이름 |
| 연락처 | 휴대폰, 이메일 (인증) | — |
| 주소 | ✓ | — |
| 계좌 | — | ✓ (계좌번호, 2FA 재인증 필요) |
| 비상연락처 | ✓ | — |
| 가족정보 | — | ✓ (4대보험 영향) |
| 보안 | 비밀번호 변경, 2FA 설정 | — |

### 3-2. 변경 요청 흐름
1. 직원이 수정 후 "변경 요청"
2. HR 관리자에게 알림 + 결재 흐름
3. HR 승인 → 본 정보 갱신
4. HR 반려 → 사유 표시

### 3-3. 보안 탭
- 비밀번호 변경 (현재 비밀번호 + 새 비밀번호 + 확인)
- 2FA 설정 (TOTP QR + 복구 코드)
- 활성 세션 목록 + 강제 종료
- 최근 로그인 이력 (IP, 디바이스)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 직접 수정 (주소 등) | `onUpdate` (즉시 반영) |
| 변경 요청 (이름·계좌 등) | `onRequestChange` (결재 흐름) |
| 비밀번호 변경 | `onChangePassword` |
| 2FA 활성화 | `onEnable2FA` |
| 프로필 사진 변경 | `onUploadAvatar` |

## 5. 상태값

`EmployeeChangeRequest.status`: pending / approved / rejected

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Employee | RU 본인 (일부 즉시) |
| User | RU 본인 (보안 설정) |
| EmployeeChangeRequest | CRU (변경 요청) |

## 7. 연관 API

```
GET   /api/v1/me/profile
PATCH /api/v1/me/profile                     # 즉시 수정 (허용된 필드만)
POST  /api/v1/me/profile/change-requests     # HR 승인 필요한 변경
GET   /api/v1/me/profile/change-requests
POST  /api/v1/me/security/change-password
POST  /api/v1/me/security/2fa/enable
POST  /api/v1/me/security/2fa/verify
POST  /api/v1/me/security/2fa/disable
GET   /api/v1/me/security/sessions
DELETE /api/v1/me/security/sessions/:id
POST  /api/v1/me/avatar
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 내 정보 / 프로필
  Background:
    Given employee 한직원 로그인

  Scenario: 주소 직접 수정
    When 주소 탭에서 새 주소 입력 + 저장
    Then employees.address 즉시 갱신
    And audit_logs 기록

  Scenario: 계좌 변경 — 2FA 재인증 + HR 승인
    When 계좌 탭에서 계좌번호 변경 시도
    Then 2FA 재인증 모달 → 통과 후 "변경 요청" 제출
    And EmployeeChangeRequest INSERT (field=bank_account, status=pending)
    And HR 알림
    When HR 승인
    Then 계좌 갱신, 직원 알림

  Scenario: 비밀번호 변경
    When "비밀번호 변경" → 현재/새 비밀번호 입력
    Then 정책 검증 (10자+ 영대소문자+숫자+특수)
    And 통과 시 변경, 모든 다른 세션 무효화

  Scenario: 2FA 활성화
    When "2FA 활성화" → QR 표시 + 6자리 코드 입력
    Then users.totp_enabled=true, 복구 코드 8개 발급

  Scenario: 활성 세션 강제 종료
    When 세션 목록에서 다른 디바이스 세션 → "종료"
    Then 해당 세션 무효화
```

## 9. 의존성

- **선행**: CM-04 (2FA 인프라)
- **연계**: TA-03 (HR가 변경 요청 처리), CM-14 (감사 로그)
- **외부**: Supabase Auth (비밀번호/2FA 관리)
