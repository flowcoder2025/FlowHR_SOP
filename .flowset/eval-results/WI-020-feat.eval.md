# WI-020-feat 로그인 핵심 — evaluator 채점 (Phase 7 code 모드)

> 출처: evaluator 서브에이전트 (.claude/agents/evaluator.md), 2026-05-29
> 대상: feature/WI-020-feat-login-core (커밋 fcf6542 + d6582ca, 정정 c40454f 전 채점)

## 채점

| 축 | 점수 | 근거 |
|----|------|------|
| 기능 완성도 | 8.5 | ST-001 수용기준(정상 로그인+5회잠금+역할리다이렉트+audit) 충족. record_login_failure 원자적 + 윈도우/잠금. stub/TODO 0. |
| 코드 품질 | 9.0 | any/빈catch/TODO 0건. server.ts 캐스팅 1건은 ssr/supabase-js 제네릭 차이로 주석 근거 명시. 모듈 분리 양호. lint max-warnings=0 통과. |
| 테스트 커버리지 | 7.5 | 단위 12(역할/권한 양·음성 매트릭스 + 스키마) + E2E 7. 핵심 E2E가 env gate로 CI skip + 잠금 윈도우 경계 단위 미보강. |
| 계약 준수 | 8.5 | audit 컬럼·enum 1:1, 역할 리다이렉트 09-routing §3 정합, login_attempts RLS+service_role 단독 grant, 키 클라이언트 미노출. |

**가중 총점: 8.38 / 10** (임계 8.0, 각 축 ≥ 7.5) → **VERDICT: PASS**

## NON_BLOCKING_OBSERVATIONS

- [P2] return_url 미소비 (middleware는 set, action 미회수) → **정정 완료 (c40454f)**
- [P2] rememberMe 파싱되나 세션 TTL(09-routing §5) 미반영 → KI-079
- [P3] 잠금 윈도우(5분 만료/15분) 경계 동작 미문서화 + 단위 부재 → KI-081
- [P3] 핵심 E2E env gate CI skip → KI-082
- [P3] roleToRedirectPath unknown→/me 폴백 (/forbidden 대안) → KI-080에 병합

채점 시 2FA/비번찾기/활성화/약관(후속 WI)·/forbidden 대시보드(후속 OP/TA/EM-01)는 스코프 외로 감점 제외.
