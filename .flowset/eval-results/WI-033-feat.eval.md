# WI-033-feat TA-13 회사설정 UI — 듀얼검증 채점표

> **SSOT**: `.flowset/contracts/review-system.md` §4 통합 판정 + `review-rubric.md`
> **WI**: WI-033-feat (ST-053, Sprint 2) — TA-13 회사설정 9탭 셸 + P0 4탭 폼 + 즉시/예약 + read-only
> **PR**: #52 / **브랜치**: feature/WI-033-feat-tenant-settings-ui
> **작성**: 2026-06-01

## 통합 판정: PASS_BOTH

| 검증자 | 라운드 | 결과 |
|--------|--------|------|
| evaluator | 1차 | **PASS 8.75** (기능 9 / 품질 9 / 테스트 8 / 계약 9, 각 축 ≥7.5) |
| evaluator | 재검증(정정 후) | **PASS 8.63** (기능 9 / 품질 9 / 테스트 7.5 / 계약 9) — 독립 검증: form-data 17/17 직접실행 + tsc EXIT=0 + 위조벡터 제거 + 데이터손실 회귀 부재 확인. 정정이 축1·축4 강화 |
| codex | 1차 | **FAIL** — P1×2 + P2×2 + P3×1 |
| codex | 2차(hotfix c4f6dcb) | **CONDITIONAL** — DB 조회 fail-open 잔여 P2 |
| codex | 3차(hotfix 8943265) | **PASS** |

## codex 검출 결함 + 처리

| # | 등급 | 결함 | 처리 |
|---|------|------|------|
| 1 | P1 | approval `original_lines_json`(클라발) → 같은 테넌트 내 conditions/default_line 위조·삭제 | **정정** — 원본을 서버가 DB(RLS tenant 격리)에서 권위 조회. hidden input 제거 (c4f6dcb) |
| 2 | P1 | scheduled_setting_changes UPDATE RLS 가 INSERT target 제한(mig 41)과 비대칭 | **KI-117 등재** — WI-033 UI 미노출(INSERT 전용), DB 레벨 보안 sweep(KI-109 인접) |
| 3 | P2 | leave_types 삭제가 FK(on delete restrict) 충돌 → 실패 큐 | **정정** — delete_keys 의 leaves/leave_balances 참조 사전 검사 → action.leave_in_use 거부 (c4f6dcb) |
| 4 | P2 | JSON parse 실패가 invalid 아닌 `[]` → leave 대량삭제 payload | **정정** — parseJsonArrayStrict(손상=invalid 중단) (c4f6dcb) |
| 5 | P2 | DB 원본 조회/count error 무시(`?? []`) → approval 보존 실패 시 fail-open | **정정** — 세 조회 error 시 fail-closed(save_failed) (8943265) |
| 6 | P3 | apply_at 이중 now+1s 경계 | **KI-118 등재** — datetime-local 분단위라 실질 무해 |

## evaluator NON_BLOCKING (1차)

- [P3] dead i18n 키 4개(pending.empty/approval.remove/approval.conditions/approval.step_count) → **정정**(제거, c4f6dcb)
- [P3] settings mutation E2E admin 시드 부재 → **KI-119 등재**(KI-089 동류)
- [P3] KI-112/113 은 WI-032 이월(KI-113 사용자 결정 현행 유지)

## 검증 (정정 후)

- turbo lint/typecheck/test/build **21/21**
- form-data 단위 **17 PASS** (apply_at 정규화 / full-replace / delete_keys / conditions 병합·위조-id 음성 + zod 정합)
- E2E **2 PASS**(미인증 가드) + 4 env-gate skip(admin 시드, KI-119)
- 빌드 SSG 28/28, `/admin/settings` 6.83kB

## 신규 KI

- **KI-117 (P2)** — scheduled_setting_changes UPDATE RLS cancel 전용 축소(보안 sweep)
- **KI-118 (P3)** — apply_at 이중 now+1s 경계
- **KI-119 (P3)** — settings mutation E2E admin 시드 부재
