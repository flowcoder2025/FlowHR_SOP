---
screen_id: OP-11
screen_name: 시스템 설정
role: [operator_super, operator_staff]
entities: [SystemSetting, OperatorUser, MaintenanceWindow]
platforms: [web, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#6-11
---

# OP-11 시스템 설정

## 1. 목적

플랫폼 전역 설정 관리 — 운영사 계정, 보안 정책, 메일/알림 발송 채널, API 키, 데이터 보관, 백업, 점검 모드.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| operator_super | C/R/U/S/L (전권) |
| operator_staff | R 일부 (계정 정보 일부, 백업 트리거 등은 불가) |

## 3. UI 요소

### 3-1. 탭 (9개)
| 탭 | 내용 |
|----|------|
| 기본정보 | 운영사 회사명, 로고, 연락처, 사업자 정보 |
| 운영자 계정 | operator_super / operator_staff 목록 + 초대 + 2FA 강제 |
| 보안 | 비밀번호 정책, 잠금 정책, 세션 만료, 2FA 강제 여부 |
| 메일 | SMTP (Supabase 기본 사용 / 자체 설정), 발신자 주소, 템플릿 |
| 알림 | 카카오 알림톡 채널 정보, NHN Cloud API 키, SMS 채널, FCM 키 |
| API | 운영사 API 키 (외부 도구용, 멀티 키 + 만료일) |
| 데이터 보관 | audit_logs / attendances / leaves 보관 기간 |
| 백업 | 자동 백업 일정 + 수동 백업 트리거 + 백업 이력 |
| 점검모드 | 점검 토글 + 표시 메시지 + 예약 점검 |

### 3-2. 액션 (탭 공통)
- 저장 (변경 시 활성)
- 테스트 발송 (메일/알림 탭에서 즉시 발송 테스트)
- 백업 실행 (백업 탭)
- 점검 모드 ON/OFF (점검 탭)

### 3-3. 점검 모드 활성화 흐름
1. 점검 토글 ON
2. 표시 메시지 입력 (한글)
3. 예약 시각 (선택) 또는 즉시
4. 확인 모달: 영향 받는 테넌트 / 활성 세션 수 표시
5. 확정 → 모든 비-operator 사용자가 CM-06 점검 화면으로 리다이렉트

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 저장 | `onSaveSettings` (탭별) |
| 테스트 발송 (메일) | `onTestEmail` |
| 테스트 발송 (알림톡) | `onTestKakao` |
| 백업 실행 | `onTriggerBackup` |
| 점검 모드 토글 | `onToggleMaintenance` |
| 운영자 초대 | `onInviteOperator` |
| API 키 발급 | `onGenerateApiKey` |
| API 키 폐기 | `onRevokeApiKey` |

## 5. 상태값

| MaintenanceMode.status | 의미 |
|---------------------|------|
| inactive | 정상 운영 |
| scheduled | 예약된 점검 (시작 전) |
| active | 점검 중 |

| BackupJob.status |
|-----------------|
| pending / running / success / failed |

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| SystemSetting | CRUDS |
| OperatorUser | CRUD (operator_super, operator_staff 관리) |
| MaintenanceWindow | CRUD |
| BackupJob | CR |
| ApiKey | CRUD |

## 7. 연관 API

```
GET   /api/v1/operator/system-settings
PATCH /api/v1/operator/system-settings           # 탭별 patch
POST  /api/v1/operator/system-settings/test-email
POST  /api/v1/operator/system-settings/test-kakao
POST  /api/v1/operator/system-settings/backup    # 수동 백업 트리거
GET   /api/v1/operator/backup-jobs
POST  /api/v1/operator/maintenance/toggle
POST  /api/v1/operator/maintenance/schedule
GET   /api/v1/operator/users                     # 운영자 목록
POST  /api/v1/operator/users/invite
DELETE /api/v1/operator/users/:id
POST  /api/v1/operator/api-keys
DELETE /api/v1/operator/api-keys/:id
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 시스템 설정
  Background:
    Given operator_super 로그인

  Scenario: 비밀번호 정책 변경
    Given 보안 탭 진입
    When 최소 길이 = 8 → 10 변경, 저장
    Then SystemSetting.password_min_length=10 저장
    And audit_logs에 setting.update 기록

  Scenario: 운영자 초대
    Given 운영자 계정 탭
    When "초대" 클릭, 이메일/역할(staff) 입력
    Then 초대 메일 발송, 7일 만료 토큰

  Scenario: 점검 모드 활성화
    Given 점검 탭에서 메시지 입력, "즉시" 선택
    When 확인 모달에서 "확정"
    Then 모든 비-operator 사용자의 다음 요청부터 503 + 점검 화면 응답
    And operator는 정상 접근 가능

  Scenario: 점검 모드 예약
    When 예약 시각 = 2026-05-18 02:00 입력, 메시지 입력
    Then 예약 등록, 시각 도달 시 자동 활성화

  Scenario: 백업 수동 실행
    When "백업 실행" 클릭
    Then BackupJob INSERT (status=pending), 백그라운드에서 실행
    And 완료/실패 시 운영사에게 알림

  Scenario: 권한 음성 — staff
    Given operator_staff 로그인
    Then "운영자 초대" 버튼 비활성
    And 점검 토글 비활성

  Scenario: 운영자 2FA 강제
    Given Settings.require_operator_2fa=true
    When 2FA 미설정 운영자가 로그인
    Then 다음 화면에서 2FA 설정 강제 + 우회 불가
```

## 9. 의존성

- **외부**: SMTP 서버 (Supabase 또는 자체), NHN Cloud API, Supabase 백업 API
- **연계**: CM-06 (점검 화면 표시), OP-09 (변경 감사 로그)
- **자동 작업**: 일일 자동 백업 (cron via Edge Function), 매주 일요일 03:00
