# Employee API (EM-01~11)

> 도메인 프리픽스: `/api/v1/me/`. 인증: JWT `employee_id != null AND tenant_id != null`.
> RLS: 본인만 (`employee_id = current_employee_id()`).

## EM-01 내 대시보드

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/dashboard` | self | 5 KPI + 출퇴근 카드 + 휴가 카드 + 요청 3건 + 알림 3건 한 번에 |
| GET | `/dashboard/today` | self | 오늘 근무 상태 단독 |

## EM-02 출퇴근

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/attendances?from&to&page` | self |
| GET | `/attendances/today` | self |
| POST | `/attendance/clock-in` | self | body: `{location:{lat,lng,accuracy?}, deviceId}` (Idempotency-Key 필수) |
| POST | `/attendance/clock-out` | self | (Idempotency-Key 필수) |
| POST | `/attendance/break/start` | self |
| POST | `/attendance/break/end` | self |
| POST | `/attendance-modifications` | self | 수정 요청 — body: `{attendanceId?, targetDate, requestType, requestedValue, reason, attachmentIds[]}` |
| GET | `/attendance-modifications` | self | 본인 요청 이력 |
| POST | `/attendance-modifications/:id/cancel` | self (pending) |

### POST /attendance/clock-in 응답
```json
{
  "ok": true,
  "data": {
    "attendance": {
      "id": "...",
      "workDate": "2026-05-15",
      "clockInAt": "2026-05-15T08:55:00Z",
      "status": "normal",
      "location": {"lat": 37.5665, "lng": 126.9780}
    }
  }
}
```

### Errors
- `422 ATTENDANCE_ALREADY_CLOCKED_IN` — 오늘 이미 출근
- `422 ATTENDANCE_OUT_OF_LOCATION` — 회사 위치 반경 밖 (재택 정책 미활성 시)
- `400 VALIDATION_ERROR` — location 누락 (work_policy.location_required=true 시)

## EM-03 휴가 신청

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/leave-balances?year` | self | 유형별 잔여 |
| POST | `/leaves/calculate-days` | self | body: `{leaveTypeId, startDate, endDate, halfDay}` → `{usedDays, remainingAfter}` |
| POST | `/leaves/preview-approval-line` | self | body: 신청 데이터 → 결재라인 미리보기 (조건 분기 적용) |
| POST | `/leaves` | self | 신청 (`Idempotency-Key`) |
| POST | `/leaves/draft` | self | 임시저장 |
| GET | `/leaves/draft` | self |
| DELETE | `/leaves/draft` | self |

### POST /leaves
```json
// Request
{
  "leaveTypeId": "...",
  "startDate": "2026-06-01",
  "endDate": "2026-06-03",
  "halfDay": "none",
  "reason": "가족 여행",
  "substituteEmployeeId": null,
  "attachmentIds": []
}
```

### Errors
- `422 LEAVE_INSUFFICIENT_BALANCE` — 잔여 부족
- `422 LEAVE_OVERLAP` — 기존 신청과 기간 겹침
- `422 LEAVE_EVIDENCE_REQUIRED` — 증빙 필수 유형 (예: 병가)
- `400 VALIDATION_ERROR` — startDate > endDate 등

## EM-04 내 휴가 현황

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/leaves?status&type&from&to&page` | self |
| GET | `/leaves/:id` | self |
| POST | `/leaves/:id/cancel` | self | body: `{reason?}` (pending=즉시, approved=결재 흐름) |

## EM-05 내 결재/진행현황

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/approvals?status&type&page` | self | 5종 통합 (Leave/AttendanceMod/Cert/ChangeReq/Doc) |
| GET | `/approvals/:id` | self | 유형별 detail join |
| POST | `/approvals/:id/cancel` | self |
| POST | `/approvals/:id/resubmit` | self | 반려된 건 복사 → 새 신청 (유형별 EM-03/EM-08 등으로 redirect URL 응답) |

## EM-06 급여명세서 조회

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/payslips?year&page` | self |
| GET | `/payslips/:id` | self | 지급/공제 상세 |
| GET | `/payslips/:id/download` | self | Signed URL 15분 |
| POST | `/payslips/:id/acknowledge` | self | 수동 열람 확인 |

(자동 열람: 상세 조회 시점에 viewed_at 자동 기록)

## EM-07 문서 조회

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/documents?type&status&from&to&page` | self | 본인 문서 |
| GET | `/documents/company-wide` | self | 회사 전체 공지 문서 |
| GET | `/documents/:id` | self / 공개 권한 |
| GET | `/documents/:id/preview` | self | PDF inline |
| GET | `/documents/:id/download` | self | Signed URL |
| POST | `/documents/:id/acknowledge` | self |

## EM-08 증명서 요청

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/certificate-requests?status&page` | self |
| POST | `/certificate-requests` | self | body: `{certificateType, submissionTarget, purpose, copies, deliveryMethod, requestMemo?}` |
| GET | `/certificate-requests/:id` | self |
| POST | `/certificate-requests/:id/cancel` | self (pending) |
| GET | `/certificate-requests/:id/download` | self (issued) | 발급된 PDF |

### HR 처리 엔드포인트 (별도)
- `POST /api/v1/tenant/certificate-requests/:id/issue` — HR가 PDF 발급 (template + 변수 자동)
- `POST /api/v1/tenant/certificate-requests/:id/reject` — body: `{reason}`

## EM-09 내 정보 / 프로필

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/profile` | self | 7탭 통합 |
| PATCH | `/profile` | self | 즉시 수정 가능 필드만 (주소/연락처/비상연락처/닉네임) |
| POST | `/profile/change-requests` | self | HR 승인 필요 필드 (이름/계좌/가족정보) — body: `{fieldName, newValue, reason}` (계좌 변경은 2FA 재인증 필요) |
| GET | `/profile/change-requests?status` | self |
| POST | `/profile/change-requests/:id/cancel` | self |
| POST | `/security/change-password` | self | body: `{currentPassword, newPassword}` |
| POST | `/security/2fa/enable` | self | body: 없음 → QR + secret 반환 |
| POST | `/security/2fa/verify` | self | body: `{code}` → 활성화 + 복구 코드 8개 |
| POST | `/security/2fa/disable` | self | body: `{currentPassword, code}` |
| GET | `/security/sessions` | self | 활성 세션 목록 |
| DELETE | `/security/sessions/:id` | self | 강제 종료 |
| POST | `/avatar` | self | 멀티파트 업로드 |

## EM-10 알림함

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/notifications?status&type&page` | self |
| POST | `/notifications/:id/read` | self |
| POST | `/notifications/read-all` | self |
| GET | `/notifications/unread-count` | self | 헤더 배지 |

### Realtime 구독
- 채널: `realtime:notifications:user_id={uuid}`
- 이벤트: INSERT만 (UPDATE는 read 상태 → 헤더 배지 갱신용 별도 채널)

## EM-11 요청 내역 (△ MVP)

- MVP는 EM-05로 통합 — `/api/v1/me/requests` 라우트는 EM-05로 redirect.
- v1.1: `GET /api/v1/me/requests?type&status&from&to&page` — 5종 통합 (Leave/AttendanceMod/Cert/ChangeReq/Doc)

## 공통 — 본인 데이터

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/me/employee` | self | TA-03 직원 상세의 self 일부 |
| GET | `/me/department` | self | 소속 부서 |
| GET | `/me/colleagues?departmentId` | self | 같은 팀 직원 명단 (이름·직급만) |

## EM-09 보안·알림·활동 (KI-029 batch-003 후속, OP-12와 공유)

> 직원 본인 프로필(EM-09)은 기본 §1에 정의되어 있고 본 §은 보강. 운영사(OP-12)는 운영사 도메인 라우트(`/operator/me/profile`)와 분리되지만 보안 탭은 직원과 동일 엔드포인트 공유.

### 보안 — 2FA

| 메서드 | 경로 | 권한 |
|--------|------|------|
| POST | `/me/security/2fa/enable` | self | TOTP secret 발급 + QR |
| POST | `/me/security/2fa/verify` | self | 6자리 검증 → 활성화 + 복구 코드 8개 |
| POST | `/me/security/2fa/disable` | self (직원만, 운영사는 차단) | 운영사 user는 `403 OPERATOR_2FA_REQUIRED` |
| POST | `/me/security/2fa/regenerate` | self | TOTP secret 재발급 (기존 무효화) + 신규 QR |
| POST | `/me/security/2fa/recovery-codes/regenerate` | self | 복구 코드 8개 재발급 (기존 모두 무효화) |

### 알림 설정 (preferences)

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/me/notifications/preferences` | self | 카테고리별 채널 토글 + 강제 항목 |
| PATCH | `/me/notifications/preferences` | self | body: `{category: {inApp, push, email, kakao, sms}}` 부분 patch |

응답 (`GET /me/notifications/preferences`):
```json
{
  "ok": true,
  "data": {
    "preferences": [
      {"category":"approval_pending","inApp":true,"push":true,"email":false,"kakao":true,"sms":false,"forced":[]},
      {"category":"system_maintenance","inApp":true,"push":true,"email":true,"kakao":false,"sms":false,"forced":["email"]}
    ]
  }
}
```

운영사 강제 채널(OP-12 §3-3): `system_maintenance` 이메일 강제, `new_ticket` 푸시 강제. 클라이언트가 force off 시도 → `400 NOTIFICATION_CHANNEL_FORCED`.

### 활동 로그 (본인)

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/me/audit-logs?days=30&action=&page=` | self | 본인 액션 로그 (audit_logs.actor_id = self) |
| POST | `/me/audit-logs/export` | self | xlsx 생성 (CM-12) → Signed URL |

`days`는 1~90 (기본 30). 90 초과 시 `400 AUDIT_LOG_RANGE_EXCEEDED`.

응답:
```json
{
  "ok": true,
  "data": {
    "items": [
      {"id":"uuid","action":"login","targetType":"session","targetId":"sid","result":"success","ipAddress":"1.2.3.4","userAgent":"Chrome 124","createdAt":"2026-05-15T09:00:00Z"}
    ],
    "pagination": {...}
  }
}
```

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 11 화면 × 약 55 엔드포인트 + Realtime 구독 | Phase 4 진입 |
| 2026-05-15 | EM-09 보안·알림·활동 §추가 (2FA regenerate, notifications/preferences, audit-logs) — 직원 + OP-12 공유 | KI-029 batch-003 후속 (Phase 4 P1 해소) |
