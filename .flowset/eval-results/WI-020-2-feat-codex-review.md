# WI-020-2-feat ST-078 약관/동의 — codex 듀얼검증

- **모델**: codex (gpt-5.5 기본), `--read-only`
- **1차 판정**: BLOCKED_FOR_HOTFIX (P1×1 + P2×2)
- **재검증 판정**: PASS_VERIFIED (정정 후)

## 1차 검출 결함

| 심각도 | 위치 | 결함 | 정정 |
|--------|------|------|------|
| P1 | consent-action.ts | `agree` 체크박스 서버 미검증 — 폼 우회 제출 시 무동의 기록 | `formData.get('agree') !== 'on'` 시 error 반환 |
| P2 | actions.ts publishLegalDocuments | `createServiceRoleClient()` 가 RLS super 게이트 실질 우회 | `createSupabaseServerClient()`(세션) — RLS `is_operator_super` 실효 |
| P2 | actions.ts clientIp | IPv4/IPv6 정규식이 `999.999.999.999`/`::::` 허용 → inet insert 실패 가능 | `node:net isIP()` 엄격 검증 |

**1차 PASS 항목**: 오픈리다이렉트(safe-return-url) / 동의 source·version 서버결정 / user_consents 불변(트리거+RLS) / 강제동의 가드 우회·루프 없음 / ko/en 페어 / ensure_single_active 무한루프 없음 / 게시 원자성 / i18n parity / login 회귀.

## 재검증 (커밋 f1ac057)
- P1 RESOLVED: agree 서버 검증 추가, 정상 플로우(checked→'on') 유지
- P2 RESOLVED: 세션 client 전환 — RLS legal_docs_insert/update(is_operator_super) 실제 통과 + 트리거 내부 UPDATE 동일 세션 통과 구조 확인
- P2 RESOLVED: isIP 엄격 검증, loose regex 제거
- P3 RESOLVED: dead i18n key 3종 제거(잔여 참조 0) + mig34 drop policy if exists
- 회귀 없음: 권한 상승/필수 import 제거 없음, git diff --check 통과

**최종: PASS_VERIFIED** — 소스/diff/마이그레이션 정적 재검증 기준 잔존·신규 결함 없음.
