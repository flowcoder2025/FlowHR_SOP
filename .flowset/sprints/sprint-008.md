# Sprint 8 — 수익/청구/리포트 + 운영사 프로필

> **주차**: 15~16주 (29 SP / 20 MD 보수 — 가장 가벼운 Sprint)
> **목표**: 운영사 수익 관리 (요금제 + 청구 cron + 미납 + 리포트) + OP-12 운영사 본인 프로필
> **SSOT**: tasks.md TS-084~100 (EP-03) + TS-217~220 (ST-080)
> **외부 신청**: Tauri 코드 서명 인증서 (Mac + Win EV) 발급 시작 (S9 데스크톱 배포 대비)

## Story 목록 (6 Story / 29 SP)

| Story | 화면/도메인 | SP | 우선 |
|-------|----------|----|------|
| ST-011 | OP-05 요금제 CRUD | 5 | P1 |
| ST-012 | OP-06 청구 일괄 발행 cron | 5 | P1 |
| ST-013 | OP-06 청구 조회·미납 추적 | 5 | P1 |
| ST-014 | 미납 자동 전환 cron | 3 | P1 |
| ST-015 | OP-10 운영 리포트 (KPI + 차트) | 3 | P1 |
| ST-080 | OP-12 운영사 본인 프로필 (14 endpoint) | 8 | P1 |

## 핵심 산출물

- `supabase/migrations/`: plans, subscriptions, invoices 마이그레이션 + 인덱스 (cycle/status/version)
- `apps/web/app/[locale]/(operator)/{plans,billing,reports,me}/page.tsx` (OP-05/06/10/12)
- `supabase/functions/cron-invoice-monthly/` — 매월 1일 00:00 활성 테넌트 invoices INSERT (idempotency key)
- `supabase/functions/cron-overdue-transition/` — issued + 15일 → overdue + 알림
- `apps/web/app/api/v1/operator/{plans,invoices,reports,me,users}/` 14 endpoint (ST-080)
- 운영사 강제 2FA + super가 staff 강제 종료 + 마지막 super 보호 + 활동 다운로드
- OP-01 데이터 활성화 (S6에서 빈 데이터 empty state → 실제 청구/플랜 데이터 연결)

## 의존

- ST-011 ← ST-006 (S2 테넌트)
- ST-012~014 ← ST-011, ST-006
- ST-015 ← ST-012/013 (집계 데이터)
- ST-080 ← ST-001 (S1), ST-004 (S1 2FA), ST-068 (S1 audit)

## Definition of Done

- [ ] 요금제 CRUD + 사용 중 플랜 가격 변경 다음 청구일부터 적용
- [ ] 매월 1일 cron invoices INSERT + idempotency (재실행 시 중복 0)
- [ ] 활성/정지 테넌트 분기 (정지 테넌트는 발행 skip + 사유 로그)
- [ ] 15일 결제 미완료 → overdue + 운영사 + 테넌트 관리자 알림
- [ ] OP-10 6 KPI + 4 차트 + 기간 필터 + PDF/Excel 내보내기 + operator_staff 내보내기 비활성
- [ ] OP-12 §8 Gherkin 4 시나리오 PASS (강제 2FA + staff 강제 종료 + 마지막 super 보호 + 활동 다운로드)
- [ ] OP-01 운영사 대시보드 실제 데이터 연결 (S6 placeholder 정정)
- [ ] CI 9 + 4 job PASS

## 위험

- **R-청구 cron 중복 발행**: 월 1일 두 번 실행 시 invoice 2개 — idempotency_key = `${tenant_id}-${billing_month}` unique 인덱스
- **R-운영사 마지막 super 강제 종료**: super 1명만 남았을 때 본인 force_logout → 운영사 lockout → "마지막 super 보호" 정책 (DB constraint + API guard)
