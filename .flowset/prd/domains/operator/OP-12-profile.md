---
screen_id: OP-12
screen_name: 운영사 본인 프로필
role: [operator_super, operator_staff]
entities: [User, OperatorUser, UserConsent]
platforms: [web, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#9-2 (KI-029 보강 — spec 미반영, 09-routing.md §6-1 참조)
---

# OP-12 운영사 본인 프로필

> KI-029 보강 (2026-05-15). spec §6은 운영사 11 화면(OP-01~11)만 정의하고 운영사 본인 화면을 누락. 직원 EM-09 동등 + 운영사 보안 강화.

## 1. 목적

운영사 사용자(operator_super / operator_staff)가 본인 계정 정보 + 보안 + 알림 설정을 관리. 직원 EM-09와 구조 동등하나 다음 운영사 특수 정책 추가:
- 2FA 강제 (가입 직후 + 미설정 시 로그인 후 우회 불가)
- 활성 세션 강제 종료 강화 (operator_super는 자기 외 모든 운영사 세션 종료 가능)
- 한국 관리자 + 외국 관리자 IP 패턴 학습 (이상 로그인 알림)

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| operator_super | R/U 본인 + 다른 운영사 사용자 세션 강제 종료 + 권한 부여 (OP-11 SystemSetting > Operators 탭과 분리) |
| operator_staff | R/U 본인만 |

## 3. UI 요소

### 3-1. 탭 5개

| 탭 | 직접 수정 가능 | 비고 |
|----|------------|------|
| 기본정보 | 프로필 사진, 닉네임, 표시 이름 | 이름은 OP-11 super 변경만 가능 |
| 연락처 | 휴대폰 (인증), 이메일 (변경 시 재인증) | 이메일 변경 시 새 메일 검증 후 적용 |
| 보안 | 비밀번호 변경, 2FA 설정/재발급, 복구 코드 재발급, 활성 세션 + 강제 종료, 최근 로그인 이력 | **2FA 비활성화 불가 (운영사 강제)** |
| 알림 | 채널 토글 (이메일/푸시/카카오/SMS), 알림 카테고리 설정 (티켓/시스템/감사) | 운영사 시스템 알림은 OFF 불가 |
| 활동 | 최근 30일 본인 액션 로그 (audit_logs.actor_id=self) | 다운로드(Excel) 가능 |

### 3-2. 보안 탭 상세

```
[비밀번호]
- 현재 비밀번호 + 새 비밀번호 + 확인
- 정책: 12자+ 영대소문자+숫자+특수 (직원 10자+보다 강화)
- 변경 시 모든 다른 세션 무효화

[2단계 인증]
- TOTP QR + 6자리 코드 검증
- 복구 코드 8개 (다운로드 / 인쇄)
- 재발급: 기존 복구 코드 모두 무효
- 비활성화 버튼 — operator_super 본인은 노출 (단, 다른 super 1명 이상 활성 필수), staff는 숨김

[활성 세션]
- 디바이스 / IP / 위치 추정 / 최근 활동 시각
- 본인 세션 종료 + 다른 세션 종료 (현재 세션은 별도 표시)
- operator_super: 다른 운영사 사용자 세션도 종료 가능 (별도 모달)

[로그인 이력]
- 최근 50건: 시각, IP, User-Agent, 결과(성공/실패), 위치
- 이상 로그인 (해외 IP / 새 디바이스) 강조 표시
```

### 3-3. 알림 탭 상세

| 카테고리 | 채널 토글 | 강제 |
|---------|---------|------|
| 신규 티켓 (OP-08) | 이메일/푸시/카카오 | 푸시 강제 (운영 모드) |
| 결제 실패 (OP-06) | 이메일/SMS | 이메일 강제 |
| 시스템 점검 (OP-11 maintenance) | 이메일 | 강제 |
| 감사 이벤트 (OP-09) | 이메일 | super만 강제 |
| 신규 가입 (OP-04) | 이메일 | 선택 |

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 프로필 사진 변경 | `onUploadAvatar` (CM-09 파일 업로드 호출) |
| 닉네임 / 표시 이름 수정 | `onUpdateProfile` |
| 이메일 변경 | `onChangeEmail` (재인증 필요) |
| 휴대폰 변경 | `onChangePhone` (SMS 인증) |
| 비밀번호 변경 | `onChangePassword` |
| 2FA 활성화 | `onEnable2FA` |
| 2FA 재발급 | `onRegenerate2FA` |
| 복구 코드 재발급 | `onRegenerateRecoveryCodes` |
| 세션 강제 종료 (본인) | `onTerminateSession(sid)` |
| 세션 강제 종료 (타 운영사 사용자) | `onForceLogoutOperator(uid)` (super only) |
| 알림 채널 토글 | `onToggleNotification(channel, enabled)` |
| 활동 로그 다운로드 | `onExportAuditLog` (CM-12 엑셀 내보내기) |
| 투어 다시 보기 | CM-22 재실행 |

## 5. 상태값

- `users.totp_enabled`: true (운영사는 강제)
- `users.last_password_change_at`
- `users.first_login_at`
- `auth.sessions.*`: Supabase 세션
- `audit_logs.actor_id`: 본인 액션 추적

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| User | RU 본인 (보안 설정 일부 즉시) |
| OperatorUser | RU 본인 + super는 다른 operator R 일부 |
| UserConsent | R 본인 (약관 동의 이력) |
| AuditLog | R 본인 (actor_id=self) |
| Notification | R 본인 (알림 설정용 카운트) |

## 7. 연관 API

```
GET    /api/v1/operator/me/profile
PATCH  /api/v1/operator/me/profile                    # 즉시 수정 (닉네임/연락처)
POST   /api/v1/operator/me/avatar                     # CM-09 호출
POST   /api/v1/me/security/change-password            # 공통 (직원과 동일)
POST   /api/v1/me/security/2fa/enable                 # 공통
POST   /api/v1/me/security/2fa/verify                 # 공통
POST   /api/v1/me/security/2fa/regenerate             # 신규 (운영사 전용)
GET    /api/v1/me/security/sessions                   # 공통
DELETE /api/v1/me/security/sessions/:id               # 공통
POST   /api/v1/operator/users/:id/force-logout        # 신규 (super only)
GET    /api/v1/me/notifications/preferences
PATCH  /api/v1/me/notifications/preferences
GET    /api/v1/me/audit-logs?days=30                  # 본인 활동
GET    /api/v1/me/consents                            # 약관 동의 이력
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 운영사 본인 프로필
  Background:
    Given operator_super 김운영 로그인

  Scenario: 운영사 강제 2FA — 미설정 시 로그인 후 차단
    Given operator_super 박오퍼가 2FA 미설정 상태
    When 박오퍼 로그인 시도
    Then /operator/me/profile?tab=security&forced=2fa 자동 리다이렉트
    And "운영사 계정은 2FA 활성화가 필수입니다" 안내
    When TOTP 활성화 + 6자리 검증
    Then 원래 가려던 화면으로 복귀

  Scenario: super는 staff 세션 강제 종료
    Given operator_staff 박오퍼가 활성 세션 보유
    When 김운영 → /operator/me/profile → 보안 탭 → "다른 운영사 사용자 세션 관리"
    Then 박오퍼 세션 목록 표시
    When "강제 종료" 클릭
    Then 박오퍼 세션 무효화 + audit_logs INSERT (action=force_logout, actor=김운영, target=박오퍼)
    And 박오퍼 다음 요청 시 /login 리다이렉트

  Scenario: super 본인 2FA 비활성화 시도 (다른 super 0명)
    Given 김운영이 유일한 operator_super
    When "2FA 비활성화" 버튼 클릭
    Then 모달 "다른 operator_super가 1명 이상 필요합니다" + 비활성화 차단
    And 버튼 disabled

  Scenario: 활동 로그 다운로드
    When "활동 탭" → "엑셀 다운로드 (최근 30일)"
    Then audit_logs WHERE actor_id=self AND created_at >= now()-30d
    And xlsx 생성 (CM-12) → Signed URL 다운로드
```

## 9. 의존성

- **선행**: CM-04 (2FA 인프라), CM-09 (파일 업로드), CM-12 (엑셀 내보내기)
- **연계**: OP-11 (운영사 사용자 관리 — super가 staff 추가), CM-14 (감사 로그), CM-15 (알림 설정)
- **외부**: Supabase Auth (세션·비밀번호·TOTP 관리)
- **차이점 (EM-09 대비)**: 비밀번호 정책 강화(12자+), 2FA 강제, super가 타 operator 세션 종료, 운영사 시스템 알림 OFF 불가

## 10. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 운영사 본인 프로필 명세 | KI-029 batch-003 |
