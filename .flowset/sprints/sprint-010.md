# Sprint 10 — 외부 연동/리포트 + 폴리싱 → MVP 완전체 출시

> **주차**: 19~20주 (21 SP / 15 MD 보수)
> **목표**: 회사별 외부 연동 (NHN 알림톡 + SMS + 이메일) + API Key 발급 + 리포트 5종 + P3 폴리싱 + 베타 1호 고객 정식 운영
> **SSOT**: tasks.md TS-153~160 (EP-10 ST-055/056/057) + ST-061/067/075 (P3 △)

## Story 목록 (6 Story / 21 SP)

| Story | 화면/도메인 | SP | 우선 |
|-------|----------|----|------|
| ST-055 | TA-14 카카오 알림톡 + SMS + 이메일 | 5 | P0 (S6에서 인프라 셋업, S10에서 회사 UI) |
| ST-056 | TA-14 API Key 발급·폐기 | 3 | P2 |
| ST-057 | TA-12 리포트 5종 MVP | 8 | P2 |
| ST-061 | EM-11 요청 내역 통합 (△ MVP) | 2 | P3 |
| ST-067 | CM-08 공통 검색 (△ MVP) | 2 | P3 |
| ST-075 | CM-18 헤더 검색 안내 | 1 | P3 |

## 핵심 산출물

- `apps/web/app/[locale]/(tenant)/{integrations,reports,api-keys}/page.tsx` (TA-14/12)
- `apps/web/app/api/v1/tenant/integrations/` NHN Cloud SDK 연동 (API Key 암호화 보관 + 테스트 발송 + 결과 콜백)
- `apps/web/app/api/v1/tenant/reports/{headcount,attendance,leave,overtime,department-compare}/` 5 endpoint
- TA-12 리포트 페이지 (5종 카드 + 상세 차트 + 기간 필터 + manager 자기 팀만)
- ST-061 EM-11 placeholder + EM-05로 리다이렉트 안내 (v1.1 별도 화면)
- ST-067 CM-08 헤더 검색바 비활성 안내 (v1.1 출시 예정 토스트)
- ST-075 같은 안내 (ST-067와 통합 처리 가능)
- 베타 1호 고객 온보딩 가이드 (Phase 9 진입 전 사전 작업)

## 의존

- ST-055 ← NHN 채널 인증 활성 (S1 신청 → S10 시점 ≥ 19주 → 60일 보수 일정 충분 통과)
- ST-056 ← ST-053/054 (S2 회사 설정)
- ST-057 ← 모든 EP 데이터 (S1~S9 누적)
- P3 3건은 의존 없음 (FE만 + 라우팅)

## Definition of Done (MVP 완전체)

- [ ] TA-14 NHN API Key 입력 + 테스트 발송 + 채널별 활성화 토글
- [ ] 폴백 체인 (카카오 → SMS → 이메일) audit 기록
- [ ] API Key 발급 시 한 번 표시 + 만료일 + 권한 범위 + 사용 로그
- [ ] TA-12 5종 리포트 + KPI 카드 + 기간 필터 + 권한 매트릭스
- [ ] EM-11/CM-08/CM-18 v1.1 placeholder + 비활성 안내 토스트
- [ ] 베타 1호 고객 시범 운영 가능 (전 화면 + 알림 채널 + 리포트)
- [ ] CI 9 + 4 job PASS
- [ ] **MVP 완전체 415 SP / 80 Story / 223 Task 완료**

## 위험

- **R-NHN 채널 미활성 (보수 60일 + 추가 지연)**: S10 시점 19주 → 충분히 통과. 그러나 베타 1호 고객 도메인이 KakaoBiz 별도 채널 요구 시 추가 14일 → 베타 진입 1주 buffer
- **R-리포트 5종 데이터 정확도**: 인력/근태/휴가/초과근무/부서비교 — manager 자기 팀만 RLS 검증 필수, 음성 케이스 (다른 팀 manager가 본 팀 조회) 차단 테스트

## MVP 출시 후 Phase 8~10 진입 준비

- **Phase 8 QA**: scenarios.md + e2e.md (Gherkin 시나리오 + 권한 매트릭스 + E2E Playwright spec)
- **Phase 9 베타**: onboarding.md + 1호 고객 모집 + 피드백 채널 + 트리아지 SOP
- **Phase 10 운영**: runbook.md + SLA + 백업/복구 + 모니터링/알림 (Sentry + Supabase Logs)
