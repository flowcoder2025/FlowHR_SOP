---
screen_id: EM-01
screen_name: 내 대시보드
role: [employee]
entities: [Attendance, Leave, LeaveBalance, Approval, Notification]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#8-1
---

# EM-01 내 대시보드

## 1. 목적

직원이 PWA를 열었을 때 처음 보는 화면. 오늘 근무상태·잔여연차·진행중 요청·알림을 한눈에. **PWA의 핵심 진입점**.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| employee | R 본인 |
| tenant_manager 도 본 화면 사용 (자기 직원 데이터) + TA-01 결재 요약 추가 |

## 3. UI 요소

### 3-1. KPI 카드 (5개, PWA 우선 레이아웃)
| 카드 | 표시 |
|------|------|
| 오늘 근무상태 | 출근/퇴근/근무중/휴게/누락 + 시각 |
| 이번주 근무시간 | 합계 + 표준 대비 % |
| 잔여연차 | 사용 N / 잔여 M (총 X) |
| 진행중 요청 | 본인이 제출한 결재 대기 카운트 |
| 읽지 않은 알림 | 카운트 + Top 3 미리보기 |

### 3-2. 출퇴근 카드 (가장 큰 영역)
- 현재 시각 (실시간)
- 출근 시각 / 퇴근 시각 (오늘)
- **출근 / 퇴근 / 휴게 시작 / 휴게 종료 버튼** — 상태에 따라 활성화
- 위치 인증 상태 표시 (GPS 활성 여부)

### 3-3. 휴가 카드
- 잔여연차 큰 숫자
- 이번달 사용 / 다음 휴가 일정
- "휴가 신청" 버튼 → EM-03

### 3-4. 요청 현황 미니 리스트 (3건)
- 유형, 제목, 단계, 상태
- 클릭 → EM-05

### 3-5. 최근 알림 (3건)
- 클릭 → EM-10

### 3-6. 다가오는 일정 (3건)
- 본인 휴가, 회사 공지, 출장 등
- v1.1: 회사 캘린더 통합

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 출근 | `onClockIn` (GPS + 디바이스 ID) |
| 퇴근 | `onClockOut` |
| 휴게 시작 / 종료 | `onBreakStart` / `onBreakEnd` |
| 휴가 신청 | → EM-03 |
| 증명서 요청 | → EM-08 |
| 급여명세서 보기 | → EM-06 |
| 알림 보기 | → EM-10 |

## 5. 상태값

화면 자체: 로딩, ready, offline (PWA Service Worker 오프라인 시).

출퇴근 버튼 상태 머신:
- 미출근 → "출근" 활성
- 근무중 → "휴게 시작" / "퇴근" 활성
- 휴게중 → "휴게 종료" 활성
- 퇴근 → 모든 버튼 비활성 (오늘 종료)
- 누락 → "수정 요청" 노출 (→ TA-06)

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Attendance | CR 본인 (오늘) |
| Leave | R 본인 |
| LeaveBalance | R 본인 |
| Approval | R 본인 |
| Notification | R 본인 |

## 7. 연관 API

```
GET  /api/v1/me/dashboard                          # 한 번에 KPI + 위 모든 카드
POST /api/v1/me/attendance/clock-in
POST /api/v1/me/attendance/clock-out
POST /api/v1/me/attendance/break/start
POST /api/v1/me/attendance/break/end
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 내 대시보드
  Background:
    Given employee 한직원 PWA 로그인

  Scenario: 진입 시 5 KPI + 출퇴근 카드 표시
    When EM-01 진입
    Then 5개 KPI + 출퇴근 카드가 1초 이내 렌더 (PWA)
    And 현재 시각이 실시간 갱신

  Scenario: 출근 버튼 1탭
    Given 미출근 상태, 위치 권한 허용됨
    When "출근" 버튼 탭
    Then GPS 좌표 + 디바이스 ID + 시각이 서버에 전송 (≤ 800ms)
    And attendances INSERT (clock_in_at, location)
    And 카드가 "근무중" 상태로 즉시 갱신

  Scenario: 위치 권한 거부 시
    Given GPS 권한 거부
    When "출근" 클릭
    Then "위치 권한 필요" 안내 + 권한 요청 다이얼로그
    And 거부 시 정책: 회사 설정에 따라 출근 거부 또는 위치 없이 진행 (사유 자동 기록)

  Scenario: 오프라인 출근 (PWA)
    Given 네트워크 오프라인
    When "출근" 탭
    Then IndexedDB 큐에 적재 + "오프라인 — 동기화 대기" 토스트
    When 네트워크 복귀
    Then 자동 동기화 시도 + 성공 시 "동기화 완료" 토스트

  Scenario: 누락 상태 — 수정 요청 안내
    Given 어제 출근만 있고 퇴근 누락
    When EM-01 진입
    Then 오늘 카드 옆에 "어제 출퇴근 누락 — 수정 요청" 알림 노출
    And 클릭 → EM-02 또는 TA-06 흐름

  Scenario: 권한 — manager 본인 화면
    Given tenant_manager 로그인 PWA
    Then 본 EM-01 표시 (본인 데이터) + 추가로 "받은 결재" 미니 카드 노출
```

## 9. 의존성

- **선행**: CM-01 로그인
- **연계**: EM-02 (출퇴근 카드 → 상세), EM-03 (휴가 신청), EM-05/EM-10 (요청/알림)
- **이벤트**: 출퇴근 / 결재 / 알림 변경 시 Realtime broadcast → 카드 즉시 갱신
- **PWA**: Service Worker로 핵심 자산 캐싱, 출퇴근 큐 IndexedDB
