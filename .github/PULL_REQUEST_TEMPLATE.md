<!--
PR 제목 형식: WI-NNN-[type] 한글 작업명
  - NNN: 영숫자 (숫자 / 영숫자 / 서브넘버링 / batch-NNN+NNN 묶음)
  - type: feat|fix|docs|style|refactor|test|chore|perf|ci|revert
  - 예외: WI-chore / WI-docs / WI-Handoff (번호 없는 시스템 커밋)
참조: ~/.claude/rules/wi-global.md
-->

## Summary

<!-- 변경 핵심 1~3줄 -->

## 변경 내역

<!-- 커밋별 또는 영역별 정리 (PRD/DB/API/Wireframe/Backlog 등) -->

- 

## 산출물 버전

- 본 PR이 영향을 주는 `.flowset/VERSION`: `wf-vX.Y.Z`
- 마일스톤: <!-- 예: G1 완료 (wf-v0.1.0) / patch (wf-v0.1.1) / 베이스라인 -->

## Known Issues 영향

- 해소: <!-- KI-NNN ... -->
- 신규: <!-- KI-NNN P? — 사유 -->
- 잔존: <!-- 변경 없음 -->

## CI 게이트 자가 점검

### 공통

- [ ] 커밋 메시지 `WI-NNN-[type] 한글 작업명` 형식 (모든 커밋)
- [ ] UTF-8 + no BOM + LF 인코딩
- [ ] `.flowset/VERSION` 형식 `wf-vX.Y.Z`

### 와이어프레임 PR (`.flowset/wireframes/**`)

- [ ] HTML syntax (htmlhint) 통과
- [ ] 디자인 시스템 SSOT 정합 (`_design-system/` 참조 + 인라인 컴포넌트 정의 없음)

### 코드 PR (`apps/**` · `packages/**` · `supabase/**`)

- [ ] `phase7-code.yml` 4 job 통과 (lint / typecheck / unit-test / build)
- [ ] zod 스키마 변경 시 `pnpm --filter @flowhr/schemas build` 재실행 + `packages/schemas/dist/openapi.yaml` 함께 커밋 (OpenAPI diff 게이트)
- [ ] API 변경 시 `.flowset/api/*.md` + zod 스키마 **동시 갱신** (한쪽만 변경 금지)
- [ ] 듀얼검증(evaluator + codex) PASS_BOTH + `.flowset/eval-results/<WI>.pass` 마커 커밋 (`project.md §1-1`, `dual-verification-gate` 필수체크)

## Test plan

<!-- 사람이 검수할 항목 (브라우저 시각 검수 / 산출물 정독 / evaluator PASS 등) -->

- [ ] 

🤖 Generated with [Claude Code](https://claude.com/claude-code)
