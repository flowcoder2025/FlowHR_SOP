---
screen_id: EM-10
screen_name: 알림함
role: [employee, tenant_manager, tenant_hr_admin, tenant_super]
entities: [Notification]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#8-10
---

# EM-10 알림함

## 1. 목적

본인의 인앱 알림을 통합 조회 + 읽음 처리. **PWA 푸시 진입점**.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| 모든 사용자 | R/U 읽음 본인 |

## 3. UI 요소

### 3-1. 진입점
- 헤더 종 아이콘 → 드롭다운 (최근 10건) + "모두 보기" 링크 → 본 페이지
- PWA 푸시 클릭 → 본 페이지 (또는 관련 화면 직접 진입)

### 3-2. 필터
- 전체 / 읽지 않음
- 유형: 결재 / 문서 / 시스템 / 공지

### 3-3. 리스트 (PWA 카드형, Web 테이블형)
| 컬럼 |
|------|
| 유형 (아이콘) |
| 제목 |
| 내용 요약 (1~2 줄) |
| 생성일 (상대 시간 — "3시간 전") |
| 읽음 여부 (배지) |
| 관련 화면 (클릭 → 이동) |

### 3-4. 액션
- 클릭 → 관련 화면 이동 + 자동 읽음 처리
- "전체 읽음" 버튼
- 개별 "읽음" 토글

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 알림 클릭 | `onClickNotification` → 관련 화면 + 읽음 처리 |
| 전체 읽음 | `onMarkAllRead` |
| 읽음 토글 | `onToggleRead` |

## 5. 상태값

`Notification.read_status`: unread / read

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Notification | R/U 본인 |

## 7. 연관 API

```
GET  /api/v1/me/notifications?status&type&page
POST /api/v1/me/notifications/:id/read
POST /api/v1/me/notifications/read-all
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 알림함
  Background:
    Given employee 한직원 PWA 로그인
    And 미열람 알림 5건

  Scenario: 헤더 종 아이콘 배지
    When 어디서든 알림 도착
    Then 헤더 종 카운트가 즉시 갱신 (≤ 2초 via Realtime)

  Scenario: 클릭 → 관련 화면 + 자동 읽음
    When 휴가 승인 알림 클릭
    Then EM-05 또는 TA-08 read-only로 이동
    And notifications.read_status=read

  Scenario: 전체 읽음
    When "전체 읽음" 클릭
    Then 모든 본인 알림 read=true
    And 헤더 배지가 0으로

  Scenario: PWA 푸시 (iOS 16.4+ + 홈화면 설치)
    Given 결재 알림 발송
    Then PWA 푸시가 모바일 OS에 도달
    And 클릭 시 EM-10 또는 직접 관련 화면 진입

  Scenario: 폴백 — 카카오 알림톡
    Given 알림 발송 후 30분 미열람 + 카카오 채널 연동 활성
    Then 자동으로 카카오 알림톡 발송

  Scenario: 권한 — 다른 사람 알림
    Given 다른 직원의 notification_id로 GET
    Then 403
```

## 9. 의존성

- **선행**: CM-15 (시스템 알림 발송)
- **연계**: 모든 화면 (알림 클릭 시 이동)
- **이벤트**: Realtime broadcast로 새 알림 즉시 푸시
- **외부**: PWA Web Push API (iOS 16.4+ 홈화면 추가 필수), 카카오 알림톡 폴백
