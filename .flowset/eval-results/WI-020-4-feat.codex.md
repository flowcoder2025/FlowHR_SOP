# WI-020-4-feat ST-002 비밀번호 찾기/재설정 (CM-02) — codex 듀얼검증

> read-only review / 3 라운드 / 2026-05-29

## 최종 판정: PASS_VERIFIED (잔존 0건)

## 라운드 경과

### 라운드 1 — CONDITIONAL (P1×2)
- **P1-1**: `/reset-password` 가 `getUser()`만 검증 → 일반 로그인 세션으로도 접근 + `updateUser({password})` 가능. 복구 흐름 전용 검증 없음.
- **P1-2**: `signOut({scope:'global'})` 에러 미검사 + success audit이 signOut 前 기록 → "비번 변경 성공 + 기존 세션 잔존 + success audit" 가능.
- PASS 영역: open redirect(sanitizeNext/resolveOrigin), 쿠키 어댑터(req/res), 계정 열거/obscureTiming, 비번 정책 SSOT, 점검 면제 exact match(WI-020-3 P1 재발 없음), i18n ko/en parity, audit 신규 액션.

### hotfix 1 (`f381291`)
- P1-1 → recovery 마커(HttpOnly, userId 바인딩) page+action 양쪽 게이트.
- P1-2 → signOut error 검사+로깅 + audit를 signOut 뒤로(result=failed 반영).
- (evaluator P2) i18n 키 상대화 + P3 config 비번 floor 10 / auth.md 감사 액션.

### 라운드 2 — CONDITIONAL (P1×1 잔존 + P2 신규 회귀)
- **P1-1 잔존**: 마커가 서명 없는 raw cookie(=userId 단순 비교) → 세션 보유자가 `fh-pw-recovery=<own id>` 직접 주입해 OTP 없이 우회 가능. 서명 필요.
- **P2 회귀**: `reset-form.tsx` `t('policy_title')` 가 `auth.reset` 네임스페이스 조회 → `auth.reset.policy_title` 부재(실제 `auth.password.policy_title`).
- P1-2 해소 확인 / P3 반영 확인.

### hotfix 2 (`57a0972`)
- P1-1 → **HMAC-SHA256 서명 마커**(`userId.exp.HMAC`, 키=SUPABASE_SERVICE_ROLE_KEY 서버전용, 15분 TTL, fail-closed). recovery-marker.ts 순수 분리 + 8 위조/만료/변조 거부 단위테스트.
- P2 → `tp = useTranslations('auth.password')` 로 `policy_title` 정정.

### 라운드 3 — PASS_VERIFIED
| 점검 | 판정 |
|------|------|
| HMAC 마커 위조 불가 (timingSafeEqual, raw/forged/타secret/exp변조/만료/형식 거부) | PASS |
| SERVICE_ROLE_KEY 재사용 타당성 (서버 전용, client 미노출) | PASS (전용 secret 분리는 향후 권고) |
| 마커 단일사용 (verifyOtp 성공 시만 발급, 사용 후 쿠키삭제+global signOut) | PASS (서버 nonce 강한 replay 차단 부재는 현 위협모델 P2 미만) |
| policy_title 회귀 해소 (auth.password 네임스페이스) | PASS |
| 신규 회귀 | 없음 |

## 종합
HMAC 마커는 userId+exp 를 서명 payload 에 묶어 세션 보유자가 비밀 없이 유효 마커를 만들 수 없다. SERVICE_ROLE_KEY 재사용은 키 분리 관점 비이상적이나 서버 전용 비밀이며 차단 사유 아님(WI-020-5 env-key 인프라 시 전용 secret 분리 가능 — 후속 권고).
