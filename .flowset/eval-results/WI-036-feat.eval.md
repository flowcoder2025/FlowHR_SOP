# WI-036-feat 듀얼검증 결과 — OP-04 7단계 테넌트 등록 마법사 UI (ST-006/010)

> 출처: evaluator(Agent subagent_type=evaluator) + codex(mcp__codex__codex 2라운드) 듀얼검증. 2026-06-02.
> 게이트: project.md §1-1 (WI 단위 PASS_BOTH 의무) + review-system.md §4 통합 판정.

## 통합 판정: PASS_BOTH

| 검증자 | 1차 | 정정 후 | 비고 |
|--------|-----|---------|------|
| evaluator | **PASS 8.15** (기능8.5/품질8.5/테스트7.5/계약8.0, 각 축 ≥7.5) | — | 자가보고 독립검증(turbo 21/21·wizard 25·i18n 168 leaf 대칭·anti-pattern 0). NON_BLOCKING P2×1+P3×3 |
| codex | **FAIL** (P0/P1 없음, P2×2 + P3×1) | **PASS** (잔여 P2+ 없음) | 정적 코드 재리뷰 |

review-system.md §4 매트릭스: evaluator PASS + codex PASS(정정 후) → **PASS_BOTH** → ready → CI → auto-merge.

## evaluator 채점 (8.15/10)

- 기능 완성도 8.5 — 7단계 전부 + 단계별 동기/비동기 게이팅 + 실시간 중복검사 3필드(debounce+seq) + 임시저장 재진입 + 6단계 초기데이터 5종 + 등록완료/activation URL/재발급. stub/TODO 0.
- 코드 품질 8.5 — any/swallowed catch/TODO 0(grep). 단일 저장큐/drain/coalesce 명확, reducer 순수, 참조무결성 정리.
- 테스트 커버리지 7.5 — wizard.ts 순수로직 단위 25(토폴로지/멱등 serde/billing/async 게이팅/스키마 거부) + permissions 3 + E2E 비인증 가드 2. server actions thin wrapper·E2E 전체등록 skip(operator 시드, KI-089류).
- 계약 준수 8.0 — matrix 권한 정합, RPC 에러코드 P0101~P0111 도메인 매핑 + i18n 키 정합, enum↔i18n 1:1, plan_id 화이트리스트.

## 검출 결함 → 정정 (hotfix 2bb4ee7)

| 등급 | 검출 | 내용 | 정정 |
|------|------|------|------|
| P2 | codex | autosave 무한루프 — SAVED 가 dirty 미하강 → 1s 타이머 영구 재등록 | rev/savedRev 카운터 전환(dirty=rev>savedRev), 저장한 rev 까지 clean, in-flight 편집 유실 없음 |
| P2 | codex | plan_id 화이트리스트가 submit 경로 부재 — 복원 draft/변조 plan_id 우회 | planAllowed(fetched 목록 멤버십) step(plan 이후)·submit 강제 |
| P2 | evaluator | startNew 가 idempotencyKey 미재생성 — 직전 등록 키 재사용 | setIdempotencyKey(crypto.randomUUID()) on RESET |
| P3 | codex | Stepper 재진입 시 review 가 async 게이트 우회 | review 완료/submit 에 allAsyncOk(domain·business·adminEmail) AND |
| P3 | evaluator | deleteDraftAction dead export | route-local actions.ts 에서 제거 |

codex 재검증: rev/savedRev in-flight 편집 유실 차단·planAllowed needsPlan 경계·review async 재게이트·asyncAvailRef 최신값 모두 확인 → **PASS**.

## NON_BLOCKING_OBSERVATIONS → KI 등재 (P3)

- KI-127 (P3) — register_tenant RPC plan status/is_public 재검증 부재(client 화이트리스트 보완, operator 신뢰역할 저위험). 보안 하드닝 sweep(KI-109 동류).
- KI-128 (P3) — 추가 관리자 이메일 실시간 중복검사 미적용(대표만 async, 추가분은 서버 P0110 권위). UX 신호 갭.
- KI-129 (P3) — 로고 파일 업로드(Storage) 미구현 — logo_url(URL) 대체 + 명시적 임시저장 discard 버튼 미구현(autosave 대체, PRD §3-3).
- KI-130 (P3) — api/operator.md OP-04 camelCase 표기 — 구현 SSOT(operator-onboarding.ts snake_case) 와 doc drift(WI-035 contract 정정 누락).

## 검증 사실
- turbo lint/typecheck/test/build **21/21** (web 112[wizard 단위 25 신규] / schemas 132 / ui 27 / api-client 13).
- E2E 비인증 가드 2 통과 + operator 시드 게이트 skip(KI-089류).
- i18n screens.op-04 ko/en **168 leaf 대칭**.
