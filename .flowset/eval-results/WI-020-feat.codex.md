# WI-020-feat 로그인 핵심 — codex 리뷰 (read-only)

> 출처: Agent subagent_type=codex:codex-rescue (gpt-5.5, --read-only), 2026-05-29
> 대상: git diff main...feature/WI-020-feat-login-core (정정 c40454f 전 리뷰)

## Verdict: CONDITIONAL

## Findings

| 등급 | 항목 | 파일 | 처리 |
|------|------|------|------|
| P1 | (email,ip) 잠금이 위변조 가능 x-forwarded-for 의존 + 분산/멀티-IP 무차별 대입 우회 (POSSIBLE_FALSE_ALARM: Vercel 엣지가 헤더 정규화) | actions.ts:25-28, login-lock.ts, migration 26 | KI-078 (사용자 승인 deferral 2026-05-29) |
| P2 | TOCTOU — 잠금 사전확인과 실패기록 분리로 버스트 시 5회 초과 시도 | actions.ts:50-67 | KI-078 (rate-limit과 묶음) |
| P2 | createServiceRoleClient에 server-only 가드 부재 + 루트 배럴 재내보내기 (POSSIBLE_FALSE_ALARM: NEXT_PUBLIC_ 아닌 키는 현재 미번들) | service-role.ts, index.ts | **정정 완료 (c40454f)** |
| P2 | 감사 쓰기 fail-open (POSSIBLE_FALSE_ALARM: best-effort 의도면 정상) | actions.ts safeAudit | KI-083 (의도된 설계, 알림 보강 검토) |
| P3 | 역할 불일치 시 /forbidden(§8) 대신 역할 대시보드 리다이렉트 | operator/admin page.tsx | KI-080 (/forbidden=CM-05 미생성) |
| P3 | return_url 미소비 | middleware.ts, actions.ts | **정정 완료 (c40454f)** |

## No-Issue 축 (codex 확인)

RLS+grant+SECURITY DEFINER 잠금 우회 차단, 이메일 열거 방지(동일 invalid_credentials 경로), Supabase SSR(getAll/setAll/getUser) 정상, Next 15 서버액션/force-dynamic/redirect 정상, 마이그레이션 원자성(ON CONFLICT)·search_path 고정·grant 협소.
