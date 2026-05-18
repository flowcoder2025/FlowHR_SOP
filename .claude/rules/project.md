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
- CI 게이트: `.github/workflows/pr-checks.yml` **9 job** — 공통 3 (commit-msg, encoding, version-format) + 와이어프레임 path-scope 6 (html-syntax, design-system-ssot, inline-svg-sprite-check, native-element-wrap-check, showcase-coverage-check, playwright-smoke). Phase 7 진입 시 `phase7-code.yml` 신규 4 job 추가 (lint, typecheck, unit-test, build — `apps/**` + `packages/**` path-scope). [2026-05-19 codex 권고 5번 채택]

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

## 7. 평가 시스템 v2 (evaluator + codex 통합, 2026-05-16)

`.flowset/contracts/review-system.md`를 SSOT로 참조. 본 §은 자동화 흐름과 사용자 개입 시점만 요약.

### 7-1. 평가 흐름 표준 (그룹 양산 종료 시)

```
양산 종료
  ↓
VERSION/CHANGELOG 갱신 + commit/push
  ↓
PR draft 생성
  ↓
evaluator (Agent subagent_type=evaluator, run_in_background=true)
codex     (Agent subagent_type=general-purpose, run_in_background=true,
           prompt에 mcp__codex__codex 호출 + 결과 저장 위탁)
  ↓ (두 통지 대기)
통합 판정 (review-system.md §4 매트릭스)
  ├── PASS_BOTH                   → ready → CI → auto-merge → tag
  ├── CONDITIONAL                 → KI 등록 + 트리거 평가 → hotfix 또는 백업 후 머지
  ├── BLOCKED_FOR_HOTFIX          → hotfix → 재평가
  ├── FAIL                        → 정정 → 재호출 (최대 3회)
  └── USER_INTERVENTION_REQUIRED  → 사용자 결정 대기
```

### 7-2. 사용자 개입 의무 시점 (review-system.md §10)

다음 경우에만 사용자 결정 요청. 그 외(P2/P3 누적, hotfix 자동 진행, 일반 양산)는 능동 처리.

1. **P0 발생** (즉시)
2. **P1 threshold 도달** (누적 3건)
3. **P0/P1 downgrade** 또는 P0/P1 백업 처리 제안
4. **public contract** / DB schema / 외부 dependency / infra 변경 필요
5. **evaluator와 codex가 PASS/FAIL 정면 충돌** (`USER_INTERVENTION_REQUIRED`)
6. **3회 연속 재평가 FAIL** (스코프 재검토)

### 7-3. codex 리뷰 비용 조절

- **G0/G1/G2 (패턴 확립)**: codex full review
- **G3/G4 (반복 양산)**: changed files + sampled screens (30%) + known-risk checklist
- **threshold 근접 시**: full review
- **Phase 5 전체 evaluator (44 화면)**: full review

### 7-4. KI 등록 + 트리거 처리

`.flowset/known-issues/triggers.md` 그대로 유지 (임계 P0=1/P1=3/P2=5/P3=10). codex 결함도 동일 트리거 + 등급 매핑은 review-system.md §5/§6.

### 7-5. CI 정적 체크 (codex 부담 감소)

codex가 반복 지적하는 항목은 `.github/workflows/pr-checks.yml` 정적 체크로 승격:
- `href-presence-check`
- `media-query-check`
- `ds-redefinition-check` (기존 design-system-ssot 확장)
- `aria-modal-check`

### 7-6. v3 추가 검증 (2026-05-16, file:// 호환 + 렌더링)

v2 운영 후 검증 누락(아이콘 미표시 / native control / showcase 분리) 대응. `review-system.md §17` SSOT.

#### CI 신규 4 job
| Job | 검사 |
|-----|------|
| `inline-svg-sprite-check` | 화면 HTML이 외부 `icons.svg#` 참조 시 인라인 sprite 보유 의무 (file:// 차단 방지) |
| `native-element-wrap-check` | `<select>` `<input type=file/date>` 발견 시 `.select-wrap` / `.file-input` / `.date-input` wrap 패턴 의무 |
| `showcase-coverage-check` | 화면이 사용한 DS 클래스가 `component-usage-matrix.json`에 매핑 의무 |
| `playwright-smoke` | Playwright headless로 모든 화면 file:// 렌더링 + console error 0 + svg use bbox > 0 + native appearance != auto + screenshot artifact |

#### evaluator 5번째 축
- Phase 5 와이어프레임 한정 — DS 사용 충실도 10% (`review-rubric.md §10`)
- Hard gate: file:// 아이콘 미표시 2화면+ → 최대 4점 + WARNING 강제

#### codex 프롬프트 의무 체크리스트 (5항목)
1. file:// asset compatibility
2. native control visual compliance
3. showcase-to-usage consistency
4. rendered evidence requirement
5. cross-screen pattern drift

#### Playwright smoke 도입 시점
**지금 도입** (Phase 7로 미루지 않음). pixelmatch baseline regression은 Phase 7로 유보.
