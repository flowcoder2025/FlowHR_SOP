# Sprint 5 — 휴가 본류 (신청 + 잔여 + 승인 + 캘린더)

> **주차**: 9~10주 (32 SP / 22 MD 보수)
> **목표**: 직원 휴가 신청 30초 → 결재 → 잔여 차감 흐름 + HR 휴가 마스터 (캘린더 + 부여) + 결재라인 동적 결정
> **SSOT**: tasks.md TS-068~076 (EP-08 휴가 본류) + TS-083 (조건 분기)

## Story 목록 (5 Story / 32 SP)

| Story | 화면/도메인 | SP | 우선 |
|-------|----------|----|------|
| ST-037 | EM-03 휴가 신청 30초 | 8 | P0 |
| ST-038 | EM-04 내 휴가 현황 | 3 | P0 |
| ST-039 | TA-08 휴가 승인 (PWA) | 8 | P0 |
| ST-040 | TA-07 휴가 마스터 (캘린더 + 부여) | 8 | P0 |
| ST-046 | 결재라인 조건 분기 (5일 이상 = 대표) | 5 | P0 |

## 핵심 산출물

- `supabase/migrations/`: leaves, leave_balances, leave_types, approvals, approval_steps, approval_lines 마이그레이션
- `apps/web/app/[locale]/(employee)/leaves/{request,my-leaves}/page.tsx` (EM-03/04)
- `apps/web/app/[locale]/(tenant)/leaves/{page,[id]}/page.tsx` (TA-07/08)
- `packages/ui` 신규: CalendarGrid, LeaveBalanceCard, CalcSummary, ApprovalTimeline
- `packages/api-client/src/hooks/employee/leaves.ts` (request/calc/balance)
- 사용일수 계산 helper (`packages/api-client/src/lib/leave-calc.ts`) — 주말/공휴일 제외, 반차
- 결재라인 조건 평가 엔진 (`approval_lines.conditions` jsonb 트리)
- TA-08 sticky 액션 버튼 (PWA 모바일)

## 의존

- ST-037 ← ST-053 (leave_types, S2), ST-054 (approval_lines, S2), ST-024 (employee, S3)
- ST-038~040 ← ST-037
- ST-046 ← ST-054 (조건 정의 — S2에서 폼만 작성, S5에서 평가 엔진)

## Definition of Done

- [ ] 휴가 신청 30초 내 (입력 + 잔여 검증 + 결재라인 자동 적용)
- [ ] 잔여 부족 / 중복 신청 차단
- [ ] 결재라인 조건 분기 (5일 이상 = 대표 결재) 평가 + 단계별 상태
- [ ] 최종 승인 시 LeaveBalance.used 차감 (트랜잭션)
- [ ] EM-04 KPI 4 + 유형별 차트 + 신청 이력 + 만료 임박 배너
- [ ] TA-07 캘린더 (월/주) + 잔여 테이블 + 부여 모달 + Excel 일괄
- [ ] TA-08 PWA sticky 액션 버튼 (모바일) + 5개 정보 카드
- [ ] CI 9 + 4 job PASS

## 위험

- **R-사용일수 계산 정확도 (반차 + 공휴일 + 주말)**: holidays 라이브러리 vs 자체 holidays.json 비교 → Sprint 5 day 1 결정
- **R-결재라인 조건 분기 평가 엔진 복잡도**: jsonb 트리 평가가 expression DSL 수준 — MVP는 5일 이상 + 부서 + 직급 3 차원만 + 그 외 v1.1
