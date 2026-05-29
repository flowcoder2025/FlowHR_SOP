# WI-020-4-feat ST-002 비밀번호 찾기/재설정 (CM-02) — evaluator 채점

> mode: code / phase 7 / 듀얼검증 1차 / 2026-05-29

## 판정: PASS (가중 총점 8.15/10, 각 축 ≥ 7.5)

| 축 | 점수 | 근거 |
|----|------|------|
| 기능 완성도 | 8.5 | AC-1 계정열거방지(forgot actions 항상 sent + obscureTiming) / AC-2 60분(config.toml otp_expiry=3600) / AC-3 전세션무효화(reset actions signOut scope:global) 충족. 오픈리다이렉트 방지(/auth/confirm sanitizeNext) 엣지 probe 통과. 점검 면제 exact-match + /auth 제외 일관. stub/TODO 0건 |
| 코드 품질 | 8.5 | any/TODO/빈catch 0건. 정책 SSOT 데이터화(서버·클라 공유). safeAudit best-effort + console.error. sanitizeNext·resolveOrigin·obscureTiming 단일책임 분리. (감점: messageKey 컨벤션 login 불일치 — P2) |
| 테스트 커버리지 | 7.5 | 단위 schemas 41 + web 14 + e2e 4pass/1skip 실측 PASS. 정책 5규칙·mismatch·점검면제 음성케이스·retryAfter 경계·fail-open. (감점: 폼 에러 렌더 경로 무검증 — P2 미포착 / cross-device 실재설정 KI) |
| 계약 준수 | 8.0 | Server Action 패턴(ForgotState/ResetState)으로 envelope 대체, auth.md 구현노트 협의 정합. token_hash+verifyOtp 근거 문서화. DB·RLS·matrix.json 정합. (감점: 신규 audit action 미열거 — P3) |

WEIGHTED_TOTAL: 8.5×0.30 + 8.5×0.25 + 7.5×0.25 + 8.0×0.20 = **8.15**

## NON_BLOCKING_OBSERVATIONS

- **[P2]** forgot/reset action 이 전체경로 messageKey(`auth.forgot.error.invalid` 등)를 네임스페이스 `t()` 에 전달 → next-intl 이중 연결 → reset 폼 검증 에러 전부 원시 키 노출. createTranslator 재현(MISSING_MESSAGE 4건). **→ 정정됨(hotfix f381291 — 상대 키 통일 + 회귀 테스트 추가)**
- **[P3]** api/auth.md §Audit 신규 액션(password_reset_requested/password_reset) 미열거. **→ 정정됨(auth.md 구현노트 감사 액션 등록)**
- **[P3]** config.toml minimum_password_length=6 (앱 정책 ≥10 대비 느슨). **→ 정정됨(10 + password_requirements 복합)**
- **[P3]** 로컬 resolveOrigin localhost vs config 127.0.0.1 — 운영 NEXT_PUBLIC_SITE_URL 고정 무해. 인지만(KI-097/098 범위).

## ISSUES

차단 이슈 없음(PASS). P2/P3는 codex P1 정정과 함께 hotfix 처리.
