# Review System v2 — evaluator + Codex 통합 평가 체계

> **상태**: 공식 정책 (사용자 승인 2026-05-16, Codex 협의 반영)
> **SSOT**: 본 문서. `review-rubric.md` / `evaluator.md` / `triggers.md` / `project.md §6-7`는 본 문서를 참조.
> **목적**: Phase 5 와이어프레임부터 Phase 10 운영까지 모든 산출물 평가 흐름의 단일 진실 출처.

## 1. 평가자 역할 분리

| 평가자 | 종류 | 평가 축 | 출력 |
|--------|------|--------|------|
| **evaluator** | Claude sub-agent (`.claude/agents/evaluator.md`, opus) | 4축 (완성도/정합성/구체성/실행가능성) — doc 모드 / code 모드 | 점수 4축 + 가중 합계 + PASS/FAIL + ISSUES P0~P3 + ANTI_PATTERNS_FOUND |
| **codex** | gpt-5 (MCP `mcp__codex__codex`, sandbox: read-only) | 구현 전환 리스크 / UX / 접근성 / 모바일 반응형 / 보안 / 라우팅 / 페이지간 cross-link | 종합 점수 + verdict (PASS/WARNING/FAIL) + 결함 P0~P3 + 화면별 코멘트 |

**중복이 아닌 보완**: evaluator는 문서 완성도, codex는 구현 리스크. 두 평가는 다른 관점이며 충돌이 아니라 합산되어야 한다.

## 2. 실행 흐름

```
양산 종료 (그룹 또는 산출물)
  ↓
VERSION/CHANGELOG 갱신 + commit/push
  ↓
PR draft 생성
  ↓
evaluator (background) + codex (background) 병렬 호출
  ↓
두 결과 통지 받으면 통합 분석
  ↓
통합 판정 결정 (§4 참조)
  ├── PASS_BOTH                   → 즉시 ready → CI → auto-merge → tag
  ├── BLOCKED_FOR_HOTFIX          → KI batch 발동 → hotfix → 재평가
  ├── FAIL                        → 정정 후 evaluator/codex 재호출 (최대 3회)
  └── USER_INTERVENTION_REQUIRED  → 사용자 결정 대기
```

## 3. codex verdict 명문화 (Codex 합의안 §2-1)

| verdict | 조건 |
|---------|------|
| **PASS** | P0/P1 없음, P2가 threshold 미만이며 phase gate 위반 없음 |
| **WARNING** | P0 없음, P1이 1~2건이거나 P2/P3 누적 관리 필요 |
| **FAIL** | P0 1건 / P1 3건 이상 / phase gate 위반 |

## 4. 통합 판정 매트릭스

| evaluator | codex | 통합 판정 | 조치 |
|-----------|-------|----------|------|
| PASS | PASS | **PASS_BOTH** | 즉시 ready → auto-merge |
| PASS | WARNING | **CONDITIONAL** | KI 등록 + 트리거 평가 → P1 threshold 도달 시 BLOCKED_FOR_HOTFIX, 미달 시 백업 후 머지 |
| PASS | FAIL | **BLOCKED_FOR_HOTFIX** | codex P1 결함 hotfix → 재평가 |
| FAIL | (any) | **FAIL** | evaluator 결함 정정 → 재호출 |
| (any) | (PASS/FAIL이 정면 충돌) | **USER_INTERVENTION_REQUIRED** | 사용자 결정 |

**원칙**: FAIL 결정은 OR (한쪽만 FAIL이라도 차단). PASS 결정은 AND (양쪽 PASS여야).

## 5. 결함 등급 매핑 (codex → KI)

| codex 등급 | KI 등급 (기본) | 비고 |
|-----------|--------------|------|
| P0 | P0 | 즉시 차단 |
| P1 | P1 | 트리거 누적 |
| P2 | P2 | 누적 |
| P3 / nice-to-have | P3 | 백업 |

**충돌 시 (codex와 evaluator가 동일 결함 다른 등급)**:
- 기본: **상위 등급 채택** (보수적)
- **P0/P1 downgrade**: 사용자 승인 필요 (Codex 합의안 §1)
- 근거 명시: KI 본문에 `rationale: codex가 영향 범위를 더 크게 봄` 식으로 기록

## 6. 중복 KI 병합 규칙 (Codex 합의안 §2-2)

동일 결함을 evaluator + codex가 독립적으로 지적한 경우:

- **별도 2건이 아닌 1건 KI로 병합** (과다 카운트 방지)
- `source: both` 사용
- 등급은 상위 채택 (위 §5)
- INDEX.md 상세 블록에 `merged_from: [evaluator-id, codex-id]` 기록

**예시 (G2 DS SSOT)**:
```markdown
## KI-046 — DS SSOT 위반 (modal/switch/stepper/toggle-pill 등)
- severity: P1
- source: both
- merged_from:
  - evaluator: WI-G2-wireframes-operator.eval.md §결함 1
  - codex:     WI-G2-codex-review.md §P1-1
- rationale: codex가 Phase 7 React 전환 비용을 더 크게 봐 P1 상향
```

## 7. KI 출처 컬럼 확장

기존 출처: `evaluator` / `claude` / `user` / `beta` / `ops` / `audit`

신규 추가:
- `codex` — codex만 단독 지적
- `both` — evaluator + codex 둘 다 지적 (병합)

## 8. 트리거 임계 (기존 유지)

| 심각도 | 임계 | 이번 변경 |
|--------|------|----------|
| P0 | 1 | 변경 없음 |
| P1 | 3 | 변경 없음 |
| P2 | 5 | 변경 없음 |
| P3 | 10 | 변경 없음 |

**Phase 종료 게이트**도 기존 유지 (`triggers.md §3`).

## 9. 점수 가중 — 보고용만 (Codex 합의안 §1)

단일 점수 산출이 필요한 경우 (CHANGELOG / tag 메시지 등):

- **참고 점수**: `evaluator × 0.6 + codex × 0.4`
- **머지 판단**: 점수 평균이 아닌 `verdict + severity + trigger + phase gate`

**오용 금지**: 평균 점수가 8.0 이상이라도 codex P1 trigger 도달이면 BLOCKED.

## 10. 사용자 개입 시점 (Codex 합의안 §2-3)

매번 보고하지 말고 다음 경우에만 사용자 결정 요청:

1. **P0 발생** (즉시)
2. **P1 threshold 도달** (누적 3건)
3. **P0/P1 downgrade** 또는 P0/P1 백업 처리 제안
4. **public contract** / DB schema / 외부 dependency / infra 변경 필요
5. **evaluator와 codex가 PASS/FAIL 정면 충돌** (`USER_INTERVENTION_REQUIRED`)
6. **3회 연속 재평가 FAIL** (스코프 재검토)

그 외(P2/P3 누적 / hotfix 자동 진행 / 일반 양산)는 사용자 개입 없이 능동 처리.

## 11. codex 리뷰 비용 조절 (Codex 합의안 §2-5)

| 작업 단계 | codex 리뷰 범위 |
|----------|---------------|
| **패턴 확립 구간** (G0/G1/G2) | full review (전 화면 + 디자인 시스템) |
| **반복 양산 구간** (G3/G4) | changed files only + sampled screens (랜덤 30%) + known-risk checklist |
| **threshold 근접 시** | full review |
| **Phase 5 전체 evaluator (44 화면)** | full review (codex 동시 호출) |

## 12. CI 정적 체크 승격 (Codex 합의안 §2-5)

codex가 반복 지적하는 항목은 CI workflow에 정적 체크로 승격해 codex 부담 감소:

- `href-presence-check`: 사이드바·CTA 링크가 `href=""` 또는 `<a>` 누락 없는지
- `media-query-check`: 화면 HTML이 `@media (max-width: 768px)` 보유 의무
- `ds-redefinition-check`: 화면 inline `<style>`에서 디자인 시스템 컴포넌트 재정의 금지 (기존 design-system-ssot job 확장)
- `aria-modal-check`: 모달이 `role="dialog"` + `aria-labelledby` + `aria-modal="true"` 보유

**효과**: 다음 그룹부터 codex가 동일 결함 반복 지적 안 함. PR 자동 차단.

## 13. 평가 흐름 자동화 (`.claude/rules/project.md §6` 보강)

```bash
# 양산 종료 후 표준 시퀀스
git push
gh pr create --draft ...

# evaluator + codex 병렬 호출 (Claude Agent 두 개 background)
Agent(subagent_type=evaluator, run_in_background=true, prompt="...")
Agent(subagent_type=general-purpose, run_in_background=true, prompt="mcp__codex__codex 호출 + 결과 저장 ...")

# 두 결과 통지 받을 때까지 대기 → 통합 판정 (§4)
# PASS_BOTH 또는 CONDITIONAL (트리거 미달) → ready + auto-merge
# BLOCKED_FOR_HOTFIX → hotfix branch 또는 같은 PR에 추가 커밋
# USER_INTERVENTION_REQUIRED → 사용자 결정 대기
```

## 14. 산출물 파일

| 산출물 | 경로 | 작성자 |
|--------|------|--------|
| evaluator 결과 | `.flowset/eval-results/{WI-ID}.eval.md` + `.pass` 마커 (PASS 시) | evaluator sub-agent |
| codex 결과 | `.flowset/eval-results/{WI-ID}-codex-review.md` | general-purpose agent (codex MCP wrapper) |
| 통합 판정 보고 | 대화에 직접 (또는 `.flowset/eval-results/{WI-ID}-integrated.md` for 큰 그룹) | Claude 본체 |

## 15. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-16 | 신설 — Codex 도입 + 통합 평가 시스템 v2 정의 | 사용자 정책 (능동적 KI 처리 + 일괄 검증) + Codex 추가 reviewer 도입 |

## 16. 관련 문서

- `.flowset/contracts/review-rubric.md` — evaluator 4축 가중 + 안티패턴 (본 시스템의 evaluator 룰)
- `.flowset/known-issues/triggers.md` — KI 트리거 임계 + Phase 게이트 (변경 없음)
- `.flowset/known-issues/INDEX.md` — 활성 KI SSOT
- `.claude/agents/evaluator.md` — evaluator sub-agent 정의
- `.claude/rules/project.md §6-7` — 자동화 시퀀스 + 사용자 개입 시점
