# FlowHR 프로젝트 규칙

> 글로벌 규칙(`~/.claude/rules/wi-*.md`) 위에 적용되는 프로젝트별 규칙.

## 1. 진행 순서

10단계 워크플로우 외 다른 순서로 진행하지 않는다. 단계 건너뛰기 금지.

| Phase | 산출물 게이트 | evaluator 모드 | 다음 진입 조건 |
|-------|-------------|--------------|--------------|
| 0 셋업 | `.flowset/` 구조 + CLAUDE.md 존재 | (생략) | 사용자 기술 스택 결정 |
| 1 PRD | `.flowset/prd.md` + matrix.json entities | doc | evaluator PASS + 사용자 승인 |
| 2 백로그 | epics/stories/tasks 작성 | doc | evaluator PASS + matrix.json 정합 |
| 3 ERD | `.flowset/db/erd.md` + rls.md | doc | evaluator PASS |
| 4 API | `.flowset/api/openapi.yaml` | doc | evaluator PASS + api-standard 정합 |
| 5 와이어프레임 | 36개 analysis/*.md + images/*.png | doc | evaluator PASS |
| 6 스프린트 | mvp-plan.md + sprint-001~N.md | doc | evaluator PASS |
| 7 개발 | Sprint 1 첫 WI 완료 | code | WI별 evaluator PASS |
| 8 QA | scenarios.md + e2e.md | doc | evaluator PASS |
| 9 베타 | onboarding.md | doc | evaluator PASS + 1호 고객 확정 |
| 10 운영 | runbook.md + SLA | doc | evaluator PASS |

**evaluator는 `.flowset/guardrails.md §5-1, §7` 절차로 매 Phase 종료 시 의무 호출.**

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

## 6. PR 머지 + 정리 자동화 체계 (Phase 5+)

### 6-1. 정책
- main branch protection 활성화 (gh api `/repos/:owner/:repo/branches/main/protection`)
- 모든 PR은 `gh pr merge --auto --squash --delete-branch` 로 활성화 — CI PASS 시 자동 머지 + 로컬+원격 브랜치 자동 삭제 + main 자동 전환
- 사용자 검토 없이 즉시 머지 (2026-05-16 사용자 결정)
- CI 게이트: `.github/workflows/pr-checks.yml` 5 job (commit-msg, encoding, html-syntax, design-system-ssot, version-format)

### 6-2. PR 머지 직후 표준 시퀀스 (Claude 자동 수행 의무)

```bash
# 1. main 동기화 (auto-merge가 자동 전환했어도 명시 보장)
git checkout main
git pull --ff-only origin main
git fetch --prune

# 2. (그룹 종료 PR인 경우) tag 부여
git tag -a wf-vX.Y.0 <merge-commit-sha> -m "..."
git push origin wf-vX.Y.0

# 3. 머지된 로컬 브랜치 정리 (가드 — --delete-branch 못 미친 경우 대비)
git branch --merged main | grep -v "^\*\|main$" | xargs -r git branch -d

# 4. 다음 작업 브랜치 시작 (해당되면)
git checkout -b feature/WI-<next>-...
```

### 6-3. 다음 작업 브랜치 생성 시 보장

- 항상 최신 main 기준으로 분기 (`git checkout main && git pull --ff-only && git checkout -b ...`)
- 직전 그룹 머지가 main에 반영된 후에만 다음 그룹 시작 — 머지 대기 중 다음 그룹 작업 금지

### 6-4. 자동화 실패 시 fallback

- gh pr merge --auto 후 CI fail 시 → 사용자에게 즉시 보고 + 수정 push (auto-merge 유지)
- branch protection이 admin 우회 허용 (`enforce_admins: false`) — 비상 시 사용자가 직접 머지 가능
- 원격 브랜치 삭제 누락 시 → `git push origin --delete <branch>` + `git fetch --prune`
