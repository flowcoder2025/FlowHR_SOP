# Sprint 9 — 기능권한/시스템 + 지원/감사 + 도움말 + 온보딩

> **주차**: 17~18주 (50 SP / 35 MD 보수)
> **목표**: 운영사 기능 플래그 + 시스템 설정 + 티켓 + 감사 로그 + 헤더 도움말 + 온보딩 투어 + 데스크톱 빌드
> **SSOT**: tasks.md TS-101~126 (EP-04 + EP-05) + TS-202~204 (ST-076) + TS-214~216 (ST-079)
> **Tauri 빌드**: 코드 서명 (S8 발급) 사용해 데스크톱 배포 시범

## Story 목록 (10 Story / 50 SP)

| Story | 화면/도메인 | SP | 우선 |
|-------|----------|----|------|
| ST-016 | OP-07 기능 플래그 CRUD + 예외 | 8 | P1 |
| ST-017 | OP-11 운영자 시스템 설정 9탭 | 8 | P1 |
| ST-018 | OP-11 점검 모드 즉시·예약 | 3 | P1 |
| ST-019 | 자동 백업 cron 일 1회 | 2 | P1 |
| ST-020 | OP-08 티켓 생성·응답·내부메모 | 8 | P1 |
| ST-021 | OP-08 티켓 담당자·상태·우선순위 | 3 | P1 |
| ST-022 | OP-09 감사 로그 조회·필터·내보내기 | 5 | P1 |
| ST-023 | audit_logs 자동 기록 (트리거 + 애플리케이션) | 5 | P1 |
| ST-076 | CM-19 헤더 도움말 패널 | 3 | P2 |
| ST-079 | CM-22 첫 사용자 온보딩 투어 | 5 | P2 |

## 핵심 산출물

- `supabase/migrations/`: feature_flags, feature_flag_overrides, system_settings, maintenance_windows, backup_jobs, api_keys, tickets, ticket_messages, ticket_attachments
- `apps/web/app/[locale]/(operator)/{feature-flags,system,tickets,audit-logs}/page.tsx` (OP-07/11/08/09)
- `apps/web/app/api/v1/feature-flags/evaluate` — 3계층 머지 ≤ 100ms + 캐시
- `supabase/functions/cron-maintenance/` 예약 점검 모드 자동 활성
- `supabase/functions/cron-backup/` 매주 일 03:00 pg_dump → Storage `backups/`
- `packages/ui/src/components/header/HeaderHelpPanel.tsx` — screen_id 매핑 + FAQ + 문의 → OP-08 신규 티켓 모달
- `packages/ui/src/components/onboarding/OnboardingTour.tsx` — 역할별 4단계
- **`apps/desktop/`** 첫 빌드 + 코드 서명 (Mac dmg + Win exe) → GitHub Releases 시범

## 의존

- ST-016 ← ST-005 (RLS)
- ST-017/018 ← (운영사 인프라)
- ST-020 ← ST-068 (audit), ST-066 (알림 폴백 — S6)
- ST-022 ← ST-068 (audit_logs 데이터)
- ST-076 ← ST-020 (티켓 BE), ST-079 (CM-22 투어 재실행)
- ST-079 ← ST-001, ST-073 (헤더 프로필 — S7)
- 데스크톱 빌드 ← ST-058 (EM-01 PWA, S6) + `apps/web/out/` 산출물

## Definition of Done

- [ ] 기능 플래그 3계층 머지 (글로벌 → 플랜 → 테넌트) + 클라이언트 평가 ≤ 100ms
- [ ] OP-11 9탭 + 테스트 발송 (메일/카카오)
- [ ] 점검 모드 토글 + 비-operator 503 응답 + 예약 cron
- [ ] 자동 백업 cron + 성공/실패 알림 + 보관 기간 정책
- [ ] OP-08 사용자→운영사 + 내부메모 비공개 + 첨부 + SLA P0~P3 임박
- [ ] OP-09 5년 보관 + 필터 + 상세 diff (before/after) + CSV 비동기 export
- [ ] audit_logs 트리거 21 테이블 INSERT/UPDATE/DELETE/APPROVE (S1 검증 후 안정성 확정)
- [ ] CM-19 screen_id 매핑 + 문의 → 티켓 생성
- [ ] CM-22 첫 로그인 자동 시작 + 역할별 4단계 + 건너뛰기 audit
- [ ] **`apps/desktop` Mac/Win 빌드 + 코드 서명 + GitHub Releases 시범**
- [ ] CI 9 + 4 job PASS

## 위험

- **R-기능 플래그 캐시 invalidation**: 운영사가 플래그 변경해도 클라이언트 캐시 60s까지 stale → SSE 또는 Realtime publication으로 실시간 invalidation
- **R-Tauri 코드 서명 EV 인증서 늦은 발급**: S8 발급 신청 → S9 도착 보수 일정. 늦어지면 unsigned beta 배포 → 실제 코드 서명은 S10으로 spill 옵션
