# Employee 도메인 (직원)

> spec §8 (EM-01 ~ EM-11). 직원 본인 화면. 11개. **PWA 모바일이 주 사용 환경**.

## 인덱스

| ID | 화면 | MVP | 우선순위 | 파일 |
|----|------|:---:|:--------:|------|
| EM-01 | 내 대시보드 | ✓ | P1 | [EM-01-dashboard.md](EM-01-dashboard.md) |
| EM-02 | 출퇴근 | ✓ | P1 | [EM-02-attendance.md](EM-02-attendance.md) |
| EM-03 | 휴가 신청 | ✓ | P1 | [EM-03-leave-request.md](EM-03-leave-request.md) |
| EM-04 | 내 휴가 현황 | ✓ | P1 | [EM-04-my-leaves.md](EM-04-my-leaves.md) |
| EM-05 | 내 결재/진행현황 | ✓ | P1 | [EM-05-my-approvals.md](EM-05-my-approvals.md) |
| EM-06 | 급여명세서 조회 | ✓ | P1 | [EM-06-payslip.md](EM-06-payslip.md) |
| EM-07 | 문서 조회 | ✓ | P1 | [EM-07-documents.md](EM-07-documents.md) |
| EM-08 | 증명서 요청 | ✓ | P2 | [EM-08-certificate-request.md](EM-08-certificate-request.md) |
| EM-09 | 내 정보/프로필 | ✓ | P2 | [EM-09-profile.md](EM-09-profile.md) |
| EM-10 | 알림함 | ✓ | P1 | [EM-10-notifications.md](EM-10-notifications.md) |
| EM-11 | 요청 내역 | △ | P3 | [EM-11-my-requests.md](EM-11-my-requests.md) |

## 권한 (spec §9-4)

| 화면 | employee 본인 | 팀장 추가 | HR 추가 |
|------|:------------:|:--------:|:------:|
| EM-01 | R 본인 | + 결재요약 | + 회사 요약 (TA-01) |
| EM-02 | CRU 요청 본인 | 동일 | + RU 관리자 화면 (TA-05) |
| EM-03 | CRU/Cancel 본인 | 동일 | + RA 관리자 (TA-08) |
| EM-04 | R 본인 | 동일 | + 회사 휴가 (TA-07) |
| EM-05 | R/Cancel/Resubmit 본인 | + R/A 지정건 | + R/A 전체 |
| EM-06 | R/E 본인 | 동일 | + CRU/Send (TA-10) |
| EM-07 | R/E 권한 문서 | 동일 | + CRUD (TA-10/11) |
| EM-08 | C/R/Cancel 본인 | 동일 | + R/Issue/Reject |
| EM-09 | R/U 요청 본인 | 동일 | + R/U 승인 |
| EM-10 | R/U 읽음 본인 | 동일 | + N 발송 (TA-13) |
| EM-11 | R/Cancel/Resubmit 본인 | + R/A 지정 | + R/A 전체 |

## PWA 모바일 사용자 여정 (한직원 케이스)

```
아침 출근길
  └─ PWA 홈화면 클릭 → EM-01 진입 (1초)
     └─ "출근" 버튼 1탭 → GPS 인증 → EM-02 기록 완료 (2초)
점심 시간
  └─ 알림 도착 (휴가 결재 진행) → EM-10 진입
     └─ EM-05로 이동 → 진행 단계 확인
저녁 퇴근
  └─ PWA 홈화면 → EM-01 → "퇴근" 1탭
주중
  └─ 휴가 신청: EM-03 → 입력 30초 → 제출
  └─ 급여명세서 도착 알림 → EM-06 → PDF 보기
  └─ 증명서 필요: EM-08 → 요청 → 발급 완료 시 EM-07에서 다운로드
```

목표: 모든 핵심 액션이 **3탭 이내**.

## 도메인 의존성

- 엔티티: `employees, attendances, leaves, leave_balances, approvals, documents, certificate_requests, notifications, users`
- 외부: PWA Service Worker (오프라인 큐잉), Web Push API (iOS 16.4+), 카카오 폴백 (TA-14)
- 클라이언트 분기: PWA가 1차, Web 보조, Tauri Desktop은 관리자 위주 (직원도 사용 가능)
