---
screen_id: OP-09
screen_name: 감사 로그
role: [operator_super, operator_staff]
entities: [AuditLog, Tenant, User]
platforms: [web, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#6-9
---

# OP-09 감사 로그

## 1. 목적

플랫폼 전체의 보안·활동 로그를 조회·필터·내보내기. 컴플라이언스 점검, 보안 사고 조사, 사용자 활동 추적.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| operator_super | R/E/L (전체) |
| operator_staff | R/L (조회 + 로그 보기, 내보내기 불가) |
| tenant 사용자 | TA-13 회사 설정 > 감사로그 탭에서 자기 테넌트만 조회 |

## 3. UI 요소

### 3-1. 필터 (강력한 필터 필수)
- 기간 (필수): 오늘 / 7일 / 30일 / 90일 / 커스텀
- 테넌트 (선택, 자동완성)
- 이벤트 유형 (멀티):
  - `auth.login`, `auth.logout`, `auth.password_change`, `auth.2fa_enable/disable`
  - `tenant.create/update/deactivate`
  - `employee.create/update/delete/invite`
  - `attendance.create/update/modify_request/approve`
  - `leave.create/approve/reject/cancel`
  - `approval.create/process/cancel`
  - `document.create/upload/send/view`
  - `setting.update`
  - `feature_flag.toggle`
- 사용자 (자동완성)
- 결과 (성공 / 실패 / 차단)

### 3-2. 테이블 (10 컬럼, 페이지네이션 50/페이지)
| 컬럼 | 정렬 |
|------|-----|
| 발생일시 | ✓ |
| 테넌트 | ✓ |
| 사용자 | — |
| 역할 | — |
| 이벤트 | ✓ |
| 대상 (type:id) | — |
| 결과 | ✓ |
| IP | — |
| 요청 ID | — |
| 액션 | — (상세보기) |

### 3-3. 액션
- 상세 보기 (모달: before/after diff, user-agent, 전체 메타)
- CSV 내보내기 (operator_super만, 최대 10만 행)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 상세 보기 | `onViewDetail` (모달) |
| CSV 내보내기 | `onExportCsv` |

## 5. 상태값

| AuditLog.result | 의미 |
|----------------|------|
| success | 정상 |
| failed | 실패 (입력 오류 등) |
| denied | 권한 차단 (RLS 또는 명시 거부) |

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| AuditLog | R |
| Tenant | R |
| User | R |

## 7. 연관 API

```
GET   /api/v1/operator/audit-logs?from&to&tenant&event&user&result&page
GET   /api/v1/operator/audit-logs/:id           # 상세 (before/after)
POST  /api/v1/operator/audit-logs/export        # CSV (비동기, 대용량은 메일 발송)
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 감사 로그
  Background:
    Given operator_super 로그인

  Scenario: 기본 진입 (오늘)
    When 감사 로그 페이지 진입
    Then 오늘 발생한 모든 이벤트가 표시된다
    And 페이지네이션이 정상 동작한다

  Scenario: 특정 사용자 활동 추적
    Given 사용자 정인사 선택
    When 이벤트 유형 = leave.*, 기간 = 30일
    Then 정인사의 휴가 관련 모든 액션이 표시된다

  Scenario: 상세 보기 — before/after diff
    Given 임의의 employee.update 행 클릭
    When 상세 모달 열림
    Then before와 after JSON이 diff로 표시된다
    And IP, user-agent, request_id가 모두 표시된다

  Scenario: CSV 내보내기
    When 30일 기간 + tenant=T로 필터 적용 후 "CSV 내보내기" 클릭
    Then 비동기 작업 시작 안내 + 완료 시 이메일 발송 또는 다운로드 링크

  Scenario: 권한 음성 — staff는 내보내기 불가
    Given operator_staff 로그인
    Then "CSV 내보내기" 버튼 비활성

  Scenario: 권한 음성 — tenant 사용자
    Given tenant_hr_admin 로그인
    When /operator/audit-logs URL 직접 접근
    Then 403 응답 + TA-13으로 안내
```

## 9. 의존성

- **선행**: 모든 액션이 audit_logs INSERT를 트리거 (CM-14 + DB trigger)
- **저장**: 5년 보관, 이후 archive 옵션
- **인덱스**: `(created_at DESC)`, `(tenant_id, created_at DESC)`, `(actor_id, created_at DESC)`, `(target_type, target_id)`
