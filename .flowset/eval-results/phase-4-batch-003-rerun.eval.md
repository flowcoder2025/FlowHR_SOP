# Phase 4 Re-evaluation (WI-KI-batch-003)

- **Date**: 2026-05-15
- **WI**: WI-KI-batch-003-rerun-phase4
- **Mode**: doc
- **이전 평가**: phase-4.eval.md (8.78/10)
- **재평가 사유**: API 보강 후 정합성·완성도 재확인

## SCORES

| 축 | 가중 | 점수 | 근거 |
|----|------|------|------|
| 완성도 | 30% | 8.5 | 9개 파일 모두 존재. CM-17/19/20/21/22 신규 엔드포인트 common.md L185-294 채워짐. force-logout, 세션, 라우팅, 약관 가드 명시. 차감: OP-12-profile.md §7 호출 API 6종이 api/*.md 어디에도 정의되지 않음. |
| 정합성 | 25% | 8.0 | matrix.json LegalDocument/UserConsent ↔ common.md 1:1. db/erd ↔ schemas 일치. 차감: schemas.md L340 `Envelope(...)` 미정의 식별자 (정의는 `SuccessEnvelope`) — Phase 7 빌드 차단. OP-12 API 6종 누락. |
| 구체성 | 25% | 9.0 | TBD/추후 0건. force-logout 응답, 약관 강제 동의 응답, CM-22 액션 enum 명시. v1.1/v1.2 시점 명시. |
| 실행가능성 | 20% | 8.0 | Phase 5 와이어프레임 호출 가능 수준. 차감: OP-12 와이어프레임 작업 시 6종 API 추가 질의. |

**WEIGHTED_TOTAL**: 8.40/10 (이전 8.78 → 8.40 -0.38)
**THRESHOLD**: 8.0 (각 축 7.5)
**VERDICT**: ✅ **PASS**

## NON_BLOCKING

**즉시 처리 (Phase 종료 게이트 P0/P1 0건 의무)**:
- [P1] api/operator.md & api/employee.md — OP-12-profile.md §7 호출 API 6종 미정의:
  - `GET /api/v1/operator/me/profile`
  - `PATCH /api/v1/operator/me/profile`
  - `POST /api/v1/operator/me/avatar`
  - `POST /api/v1/me/security/2fa/regenerate`
  - `GET /api/v1/me/notifications/preferences` + `PATCH`
  - `GET /api/v1/me/audit-logs?days=30`
- [P2] api/schemas.md:340 — `Envelope` → `SuccessEnvelope` 정정 (또는 alias)

**KI-036 (P3 묶음)**:
- [P3] api/auth.md:230 — `GET /operator/users/:id/sessions` 응답 본문 미정의
- [P3] api/cron.md:65-83 — `tenant_settings.value` jsonb 경로 db 정합 미확인
- [P3] api/common.md:111 — KI-026 정책 정합 Phase 7 재검증
