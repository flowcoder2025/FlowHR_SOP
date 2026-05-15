---
screen_id: TA-14
screen_name: 외부 연동
role: [tenant_super, tenant_hr_admin]
entities: [Integration, ApiKey]
platforms: [web, desktop_tauri]
mvp: partial
mvp_note: "MVP는 카카오 알림톡 + SMS + 이메일만. Google Calendar/Slack/SSO/출퇴근기기/회계는 v1.2"
spec_ref: docs/FlowHR_screen_spec_v_1.md#7-14
---

# TA-14 외부 연동

## 1. 목적

회사의 외부 시스템과 FlowHR를 연결. MVP는 알림 채널 (카카오/SMS/이메일)만, 나머지는 v1.2+.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| tenant_super | CRUD/S/L |
| tenant_hr_admin | R/U 일부 (인증 정보는 super만) |
| 그 외 | X |

## 3. UI 요소

### 3-1. 연동 항목 카드 그리드
| 연동 | MVP | 비고 |
|------|:---:|------|
| 카카오 알림톡 | ✓ | NHN Cloud (사전 채널 인증 필수) |
| SMS | ✓ | NHN Cloud |
| SMTP (이메일) | ✓ | Supabase 기본 / 자체 SMTP |
| 전자계약 | — | v1.2 (모두싸인 등) |
| Google Calendar | — | v1.2 (휴가 일정 sync) |
| Slack | — | v1.2 (알림 sync) |
| 출퇴근 기기 (NFC/지문) | — | v1.3 (SDK 별) |
| 급여/회계 시스템 | — | v1.2~v2.0 |
| SSO (SAML/OIDC) | — | v1.2 |
| API Key | ✓ | 외부 도구가 FlowHR API 호출 |
| Webhook | — | v1.3 (이벤트 외부 발송) |

### 3-2. 카드 표시
- 연동명 + 로고
- 상태 (연결됨 / 연결안됨 / 오류 / 인증만료)
- 마지막 동기화 시각
- 실패 카운트 (24h)
- 액션: 연결 / 해제 / 테스트 / 로그 보기 / API Key 재발급

### 3-3. 카카오 알림톡 연결 흐름
1. NHN Cloud에서 발급받은 API Key + Secret + 채널 ID 입력
2. 사전 승인받은 템플릿 키 목록 조회
3. "테스트 발송" → tenant_super의 카카오톡으로 샘플
4. 통과 시 활성화 → 모든 알림이 인앱/푸시 30분 미열람 시 카카오 폴백 활성

### 3-4. API Key 관리
- 키 발급 (super만, 사유 입력)
- 키 권한 범위 (read-only / write / 특정 도메인만)
- 만료일 (기본 1년)
- 사용 로그 (호출 수 / 마지막 호출)
- 폐기

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 연결 | `onConnect` (모달별 설정) |
| 해제 | `onDisconnect` |
| 테스트 발송 | `onTest` |
| 로그 보기 | `onViewLogs` |
| API Key 발급 | `onIssueApiKey` |
| API Key 폐기 | `onRevokeApiKey` |
| API Key 재발급 | `onRotateApiKey` |

## 5. 상태값

| Integration.status |
|------------------|
| disconnected / connected / error / expired |

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Integration | CRUD |
| ApiKey | CRUD |
| IntegrationLog | R |

## 7. 연관 API

```
GET   /api/v1/tenant/integrations
POST  /api/v1/tenant/integrations/:type/connect             # type=kakao|sms|smtp|...
POST  /api/v1/tenant/integrations/:type/disconnect
POST  /api/v1/tenant/integrations/:type/test
GET   /api/v1/tenant/integrations/:type/logs?from&to&page
GET   /api/v1/tenant/api-keys
POST  /api/v1/tenant/api-keys                               # 발급 (super만)
DELETE /api/v1/tenant/api-keys/:id
POST  /api/v1/tenant/api-keys/:id/rotate
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 외부 연동 — 카카오 알림톡
  Background:
    Given tenant_super 로그인

  Scenario: 카카오 알림톡 연결
    When TA-14 → 카카오 알림톡 카드 → "연결"
    And API Key/Secret/채널ID 입력 + "테스트 발송"
    Then 본인의 카카오로 샘플 도착
    When "활성화"
    Then integrations.status=connected
    And 모든 알림의 카카오 폴백이 활성됨

  Scenario: 연결 실패 — 잘못된 키
    Given 잘못된 API Key 입력 + "테스트"
    Then NHN Cloud API 401 → integrations.status=error
    And 사용자에게 "인증 실패" 안내

  Scenario: API Key 발급
    Given tenant_super
    When "API Key 발급" → 사유="HRIS 동기화" + 권한=read-only + 만료=1년 입력
    Then api_keys INSERT, 키 값이 한 번만 표시 (이후 hashed 저장)
    And audit_logs 기록

  Scenario: API Key 권한 음성 — hr_admin
    Given tenant_hr_admin
    When "API Key 발급" 클릭
    Then 버튼 비활성 또는 403

  Scenario: API Key 폐기
    When 기존 API Key "폐기" + 확인
    Then api_keys.status=revoked, 다음 요청부터 401
```

## 9. 의존성

- **외부**: NHN Cloud (알림톡/SMS), SMTP, (v1.2 이후) Google Calendar API, Slack, 모두싸인, SAML IdP
- **연계**: CM-15 (시스템 알림 발송), OP-09 (감사 로그)
- **보안**: 모든 외부 인증 정보는 Supabase Vault 또는 컬럼 단위 암호화 저장
