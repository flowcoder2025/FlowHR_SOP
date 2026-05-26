# Common API (CM-07~22)

> 공통 인프라 — 알림, 파일, Excel, PDF, 감사 로그, 약관, 헤더 컴포넌트. 모든 도메인에서 공유.
> 2026-05-15 (KI-028/030 batch-003): 헤더 알림 미니(CM-17), 도움말(CM-19), 약관(CM-21), 온보딩(CM-22) 엔드포인트 추가.

## 알림 (CM-07, CM-15)

### 인앱 알림 — `/api/v1/me/notifications` (employee.md EM-10 참조)

### 시스템 알림 발송 (서버 내부 + Edge Function)
- 클라이언트에 직접 노출되지 않음. Edge Function 또는 트리거에서 호출.
- 채널 우선순위:
  ```
  1. 인앱 (notifications INSERT + Realtime broadcast)               — 기본 (무료)
  2. PWA Push (Web Push API, iOS 16.4+ + 홈화면 설치)               — 기본
  3. 이메일 (Resend 3,000건/월 무료, 중요 알림 즉시 / 일반 24시간 미열람)  — 기본 (무료)
  4. 카카오 알림톡 (30분 미열람 시) — tenant_settings.notifications.kakao_enabled  — 옵션 (DEFER)
  5. SMS (1시간 + 카카오 미수신) — tenant_settings.notifications.sms_enabled        — 옵션
  ```
  > **카카오 알림톡 / SMS는 옵션 기능** (사용자 결정 2026-05-19, `guardrails.md §10`). 카카오는 NHN Cloud 채널 인증(60일) 필요 → 기본 비활성(DEFER). `tenant_settings.notifications.kakao_enabled` 활성 테넌트만 발송 (첫 활성 시 NHN 신청). 미활성 테넌트는 인앱 + 푸시 + 이메일(Resend)로 충분. 이메일을 기본 폴백 채널로 승격 (기존 24시간 한정 → 중요 알림 즉시).
- 외부 채널 발송 결과는 `integration_logs` INSERT

## 파일 업로드 (CM-09)

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/files/upload` | 모든 로그인 사용자 | 멀티파트, body: `file + metadata{domain, refId?}` |
| GET | `/api/v1/files/:fileId` | RLS (domain별) | 메타 |
| GET | `/api/v1/files/:fileId/signed-url?ttl=900` | RLS | Signed URL (15분 기본) |
| DELETE | `/api/v1/files/:fileId` | super/operator | soft delete |

### 응답
```json
{
  "ok": true,
  "data": {
    "fileId": "uuid",
    "url": "tenants/{tid}/leaves/2026-06/abc.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 1234567,
    "signedUrl": "https://...?token=..."
  }
}
```

### 제약 (CM-09 PRD §3-2)
- 단일 50MB, 요청 전체 200MB
- 허용 MIME: `application/pdf`, `image/(jpg|png|webp|gif)`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/csv`, `application/x-hwp`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- 바이러스 스캔: v1.1 (ClamAV)

## 파일 미리보기 (CM-10)

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/api/v1/files/:fileId/preview` | RLS | PDF/이미지: 직접 렌더 / xlsx/csv: HTML 변환 응답 |

## Excel 가져오기 (CM-11)

직원 일괄(TA-02), 급여명세서(TA-10) 등에서 사용. 양식 다운로드 → 업로드 → 검증 → 부분 적용 패턴.

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/api/v1/tenant/employees/bulk-template` | super/hr_admin | xlsx 양식 |
| POST | `/api/v1/tenant/employees/bulk` | super/hr_admin | 파싱 + 검증 + INSERT |
| (payslip) GET `/api/v1/tenant/documents/payslip-template` | super/hr_admin | 직원 자동 채움 xlsx |
| (payslip) POST `/api/v1/tenant/documents/bulk-payroll` | super/hr_admin | 파싱 + PDF 생성 (비동기 202) |

### bulk 응답 형식
```json
{
  "ok": true,
  "data": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "errors": [
      {"row": 3, "field": "email", "code": "EMPLOYEE_DUPLICATE_EMAIL", "message": "..."},
      {"row": 7, "field": "departmentId", "code": "VALIDATION_REQUIRED"}
    ],
    "failedRowsDownloadUrl": "https://..."  // 실패 행만 추출한 xlsx
  }
}
```

## Excel 내보내기 (CM-12)

모든 목록 화면. 동기 (< 1만 행) 또는 비동기 202 (대량).

| 응답 패턴 | 설명 |
|---------|------|
| 동기 200 | `{data: {downloadUrl}}` |
| 비동기 202 | `{data: {jobId, statusUrl, expectedCompletionAt}}` |
| Job 상태 조회 | `GET /api/v1/jobs/:jobId` → `{status: pending|running|success|failed, resultUrl?}` |

## PDF 다운로드 (CM-13)

급여명세서/증명서/리포트/감사로그 등. 서버 렌더링 (Puppeteer 또는 React-PDF).

| 응답 | 설명 |
|------|------|
| Signed URL 15분 만료 | 클라이언트가 직접 다운로드 |
| 워터마크 | 발행 일자 + 회사 인장 (tenant_settings.company_seal_url) |

## 감사 로그 기록 (CM-14)

서버 내부 — 모든 핵심 액션이 자동 INSERT. 클라이언트 직접 노출 없음.

### 기록 대상 (DB trigger + 애플리케이션 레벨 이중)

**핵심 마스터 테이블 (11개 — DB after-trigger)**: employees, leaves, approvals, attendances, documents, users, tenants, subscriptions, invoices, feature_flags, tenant_settings

**결재 폴리모픽 자식 테이블 (KI-026 정책)**: attendance_modifications, certificate_requests, employee_change_requests는 **개별 audit_logs 트리거 미적용**. 대신 연결된 `approvals` 테이블의 audit_logs 항목에 자식 state를 `before`/`after` jsonb로 포함. 이유: (1) 결재 단위가 비즈니스 추적 단위, (2) 자식 INSERT는 approvals INSERT와 동일 트랜잭션, (3) 자식 UPDATE는 approval 단계 진행 시 자동 — 중복 로그 회피.

**APPROVE/REJECT/CANCEL 액션**: approvals + approval_steps 양쪽에 기록 (애플리케이션 레벨).

**인증/시스템 액션**: 로그인 / 로그아웃 / 비밀번호 변경 / 2FA 변경 / 권한 변경 / 테넌트 비활성화 / 점검 모드 토글.

### 조회
- 운영사: `/api/v1/operator/audit-logs` (cross-tenant)
- 테넌트: `/api/v1/tenant/audit-logs` (자기 테넌트)
- 직원: TA-03/EM-09 본인 변경 이력 부분 노출

## Feature Flag 평가 (런타임)

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/api/v1/feature-flags` | 모든 로그인 사용자 | 본인 테넌트에 적용되는 플래그 머지 결과 (글로벌 + 플랜 + 예외) |

### 응답
```json
{
  "ok": true,
  "data": {
    "flags": {
      "attendance": {"enabled": true, "source": "global"},
      "e_contract": {"enabled": false, "source": "plan_restricted"},
      "dark_mode": {"enabled": true, "source": "tenant_override"}
    }
  }
}
```

캐시: 클라이언트 SWR (5분), 변경 시 Realtime broadcast로 즉시 invalidate.

## 점검 모드 (CM-06)

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/api/v1/maintenance` | bypass | 현재 상태 (공개) |

응답:
```json
{
  "ok": true,
  "data": {
    "status": "inactive|scheduled|active",
    "message": "string|null",
    "scheduledStart": "string|null",
    "scheduledEnd": "string|null"
  }
}
```

점검 활성 시 모든 비-operator 요청에 `503 MAINTENANCE` 응답 + `Retry-After` 헤더.

## 시스템 헬스 체크

| 메서드 | 경로 | 권한 | 용도 |
|--------|------|------|------|
| GET | `/api/v1/health` | bypass | UptimeRobot 호출 — `{ok: true, db: ok, storage: ok}` |
| GET | `/api/v1/health/detailed` | operator_super | DB pool, Realtime, Storage, 외부 연동 상태 |

## Realtime 채널 (Supabase)

| 채널 | 권한 | 이벤트 |
|------|------|------|
| `realtime:notifications:user_id={uid}` | 본인 | INSERT |
| `realtime:approvals:tenant_id={tid}` | tenant_super/hr_admin | UPDATE (status 변경) |
| `realtime:approval_steps:approver_id={eid}` | 본인 | INSERT (새 결재 도착) |
| `realtime:tenants:operator` | operator_* | INSERT/UPDATE (대시보드 KPI 갱신) |
| `realtime:maintenance` | 모두 | UPDATE (점검 모드 진입/종료) |
| `realtime:feature_flags:tenant_id={tid}` | 본인 테넌트 | UPDATE (플래그 변경) |

클라이언트 wrapper (`packages/api-client/realtime.ts`)는 JWT 자동 첨부 + 채널 다중 구독 + 재연결 처리.

## 헤더 알림 미니 드롭다운 (CM-17)

CM-07 알림 센터의 미니 미리보기 — 최근 N건 + 미읽음 카운트.

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/api/v1/me/notifications?limit=10&unread_only=false` | 본인 | 최근 10건 (헤더 드롭다운 기본) |
| GET | `/api/v1/me/notifications/unread-count` | 본인 | 미읽음 카운트만 (배지 갱신용 — Realtime 미구독 폴백) |
| POST | `/api/v1/me/notifications/mark-all-read` | 본인 | 일괄 읽음 처리 |
| POST | `/api/v1/me/notifications/:id/read` | 본인 (RLS) | 개별 읽음 |

응답:
```json
{
  "ok": true,
  "data": {
    "items": [
      {"id":"uuid","type":"approval_pending","title":"휴가 결재 요청","body":"한직원 — 연차 1일","relatedUrl":"/admin/leaves/uuid","unread":true,"createdAt":"2026-05-15T09:00:00Z"}
    ],
    "unreadCount": 3
  }
}
```

Realtime: `realtime:notifications:user_id={uid}` INSERT 이벤트로 즉시 헤더 배지 갱신 (≤ 2초).

## 헤더 도움말 패널 (CM-19)

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/api/v1/help/screen/:screenId` | 모든 로그인 | 화면 ID별 1줄 도움말 + 외부 링크 |
| GET | `/api/v1/help/faq` | 모든 로그인 | FAQ 5건 (역할별 필터링) |
| POST | `/api/v1/help/contact-ticket` | 모든 로그인 | OP-08 신규 티켓 단축 생성 (subject + body) |

응답 (`/help/screen/:screenId`):
```json
{
  "ok": true,
  "data": {
    "screenId": "TA-09",
    "title": "결재 처리 가이드",
    "summary": "결재 인박스에서 항목 클릭 → 승인/반려/위임을 처리합니다.",
    "externalUrl": "https://help.flowhr.kr/screens/ta-09",
    "shortcuts": [
      {"key":"Cmd+K","action":"명령 팔레트 (v1.1)"},
      {"key":"Esc","action":"모달 닫기"}
    ]
  }
}
```

## 약관/개인정보처리방침 (CM-21)

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/api/v1/legal/documents?type=terms\|privacy&language=ko\|en&latest=true` | 모두 (비로그인 OK) | 현재 활성 버전 본문. language 미지정 시 user.locale (인증 시) 또는 Accept-Language (비로그인) 기준 자동 |
| GET | `/api/v1/legal/documents?type=terms&language=en` | operator | 모든 버전 (운영사 관리) |
| GET | `/api/v1/legal/documents/:id` | RLS | 특정 버전 (language 필드 포함) |
| POST | `/api/v1/operator/legal/documents` | operator_super | **신규 버전 게시 — body는 ko + en 페어** (한쪽만 게시 시 `400 LANGUAGE_PAIR_REQUIRED`) |
| PATCH | `/api/v1/operator/legal/documents/:id` | operator_super | 활성 토글 / 본문 수정 (트랜잭션 내 기존 active → false) |
| GET | `/api/v1/me/consents` | 본인 | 본인 동의 이력 |
| POST | `/api/v1/me/consents` | 본인 | `{documentId, version}` 동의 기록 |
| GET | `/api/v1/operator/legal/consents?documentId=...` | operator | 감사 — 동의 통계 + 이력 |
| GET | `/api/v1/me/consents/required` | 본인 | 강제 동의 필요한 문서 목록 (가드 매트릭스 §8) |

`POST /me/consents` 응답:
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "documentId": "uuid",
    "version": "2.0.0",
    "consentedAt": "2026-05-15T09:00:00Z",
    "ipAddress": "1.2.3.4"
  }
}
```

`GET /me/consents/required` 응답 (강제 동의 필요 시):
```json
{
  "ok": true,
  "data": {
    "required": [
      {"type":"terms","version":"2.0.0","documentId":"uuid","effectiveDate":"2026-06-01","summaryMd":"##주요 변경..."}
    ]
  }
}
```

빈 배열이면 강제 동의 가드 통과.

## 첫 사용자 온보딩 (CM-22)

CM-22 자체는 클라이언트 모달 — API는 first_login_at 갱신만 사용.

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/api/v1/me/profile` | 본인 | `first_login_at` 포함 (모달 트리거 판단) |
| PATCH | `/api/v1/me/profile` | 본인 | `{firstLoginAt: "2026-05-15T09:00:00Z"}` (투어 종료 시) |
| POST | `/api/v1/me/onboarding/event` | 본인 | `{action: "started\|step_completed\|skipped\|finished", step?: 1-4}` → audit_logs |

## PWA 설치 가이드 (CM-20)

CM-20은 정적 페이지 — 별도 API 없음. 다만 설치 추적용 이벤트 로깅:

| 메서드 | 경로 | 권한 |
|--------|------|------|
| POST | `/api/v1/me/pwa-install-event` | 본인 (또는 anonymous) | `{action: "guide_viewed\|installed\|dismissed", platform: "ios\|android\|desktop"}` → audit_logs (08 success-metrics PWA 설치율 측정용) |

## i18n locale API (batch-005, 2026-05-16)

| 메서드 | 경로 | 권한 | 비고 |
|--------|------|------|------|
| GET | `/api/v1/i18n/messages?locale=ko\|en` | bypass (CDN 가능) | next-intl messages JSON. 화면별로 분할 가능: `?namespace=op-01` 등 |
| GET | `/api/v1/me/locale` | self | 본인 locale 조회 (캐시 무효화용) |
| PATCH | `/api/v1/me/profile` | self | body `{locale: 'ko'\|'en'}` 포함 — locale 즉시 변경 |

알림 발송 (CM-15) 시 수신자 `users.locale` 기준 자동 분기 (카카오/SMS는 `tenant_settings` 옵션 활성 시만 — `guardrails.md §10`):
- `ko`: 인앱+푸시(ko) → 이메일(ko 템플릿, Resend) → [옵션] 카카오 알림톡(ko) → [옵션] SMS(ko)
- `en`: 인앱+푸시(en) → 이메일(en 템플릿, Resend) → [옵션] SMS(en) (카카오 skip)

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 알림/파일/Excel/PDF/감사/플래그 평가/점검/헬스/Realtime 채널 | Phase 4 진입 |
| 2026-05-15 | 헤더 알림 미니(CM-17) / 도움말(CM-19) / 약관(CM-21) / 온보딩(CM-22) / PWA 설치 이벤트(CM-20) 엔드포인트 추가 | KI-028/030 batch-003 |
| 2026-05-16 | i18n: legal docs language 파라미터 + ko/en 페어 게시 + i18n messages API + locale별 알림 분기 | 사용자 결정 batch-005 |
| 2026-05-19 | CM-15 알림 채널 — 카카오/SMS 옵션 기능화 (kakao_fallback → kakao_enabled + sms_enabled tenant_settings 토글) + 이메일(Resend) 기본 폴백 승격 + NHN DEFER 반영 | WI-InfraPolicy-docs — 사용자 결정 (NHN 옵션 기능). SSOT: guardrails.md §10 |
