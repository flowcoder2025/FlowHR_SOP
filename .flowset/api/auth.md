# Auth API (CM-01~05)

> Supabase Auth wrapper. JWT custom claims + 2FA TOTP + 잠금 정책.

## 엔드포인트 표

| 메서드 | 경로 | 화면 | 인증 | 설명 |
|--------|------|------|------|------|
| POST | `/api/v1/auth/login` | CM-01 | bypass | 이메일/비밀번호 로그인. 2FA 활성 시 `requires2fa: true` 반환 |
| POST | `/api/v1/auth/2fa/verify` | CM-04 | bypass (challenge 토큰) | TOTP 6자리 검증 → 최종 세션 발급 |
| POST | `/api/v1/auth/logout` | header | bearer | 현재 세션 무효화 |
| POST | `/api/v1/auth/refresh` | (자동) | refresh token | 액세스 토큰 갱신 |
| POST | `/api/v1/auth/forgot-password` | CM-02 | bypass | 재설정 토큰 메일 발송 (계정 존재 무관 동일 응답) |
| POST | `/api/v1/auth/reset-password` | CM-02 | reset token | 새 비밀번호 설정 + 모든 세션 무효화 |
| POST | `/api/v1/auth/activate` | CM-03 | invitation token | 초대 토큰 활성화 + 비밀번호 + 약관 + 선택적 2FA |
| GET | `/api/v1/auth/activate/:token` | CM-03 | bypass | 토큰 유효성 사전 검증 |
| POST | `/api/v1/auth/invitations/resend` | CM-03 | bypass (이메일) | 만료된 토큰 재발송 요청 |

## POST /api/v1/auth/login

### Request
```json
{
  "email": "user@example.com",
  "password": "string (≥10자, 영문대소문자+숫자+특수)",
  "rememberMe": true
}
```

### Response 200 (정상 + 2FA 비활성)
```json
{
  "ok": true,
  "data": {
    "session": {
      "accessToken": "jwt",
      "refreshToken": "jwt",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    },
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "employee",
      "employeeId": "emp-uuid",
      "tenantId": "tenant-uuid",
      "totpEnabled": false
    },
    "redirectTo": "/me"
  },
  "meta": {...}
}
```

### Response 200 (2FA 필요)
```json
{
  "ok": true,
  "data": {
    "requires2fa": true,
    "challengeToken": "short-lived-jwt (5분)",
    "user": {"id":"...","email":"..."}
  }
}
```

### Errors
- `401 AUTH_INVALID_CREDENTIALS` — 이메일/비밀번호 불일치
- `401 AUTH_LOCKED` — 5회 실패 잠금 (`Retry-After: 300`)
- `429 RATE_LIMIT` — 분당 5회 초과 (IP 기반)

### Rate Limit
- IP당 5회/분
- 5회 실패 시 (`email`, `ip`) 페어 5분 잠금

### Audit
- 성공 시 `auth.login` (result=success)
- 실패 시 `auth.login_failed` (result=failed, before/after 비공개)
- 잠금 시 `auth.locked` (result=denied)

## POST /api/v1/auth/2fa/verify

### Request
```json
{
  "challengeToken": "from /login",
  "code": "123456"  // 또는 복구 코드 (8자리 형식)
}
```

### Response 200
정상 로그인 응답과 동일 (session 포함).

### Errors
- `401 AUTH_2FA_INVALID` — 코드 불일치
- `401 AUTH_SESSION_EXPIRED` — challengeToken 5분 만료

### Audit
- 성공: `auth.2fa_verified`
- 실패: `auth.2fa_failed`
- 복구 코드 사용: `auth.recovery_code_used` (해당 코드 무효화)

## POST /api/v1/auth/forgot-password

### Request
```json
{ "email": "user@example.com" }
```

### Response 200 (항상 동일 — 계정 존재 노출 방지)
```json
{
  "ok": true,
  "data": { "message": "재설정 안내 메일을 발송했습니다." }
}
```

### 내부 처리
- 계정 존재 시: Supabase `resetPasswordForEmail()` + 60분 만료 토큰 메일 발송
- 미존재: 무작업, 동일 200 응답
- Rate Limit: IP당 5회/분

## POST /api/v1/auth/reset-password

### Request
```json
{
  "token": "reset-token",
  "newPassword": "string (≥10자, 정책)"
}
```

### Response 200
```json
{
  "ok": true,
  "data": { "message": "비밀번호가 재설정되었습니다. 다시 로그인하세요." }
}
```

### 내부 처리
- 토큰 검증 + 만료 확인
- 새 비밀번호 정책 검증 (10자+ 영문대소문자+숫자+특수)
- 사용자의 **모든 활성 세션** 무효화 (Supabase `signOut({scope:'global'})`)

### Errors
- `400 VALIDATION_ERROR` — 비밀번호 정책 위반 (fields.newPassword)
- `401 AUTH_INVITATION_EXPIRED` — 토큰 만료
- `401 AUTH_INVITATION_USED` — 이미 사용된 토큰

## POST /api/v1/auth/activate

### Request
```json
{
  "token": "invitation-token",
  "password": "...",
  "termsAccepted": true,
  "totpSetup": {
    "enabled": true,
    "secret": "base32",
    "code": "123456"
  }
}
```

### Response 200
정상 로그인 응답 + `redirectTo: "/me"` (또는 역할별).

### Errors
- `401 AUTH_INVITATION_EXPIRED` — 7일 만료
- `401 AUTH_INVITATION_USED` — 이미 사용
- `400 VALIDATION_ERROR` — 약관 미동의 / 비밀번호 정책 / TOTP 검증 실패

### Audit
- `user.activated` (target_type=user, target_id=user_id)
- TOTP 활성 시 `auth.2fa_enabled`

## POST /api/v1/auth/invitations/resend

### Request
```json
{ "email": "...", "type": "tenant_admin|employee" }
```

운영사(`operator_*`)는 OP-04에서 별도 엔드포인트 사용. 본 엔드포인트는 직원 본인이 만료된 초대 재발송 요청 (감사 로그 기록).

### Response 200 (항상 동일)
"메일을 발송했습니다." (계정 존재 노출 방지)

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 9 엔드포인트 (로그인 + 2FA + 비밀번호 + 활성화) | Phase 4 진입 |
