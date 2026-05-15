# API 규약 (contracts/api-standard.md 확장)

> 본 문서는 `.flowset/contracts/api-standard.md`(SSOT) 위에 Phase 4 구체화. 280개 엔드포인트 공통 규칙.

## 1. URL 구조

```
https://api.flowhr.kr/v1/{도메인}/{리소스}
도메인: auth | me | operator | tenant | feature-flags
```

| 도메인 | 사용자 | RLS |
|-------|------|-----|
| `/api/v1/auth/*` | 비로그인 (로그인/2FA/비밀번호 찾기) | bypass |
| `/api/v1/me/*` | 모든 로그인 사용자 (본인 데이터) | self_only |
| `/api/v1/operator/*` | `operator_*` 역할만 | operator |
| `/api/v1/tenant/*` | `tenant_*` 역할 + 본인 테넌트 데이터 | tenant_isolation |
| `/api/v1/feature-flags` | 모든 로그인 사용자 (런타임 평가) | own_tenant + merge |

## 2. 인증

- **헤더**: `Authorization: Bearer <jwt>` 필수 (`/api/v1/auth/*` 제외)
- **JWT claims** (Supabase Auth custom):
  ```json
  {
    "sub": "user-uuid",
    "tenant_id": "tenant-uuid|null",
    "employee_id": "employee-uuid|null",
    "role": "operator_super|operator_staff|tenant_super|tenant_hr_admin|tenant_manager|employee",
    "tenant_super": false,
    "exp": 1234567890
  }
  ```
- **Realtime 인증**: 동일 JWT를 Supabase Realtime websocket 핸드셰이크에 전달
- **API Key**: `X-Api-Key: <key>` (TA-14 / OP-11에서 발급, JWT 대신 사용 가능)

## 3. 응답 envelope

### 성공 (200/201/204)
```json
{
  "ok": true,
  "data": <T | { items, pagination } | null>,
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-05-15T10:00:00Z",
    "tenantId": "uuid|null"
  }
}
```

### 페이지네이션
```json
{
  "ok": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 153,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "meta": {...}
}
```

### 실패
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "이메일 형식이 올바르지 않습니다",
    "fields": {"email": "INVALID_FORMAT"},
    "traceId": "uuid"
  },
  "meta": {...}
}
```

## 4. HTTP 상태 코드

| 코드 | 사용처 |
|------|------|
| 200 | GET / PATCH / 일반 성공 |
| 201 | POST 생성 — `Location` 헤더에 새 리소스 URL |
| 202 | 비동기 작업 시작 (CSV export 등) — `data.jobId` 반환 |
| 204 | DELETE / 단순 성공 (응답 본문 없음) |
| 400 | `VALIDATION_ERROR` — 입력 검증 실패 |
| 401 | `AUTH_*` — 세션 없음/만료/2FA 필요 |
| 403 | `FORBIDDEN` — RLS 차단 / 권한 부족 |
| 404 | `NOT_FOUND` — 리소스 없음 또는 RLS로 접근 불가 (정보 노출 방지) |
| 409 | `*_DUPLICATE` — 사업자번호/도메인/이메일 중복 |
| 422 | `*_RULE_VIOLATION` — 비즈니스 규칙 위반 (예: `LEAVE_INSUFFICIENT_BALANCE`) |
| 429 | `RATE_LIMIT` |
| 500 | `INTERNAL_ERROR` (Sentry 자동 보고) |
| 503 | `MAINTENANCE` (점검 모드) |

## 5. 페이지네이션 / 정렬 / 필터

### 쿼리 파라미터
```
?page=1&pageSize=20&sort=-createdAt,name&filter[status]=active&filter[department]=dept-uuid&q=홍길동
```

- `page`: 1부터 시작, 기본 1
- `pageSize`: 기본 20, 최대 100
- `sort`: 콤마 구분, `-` 접두는 내림차순. 정렬 가능 컬럼은 엔드포인트별 명시
- `filter[필드]`: 필터 값. 다중 값은 콤마 (`filter[status]=active,probation`)
- `q`: 자유 텍스트 검색 (엔드포인트별 검색 대상 정의)

## 6. 멱등성 (Idempotency)

- **POST/PATCH**: 클라이언트가 `Idempotency-Key: <uuid>` 헤더 전달
- 서버 캐시 TTL: 24시간
- 동일 키 재요청: 캐시된 응답 그대로 반환 (HTTP 코드 + body)
- **출퇴근 / 결재 처리** 엔드포인트는 멱등성 필수 (오프라인 큐 재전송 대비)

## 7. 버전 관리

- URL 프리픽스: `/api/v1/`
- 호환성 깨짐: `/api/v2/`로 분리, 최소 6개월 병행 (v1 deprecation 알림)
- 마이너 변경 (선택 필드 추가): v1 내 backward-compatible

## 8. Rate Limiting

| 도메인 | 기본 한도 |
|-------|---------|
| `/api/v1/auth/*` | IP당 5회/분 (브루트포스 방지) |
| `/api/v1/me/attendance/clock-*` | employee당 60회/분 (오프라인 큐 대비 너그러움) |
| 그 외 | user당 600회/분 (10/초) |

초과 시 429 + `Retry-After` 헤더.

## 9. CORS

- Vercel 호스팅 도메인: `https://app.flowhr.kr`, `https://staging.flowhr.kr`, `https://*.vercel.app` (preview)
- Tauri Desktop: `tauri://localhost` (Tauri WebView origin)
- `Access-Control-Allow-Credentials: true`

## 10. 응답 시간 SLO

| 엔드포인트 유형 | p50 | p95 | p99 |
|---------------|-----|-----|-----|
| 조회 (GET) | ≤ 200ms | ≤ 500ms | ≤ 1500ms |
| 변경 (POST/PATCH/DELETE) | ≤ 300ms | ≤ 700ms | ≤ 2000ms |
| 일괄 처리 (Excel 업로드 등) | ≤ 5s | ≤ 30s | ≤ 60s (≥ 5s는 비동기 202) |
| 출퇴근 clock-in/out | ≤ 200ms | ≤ 500ms | ≤ 800ms |
| 로그인 | ≤ 500ms | ≤ 1s | ≤ 2s |

위반 시 Sentry Performance Alert.

## 11. 에러 코드 카탈로그

`api-standard.md §3` 확장:

```
AUTH_INVALID_CREDENTIALS / AUTH_LOCKED / AUTH_2FA_REQUIRED / AUTH_2FA_INVALID
AUTH_SESSION_EXPIRED / AUTH_INVITATION_EXPIRED / AUTH_INVITATION_USED

TENANT_NOT_FOUND / TENANT_INACTIVE / TENANT_QUOTA_EXCEEDED
TENANT_BUSINESS_NUMBER_DUPLICATE / TENANT_DOMAIN_DUPLICATE / TENANT_ADMIN_EMAIL_DUPLICATE

EMPLOYEE_NOT_FOUND / EMPLOYEE_DUPLICATE_EMAIL / EMPLOYEE_DUPLICATE_EMPLOYEE_NUMBER
EMPLOYEE_INVALID_STATUS / EMPLOYEE_RESIGN_BLOCKED (활성 결재 있음)

ATTENDANCE_ALREADY_CLOCKED_IN / ATTENDANCE_NOT_CLOCKED_IN
ATTENDANCE_OUT_OF_LOCATION / ATTENDANCE_LOCATION_REQUIRED

LEAVE_INSUFFICIENT_BALANCE / LEAVE_OVERLAP / LEAVE_DATE_INVALID
LEAVE_EVIDENCE_REQUIRED / LEAVE_TYPE_NOT_FOUND

APPROVAL_NOT_AUTHORIZED / APPROVAL_ALREADY_PROCESSED / APPROVAL_INVALID_STEP

DOC_NOT_VIEWABLE / DOC_EXPIRED / DOC_TEMPLATE_NOT_FOUND
CERTIFICATE_TYPE_INVALID

VALIDATION_ERROR / VALIDATION_REQUIRED / VALIDATION_FORMAT / VALIDATION_RANGE

RATE_LIMIT / MAINTENANCE / FORBIDDEN / NOT_FOUND / INTERNAL_ERROR
```

## 12. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — API 규약 확장 + 12개 섹션 + 에러 코드 카탈로그 | Phase 4 진입 |
