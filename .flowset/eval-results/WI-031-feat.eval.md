# WI-031-feat evaluator 결과 (code 모드)

## 1차 — FAIL 7.75 (in-scope P1)

- [P1·차단] `claim_due_scheduled_setting_changes`(security definer)의 EXECUTE 가 Supabase pg_default_acl 로 anon/authenticated 에 잔존(`revoke all from public`만으론 무력). live proacl `{postgres,anon,authenticated,service_role}=X` + advisor 0028/0029 실증. cross-tenant pending 행 claim + returning sc.* payload 유출(RLS 우회) + cron DoS. mig 31 record_login_failure 와 동일 클래스 재발.
- 점수: 기능 8 / 품질 8 / 테스트 7 / 계약 8 = 7.75 (< 8.0).

## 재평가 — PASS 8.80 (mig 39 정정 후)

```
SCORES:
- 기능 완성도: 9 | P1 해소 staging proacl 실증(anon/auth execute=false, svc=true, prosecdef=true). 큐 RLS + claim skip-locked 원자 전환 완비.
- 코드 품질: 9 | mig 39 가 mig 31 패턴 1:1 일치(revoke ... from public, anon, authenticated). update 정책 USING status='pending' + WITH CHECK status in (pending,cancelled) 실측.
- 테스트 커버리지: 8 | T14/T15 staging BEGIN..ROLLBACK 독립 재현(자가보고 미신뢰). has_function_privilege 독립 PRIV_CHECK_PASS.
- 계약 준수: 9 | rls.md operator 전체/tenant_admin 자기테넌트 격리 준수. RLS enabled. target CHECK 8종.

WEIGHTED_TOTAL: 8.80/10
VERDICT: PASS (각 축 ≥7.5)

NON_BLOCKING_OBSERVATIONS:
- [P2] mig 35 accept_invitation 동일 grant 클래스(out-of-scope, KI-109).
- [P3] claim 함수 audit actor NULL(service_role 컨텍스트, KI-110, KI-106 인접).
- [P3] applicable_departments zod text[] 불일치(WI-021-1 도입, KI-111).
ANTI_PATTERNS_FOUND: 없음 (drop policy if exists 는 idempotent forward migration 관용구)
```

상세 전문은 task 통지 산출(2026-06-01) 보존. 통합 판정은 `.pass` 마커 참조.
