# WI-020-5-feat ST-004 2FA TOTP — evaluator 채점 (Phase 7 code 모드)

> 평가일: 2026-05-29 | 대상 커밋(평가 시점): bd7405a | 정정 후: 5f981dc

## 판정: **PASS** — WEIGHTED_TOTAL 8.93 / 10 (임계 8.0, 각 축 7.5)

| 축 | 점수 | 근거 요약 |
|----|------|----------|
| 기능 완성도 | 9.0 | codex 설계 7항목 전부 구현(challenge 격리클라이언트·enable/disable·복구코드 scrypt·OTP 5회 잠금 재사용·operator 강제 2FA·점검 면제·audit 5종). 5상태 매트릭스 매핑. stub/TODO 0. 엣지(challenge 만료/위변조/2FA-OFF-during-challenge) fail-closed. |
| 코드 품질 | 9.0 | 순수/server-only 계층 분리(crypto·totp·recovery-codes 순수 = 단위테스트 / two-factor·store = server-only). `any` 0, 빈 catch 0(전부 fail-closed). fail-closed 일관(키 부재 throw). lint 20/20. |
| 테스트 커버리지 | 8.5 | schemas 47 + web 48 직접 재실행 PASS. 위변조/다른키/1회용/형식거부/salt다양성/timingSafe + discriminatedUnion 음성. E2E 양성+음성. 감점: server-only 오케스트레이션은 staging E2E 의존(env 게이트 → KI-100). |
| 계약 준수 | 9.0 | api/auth.md §2FA SSR 노트 + CM-04 정합노트 + HANDOFF §-0h 7항목 1:1. audit_logs 컬럼 일치. i18n ko/en 164/164 패리티. |

## NON_BLOCKING_OBSERVATIONS → KI 등재

- [P2→P3] disable/enroll 비밀번호+코드 재확인이 login_attempts 잠금 미연동 — **이미 인증된 세션 + 필수 2차 인증(TOTP/복구코드)** 이중 게이트로 위협 완화(pre-auth 브루트포스 KI-078 대비 낮음). 스펙 위반 아님(하드닝). → **KI-102 (P3)**
- [P3] confirmEnroll 6자리 시도 제한 없음(10분 setup 쿠키 바운드, 미인증 불가) → KI-102 에 포함
- [P3] KI-099/100 전방참조가 INDEX 미등재였음 → 본 사이클에서 KI-099/100/101/102 정식 등재로 해소
- [P3] disable 복구코드 경로가 remaining 폐기(직후 disableTotp 전체 null → 무해, redundant) → 가독성 메모(코드 변경 불요)
- [P3] operator 강제 2FA 판정 시 system_settings 를 세션 클라이언트로 조회 — RLS `system_settings_read using(is_operator())` 확인됨(operator 읽기 허용). require_operator_2fa=false 정상 반영. **결함 아님(staging 확인 완료)**

## ANTI_PATTERNS: 없음 (TODO/any/빈 catch/하드코딩 0건)

## ISSUES: 없음 (차단 사유 없음)

> 통합 판정은 codex 듀얼검증과 review-system.md §4 매트릭스로 결정. codex 1차 FAIL(P1 fail-open + P2×3) → 정정 4건(5f981dc) → codex 재검증 후 PASS_BOTH 마커 생성.
