# Sprint 6 — 결재 인박스 + 직원 셀프 + 알림 채널 + 운영사 대시보드 → MVP P0 출시

> **주차**: 11~12주 (57 SP / 40 MD 보수, 3 페어 병렬 필요)
> **목표**: MVP P0 모든 영역 통합 + 카카오/SMS/이메일 폴백 + 베타 후보 1차 출시 가능
> **SSOT**: tasks.md TS-077~083 (EP-08 인박스) + TS-161~174 (EP-11) + TS-184~187 (ST-066) + TS-098~100 (ST-070 OP-01)

## Story 목록 (11 Story / 57 SP — 3 페어 병렬 권장)

> Task SSOT: tasks.md TS-077~083 (EP-08 인박스/취소/조건분기) + TS-161~174 (EP-11 직원 셀프 + 폴백) + TS-184~187 (ST-066 5채널 어댑터) + TS-098~100 (ST-070 OP-01 대시보드)

| Story | 화면/도메인 | SP | 페어 |
|-------|----------|----|----|
| ST-041 | TA-09 결재 통합 인박스 + 일괄 | 8 | A |
| ST-042 | EM-05 내 결재 진행현황 | 5 | A |
| ST-043 | 휴가 자동 부여 cron | 5 | B |
| ST-044 | 결재 SLA 임박 알림 cron | 5 | B |
| ST-045 | 요청 취소 흐름 | 3 | B |
| ST-058 | EM-01 직원 대시보드 (PWA 진입) | 5 | C |
| ST-059 | EM-09 내 정보·보안 7탭 | 5 | C |
| ST-060 | EM-10 알림함 + Realtime | 3 | C |
| ST-062 | 푸시 + 카카오 폴백 체인 | 5 | B |
| ST-066 | CM-15 시스템 알림 발송 채널 (5채널) | 8 | B |
| ST-070 | OP-01 운영사 대시보드 (P0 placeholder, S8 데이터 연결) | 5 | A |

**합계 검증**: 8+5+5+5+3+5+5+3+5+8+5 = **57 SP / 11 Story** ↔ stories.md L505 SSOT 정합 ✓

> **ST-070 S6 placeholder 사유**: stories.md L531 ST-070 P0 분리 + dependency-graph §Sprint 8(L88)에 의존 (ST-007/011~014/020~022 → S8 도착)이 명시되어 있으나, OP-01 자체는 P0이므로 MVP P0 출시(S6 종료) 시점에 화면 자체는 가동 필요. → S6에 화면+API 구현 + 빈 데이터 empty state, S8 후 실제 데이터 자동 연결.

## 핵심 산출물

- `apps/web/app/[locale]/(tenant)/approvals/page.tsx` (TA-09 받은/보낸/완료 탭 + 일괄 + PWA 스와이프)
- `apps/web/app/[locale]/(employee)/{dashboard,profile,my-approvals,notifications}/page.tsx` (EM-01/05/09/10)
- `apps/web/app/[locale]/(operator)/dashboard/page.tsx` (OP-01)
- `supabase/functions/cron-leave-grant/` (자동 부여 + 만료 30/7일 전 알림 + 만료일 차감)
- `supabase/functions/cron-approval-sla/` (단계별 SLA 임박)
- `packages/api-client/src/notifications/` — 폴백 체인 워커 (인앱 → 30분 → 카카오 → 1h → SMS → 24h → 이메일)
- 채널 어댑터 5종 (Web Push / Capacitor Push / NHN 카카오 / NHN SMS / SMTP)
- `packages/ui` 신규: ApprovalInbox, NotificationRow

## 의존

- ST-041~042 ← ST-037 (S5), EP-07 Approval 흐름 (S4)
- ST-058 ← 모든 P0 Epic 데이터 집계 (S1~S5 누적)
- ST-059~062 ← EP-06 (S3) + ST-068 (audit) + ST-069 (Realtime)
- ST-066 ← ST-055 (NHN 채널 인증 — S1 day 1 신청 → S5/S6 시점 60일 경과로 활성 검증)
- ST-070 ← ST-007 (S2 테넌트 목록 — 활성), ST-011~014 (S8 청구/플랜 — S6 시점 미존재, empty state placeholder), ST-020~022 (S9 티켓/감사 — S6 시점 미존재, empty state). S6에 화면+API 가동, S8/S9 후 실제 데이터 자동 연결.

## Definition of Done (MVP P0 출시 기준)

- [ ] TA-09 받은/보낸/완료 탭 + 같은 유형 일괄 승인 + PWA 스와이프
- [ ] EM-05 5종 통합 조회 (탭 필터) + 취소·재신청
- [ ] EM-01 진입 ≤ 1초 (PWA) + KPI 5 + 출퇴근 카드 + 휴가 카드 + 알림 3건
- [ ] EM-09 7탭 + 즉시 수정 / HR 승인 / 2FA / 세션 강제 종료
- [ ] EM-10 헤더 종 배지 Realtime ≤ 2초 + 클릭 자동 읽음
- [ ] CM-15 5채널 발송 + 우선순위 폴백 + 결과 콜백
- [ ] 휴가 자동 부여 cron (입사일/회계연도) + 만료 30/7일 전 알림 + 만료일 차감
- [ ] 결재 SLA 임박 알림 (휴가 4h, 근태수정 24h 등 회사 설정)
- [ ] OP-01 KPI 7 + 차트 4 + 최근 활동 3섹션 (테넌트/청구/티켓 일부 빈 데이터 허용)
- [ ] 베타 1호 고객 시범 운영 가능 검증

## 위험

- **R-3 페어 병렬 (45 MD)**: 페어 A (결재 인박스 + OP-01), 페어 B (cron + 알림 폴백 5채널), 페어 C (직원 셀프 3종) — 일정 압축 큰 위험. → P0의 P0 ST-058/059/060/041/042/066만 의무, ST-043/044/045/070 일부 S7로 spill 옵션
- **R-알림 폴백 체인 idempotency**: 한 알림이 폴백 4단계 모두 발송되면 안 됨 → notification_event_id + channel_attempt 테이블로 추적
- **R-OP-01 데이터 부족**: P0 시점 청구 (S8)/플랜 (S8) 데이터 없음 → "데이터 없음" empty state + Sprint 8 후 자동 활성
