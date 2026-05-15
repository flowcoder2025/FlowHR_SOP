# Known Issues — Registry (SSOT)

> 모든 미해결 알려진 이슈의 단일 진실 출처. 발견 시 즉시 등록, 해결 시 `archive/`로 이동 후 본 표에서 제거.

## 카운트 요약

| 심각도 | 활성 건수 | 트리거 임계 | 트리거 도달 |
|--------|----------|------------|-----------|
| P0 Critical | 0 | 1 | ❌ |
| P1 High | 0 | 3 | ❌ |
| P2 Medium | 0 | 5 | ✅ 모두 해소 (KI-001/002/003 resolved Phase 3/4) |
| P3 Low | 6 | 10 | ❌ (KI-013/016/017/020/023/025 활성 — Phase 6/7/9/10/v1.2 scheduled, batch-002로 KI-018/019/021/022/024/026 resolved) |

**카운트 갱신 규칙**: 이슈 등록/해결 시 즉시 본 표 재계산. P0 1건 이상이면 즉시 트리거. 누적 건수가 임계 도달 시 `triggers.md §3` 절차 발동.

## 활성 이슈

| KI-ID | 심각도 | 발견 Phase | 영역 | 제목 | 출처 | 등록일 | 상태 |
|-------|--------|-----------|------|------|------|--------|------|
| ~~KI-001~~ | P2 | 1 | API | ~~OP-08 Ticket SLA 알림 트리거~~ | — | — | **resolved (Phase 4 cron.md §2)** |
| ~~KI-002~~ | P2 | 1 | ERD | ~~tenant_drafts 정식 엔티티화 + ERD 스키마~~ | — | — | **resolved (Phase 3 erd.md L114-121)** |
| ~~KI-003~~ | P2 | 1 | API | ~~TA-08 결재 SLA 단계별 트리거~~ | — | — | **resolved (Phase 4 cron.md §2)** |
| ~~KI-004~~ | P3 | 1 | ERD | ~~Attendance.status enum 영문 통일~~ | — | — | **resolved (Phase 3 enums.md + erd.md L334 동기화)** |
| KI-005 | P3 | 1 | Cross-cutting | EmployeeChangeRequest TA-03 변경이력 탭 매핑 보강 검토 (screens_to_entities_map TA-03에 추가됨) — Phase 2 백로그 작성 시 의존성 그래프 확인 | evaluator | 2026-05-15 | scheduled (Phase 2) |
| KI-006 | P3 | 1 | Tech | 로깅 도구 미확정 (Axiom vs Supabase Logs) — Phase 7 진입 전 결정 | 07-risks D-01 | 2026-05-15 | scheduled (Phase 7) |
| KI-007 | P3 | 1 | Tech | 부하 테스트 도구 미확정 (k6 vs Artillery) — Phase 8 진입 전 결정 | 07-risks D-02 | 2026-05-15 | scheduled (Phase 8) |
| ~~KI-008~~ | P2 | 1 | PRD | ~~06-mvp-scope.md TA 섹션 분류 차이~~ | — | — | **resolved (batch-001)** |
| ~~KI-009~~ | P2 | 1 | PRD | ~~OP-11 frontmatter entities 누락~~ | — | — | **resolved (batch-001)** |
| ~~KI-010~~ | P3 | 1 | API | ~~matrix.json TenantDraft.endpoints U 누락~~ | — | — | **resolved (batch-001)** |
| ~~KI-011~~ | P3 | 1 | PRD | ~~04-data-model.md 변경 이력 "26 엔티티" 잔존~~ | — | — | **resolved (batch-001)** |
| ~~KI-012~~ | P3 | 1 | PRD | ~~03-tech-architecture.md i18n "en 추후"~~ | — | — | **resolved (batch-001)** |
| KI-013 | P3 | 2 | Backlog | EP-03/04/05/09/10/11/12 7 Epic Task 분해 미완 — Phase 6 스프린트 계획 진입 전에 완전 분해 필요 | evaluator Phase 2 attempt 1 | 2026-05-15 | scheduled (Phase 6) |
| ~~KI-014~~ | P3 | 2 | Backlog | ~~EP-08 AttendanceModification routing~~ | — | — | **resolved (Phase 3 rls.md §4 Approval polymorphic)** |
| KI-015 | P3 | 2 | Backlog | estimation.md 200 MD vs tasks.md 739 MD 환산 차이는 명시되어 있으나 외부 견적 시 어느 기준 사용할지 정책 명확화 권장 | evaluator Phase 2 attempt 1 | 2026-05-15 | resolved (estimation.md L60-63에 정책 명시) |
| KI-016 | P3 | 2 | Backlog | dependency-graph.md NHN Cloud 30~60일 출처 URL/발행일 부재 — 운영사가 실제 신청 시 NHN Cloud 공식 가이드 URL 인용 보강 | evaluator Phase 2 attempt 2 | 2026-05-15 | scheduled (Phase 9 베타 진입 전 NHN Cloud 신청 시점) |
| KI-017 | P3 | 3 | DB | rls.md §3 37 테이블 정책 표가 "패턴 A/B/C + 자연어" 형식 — 일부 항목 실제 CREATE POLICY SQL 코드 미작성. Phase 7 마이그레이션 00000000000020_rls_policies.sql 작성 시 패턴 변형 SQL 생성 작업 필요 | evaluator Phase 3 | 2026-05-15 | scheduled (Phase 7 마이그레이션 변환) |
| ~~KI-018~~ | P3 | 3 | DB | ~~clock_in_location postgis vs jsonb~~ | — | — | **resolved (Phase 4 schemas.md LocationSchema jsonb)** |
| ~~KI-019~~ | P3 | 3 | DB | ~~approval_lines.conditions zod~~ | — | — | **resolved (Phase 4 schemas.md ConditionRule)** |
| KI-020 | P3 | 3 | DB | 신규 직원 leave_balances 자동 INSERT 트리거 위치 결정 (애플리케이션 vs DB after-trigger) — Phase 7 결정 | evaluator Phase 3 | 2026-05-15 | scheduled (Phase 7) |
| ~~KI-021~~ | P3 | 4 | API | ~~EM-02 PRD §7 body 형식 KI-018 결과 동기화~~ | — | — | **resolved (batch-002)** |
| ~~KI-022~~ | P3 | 4 | API | ~~Common API 카운트 차이~~ | — | — | **resolved (batch-002)** |
| KI-023 | P3 | 4 | API | Signature 엔티티 zod 스키마 — TA-11 v1.2 전자서명 도입 시 작성 | evaluator Phase 4 | 2026-05-15 | scheduled (v1.2) |
| ~~KI-024~~ | P3 | 4 | API | ~~/api-keys owner 파라미터 컨벤션~~ | — | — | **resolved (batch-002)** |
| KI-025 | P3 | 4 | API | Rate Limiting 엔드포인트별 차등 — 운영 시점 실측 후 결정 | evaluator Phase 4 | 2026-05-15 | scheduled (Phase 10) |
| ~~KI-026~~ | P3 | 4 | API | ~~결재 폴리모픽 자식 audit_logs 정책~~ | — | — | **resolved (batch-002)** |

## 등록 형식

이슈를 추가할 때 위 표에 한 행 추가 + 본 파일 하단에 상세 블록을 작성:

```markdown
### KI-NNN — {제목}

- **심각도**: P0 | P1 | P2 | P3
- **발견 Phase**: 0~10 또는 "operations"
- **영역**: PRD / Backlog / ERD / API / Wireframe / Sprint / Code / QA / Beta / Ops / Cross-cutting
- **출처**: evaluator (eval-results/phase-N.eval.md) / 사용자 / 베타 / 운영 / Claude 발견
- **등록일**: YYYY-MM-DD
- **상태**: open | scheduled | in_progress
- **영향**: {영향받는 기능/모듈/사용자}
- **근거**: {파일:줄번호 또는 인용}
- **권장 조치**: {구체적 수정 방향}
- **batch 후보**: WI-KI-batch-NNN (트리거 도달 시 할당)
```

## 해결 흐름

1. 트리거 도달 (P0 즉시 / P1 3건 / P2 5건 / P3 10건 / Phase 종료 / 사용자 명시)
2. `WI-KI-batch-NNN` 생성하여 fix_plan.md에 추가
3. 묶음 수정 진행 (코드 / 문서 영역별로)
4. 해결된 이슈를 `archive/YYYY-MM-DD-batch-NNN.md`로 이동
5. 본 INDEX.md 활성 표에서 제거, 카운트 표 갱신
6. 해당 영역 evaluator 재호출하여 PASS 재확인
7. `.flowset/eval-results/phase-N.pass` 마커 갱신 (필요 시)

## 카운트 자동 검사 (수동 절차, 라이트)

매 작업 종료 시 Claude가:
1. 본 표의 활성 건수 재계산
2. 트리거 임계 도달 여부 확인
3. 도달 시 사용자에게 "트리거 도달 — batch 진행 권장" 보고
