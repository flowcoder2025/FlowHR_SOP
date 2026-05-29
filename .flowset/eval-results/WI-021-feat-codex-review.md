# WI-021-feat — codex 듀얼검증 리뷰

> 출처: codex (codex:codex-rescue, read-only) · 2026-05-29 · 브랜치 feature/WI-021-feat-ci-openapi (커밋 2428b26)
> review-system.md §7-1 듀얼검증 1세트 (evaluator + codex). 통합 판정은 §4 매트릭스.

## 종합 판정: CONDITIONAL (P0/P1 0 · P2 2 · P3 3)

핵심 구조는 WI-021 범위와 대체로 일치. P0/P1 결함 없음. OpenAPI diff gate의 untracked false-pass(P2)와 E2E trace artifact 보안(P2)이 게이트 신뢰도에 직접 영향 → CONDITIONAL.

## 결함

### P2
- **P2-1 OpenAPI 게이트 untracked false pass**: `phase7-code.yml` build job의 `git diff --exit-code -- packages/schemas/dist/openapi.yaml`는 파일이 untracked이면 실패 처리하지 않아 false pass 가능. (현재 PR은 추적됨이나 방어 부재)
- **P2-2 Playwright trace artifact 보안**: 로그인 E2E 실패 시 trace(`retain-on-failure`)가 테스트 계정 입력값/인증 세션 상태를 포함할 수 있음. `if: always()` 업로드 + 14일 보관.

### P3
- **P3-1 path-scope 불일치**: phase7-code.yml `paths`에 `supabase/**` 없으나 PR template 코드 PR 구획엔 포함 — 정의 불일치(의도 명확화 필요).
- **P3-2 typecheck/build 중복**: turbo `typecheck dependsOn build`로 typecheck job이 web build를 재실행 → build job과 중복. job별 `.turbo` cache key가 달라 완화 제한.
- **P3-3 e2e-gate 단일 secret 확인**: `NEXT_PUBLIC_SUPABASE_URL`만 확인 → 다른 필수 secret(ANON_KEY/EMAIL/PASSWORD) 누락 시 graceful skip이 아니라 부분 실패 가능.

## 정정 권고
1. OpenAPI 게이트에 `git ls-files --error-unmatch ...` 추적 확인 추가 (P2-1)
2. E2E trace 업로드를 `if: failure()` + retention 최소화 (P2-2)
3. e2e-gate가 필수 secret 묶음 전체 확인 (P3-3)
4. supabase/** 코드 PR 범위 포함 여부 명확화 — workflow paths ↔ PR template 정합 (P3-1)
5. typecheck/build 중복 완화 전략 재검토 (P3-2, 낮은 우선순위)

## 정정 1라운드 (2026-05-29, WI-021 재커밋)

| 결함 | 정정 |
|------|------|
| P2-1 | OpenAPI 게이트에 `git ls-files --error-unmatch` 추적 확인 추가 (untracked false-pass 방어) |
| P2-2 | E2E trace 업로드 `if: always()` → `if: failure()` + retention 14→5일 |
| P3-3 | e2e-gate가 필수 secret 5종(URL/ANON/SERVICE_ROLE/EMAIL/PASSWORD) 묶음 전체 확인 |
| P3-1 | phase7-code.yml 상단 주석에 supabase/** 비대상 의도 명시(dual-verification-gate가 supabase 머지 커버) |
| P3-2 | KI-088 등록(수용, CI 효율 — 빌드 시간 체감 시 완화) |

evaluator FAIL 사유(39 entity zod schema 0/39)는 사용자 결정으로 **WI-021-1**로 분리 — mvp-plan §2-5/sprint-001 WI매핑/fix_plan 정정(둘 다 Sprint 1, 연기 아님). KI-089(e2e 시드 정리) 등록.
