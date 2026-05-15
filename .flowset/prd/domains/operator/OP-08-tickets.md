---
screen_id: OP-08
screen_name: 지원 티켓
role: [operator_super, operator_staff, tenant_super, tenant_hr_admin, employee]
entities: [Ticket, TicketMessage, User, Tenant]
platforms: [web, pwa, desktop_tauri]
mvp: true
spec_ref: docs/FlowHR_screen_spec_v_1.md#6-8
---

# OP-08 지원 티켓

## 1. 목적

고객 문의 / 장애 신고 / 기능 요청을 운영사가 통합 응대. 테넌트 사용자는 자기 회사 티켓을 생성/조회. 운영사는 모든 티켓 응대.

## 2. 사용자·권한 (spec §9-2 + 본 PRD)

| 역할 | 권한 |
|------|------|
| operator_super | C/R/U/A/N (전체) |
| operator_staff | C/R/U/A/N (전체) |
| tenant_super | C/R/U/N (자기 테넌트만) |
| tenant_hr_admin | C/R/U/N (자기 테넌트만) |
| employee | C/R/N (자기가 생성한 것만) |

## 3. UI 요소

### 3-1. 운영사 화면 (전체 티켓)
**테이블 (10 컬럼)**

| 컬럼 | 정렬 |
|------|-----|
| 티켓번호 (`TK-2026-NNNN`) | ✓ |
| 회사명 | ✓ |
| 제목 | — |
| 유형 | ✓ (문의/장애/요청/기타) |
| 우선순위 | ✓ (P0/P1/P2/P3) |
| 상태 | ✓ |
| 담당자 | — |
| SLA (남은시간) | ✓ (색상 코딩) |
| 생성일 | ✓ |
| 액션 | — |

**필터**: 상태 / 유형 / 우선순위 / 담당자 / 테넌트 / 기간

**액션**: 답변 / 담당자 지정 / 상태 변경 / 내부 메모 / 첨부 확인

### 3-2. 테넌트 화면 (자기 회사 티켓)
- 동일 테이블 (컬럼 축소: 티켓번호, 제목, 상태, 마지막 응답, 액션)
- "새 티켓 작성" CTA

### 3-3. 티켓 상세 페이지 (`/tickets/:id`)
- 헤더: 티켓번호, 제목, 유형, 우선순위, 상태, 담당자
- 본문 + 첨부
- 응답 스레드 (사용자 / 운영사 / 내부 메모 구분)
- 응답 입력 폼 (텍스트 + 파일 첨부 + 내부 메모 토글)
- 운영사: 담당자/상태/우선순위 변경 사이드 패널

### 3-4. 새 티켓 작성 폼
- 유형 선택 (문의/장애/요청/기타)
- 제목
- 본문 (마크다운)
- 첨부 (CM-09)
- 영향 화면 (선택)
- 긴급도 (사용자 의견, 운영사가 최종 우선순위 결정)

## 4. 액션

| 라벨 | 핸들러 |
|------|--------|
| 새 티켓 작성 | `onCreateTicket` |
| 답변 작성 | `onReply` (사용자) / `onReplyAsOperator` (운영사) |
| 담당자 지정 | `onAssign` |
| 상태 변경 | `onChangeStatus` |
| 우선순위 변경 | `onChangePriority` |
| 내부 메모 추가 | `onInternalNote` (사용자에게 비공개) |
| 첨부 확인 | `onViewAttachment` |
| 종료 | `onClose` |

## 5. 상태값

| Ticket.status | 색상 | 설명 |
|-------------|------|------|
| open | info | 신규 |
| in_progress | info | 담당자 배정됨, 응대 중 |
| waiting_user | warning | 사용자 응답 대기 |
| resolved | success | 해결 완료, 24시간 후 자동 종료 |
| closed | text-muted | 종료 |

| Ticket.priority | 의미 | SLA (응답) |
|---------------|------|----------|
| P0 | 시스템 다운 / 데이터 손실 | 30분 |
| P1 | 핵심 기능 장애 | 2시간 |
| P2 | 일반 결함 / 기능 요청 | 24시간 |
| P3 | 문서 / 마이너 UX | 72시간 |

## 6. 연관 엔티티

| 엔티티 | 권한 |
|--------|------|
| Ticket | CRUD |
| TicketMessage | CR (응답 스레드) |
| User | R (담당자, 작성자) |
| Tenant | R |

## 7. 연관 API

```
GET    /api/v1/tickets?role=operator|tenant         # 역할별 자동 필터
POST   /api/v1/tickets
GET    /api/v1/tickets/:id
PATCH  /api/v1/tickets/:id                          # 상태/담당자/우선순위
POST   /api/v1/tickets/:id/messages                 # 답변/내부메모
POST   /api/v1/tickets/:id/close
GET    /api/v1/tickets/:id/attachments
```

## 8. 수용 기준 (Gherkin)

```gherkin
Feature: 지원 티켓
  Background:
    Given operator_staff 로그인

  Scenario: 사용자가 티켓 작성
    Given employee 한직원 로그인
    When "새 티켓 작성" 클릭, 유형=문의, 제목="출퇴근 위치 인식 오류", 본문 입력
    Then ticket INSERT, 운영사 박오퍼에게 알림 발송
    And 한직원에게 티켓번호 안내

  Scenario: 운영사 응답 + 상태 변경
    Given 신규 티켓 TK-2026-0001 존재 (status=open)
    When 박오퍼가 티켓 상세 진입, 담당자=박오퍼로 지정, 응답 작성
    Then status=in_progress, 응답이 사용자에게 알림 전달

  Scenario: 내부 메모 — 사용자에게 비공개
    Given 박오퍼가 티켓 상세에서 "내부 메모" 토글 ON, 메모 작성
    Then ticket_messages.is_internal=true
    And 사용자가 티켓 상세 조회 시 해당 메모는 표시되지 않음

  Scenario: 권한 음성 — 다른 테넌트 티켓 접근
    Given 테넌트 A의 employee가 테넌트 B의 티켓 URL 직접 접근
    Then 403 응답

  Scenario: SLA 임박 알림
    Given P1 티켓이 생성된 후 1시간 50분 경과
    Then 담당자에게 "SLA 10분 임박" 알림 발송
```

## 9. 의존성

- **선행**: CM-01
- **연계**: OP-01 (대시보드 KPI), OP-03 (테넌트 상세 탭)
- **이벤트**: 신규 / 응답 시 Realtime broadcast → 운영사 + 사용자 알림
- **외부**: 첨부 파일 (CM-09 / CM-10)
