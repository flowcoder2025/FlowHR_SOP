# FlowHR 프로젝트 규칙

> 글로벌 규칙(`~/.claude/rules/wi-*.md`) 위에 적용되는 프로젝트별 규칙.

## 1. 진행 순서

10단계 워크플로우 외 다른 순서로 진행하지 않는다. 단계 건너뛰기 금지.

| Phase | 게이트 | 다음 진입 조건 |
|-------|-------|--------------|
| 0 셋업 | `.flowset/` 구조 + CLAUDE.md 존재 | 사용자 기술 스택 결정 |
| 1 PRD | `.flowset/prd.md` 존재 + matrix.json entities 채워짐 | 사용자 승인 |
| 2 백로그 | epics/stories/tasks 작성 | matrix.json 모든 entities에 endpoints/gherkin 슬롯 채워짐 |
| 3 ERD | `supabase/migrations/*.sql` 또는 erd.md 작성 | 마이그레이션 적용 |
| 4 API | openapi.yaml 작성 | data-flow.md / api-standard.md와 정합 |
| 5 와이어프레임 | 36개 화면 analysis/*.md 작성 | Codex 이미지 + Claude 분석 완료 |
| 6 스프린트 | mvp-plan.md + sprint-001~N.md | 종속성 그래프 정합 |
| 7 개발 | Sprint 1 첫 WI 완료 | smoke test pass |
| 8 QA | scenarios.md 작성 | 권한 매트릭스 음성/양성 케이스 포함 |
| 9 베타 | onboarding.md 작성 | 베타 1호 고객 확정 |
| 10 운영 | runbook.md 작성 | SLA 명문화 |

## 2. 산출물 작성 규칙

- 한글로 작성 (코드 식별자만 영문)
- 표 / Mermaid / 코드 펜스 적극 활용
- 각 산출물 첫 줄에 SSOT 또는 출처 명시
- 변경 이력 섹션 유지 (날짜 + 변경 + 사유)

## 3. matrix.json 변경 규칙

- entities 추가/삭제는 PRD 변경 동반 필수
- status 필드 (missing/pending/done)는 실제 코드/테스트 존재 여부로 갱신
- permissions 필드는 spec §9 권한 매트릭스와 일치

## 4. Codex 이미지 생성 호출

- 한 번에 1 화면 1 이미지
- 프롬프트 템플릿은 `docs/FlowHR_screen_spec_v_1.md §13` 기준
- 이미지 저장 후 즉시 `analysis/{화면ID}.md` 작성 (이미지 파일만 두지 않는다)

## 5. 사용자 확인 필수 시점

- Phase 종료 시 (다음 Phase 진입 전 승인)
- matrix.json entities/roles 구조 변경 시
- 디바이스 매트릭스 (웹/PWA/네이티브) 범위 변경 시
- 외부 비용 발생 시 (Supabase 유료 플랜 / Vercel Pro / EAS Build / Codex 대량 호출)
