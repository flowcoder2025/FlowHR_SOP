# Known Issues — Registry (SSOT)

> 모든 미해결 알려진 이슈의 단일 진실 출처. 발견 시 즉시 등록, 해결 시 `archive/`로 이동 후 본 표에서 제거.

## 카운트 요약

| 심각도 | 활성 건수 | 트리거 임계 | 트리거 도달 |
|--------|----------|------------|-----------|
| P0 Critical | 0 | 1 | ❌ |
| P1 High | 0 | 3 | ❌ |
| P2 Medium | 5 | 5 | ✅ **트리거 도달 — Phase 2 진입 시 batch 진행** |
| P3 Low | 6 | 10 | ❌ |

**카운트 갱신 규칙**: 이슈 등록/해결 시 즉시 본 표 재계산. P0 1건 이상이면 즉시 트리거. 누적 건수가 임계 도달 시 `triggers.md §3` 절차 발동.

## 활성 이슈

| KI-ID | 심각도 | 발견 Phase | 영역 | 제목 | 출처 | 등록일 | 상태 |
|-------|--------|-----------|------|------|------|--------|------|
| KI-001 | P2 | 1 | API | OP-08 Ticket priority SLA(30분/2h/24h/72h) 알림 트리거 로직 미명세 | evaluator | 2026-05-15 | open |
| KI-002 | P2 | 1 | ERD | OP-04 본문에 등장하는 `tenant_drafts`는 1차 정정 후 정식 엔티티화 (matrix.json 추가됨) — Phase 3 ERD에서 스키마 확정 | evaluator | 2026-05-15 | scheduled (Phase 3) |
| KI-003 | P2 | 1 | API | TA-08 결재 단계별 SLA 위반 알림 트리거 (TA-09와 동일 정책 vs 차별화) — Phase 4 API 결정 | evaluator | 2026-05-15 | scheduled (Phase 4) |
| KI-004 | P3 | 1 | ERD | Attendance.status enum 한글/영문 혼재 — Phase 3 ERD에서 영문 통일 확정 | evaluator | 2026-05-15 | scheduled (Phase 3) |
| KI-005 | P3 | 1 | Cross-cutting | EmployeeChangeRequest TA-03 변경이력 탭 매핑 보강 검토 (screens_to_entities_map TA-03에 추가됨) — Phase 2 백로그 작성 시 의존성 그래프 확인 | evaluator | 2026-05-15 | scheduled (Phase 2) |
| KI-006 | P3 | 1 | Tech | 로깅 도구 미확정 (Axiom vs Supabase Logs) — Phase 7 진입 전 결정 | 07-risks D-01 | 2026-05-15 | scheduled (Phase 7) |
| KI-007 | P3 | 1 | Tech | 부하 테스트 도구 미확정 (k6 vs Artillery) — Phase 8 진입 전 결정 | 07-risks D-02 | 2026-05-15 | scheduled (Phase 8) |
| KI-008 | P2 | 1 | PRD | 06-mvp-scope.md TA 섹션 헤더(✓10+△4) vs 표(✓11+△3) 분류 미세 차이 (합계 36 정합) | evaluator attempt 2 | 2026-05-15 | open (Phase 2 batch) |
| KI-009 | P2 | 1 | PRD | OP-11 frontmatter entities에 BackupJob/ApiKey 누락 (matrix.json screens_to_entities_map은 포함) | evaluator attempt 2 | 2026-05-15 | open (Phase 2 batch) |
| KI-010 | P3 | 1 | API | matrix.json TenantDraft.endpoints에 U(PATCH) 메서드 누락 (permissions.U는 정의됨) | evaluator attempt 2 | 2026-05-15 | open (Phase 2 batch) |
| KI-011 | P3 | 1 | PRD | 04-data-model.md:200 변경 이력에 "26 엔티티" 잔존 (본문은 36 정정) | evaluator attempt 2 | 2026-05-15 | open (Phase 2 batch) |
| KI-012 | P3 | 1 | PRD | 03-tech-architecture.md:23 i18n "en 추후" → v2.0 도입 시점 명시 권장 | evaluator attempt 2 | 2026-05-15 | open (Phase 2 batch) |

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
