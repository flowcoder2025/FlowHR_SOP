# WI-020-6-feat ST-003 계정 활성화 — evaluator 채점 (Phase 7 code 모드)

> 평가일: 2026-06-01 | 대상 HEAD(평가 시점): 61bed1b | P2/P3 정정 후: 754898d

## 판정: **PASS** — WEIGHTED_TOTAL 8.28 / 10 (임계 8.0, 각 축 7.5)

| 축 | 점수 | 근거 요약 |
|----|------|----------|
| 기능 완성도 | 8.5 | 토큰 검증/만료/1회용/비번정책/약관/세션/역할 리다이렉트/운영사 강제2FA 완비. create-at-activate 로 forgot-password 우회 구조적 차단. stub/TODO 0. staging 실증(source=activate consent + migration 35 적용). |
| 코드 품질 | 8.5 | 단일 rpc 위임으로 orphan 제거 + 보상 삭제 명시 로깅(빈 catch 0). `any` 0. timingSafe 토큰. |
| 테스트 커버리지 | 8.0 | 단위(토큰 4 + activateSchema 4) fresh-run 통과 + E2E 4 시나리오(가드 ko/en + 만료 + 전체흐름 유니크이메일·1회용 + agree required). |
| 계약 준수 | 8.0 | api/auth.md activate 정합, audit user.activated, 점검 면제 /activate, database.ts enum/함수 staging 정합, i18n ko/en 패리티, RLS 6정책. |

> evaluator 독립 실측: turbo --force fresh(캐시0) schemas 51/web 52 통과 + Supabase MCP 로 migration/enum/함수/consent 6건 라이브 확인.

## NON_BLOCKING_OBSERVATIONS → 처리

- [P2] activate/actions.ts clientIp 가 헤더 부재 시 'unknown' 반환 → user_consents.ip_address(inet) 22P02 거부 → 컴플라이언스 동의 무음 누락. legal/actions.ts isIP→null 패턴과 불일치. → **머지 전 정정 완료(754898d)** — node:net isIP()→null 통일. (KI 불요)
- [P3] user.activated audit 페이로드 2회 복사. → **머지 전 정정 완료(754898d)** — activatedAudit 단일 추출. (KI 불요)
- [P3] CM-03 스펙(common.md §CM-03 "선택적 2FA 설정") in-flow 직원 2FA 셋업 단계 미구현 — 운영사는 활성화 후 /me/security 강제 리다이렉트로 대체, 직원 선택 2FA 는 활성화 후 /me/security 에서 가능(ST-004 재사용). API auth.md activate totpSetup 은 optional 이라 차단 아님. → **KI 등록**(KI-105).

## ISSUES: 없음 (전 축 ≥7.5, 가중 8.28 ≥ 8.0, 차단 0)

## 통합 (review-system.md §4)
- evaluator PASS 8.28 + codex PASS_VERIFIED = **PASS_BOTH**
- evaluator P2/P3 는 hotfix 권고였으나 컴플라이언스 로그(P2) 특성상 머지 전 정정(754898d). codex 4건은 정정 후 PASS_VERIFIED(WI-020-6-feat.codex.md).
