# Operator 도메인 (운영사)

> spec §6 (OP-01 ~ OP-11) + KI-029 보강 (OP-12). 운영사 = FlowHR 자체 운영팀. 12개 화면.

## 인덱스

| ID | 화면 | MVP | 우선순위 | 파일 |
|----|------|:---:|:--------:|------|
| OP-01 | 운영사 대시보드 | ✓ | P1 | [OP-01-dashboard.md](OP-01-dashboard.md) |
| OP-02 | 테넌트 관리 | ✓ | P1 | [OP-02-tenants.md](OP-02-tenants.md) |
| OP-03 | 테넌트 상세 | ✓ | P1 | [OP-03-tenant-detail.md](OP-03-tenant-detail.md) |
| OP-04 | 신규 테넌트 등록/온보딩 | ✓ | P1 | [OP-04-onboarding.md](OP-04-onboarding.md) |
| OP-05 | 구독/요금제 관리 | ✓ | P1 | [OP-05-subscriptions.md](OP-05-subscriptions.md) |
| OP-06 | 청구/정산 (수동) | △ | P2 | [OP-06-billing.md](OP-06-billing.md) |
| OP-07 | 기능 플래그 | ✓ | P2 | [OP-07-feature-flags.md](OP-07-feature-flags.md) |
| OP-08 | 지원 티켓 | ✓ | P1 | [OP-08-tickets.md](OP-08-tickets.md) |
| OP-09 | 감사 로그 | ✓ | P2 | [OP-09-audit-logs.md](OP-09-audit-logs.md) |
| OP-10 | 운영 리포트 (요약) | △ | P2 | [OP-10-reports.md](OP-10-reports.md) |
| OP-11 | 시스템 설정 | ✓ | P2 | [OP-11-system-settings.md](OP-11-system-settings.md) |
| OP-12 | 운영사 본인 프로필 | ✓ | P1 | [OP-12-profile.md](OP-12-profile.md) |

## 권한 (spec §9-2 요약)

| 화면 | operator_super | operator_staff |
|------|:--------------:|:--------------:|
| OP-01 | R/E | R |
| OP-02 | CRUD/E | CRU/E |
| OP-03 | R/U/D/L | R/U/L |
| OP-04 | C/R/U/N | C/R/U/N |
| OP-05 | CRUD/S | R |
| OP-06 | CRU/E | R/U/E |
| OP-07 | CRUD/S/L | R/U/L |
| OP-08 | CRUA/N | CRUA/N |
| OP-09 | R/E/L | R/L |
| OP-10 | R/E | R/E |
| OP-11 | CRUS/L | R 일부 |
| OP-12 | RU 본인 + 타 operator 세션 강제 종료 | RU 본인 |

(C=Create, R=Read, U=Update, D=Delete, A=Approve/Process, E=Export, N=Notification, S=Settings, L=Log)

## 도메인 진입점 / 사이드바

| 메뉴 항목 | 활성 화면 |
|---------|---------|
| 대시보드 | OP-01 |
| 테넌트 | OP-02, OP-03, OP-04 |
| 구독 | OP-05 |
| 청구 | OP-06 |
| 기능 권한 | OP-07 |
| 지원 | OP-08 |
| 감사 로그 | OP-09 |
| 리포트 | OP-10 |
| 시스템 설정 | OP-11 |
| 내 프로필 (헤더 드롭다운 CM-16에서도 접근) | OP-12 |

## 도메인 의존성

- 사용 엔티티: `tenants`, `subscriptions`, `invoices`, `plans`, `feature_flags`, `tickets`, `audit_logs`, `users`
- 외부 시스템 의존:
  - NHN Cloud (알림톡/SMS) — 운영사 채널 인증
  - GitHub (티켓 연동, MVP 후순위)
  - Supabase Admin API (운영사 우회 권한)

## 운영사 사용 패턴

1. **아침 9시**: OP-01 대시보드 → 신규 가입/해지/티켓/시스템 상태 확인
2. **오전 업무**: OP-08 티켓 응대 (박오퍼 1차, 김운영 에스컬레이션)
3. **신규 영업 시**: OP-04 신규 테넌트 등록 → 김운영이 30분~2시간 작업
4. **월말**: OP-06 청구 발행 → 미수금 추적
5. **분기**: OP-10 리포트 → 성장/매출 지표 확인
6. **상시**: OP-07 기능 플래그 토글 (베타 기능 점진 출시), OP-09 감사 로그 (보안 점검)
