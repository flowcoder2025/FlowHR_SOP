# WI-020-2-feat ST-078 약관/동의 — evaluator 채점표

- **PHASE**: 7 / **MODE**: code / **WI**: WI-020-2-feat
- **VERDICT**: PASS / **WEIGHTED_TOTAL**: 8.45/10 (임계 8.0, 각 축 7.5)
- **일자**: 2026-05-29

## 점수

| 축 | 가중 | 점수 | 근거 요약 |
|----|------|------|----------|
| 기능 완성도 | 30% | 8.5 | AC-1 비로그인 조회(RLS legal_docs_read) / AC-2 강제동의 가드 이중(로그인 직후 redirect + 보호 레이아웃 3종, R4 정합) / AC-3 user_consents 서버결정 INSERT / AC-4 게시 단일active 트리거+partial index 이중보호 / AC-6 ko/en 페어 스키마 강제. **감점: AC-5 운영사 감사 미구현(OP-09 deferral → KI-092)** |
| 코드 품질 | 25% | 9.0 | TODO/empty-catch/any 0건. 오픈리다이렉트 server-side 차단, source/version/ip/ua 서버결정, 멱등 upsert, search_path 고정 + 트리거 revoke |
| 테스트 커버리지 | 25% | 7.5 | schema 단위 31 + 비로그인 조회 E2E 5/5 + 트리거/recordConsent staging 실증. **감점: 강제동의 동의-클릭/게시 트랜잭션 자동 E2E 미검증 → KI-091** |
| 계약 준수 | 20% | 9.0 | legal endpoint 4종 서버액션/서버컴포넌트 1:1, casing 정책 schemas.md 노트, rls.md §6-1 트리거 정합, 게시 super 축소 AC-4 정합 |

## NON_BLOCKING_OBSERVATIONS
- [P2] AC-5 운영사 감사 화면 미구현 (RLS plumbing 존재) → **KI-092**
- [P3] dead i18n key 3종 → hotfix 정리됨
- [P3] mig34 drop policy if exists 미사용 → hotfix 정리됨
- [P3] 강제동의 가드 locale URL prefix 파생 (next-intl 라우팅상 실효 locale, pickByLanguage ko fallback — 무해)
- [P3] KI-091 (동의-클릭/게시 E2E) 정직 등록 확인

## ANTI_PATTERNS_FOUND
- 0건 (변경 .ts/.tsx/.sql 전수 + 오픈리다이렉트 trust chain + 트리거 per-row + 마이그레이션 순서 추가 검증)

## RECOMMENDATION
승인 (PASS). 4축 전부 ≥ 7.5, 가중 8.45. 보안 핵심 견고. (호출자: codex 결과와 통합 판정 — PASS_BOTH 확정)
