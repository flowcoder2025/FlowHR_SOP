# WI-020-5-feat ST-004 2FA TOTP — codex 듀얼검증 (read-only)

> 모델 gpt-5.x | 1차 대상 bd7405a → 정정 5f981dc 재검증

## 1차 리뷰: **FAIL** (실결함 4건 검출 — 게이트 모범 사례)

| # | 등급 | 결함 | 위치 |
|---|------|------|------|
| 1 | **P1** | 프로필 조회 미스/오류를 무시하고 `totp_enabled=false` 처리 → 일시적 RLS/읽기 실패 시 2FA 사용자가 OTP 없이 세션 발급(세션 미수립 보장 위반, fail-open) | login/actions.ts |
| 2 | P2 | challenge `jti` 서버 미소비 → 만료 전 challenge 쿠키 복사 재생 가능 | two-factor.ts / two-factor/actions.ts |
| 3 | P2 | 복구코드 소비 비원자(read→메모리제거→blind update) → 동일 코드 병렬 제출 시 양쪽 통과(단일사용 위반) | two-factor/actions.ts / two-factor-store.ts |
| 4 | P2 | operator 강제 2FA 가드 프로필 조회 실패 시 fail-open(+ disable role nullable 동일 패턴) | operator-2fa-guard.ts / me/security/actions.ts |

## 정정 (5f981dc) 재검증: **PASS_VERIFIED**

| # | 상태 | 정정 확인 |
|---|------|----------|
| 1 | **RESOLVED** | `profileError` 캡처 + `if (profileError||!profile)` → auth.login_failed 감사 후 `error.unexpected` 반환(setSession 진입 불가) |
| 4 | **RESOLVED** | operator-2fa-guard `error||!profile` → `/login` redirect(fail-closed) + disableAction `role===null` 차단 |
| 3 | **RESOLVED** | `consumeRecoveryHash` `.contains('recovery_codes_hash',[matchedHash])` CAS — Postgres 행 잠금 하 `@>` 재평가로 동일 코드 병렬 1회만 성공, 0행 시 verified=false. matchedHash 반환 추가 |
| 2 | **ACCEPTABLE_DEFERRAL → KI-101 (P3)** | (a) 서버측 jti 저장소 = DB 스키마 변경(범위 외 + §5/§7-2 사용자 승인) (b) HttpOnly+Secure+5분 협소 위협 (c) WI-020-4 recovery-marker(HMAC 15분) 동일 패턴 PASS 선례. **머지 차단 아님** |

## 통합 verdict: **PASS_VERIFIED** (잔존 머지 차단 결함 0)

→ evaluator PASS 8.93 + codex PASS_VERIFIED = **PASS_BOTH** (review-system.md §4)
