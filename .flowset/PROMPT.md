# FlowHR — AI 진행 지시서 (라이트 모드)

> 새 세션 시작 시 이 파일과 `.flowset/requirements.md`, `.flowset/guardrails.md`, `.flowset/fix_plan.md`, `.flowset/prd-state.json`을 먼저 읽고 시작합니다.

## 진행 모드

**라이트 모드** — Claude 단독 진행, 사용자 명령 단위 실행. Stop hook / Agent Teams / vault / loop 자동화 미사용. **evaluator는 Phase 종료 게이트에서 Agent 도구로 명시 호출**.

## 10단계 워크플로우 (사용자 확정)

1. 개발용 PRD 작성
2. Epic/User Story/Task 백로그 작성
3. DB ERD 설계
4. API 명세 작성
5. 화면별 와이어프레임 정리 (Codex 이미지 생성 → Claude 분석)
6. MVP 스프린트 계획 수립
7. 개발 착수
8. QA 시나리오 작성
9. 베타 고객 온보딩
10. 운영/유지보수 체계 정리

## 절대 규칙

- `.flowset/requirements.md`는 사용자 원본. 임의 수정 금지
- `.flowset/spec/matrix.json`은 데이터 모델 SSOT. 모든 백로그/ERD/API/QA가 이 파일을 참조
- 단계별 산출물은 `.flowset/guardrails.md §6` 매핑대로 저장
- **매 Phase 종료 시 evaluator 호출 필수** (`.flowset/guardrails.md §5-1, §7`)
- 매 Phase PASS 후 `prd-state.json` + `fix_plan.md` 업데이트
- 추측 금지, 실행 결과 기반 보고만

## evaluator 호출 방식

```
Agent(
  subagent_type: "evaluator",
  description: "Phase {N} 산출물 평가",
  prompt: """
phase: {1-10}
mode: doc | code
wi_id: {WI-NNN-type} (선택)
artifact_paths:
  - {경로1}
  - {경로2}
context_files:
  - .flowset/requirements.md
  - .flowset/spec/matrix.json
  - {이전 Phase 산출물}

채점 루브릭: .flowset/contracts/review-rubric.md
판정 결과(---EVAL_RESULT---)를 그대로 반환하시오.
"""
)
```

evaluator 결과를 받으면:
1. 채점표를 `.flowset/eval-results/phase-{n}.eval.md` (또는 `WI-{ID}.eval.md`)로 저장
2. PASS면 `.flowset/eval-results/phase-{n}.pass` 마커 생성
3. FAIL이면 ISSUES 수정 → 재호출 (최대 3회)

## 와이어프레임 단계 처리 방식 (5단계)

1. Claude가 36개 화면별 이미지 프롬프트를 `.flowset/wireframes/prompts/{화면ID}.md`로 작성
2. `mcp__codex__codex` 호출하여 이미지 생성 → `.flowset/wireframes/images/{화면ID}.png`
3. Claude가 생성 이미지를 읽고 `.flowset/wireframes/analysis/{화면ID}.md`에 컴포넌트/필드/액션/검증 규칙을 정리
4. 정리된 와이어프레임은 7단계(개발)에서 컴포넌트 구현 시 직접 참조

## 사용자 확정 필요 사항 (Phase 1 진입 전)

- 기술 스택 확정 (현재 후보: Next.js + Supabase + Capacitor/RN, prd-state.json 참조)
- 네이티브 앱 범위 (출퇴근 전용 / 직원 풀 기능)
- Git 저장소 + GitHub 조직/리포지토리
- 디자인 토큰 / 브랜드 (style-guide.md 색상 채택 여부)
