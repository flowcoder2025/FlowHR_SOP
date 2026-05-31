# WI-020-6-feat ST-003 계정 활성화 — codex 듀얼검증 (read-only)

> 모델 gpt-5.x | 1차 대상 02a0446 → 정정 cafff5d → 잔여정정 61bed1b 최종확인

## 1차 리뷰: **FAIL** (실결함 4건 검출 — 게이트 모범 사례)

| # | 등급 | 결함 | 위치 |
|---|------|------|------|
| 1 | **P1** | TS activateAccount claim 실패 보상에서 `public.users` 미삭제 → orphan(deleteUser 실패 시 auth+public 양쪽 잔존) | invitations.ts |
| 2 | **P1** | SQL `accept_invitation` 함수 FK 순서 위반 — claim UPDATE(accepted_user_id=users FK) 가 users INSERT 보다 먼저 → FK 위반 | migration 35 |
| 3 | P1 조건부 | `recordConsent('activate')` 가 setSession 직후 같은 요청에서 getUser()=null 로 무음 실패 가능 → source='activate' 동의 미기록 | activate/actions.ts |
| 4 | P2 | database.ts `invitation_status` enum 미정의(status:string) | database.ts |

통과(처음부터): forgot-password 우회 차단(create-at-activate) / 토큰 보안(sha256+timingSafe) / RLS·함수 권한 / 이메일 정규화·중복.

## 정정 (cafff5d) 재검증: 3 RESOLVED + 1 PARTIAL

| # | 상태 | 정정 |
|---|------|------|
| 1 | RESOLVED | activateAccount 단일 `rpc('accept_invitation')` 호출로 단순화 — public 측 SQL 트랜잭션 위임(실패 시 자동 롤백, 부분상태 없음), 호출부는 auth.users 만 보상 삭제. rollbackClaim/deleteAuthUser 인라인 제거 |
| 2 | RESOLVED | SQL 함수 SELECT FOR UPDATE → users INSERT → claim UPDATE → operator/employee 순서. staging 재적용 |
| 3 | RESOLVED | recordActivationConsents(service_role+명시 userId, 세션 비의존, type별 locale 우선+ko fallback = getRequiredConsents pickByLanguage 와 동일 문서 → /me legal guard 중복 동의요구 없음). setSession 전 호출. **staging source='activate' consent 실증** |
| 4 | **PARTIAL** | invitations Row/Insert/Update.status 는 enum 교체됐으나 `get_invitation_by_token_hash` Returns.status 가 string 잔존 |

## 잔여정정 (61bed1b) 최종확인: **PASS_VERIFIED**

- `get_invitation_by_token_hash` Returns.status → `Database["public"]["Enums"]["invitation_status"]` 교체 확인(diff +1/-1).
- `rg "status: string" packages/types/src/database.ts` → 0건.
- invitations.ts `status === 'pending'` 비교 enum 호환.

## 통합 verdict: **PASS_VERIFIED** (잔존 머지 차단 결함 0)

→ evaluator 채점과 합산해 review-system.md §4 매트릭스로 PASS_BOTH 판정.
