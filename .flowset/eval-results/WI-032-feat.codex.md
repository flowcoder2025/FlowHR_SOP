# WI-032-feat codex 리뷰 — TA-13 회사설정 API

> reviewer: codex (gpt-5 계열, MCP mcp__codex__codex, sandbox read-only)
> thread: 019e8246 (구현 독립 적대적 리뷰 — 설계 협의 thread 019e8219 와 분리)
> review-system.md §3 verdict 기준

## 1차 리뷰 — WARNING (P0 0 / P1 1 / P2 1)

대상 HEAD 7710a8f.

- **P1 — hr_admin GET 권한 과다**: `queries.ts canRead` 가 hr_admin 에게 전탭 read 허용 → `security_policy`(보안 탭) + `audit_logs` 노출. api/tenant.md TA-13 GET 은 hr_admin 을 회사정보/근무/휴가/문서양식으로 제한. (RLS 도 hr_admin 차단 안 함 — DB 경계 동일). 조치: canRead 를 TA-13 탭별 권한으로 좁히고 security/roles 는 super 전용.
- **P2 — 큐 INSERT target 미제한**: `scheduled_setting_changes` INSERT RLS(mig 37)가 target 제한 없이 tenant_admin 통과 → Data API 직접 미구현 target(roles/notifications/document_templates/security) 적재 → cron 재시도/실패 큐 오염 가능(비인가 적용은 apply 엔진 예외로 차단됨). 조치: with-check 또는 DB check 를 구현 4 target 으로 제한.

체크리스트 통과 항목(P0/P1 없음): security-definer grant(5함수 anon/auth revoke + search_path 고정) / audit_row_change 회귀(auth.uid() 우선 + GUC is_local) / 동시성(for update skip locked + status 가드) / payload-DB 정합(snake_case ↔ payload->>) / grant_basis 제외 KI-112 문서화.

## hotfix 재검증 — PASS

대상 HEAD 31c9271 (origin 동일).

- **P1 해소**: `permissions.ts canRead` 가 hr_admin 의 security/roles 차단, queries.ts envelope 조립에서 `permission==='none' ? null`. audit_logs 유지는 RLS(`audit_logs_read=is_tenant_admin`)+api/tenant.md(`/audit-logs hr_admin 일부`)+와이어프레임 pane 9 근거로 정합. 와이어프레임 §2 state4 hr_admin 보안 read-only 는 KI-113 defer.
- **P2 해소**: mig 41 — `scheduled_setting_changes_insert` with-check 에 `target in ('company','work_policy','leave_policy','approval_lines')` 추가(staging 적용).

> **잔여 머지 차단 결함 없음. verdict: PASS.** (codex read-only 제약으로 신규 permissions.test.ts/schemas 테스트는 미실행 — claude 가 turbo lint/typecheck/test/build 21/21 실행 검증.)
