# Sprint 4 — 근태 PWA + 회사 모니터링 + PWA 설치 가이드

> **주차**: 7~8주 (40 SP / 30 MD 보수)
> **목표**: 직원 PWA 출퇴근 + HR/팀장 회사 근태 모니터링 + PWA 설치 안내
> **SSOT**: tasks.md TS-054~067 (EP-07) + TS-205~208 (ST-077)
> **외부 의존 체크포인트**: NHN Cloud 알림톡 채널 인증 진행 상태 확인 (S1 신청 D+42~56 시점 — 보수 60일까지 4~18일 마진). 활성 보장은 S6 ST-066 진입 시점(D+71)이 정확.

## Story 목록 (7 Story / 40 SP)

| Story | 화면/도메인 | SP | 우선 |
|-------|----------|----|------|
| ST-031 | EM-02 출퇴근 GPS (PWA 핵심) | 13 | P0 |
| ST-032 | TA-05 회사 근태 모니터링 | 5 | P0 |
| ST-033 | TA-05 근태 수동 등록·수정 | 3 | P0 |
| ST-034 | EM-02→TA-06 수정 요청 흐름 | 8 | P0 |
| ST-035 | 23:59 누락 자동 처리 cron | 3 | P0 |
| ST-036 | 지각/조퇴 자동 status | 3 | P0 |
| ST-077 | CM-20 PWA 설치 가이드 | 5 | P1 (PWA 묶음 진입) |

## 핵심 산출물

- `supabase/migrations/`: attendances, attendance_modifications, work_policies 마이그레이션 + 인덱스 `(tenant_id, employee_id, work_date)`
- `apps/web/app/[locale]/(employee)/attendance/page.tsx` (EM-02 큰 액션 버튼 + GPS)
- `apps/web/public/sw.js` + `apps/web/public/manifest.json` + `packages/platform`의 `useGeolocation({foregroundOnly: true})` + `useInstallPrompt()`
- IndexedDB 오프라인 큐 (`packages/platform/src/offline-queue.ts`) + 복귀 동기화
- `supabase/functions/cron-missing-attendance/` 23:59 Edge Function
- `apps/web/app/[locale]/(tenant)/attendance/{page,modifications}.tsx` (TA-05/06)
- `packages/ui` 신규: ClockCard

## 의존

- ST-031 ← ST-024 (직원), ST-053 (work_policy, S2)
- ST-032~036 ← ST-031
- ST-077 ← ST-031, ST-058 (EM-01, S6 예정이지만 PWA install 시점은 S4 진입 가능)

## Definition of Done

- [ ] EM-02 출근/퇴근/휴게 1탭 응답 ≤ 800ms
- [ ] GPS 권한 거부 시 정책별 분기 (force_gps_required 정책)
- [ ] 오프라인 큐잉 + 복귀 시 자동 동기화 (IndexedDB)
- [ ] Lighthouse PWA 점수 ≥ 90
- [ ] 23:59 cron 누락 자동 처리 + 직원 알림
- [ ] work_policy 기준 지각/조퇴 자동 status (트리거 또는 INSERT hook)
- [ ] 수정 요청 → 팀장 1차 → HR 최종 (Approval/ApprovalStep 자동 생성)
- [ ] CM-20 PWA 설치 가이드 iOS 16.4+ 분기 + standalone 자동 dismiss + 30일 재표시 방지
- [ ] iOS Safari + Android Chrome + Tauri 데스크톱 3 디바이스 E2E
- [ ] **NHN 채널 인증 진행 상태 체크포인트** (D+42~56 — 활성 보장은 S6 ST-066 진입 시점 D+71. S5 진입 시 미활성이어도 SMS+이메일 폴백 코드 의무 진입)

## 위험

- **R-iOS 16.4+ 푸시 + 홈화면 추가 강제**: 미만 OS는 카카오 폴백 + Tauri 다운로드 CTA
- **R-Service Worker + Vercel Edge**: next-pwa 빌드 시 SW 캐시 정책 검증 (출퇴근 큐는 SW 우회 IndexedDB 직접)
- **R-NHN 채널 미활성 (8주 차 점검 시점)**: 60일 보수 일정 +α 대비 SMS만 폴백 또는 S5 일정 +1주 buffer
