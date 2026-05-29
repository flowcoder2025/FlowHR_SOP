# WI-020-3-feat ST-072 오류/점검 — codex 듀얼검증

> 검증일: 2026-05-29 · read-only diff 리뷰 (`git diff main...HEAD`) · 모델 gpt-5.x

## 라운드 1 — CONDITIONAL

P0 없음. P1×1 + P2×1 + P3×1.

| 심각도 | 영역 | 위치 | 설명 |
|--------|------|------|------|
| P1 | 우회/차단 보안 | `middleware.ts:43` / `queries.ts` `isMaintenanceExempt` | `/login`·`/maintenance` prefix 면제로 중첩 경로(`/ko/login/foo` 등)가 점검 중 503 대신 404 fall-through. 향후 중첩 인증 라우트가 의도치 않게 면제될 위험 → exact match 권장 |
| P2 | i18n 키 정합 | `{ko,en}.json` | CM-06 §4 catalog 의 `serviceUnavailable.*`/`network.title` 키가 locale 파일에 없음 |
| P3 | RLS 컬럼 노출 | `..._rls.sql:96` / `queries.ts:28` | `maintenance_windows` `using(true)` — anon Data API 직접 조회 시 `created_by` 등 노출. 미들웨어는 안전 컬럼만 select(직접 위험 없음), REST 직접 호출 잔여 위험 |

### 통과 영역 (codex PASS)

- 503 rewrite / Retry-After / redirect loop 없음
- 15s TTL 캐시 + fail-open
- Sentry 추상화 seam / instrumentation.ts Next 15 시그니처
- operator_super 우회 + 로그인 기본 경로

## 라운드 2 — hotfix 정정 후

| 지적 | 처리 |
|------|------|
| P1 prefix 면제 | **hotfix** — `isMaintenanceExempt` 를 `Set.has(restPath)` exact match 로 변경. 미정의 중첩 경로는 점검 중 503 대상. unit test 음성 케이스 추가(`/login/foo`·`/maintenance/anything`·`/login-something` → false). vitest 14/14 |
| P2 catalog 키 | **doc 정합** — `serviceUnavailable.*`/`network.*` 은 ST-072 범위 외 확장 상태(§8 유보). CM-06 §4 에 "locale 파일은 catalog 의 부분집합, 확장 상태 구현 WI 에서 키 추가(dead key 방지)" 노트 추가 |
| P3 RLS 노출 | **KI-096** 등록 (column-level grants / public_view 후속) |

→ **codex 재검증: PASS_VERIFIED** (아래 라운드 2 결과 반영)

## 통합 판정 (review-system.md §4)

- evaluator: PASS (8.40, 4축 ≥8.0)
- codex: 라운드1 CONDITIONAL → hotfix → 라운드2 PASS_VERIFIED
- **통합: PASS_BOTH** (hotfix 후)
