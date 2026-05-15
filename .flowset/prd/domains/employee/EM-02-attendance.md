---
screen_id: EM-02
screen_name: 출퇴근
role: [employee]
entities: [Attendance, AttendanceModification, WorkPolicy]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#8-2
---

# EM-02 출퇴근

## 1. 목적

직원이 본인 출퇴근을 기록 + 본인 근무 이력 조회. **PWA 핵심 기능, GPS 위치 인증 포함**.

## 2. 사용자·권한

| 역할 | 권한 |
|------|------|
| employee | CRU 요청 본인 |

(관리자 화면은 TA-05.)

## 3. UI 요소

### 3-1. 카드 (상단)
- 현재 근무 상태 + 시각
- 오늘 출근 / 퇴근 / 휴게 합계
- 근무 위치 (오늘 출근 위치 — 지도 또는 주소)

### 3-2. 액션 버튼 (큰 버튼, 상태별 활성화)
| 상태 | 버튼 |
|------|------|
| 미출근 | "출근" |
| 근무중 | "휴게 시작", "퇴근" |
| 휴게중 | "휴게 종료" |
| 퇴근 | 모든 버튼 비활성 + "수정 요청" 노출 |
| 누락 | "수정 요청" 활성 |

### 3-3. 본인 근무 이력 테이블 (7 컬럼)
| 컬럼 | 정렬 |
|------|-----|
| 날짜 | ✓ |
| 출근 | — |
| 퇴근 | — |
| 휴게 (분) | — |
| 근무시간 | ✓ |
| 상태 | ✓ |
| 수정요청 | — |

### 3-4. 수정 요청 모달 (TA-06으로 연동)
- 대상일 (기본 = 클릭한 행)
- 요청유형 (출근/퇴근/휴게/외근)
- 원기록 vs 요청값 (자동 채움)
- 사유 (필수)
- 증빙 첨부 (선택)
- 제출 → TA-06 결재 흐름

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 출근 | `onClockIn` (GPS + 디바이스 ID 첨부) |
| 퇴근 | `onClockOut` |
| 휴게 시작 / 종료 | `onBreakStart` / `onBreakEnd` |
| 수정 요청 | `onRequestModification` → TA-06 |

## 5. 상태값

`Attendance.status`: 정상 / 지각 / 조퇴 / 결근 / 휴가 / 재택 / 외근 / 출장 / 누락 / 수정요청중 / 수정완료

화면 자체: 위치 인증 진행중, 오프라인 큐잉 등 별도 표시.

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Attendance | CR 본인 (오늘 + 이력 조회) |
| AttendanceModification | C 본인 |
| WorkPolicy | R (지각 기준 등 안내) |

## 7. 연관 API

```
GET  /api/v1/me/attendances?from&to&page
GET  /api/v1/me/attendances/today
POST /api/v1/me/attendance/clock-in           # body: { location: { lat, lng, accuracy? }, deviceId }  (KI-018: jsonb LocationSchema)
POST /api/v1/me/attendance/clock-out
POST /api/v1/me/attendance/break/start
POST /api/v1/me/attendance/break/end
POST /api/v1/me/attendance-modifications      # 수정 요청
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 직원 출퇴근 (PWA)
  Background:
    Given employee 한직원 PWA 로그인
    And 회사 표준 출근시간 09:00, 지각 09:01
    And 회사 위치 = 서울시청 (위도/경도)

  Scenario: 정상 출근
    Given 현재 시각 08:55, 위치 = 회사 100m 이내
    When "출근" 탭
    Then attendances INSERT (clock_in_at=08:55, location=현재)
    And status = 정상

  Scenario: 지각 자동 분류
    Given 현재 시각 09:15
    When "출근" 탭
    Then attendances INSERT (clock_in_at=09:15)
    And status = 지각 (work_policy 기준 자동 결정)

  Scenario: 위치 인증 — 회사 반경 밖
    Given 회사 1km 밖 위치, "재택" 정책 활성
    When "출근" 탭
    Then "재택 출근으로 기록됩니다" 안내 모달
    And 확인 시 status = 재택, location 기록

  Scenario: 위치 권한 미허용
    Given GPS 권한 거부됨
    When "출근" 탭
    Then "위치 권한이 필요합니다" 안내 + 권한 요청
    And 거부 지속 시: 회사 설정에 따라 (a) 출근 차단 또는 (b) 위치 없이 진행 + 사유 자동 기록

  Scenario: 오프라인 출근
    Given 네트워크 끊김
    When "출근" 탭
    Then 로컬 IndexedDB 큐에 적재 + UI는 즉시 "근무중" 표시
    And 네트워크 복귀 시 자동 동기화

  Scenario: 휴게 시작/종료
    Given 근무중 상태
    When "휴게 시작" 탭 + 12:00 → "휴게 종료" 탭 13:00
    Then attendances.break_minutes += 60

  Scenario: 퇴근 누락 → 자동 누락 처리
    Given 어제 출근만 기록, 퇴근 없음
    When 자정(23:59) cron 실행
    Then attendances.status = 누락
    And 직원에게 알림: "어제 퇴근 기록 누락. 수정 요청"

  Scenario: 수정 요청 → TA-06
    Given 누락 행
    When "수정 요청" 클릭, 퇴근 시각 + 사유 입력
    Then attendance_modifications INSERT (status=pending)
    And 결재자에게 알림
```

## 9. 의존성

- **선행**: TA-13 (work_policy 정의), TA-02 (직원 존재)
- **연계**: TA-06 (수정 요청), TA-05 (관리자 모니터링)
- **PWA**:
  - 백그라운드 위치 추적 불가 → 포그라운드 클릭 시점만
  - 오프라인 큐 IndexedDB (단발 출퇴근 요청만)
  - iOS PWA에서 GPS 정확도 ~10m
- **자동**: 매일 23:59 누락 자동 처리 cron
