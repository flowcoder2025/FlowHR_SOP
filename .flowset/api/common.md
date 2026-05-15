# Common API (CM-07~15)

> 공통 인프라 — 알림, 파일, Excel, PDF, 감사 로그. 모든 도메인에서 공유.

## 알림 (CM-07, CM-15)

### 인앱 알림 — `/api/v1/me/notifications` (employee.md EM-10 참조)

### 시스템 알림 발송 (서버 내부 + Edge Function)
- 클라이언트에 직접 노출되지 않음. Edge Function 또는 트리거에서 호출.
- 채널 우선순위:
  ```
  1. 인앱 (notifications INSERT + Realtime broadcast)
  2. PWA Push (Web Push API, iOS 16.4+ + 홈화면 설치)
  3. 카카오 알림톡 (30분 미열람 시) — tenant_settings.notifications.kakao_fallback
  4. SMS (1시간 + 카카오 미수신)
  5. 이메일 (24시간 미열람, 중요 알림만)
  ```
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
- 핵심 테이블 11개: employees, leaves, approvals, attendances, documents, users, tenants, subscriptions, invoices, feature_flags, tenant_settings
- 모든 APPROVE/REJECT/CANCEL 액션
- 로그인 / 로그아웃 / 비밀번호 변경 / 2FA 변경
- 권한 변경, 테넌트 비활성화, 점검 모드 토글

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

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 알림/파일/Excel/PDF/감사/플래그 평가/점검/헬스/Realtime 채널 | Phase 4 진입 |
