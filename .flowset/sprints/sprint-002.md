# Sprint 2 — 테넌트 라이프사이클 + 회사 설정 P0

> **주차**: 3~4주 (49 SP / 35 MD 보수)
> **목표**: 운영사가 신규 테넌트 등록 가능 (OP-04 7단계 마법사) + 테넌트 관리 (OP-02/03) + 회사 설정 (TA-13 회사정보/근무/휴가/결재라인)
> **SSOT**: tasks.md TS-022~040 (EP-02) + TS-145~152 (EP-10 ST-053/054)

## Story 목록 (7 Story / 49 SP)

| Story | 화면/도메인 | SP | 우선 |
|-------|----------|----|------|
| ST-006 | OP-04 7단계 마법사 | 13 | P0 |
| ST-007 | OP-02 테넌트 목록 | 5 | P0 |
| ST-008 | OP-03 테넌트 상세 8탭 | 8 | P0 |
| ST-009 | OP-02 상태 변경 + audit | 3 | P0 |
| ST-010 | CM-03 테넌트 관리자 활성화 | 2 | P0 |
| ST-053 | TA-13 회사 설정 9탭 | 13 | P0 |
| ST-054 | TA-13 결재라인 조건 분기 | 5 | P0 |

## 핵심 산출물

- `supabase/migrations/`: tenants, tenant_drafts, subscriptions, tenant_settings, work_policies, leave_types, approval_lines, document_templates, roles 마이그레이션
- `apps/web/app/[locale]/(operator)/tenants/{page,new,[id]}.tsx` (OP-02/03/04)
- `apps/web/app/[locale]/(tenant)/settings/page.tsx` (TA-13 9탭)
- `packages/ui` 신규: Stepper, DataTable, FilterBar, DomainPrefixInput, SettingsPane
- `apps/web/app/api/v1/operator/tenants/*` Route Handler + drafts/check-domain/check-business-number
- 트랜잭션 API (`POST /operator/tenants`) — tenants/subscriptions/tenant_settings/users 동시 INSERT + 관리자 초대 메일

## 의존 (dependency-graph §Sprint 2)

- ST-006 ← ST-005 (RLS, Sprint 1), ST-053 (초기 데이터 입력 폼 — 같은 Sprint 내 동시 진행)
- ST-007~010 ← ST-006
- ST-053/054 ← ST-005

## Definition of Done

- [ ] 7단계 마법사 정상 완료 → tenants + subscriptions + tenant_settings + admin user 동시 INSERT 트랜잭션
- [ ] 슬러그/사업자번호/이메일 실시간 중복 검증 (≤ 300ms)
- [ ] 관리자 초대 메일 발송 실패 시 재시도
- [ ] 임시저장 → 재진입 (3단계까지 입력 후 이탈해도 복원)
- [ ] TA-13 9탭 (회사정보/근무/휴가/결재라인/역할/알림/문서양식/보안/감사로그) 저장 + 적용일 예약 cron
- [ ] 결재라인 조건 분기 (5일 이상 = 대표 결재) audit 기록
- [ ] OP-03 비활성화 → 활성 세션 즉시 무효화 (Realtime broadcast)
- [ ] 권한 매트릭스: operator_staff "비활성화" 버튼 비활성 확인
- [ ] CI 9 + 4 job PASS

## 위험

- **R-마법사 임시저장 충돌**: 한 운영자가 같은 테넌트 draft 2개 만들 때 → draft.owner_id + (operator_id, status='draft') unique 제약
- **R-tenant 비활성화 시 세션 무효화 cascade**: Realtime broadcast 누락 시 로그인 유지 가능 → ST-068 audit 비교 + ST-069 wrapper 테스트로 검증
