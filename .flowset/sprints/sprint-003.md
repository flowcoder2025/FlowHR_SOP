# Sprint 3 — 직원/조직 마스터 + 관리자 대시보드 + 공통 인프라

> **주차**: 5~6주 (55 SP / 38 MD 보수)
> **목표**: 회사가 직원 등록 + 조직도 운영 + 관리자 대시보드 + 파일/Excel/PDF 인프라 확보
> **SSOT**: tasks.md TS-041~053 (EP-06) + TS-221~223 (ST-071) + TS-175~183 (ST-063/064/065)

## Story 목록 (11 Story / 55 SP)

> 분해 합: ST-024~030 (7) + ST-071 (1) + ST-063/064/065 (3) = **11 Story / 55 SP** ↔ stories.md L505 정합 ✓

| Story | 화면/도메인 | SP | 우선 |
|-------|----------|----|------|
| ST-024 | TA-02 직원 등록·수정·상태 | 8 | P0 |
| ST-025 | TA-02 일괄 Excel 업로드 | 5 | P0 |
| ST-026 | TA-03 직원 상세 9탭 | 8 | P0 |
| ST-027 | TA-03 휴직·퇴사 처리 | 3 | P0 |
| ST-028 | TA-04 조직도 CRUD + 드래그 | 5 | P0 |
| ST-029 | TA-04 구성원 다중 이동 | 3 | P0 |
| ST-030 | TA-03 본인 변경 요청 | 3 | P0 |
| ST-071 | TA-01 관리자 대시보드 | 5 | P0 |
| ST-063 | CM-09/10 파일 업로드·미리보기 | 5 | P0 |
| ST-064 | CM-11/12 Excel 가져오기/내보내기 | 5 | P0 |
| ST-065 | CM-13 PDF 생성 (워터마크) | 5 | P0 |

## 핵심 산출물

- `supabase/migrations/`: employees, departments (self-ref + path cache), roles, employee_change_requests
- `apps/web/app/[locale]/(tenant)/{dashboard,employees,[id],org-chart}/page.tsx`
- `packages/ui` 신규: KpiCard, OrgTreePane, FileInput, DropdownMenu, Drawer
- `packages/api-client/src/hooks/tenant.ts` (employees + departments + dashboard)
- `apps/web/app/api/v1/tenant/employees/bulk` (검증 + 부분 INSERT + 실패 행 반환)
- Storage policy: `tenants/{tid}/{domain}/{yyyy-mm}/` + Signed URL 15분
- SheetJS wrapper (`packages/api-client/src/lib/excel.ts`) + Puppeteer/React-PDF wrapper

## 의존

- ST-024~027 ← ST-006 (테넌트, S2), ST-005 (RLS, S1)
- ST-028~029 ← ST-006
- ST-030 ← ST-024
- ST-071 ← ST-024, ST-068 (audit), ST-069 (Realtime)
- ST-063 ← Storage policy 셋업 (S1 인프라 일부 보완 가능)
- ST-064/065 ← ST-063

## Definition of Done

- [ ] 직원 CRUD + 초대 메일 (7일 만료) + 상태 변경 사유 + 휴직/퇴사 시 세션 종료
- [ ] Excel 100행 일괄 업로드 + 부분 실패 행 다운로드
- [ ] 직원 상세 9탭 권한별 가시성 (manager 자기 팀만, employee 본인만 일부)
- [ ] 조직도 드래그앤드롭 + 자식 경로 재계산
- [ ] TA-01 대시보드 KPI 6 2초 렌더 + manager 자기 팀만 집계 + employee → EM-01 리다이렉트
- [ ] Storage MIME 검증 + 50MB 제한 + Signed URL 15분
- [ ] PDF 워터마크 (회사 인장) + 500명 일괄 5분 보장
- [ ] CI 9 + 4 job PASS

## 위험

- **R-9탭 컴포넌트 큰 부담**: TS-046 10h 한 Task. → 9탭 shell + 기본 4탭(기본/인사/계약/근태) Sprint 3, 나머지 5탭(휴가/급여/문서/결재이력/변경이력) Sprint 5 점진
- **R-PDF 생성 워커**: Puppeteer Chromium 빌드 무거움 → Vercel serverless 한계 → Supabase Edge Function 활용
