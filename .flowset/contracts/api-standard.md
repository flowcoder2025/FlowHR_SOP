# API 응답 형식 계약

> 웹/PWA/네이티브앱 3개 클라이언트가 공유하는 단일 API 응답 규약.

## 1. 응답 봉투 (Envelope)

### 성공
```json
{
  "ok": true,
  "data": <T>,
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-05-15T10:00:00Z",
    "tenantId": "uuid|null"
  }
}
```

### 페이지네이션 (목록 조회)
```json
{
  "ok": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 153,
      "totalPages": 8
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
    "message": "사용자에게 보여줄 한글 메시지",
    "fields": {"email": "이메일 형식이 올바르지 않습니다"},
    "traceId": "uuid"
  },
  "meta": {...}
}
```

## 2. HTTP 상태 코드

| 코드 | 의미 | 사용처 |
|------|------|--------|
| 200 | OK | 조회, 수정 |
| 201 | Created | 생성 |
| 204 | No Content | 삭제 |
| 400 | Bad Request | 입력 검증 실패 |
| 401 | Unauthorized | 세션 없음/만료 |
| 403 | Forbidden | 권한 없음 (RLS 차단 포함) |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 중복(사업자번호, 도메인, 이메일) |
| 422 | Unprocessable | 비즈니스 규칙 위반 |
| 429 | Too Many Requests | Rate limit |
| 500 | Internal Server Error | 서버 오류 |

## 3. 에러 코드 (네임스페이스 단위)

| 네임스페이스 | 예시 코드 |
|-------------|----------|
| `AUTH_*` | `AUTH_INVALID_CREDENTIALS`, `AUTH_SESSION_EXPIRED`, `AUTH_2FA_REQUIRED` |
| `TENANT_*` | `TENANT_NOT_FOUND`, `TENANT_INACTIVE`, `TENANT_QUOTA_EXCEEDED` |
| `EMPLOYEE_*` | `EMPLOYEE_DUPLICATE_EMAIL`, `EMPLOYEE_INVALID_STATUS` |
| `ATTENDANCE_*` | `ATTENDANCE_ALREADY_CLOCKED_IN`, `ATTENDANCE_OUT_OF_LOCATION` |
| `LEAVE_*` | `LEAVE_INSUFFICIENT_BALANCE`, `LEAVE_OVERLAP` |
| `APPROVAL_*` | `APPROVAL_NOT_AUTHORIZED`, `APPROVAL_ALREADY_PROCESSED` |
| `DOC_*` | `DOC_NOT_VIEWABLE`, `DOC_EXPIRED` |
| `VALIDATION_*` | `VALIDATION_REQUIRED`, `VALIDATION_FORMAT` |
| `RATE_LIMIT` | — |

## 4. 인증 / 권한

- **인증 전송**: `Authorization: Bearer <jwt>` (Supabase 세션 토큰)
- **테넌트 컨텍스트**: JWT claim `tenant_id` 또는 헤더 `X-Tenant-Id` (운영사 화면용)
- **권한 검증 순서**: JWT 검증 → 역할 매핑 → Supabase RLS → 비즈니스 규칙

## 5. 페이지네이션 / 정렬 / 필터

- 쿼리: `?page=1&pageSize=20&sort=-createdAt&filter[status]=active`
- `pageSize` 최대 100, 기본 20
- `sort`: `-` 접두사로 내림차순
- `filter[필드명]` 형식 (다중 값은 콤마)

## 6. 멱등성 (Idempotency)

- POST/PATCH에 `Idempotency-Key: <uuid>` 헤더 지원 (출퇴근 기록, 결재 처리 등)
- 24시간 캐시 후 동일 키로 재호출 시 캐시 응답

## 7. 버전 관리

- URL 프리픽스: `/api/v1/`
- 호환성 깨지는 변경은 `/api/v2/`로 분리, 최소 6개월 병행 운영
