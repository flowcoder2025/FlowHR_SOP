# Sprint 7 — 문서/급여 + 헤더 컴포넌트 묶음

> **주차**: 13~14주 (40 SP / 28 MD 보수)
> **목표**: 급여명세서 일괄 + 계약서 + 증명서 + 헤더 프로필/알림 종 컴포넌트 완성
> **SSOT**: tasks.md TS-127~144 (EP-09) + TS-195~200 (ST-073/074)
> **외부 신청**: Phase 9 베타 진입 전 사업자등록 + 정보통신 신고 시작

## Story 목록 (8 Story / 40 SP)

| Story | 화면/도메인 | SP | 우선 |
|-------|----------|----|------|
| ST-047 | TA-10 급여명세서 일괄 (PDF + 발송) | 13 | P1 |
| ST-048 | EM-06 급여명세서 조회·다운로드 | 5 | P1 |
| ST-049 | EM-08 증명서 요청 → HR 발급 | 5 | P1 |
| ST-050 | TA-11 계약서 생성·발송 (MVP) | 5 | P1 |
| ST-051 | TA-10 인사/회사 문서 관리 | 3 | P1 |
| ST-052 | EM-07 문서 조회 | 3 | P1 |
| ST-073 | CM-16 헤더 프로필 드롭다운 | 3 | P1 |
| ST-074 | CM-17 헤더 알림 종 미니 드롭다운 | 3 | P1 |

## 핵심 산출물

- `supabase/functions/batch-payslip-pdf/` — Excel → 500명 PDF 5분 이내 큐
- `supabase/migrations/`: documents, document_templates, document_views, certificate_requests
- `apps/web/app/[locale]/(tenant)/{payslips,documents,contracts}/page.tsx` (TA-10/11)
- `apps/web/app/[locale]/(employee)/{payslip,documents,certificate-request}/page.tsx` (EM-06/07/08)
- `packages/ui/src/components/header/{HeaderProfile,HeaderBell}.tsx` — Realtime ≤ 2초 배지 + 미니 드롭다운 10건
- 미열람 7일 재발송 cron + 재발송 한도 (3회)
- Signature 엔티티 v1.2 슬롯 (실제 구현 안 함, 자료형만 정의)

## 의존

- ST-047 ← ST-063/065 (S3 파일/PDF 인프라), ST-066 (S6 알림 채널)
- ST-048~049 ← ST-047
- ST-050 ← ST-024 (S3 직원), ST-063 (파일)
- ST-052 ← ST-051
- ST-073 ← ST-001 (인증, S1), ST-058~062 (직원 셀프, S6), ST-080 (S8 예정 — 7 Sprint 진입 시 미완성 가능, 운영사 메뉴 분기는 ST-080 이후 보강)
- ST-074 ← ST-060 (S6 알림함), ST-069 (S1 Realtime)

## Definition of Done

- [ ] 급여명세서 500명 PDF 5분 이내 + 일괄 발송 + 미열람 7일 재발송 cron
- [ ] 직원 모달 진입 자동 열람 처리 + Signed URL 15분
- [ ] 증명서 요청 → HR 승인 → PDF 발급 (워터마크) → EM-07 다운로드
- [ ] 계약서 템플릿 변수 자동 채움 + PDF (전자서명 v1.2 슬롯)
- [ ] CM-16 6 역할 × 메뉴 매트릭스 + 로그아웃 audit
- [ ] CM-17 Realtime 미읽음 배지 ≤ 2초 + 100건 초과 "99+" + 자동 읽음
- [ ] CI 9 + 4 job PASS

## 위험

- **R-Puppeteer Vercel serverless 메모리**: 500명 일괄 시 메모리 한계 → Supabase Edge Function (Deno) + chrome-aws-lambda 검토. fallback: 100명씩 batch 큐
- **R-Realtime 100건 + Sprint 6 검증 후 운영 부담**: Supabase realtime quota 모니터링 (Sentry alert)

## S6 spill 수용 (P3 시나리오)

S6 (mvp-plan §4 + sprint-006 위험)에서 3 페어 병렬 부담 시 다음 Story spill 수용 가능:
- ST-043 (휴가 자동 부여 cron, 5 SP) → S7에 흡수 (sprint-007 본 추가 SP = +5 → 45)
- ST-044 (결재 SLA 임박 cron, 5 SP) → S7에 흡수 (+5 → 50)
- ST-045 (요청 취소 흐름, 3 SP) → S7에 흡수 (+3 → 53)
- ST-070 (OP-01 placeholder, 5 SP) → S8 흡수 권장 (이미 S6 placeholder + S8 실제 데이터 연결 정책 — 화면 자체도 S8로 전체 이동 옵션, sprint-008 +5 → 34)

spill 시 본 sprint-007 SP는 40 → 최대 53 SP까지 흡수. 28 MD → 38 MD. Sprint 1 부트스트랩 실측 후 보수배수가 4배+ 확인되면 spill 발동 의무 (mvp-plan §7 R-1 SP × 0.5 MD 환산 위험 반영).
