# Auth API (CM-01~05) + 세션 / 라우팅 가드

> Supabase Auth wrapper. JWT custom claims + 2FA TOTP + 잠금 정책.
> 2026-05-15 (KI-027/029 batch-003): 세션 관리(자기/타 운영사) + 라우팅 진입점 매핑 보강.

## 라우팅 진입점 매핑 (09-routing.md §3 참조)

`/api/v1/auth/login` 응답 `redirectTo` 결정 로직:

| JWT role | redirectTo | first_login_at IS NULL 시 |
|----------|-----------|--------------------------|
| operator_super, operator_staff | `/operator` | + CM-22 모달 트리거 (operator 4단계) |
| tenant_super, tenant_hr_admin | `/admin` | + CM-22 모달 트리거 (tenant 4단계) |
| tenant_manager | `/admin` | + CM-22 모달 트리거 (manager 4단계) |
| employee | `/me` | + CM-22 모달 트리거 (employee 4단계) |

`return_url` 쿼리가 있으면 권한 검사 후 우선 (세션 만료 후 복귀 — 09-routing.md §5).

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

## 세션 관리 (`/api/v1/me/security/sessions`, OP-12 + EM-09 보안 탭 공통)

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/api/v1/me/security/sessions` | 본인 | 활성 세션 목록 (Supabase auth.sessions + last_seen_at + ip + user_agent) |
| DELETE | `/api/v1/me/security/sessions/:id` | 본인 | 본인 다른 세션 종료 |
| DELETE | `/api/v1/me/security/sessions` | 본인 | 본인 모든 다른 세션 종료 (현재 세션 제외) |
| GET | `/api/v1/me/security/login-history?limit=50` | 본인 | 최근 로그인 이력 |

응답 (`GET sessions`):
```json
{
  "ok": true,
  "data": {
    "sessions": [
      {"id":"sid","current":true,"ipAddress":"1.2.3.4","userAgent":"Chrome 124","lastSeenAt":"2026-05-15T09:00:00Z","createdAt":"2026-05-15T08:00:00Z","location":"Seoul, KR"}
    ]
  }
}
```

## 운영사 강제 종료 (OP-12 super only, KI-029)

| 메서드 | 경로 | 권한 |
|--------|------|------|
| GET | `/api/v1/operator/users/:id/sessions` | operator_super | 다른 운영사 사용자 활성 세션 |
| POST | `/api/v1/operator/users/:id/force-logout` | operator_super | 모든 세션 무효화 + audit_logs |

요청:
```json
{ "reason": "string (필수, audit 기록)" }
```

응답:
```json
{
  "ok": true,
  "data": {
    "userId": "uuid",
    "terminatedSessions": 3,
    "auditLogId": "uuid"
  }
}
```

가드: target user가 마지막 active operator_super인 경우 차단 (`409 OPERATOR_SUPER_LAST_REMAINING`).

## 운영사 2FA 강제 가드 (OP-12)

`/api/v1/auth/login` 응답에서 `redirectTo` 결정 시:

```text
역할 IN (operator_super, operator_staff) AND totp_enabled = false
  → redirectTo: "/operator/me/profile?tab=security&forced=2fa"
  → 응답에 `forced2faSetup: true` 포함 → 클라이언트가 강제 모달
```

## 약관 강제 동의 가드

`/api/v1/auth/login` 응답에서:

```text
GET /api/v1/me/consents/required → 비어있지 않으면
  → 클라이언트가 redirectTo를 무시하고 /legal/terms?must_accept=true (또는 /legal/privacy)로 이동
  → 사용자 locale 기준 ko/en 약관 표시 (영문은 참고 번역 banner 표시)
  → 동의 후 원래 redirectTo로 복귀
```

## i18n locale 처리 (batch-005, 2026-05-16)

`/api/v1/auth/login` 및 모든 인증 응답에 `user.locale` 포함. 클라이언트가 next-intl init에 사용.

### locale 결정 우선순위
1. `users.locale` (DB 명시값) → 사용
2. 없거나 첫 로그인 → `Accept-Language` 헤더 검사 → `ko` / `en` 매칭
3. 매칭 실패 → `'ko'` (default)
4. 첫 로그인 시 자동 결정값을 `users.locale`에 INSERT (이후 본인이 EM-09/OP-12에서 변경 가능)

### locale 변경
```
PATCH /api/v1/me/profile { locale: 'ko' | 'en' }
→ users.locale 업데이트
→ 응답 후 클라이언트가 페이지 새로고침 + next-intl 메시지 재로드
→ 인앱 알림/이메일 발송 시 즉시 새 locale 적용
```

### 응답 본문 예시
```json
{
  "ok": true,
  "data": {
    "session": {...},
    "user": {
      "id": "uuid",
      "email": "...",
      "role": "employee",
      "locale": "en",
      "totpEnabled": false
    },
    "redirectTo": "/me"
  }
}
```

## 구현 노트 — 비밀번호 재설정 (CM-02 / WI-020-4, 2026-05-29)

Next.js App Router + @supabase/ssr 구현은 본 명세의 토큰-바디 API(`{ token, newPassword }`)와 다음과 같이 정합한다(codex 협의 2026-05-29):

- **토큰 수신**: `token_hash + verifyOtp({ type:'recovery' })` 채택. @supabase/ssr 기본 flowType=pkce 는 code_verifier 가 **신청 기기**에만 있어 "다른 기기에서 재설정 링크 클릭" 시 실패한다. token_hash 는 stateless 서버 검증이라 기기 무관.
- **콜백 라우트**: `GET /auth/confirm?token_hash=&type=recovery&redirect_to=` (locale prefix 없음, middleware `/auth` 제외). verifyOtp 로 recovery 세션 쿠키 수립 후 `redirect_to`(동일 origin 검증) 로 이동. 실패 시 `?error=invalid_token`.
- **재설정 폼**: `/{locale}/reset-password` 는 토큰을 싣지 않는다(이미 /auth/confirm 가 세션으로 소비). recovery 세션 확인 → `updateUser({ password })` → `signOut({ scope:'global' })`(현재 recovery 세션 포함 전 세션 무효화, AC-3) → `/login?reset=success`.
- **계정 열거 방지(AC-1)**: forgot-password 는 미등록/오류 모두 동일 `sent` 응답 + obscureTiming(응답 시간 균일화).
- **복구 흐름 게이트**: /auth/confirm 가 recovery verifyOtp 성공 시에만 단기 HttpOnly 마커(`fh-pw-recovery`=userId, 15분)를 설정. reset-password 페이지/액션이 recovery 세션 **+ 마커(=본인)** 를 모두 요구 → 일반 로그인 세션의 직접 재설정 차단(codex 듀얼검증 P1).
- **감사 로그**: `auth.password_reset_requested`(forgot 요청, best-effort) / `auth.password_reset`(reset 결과 — signOut 실패 시 `result=failed` 로 세션 잔존 위험 기록).
- **이메일 템플릿 의존**: 위 흐름은 Recovery 메일이 `/auth/confirm` 으로 token_hash 를 전달하도록 **이메일 템플릿 커스터마이즈**가 전제. 로컬은 `supabase/config.toml [auth.email.template.recovery]` + `supabase/templates/recovery.html`. **원격(staging/prod)은 대시보드 수동 설정 필요(KI-098)** + Redirect URL allow-list 에 배포 도메인 등록.
- **검증 경계**: 실메일 발송 + cross-device 클릭 자동 E2E 는 Free SMTP + 대시보드 의존으로 미검증(KI-097). 스키마/정책/동일응답/세션-없는-만료안내는 unit + E2E 로 검증.

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 — 9 엔드포인트 (로그인 + 2FA + 비밀번호 + 활성화) | Phase 4 진입 |
| 2026-05-15 | 라우팅 진입점 매핑 + 세션 관리 + 운영사 강제 종료/2FA + 약관 가드 | KI-027/029 batch-003 |
| 2026-05-16 | i18n: login response.user.locale + locale 결정 우선순위 + PATCH locale | 사용자 결정 batch-005 |
| 2026-05-29 | 비밀번호 재설정 SSR 구현 노트 (token_hash+verifyOtp / /auth/confirm / signOut global) | WI-020-4 ST-002 |
