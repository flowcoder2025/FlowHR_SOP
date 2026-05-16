# Review System v2 — Codex 협의 초안

> **출처**: Codex (gpt-5) 독립 검토 의견
> **작성일**: 2026-05-16
> **상태**: 사용자 최종 결정 대기 (Claude v2 제안 → Codex 비평 수렴)
> **목적**: evaluator + codex 이중 리뷰 통합 시스템 v2 설계 합의안 도출
> **참조**:
> - Claude v2 제안: 대화 컨텍스트 (요약 §3)
> - 기존 정책: `.flowset/known-issues/triggers.md`, `.flowset/contracts/review-rubric.md`, `.claude/agents/evaluator.md`
> - G2 평가 결과: `.flowset/eval-results/WI-G2-wireframes-operator.eval.md` (evaluator PASS 8.11), `.flowset/eval-results/WI-G2-codex-review.md` (codex WARNING 6.8)

---

## Codex 검토 의견: Review System v2

### 1. 동의 / 수정 / 반대

| 항목 | 의견 | 판단 |
|---|---:|---|
| evaluator / codex 역할 분리 | evaluator는 PRD·문서 정합성, codex는 구현 전환 리스크·UX·접근성·라우팅을 보는 분리는 적절합니다. | 동의 |
| 병렬 평가 후 통합 분석 | 사용자 검토 병목을 줄이고, "양산 → 일괄 검증 → 일괄 보고" 의도와 맞습니다. | 동의 |
| evaluator PASS + codex WARNING 처리 | KI 등록 + 트리거 평가는 맞지만, P1 3건 이상이면 "백업 후 머지"가 아니라 batch/hotfix 우선이어야 합니다. | 수정 |
| severity 충돌 시 높은 등급 채택 | 기본값으로는 맞습니다. 다만 P1 이하 자동 상향만 두면 과잉 차단이 생길 수 있으므로 "상위 등급 채택 + 근거 있는 명시적 downgrade 가능"이 좋습니다. P0/P1 downgrade는 사용자 승인 필요. | 수정 |
| KI 출처 컬럼 `codex` / `both` 추가 | 기존 `evaluator`, `claude`, `user` 체계에 자연스럽게 확장됩니다. `both`는 동일 결함을 양쪽이 독립적으로 지적한 경우에만 사용해야 합니다. | 동의 |
| 트리거 임계 유지 | 기존 P0=1, P1=3, P2=5, P3=10 유지가 맞습니다. 현재 P3 17건은 이미 threshold 초과 상태입니다. | 동의 |
| 단일 점수 산출 | 단일 점수는 보고용으로만 사용해야 합니다. PASS/FAIL 게이트는 점수 평균이 아니라 `evaluator verdict OR codex blocking severity`로 판단해야 합니다. | 수정 |
| FAIL 결정 OR | evaluator FAIL 또는 codex P0/P1 명확 판단이면 차단하는 것이 맞습니다. 단, codex WARNING 안에서도 P1 threshold 도달 시 사실상 차단으로 보아야 합니다. | 동의 |

---

### 2. 빠진 관점 / 보완 제안

1. **codex verdict 체계 명문화 필요**
   - evaluator는 PASS/FAIL rubric이 있지만 codex는 현재 `PASS / WARNING / FAIL`의 경계가 문서화되어 있지 않습니다.
   - 제안:
     - `PASS`: P0/P1 없음, P2가 threshold 미만이며 phase gate 위반 없음
     - `WARNING`: P0 없음, P1이 1~2건이거나 P2/P3 누적 관리 필요
     - `FAIL`: P0 1건, P1 3건 이상, 또는 phase gate 위반

2. **중복 KI 병합 규칙 필요**
   - evaluator의 DS SSOT P2와 codex의 DS SSOT P1은 별도 이슈 2건이 아니라 하나의 KI로 병합하고 등급만 P1로 상향하는 편이 맞습니다.
   - `source: both`, `severity: P1`, `rationale: codex가 영향 범위를 더 크게 봄`처럼 기록.

3. **사용자 개입 시점**
   - 매번 사용자에게 묻지 말고 다음 경우에만 개입:
     - P0 발생
     - P1 threshold 도달
     - P0/P1 downgrade 또는 백업 처리 제안
     - public contract / DB schema / dependency / infra 변경 필요
     - evaluator와 codex가 PASS/FAIL을 정면으로 다르게 판단

4. **점수 평균의 한계**
   - evaluator 8.11과 codex 6.8은 같은 rubric이 아닙니다.
   - `0.6/0.4` 평균은 "상태 요약"에는 쓸 수 있지만 머지 판단에는 부적절합니다.
   - 권장: `통합 점수 = 참고`, `통합 판정 = severity + trigger + phase gate`.

5. **비용·시간 효율**
   - codex 전체 리뷰는 모든 그룹마다 무조건 깊게 돌리기보다 다음 기준으로 조절하는 것이 좋습니다.
     - G0/G1/G2 같은 패턴 확립 구간: full review
     - 반복 양산 구간: changed files + sampled screens + known-risk checklist
     - threshold 근접 시: full review
   - codex가 반복적으로 잡는 항목은 CI job 또는 정적 체크로 승격해야 합니다. 예: href 누락, modal aria, DS class 재정의, mobile media query 부재.

---

### 3. G2 결과 v2 적용 권장 결정

**권장: 즉시 머지 아님. `hotfix` 후 재평가.**

이유:

- evaluator: PASS 8.11
- codex: WARNING 6.8이지만 P1 3건 제시
- 기존 KI 현재 P1=0, P2=0
- codex P1 3건을 반영하면 `P1 = 0 + 3 = 3`
- 기존 trigger 정책상 P1 threshold는 3건이므로 즉시 `WI-KI-batch-NNN` 발동 대상
- Phase 5 종료 게이트에서도 P0/P1 잔존은 다음 Phase 진입 전 0이어야 함
- 현재 P3도 17건으로 이미 P3 threshold 10 초과

따라서 G2 PR은 `draft` 유지 또는 ready 전환 보류가 맞습니다.
처리 순서는 다음을 권장합니다.

1. DS SSOT / 모바일 반응형 / 라우팅 href를 G2 hotfix로 수정
2. KI 등록 시 DS SSOT는 evaluator+codex 중복 병합, severity P1
3. P1 count 0 재확인
4. evaluator + codex 재검토는 전체 재리뷰보다 hotfix 범위 중심으로 수행
5. PASS 후 ready/auto-merge

`백업 후 머지`는 P3 또는 명시적으로 deferred 가능한 P2에 적합합니다. 이번 G2의 codex P1 3건에는 부적합합니다.

---

### 4. codex P1 3건 KI 등급 매핑 권장

| 결함 | 권장 KI 등급 | 출처 | 이유 |
|---|---:|---|---|
| DS SSOT 위반 | P1 | `both` | 기존 KI-037도 DS SSOT 부재가 P1로 처리된 전례가 있습니다. 이번에는 `.stepper`, `.tab`, modal, switch 계열이 화면별 재정의되어 Phase 7 React 전환 비용과 일관성 리스크가 큽니다. evaluator P2보다 codex P1을 채택하는 것이 맞습니다. |
| 모바일 반응형 부재 | P1 | `codex` | OP-02~OP-12 전반에 `@media (max-width: 768px)` 대응이 없고 고정 grid/table이 많습니다. Web/PWA 화면 명세 단계에서 전 화면 공통 사용성 결함이므로 단순 UX P3가 아니라 핵심 전환 리스크입니다. |
| 라우팅 href placeholder / cross-link 부재 | P1 | `codex` | 기존 Phase 5에서 routing matrix 누락이 KI-027 P1로 처리된 전례가 있습니다. 화면 간 진입·상세·신규 등록 링크가 실제 route와 연결되지 않으면 다음 Phase 구현자가 흐름을 확정할 수 없습니다. |

추가로 codex의 접근성, 권한 UI 표현, 상태 fidelity, 긴 텍스트/테이블 overflow는 각각 P2 후보입니다. 다만 DS/mobile과 중복되는 것은 병합해서 과다 카운트하지 않는 편이 좋습니다.

---

### 5. evaluator 8.11 vs codex 6.8 해석

1. **평가 축이 다릅니다.**
   - evaluator는 Phase 5 doc artifact 기준으로 "문서 완성도, 정합성, 구체성, 실행 가능성"을 평가했습니다.
   - codex는 "Phase 7 구현 전환 시 실제로 깨질 UX·라우팅·접근성·반응형 리스크"를 더 강하게 봤습니다.

2. **1.3점 차이는 충돌이라기보다 관점 차이입니다.**
   - evaluator도 DS SSOT와 권한 매트릭스를 P2로 잡았습니다.
   - codex는 같은 계열 문제의 범위와 후속 비용을 더 크게 보고 P1로 상향했습니다.

3. **evaluator PASS는 무효가 아닙니다.**
   - evaluator 기준으로는 모든 축이 threshold 7.5 이상이고 총점 8.11이므로 PASS가 타당합니다.
   - 다만 codex 기준 P1 3건이 trigger를 만족하므로 통합 시스템에서는 "PASS지만 hotfix 필요"가 맞습니다.

4. **통합 판정 문구 권장**
   - `Integrated Verdict: BLOCKED_FOR_HOTFIX`
   - `Reason: evaluator PASS, codex WARNING with 3 P1 findings; P1 trigger reached`
   - `Merge: hold until P1=0`
   - `Next: create WI-KI-batch-NNN or G2 hotfix WI, re-run focused evaluator/codex review`
