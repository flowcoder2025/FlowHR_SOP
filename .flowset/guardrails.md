# FlowHR 가드레일 (누적 규칙)

> 실수 / 실패 패턴이 발견될 때마다 즉시 추가. 새 세션도 반드시 읽고 시작.

## 1. 절대 금지

- **추측성 답변/작업** — 확인하지 않은 사실을 단정하지 않는다
- **미완성 표현** — "필요", "TBD", "검토", "추후", "나중에", "TODO"를 산출물에 남기지 않는다
- **방향만 잡고 구체화 없이 넘기기** — 다음 단계가 그대로 실행 가능한 수준까지 채운다
- **실행 안 해보고 "될 것이다"라고 보고** — 실행/검증 결과가 있는 것만 보고한다
- **자기 기억을 사실로 확정** — 실제 코드/파일과 대조 후 행동
- **main/master 직접 push** — 반드시 PR을 통해서만 머지
- **.flowset/ 디렉토리 파일 삭제** — 명시적 승인 없이 절대 삭제 금지
- **플레이스홀더 / stub 코드** — 완전한 구현만 허용

## 2. 영향 분석 절차 (변경/리팩토링 시)

1. 키워드 grep은 **확장자 필터 없이** 전체 검색 (glob 지정 금지)
2. 동의어/변형 표현을 반드시 2차 검색
3. 검색 결과를 파일 단위로 **수정 / 제외** 분류
4. 제외 파일은 해당 줄과 제외 근거 명시
5. 수정 파일은 변경할 줄 번호와 before/after 명시

## 3. UTF-8 / Windows 환경

- 모든 텍스트 파일: UTF-8, BOM 없음, LF 줄바꿈
- 셸 스크립트 시작부에 UTF-8 환경변수 설정
- Git: `core.quotepath=false`, `i18n.commitEncoding=utf-8`

## 4. 커밋 / 브랜치 규칙 (~/.claude/rules/wi-global.md 준수)

- 커밋: `WI-NNN-[type] 한글 작업명`
- 브랜치: `{type}/WI-NNN-{type}-작업명-kebab`, main에서 분기
- PR 제목도 동일 형식

## 5. 라이트 버전 한정 (FlowSet 풀버전과의 차이)

- **Stop hook B1~B7 미적용** — 자동 차단 없음, 수동 검증
- **Agent Teams 미사용** — Claude 단독 진행
- **evaluator 미사용** — Claude 자체 검증
- **vault/Obsidian 미연동** — 상태는 `.flowset/` 파일로만 관리
- **launch-loop 미사용** — 사용자 명령 단위로 진행
- 위 항목은 프로젝트가 커지면 풀버전으로 전환 검토

## 6. 산출물 디렉토리 매핑

| Phase | 산출물 위치 |
|-------|------------|
| 1 PRD | `.flowset/prd.md` |
| 2 백로그 | `.flowset/backlog/{epics,stories,tasks}.md` |
| 3 ERD | `.flowset/db/erd.md`, `.flowset/db/rls.md` |
| 4 API | `.flowset/api/openapi.yaml`, `.flowset/api/endpoints.md` |
| 5 와이어프레임 | `.flowset/wireframes/{prompts,images,analysis}/` |
| 6 스프린트 | `.flowset/sprints/{mvp-plan,sprint-NNN}.md` |
| 7 개발 | 실제 코드 (apps/, packages/) |
| 8 QA | `.flowset/qa/scenarios.md`, `.flowset/qa/e2e.md` |
| 9 베타 | `.flowset/beta/onboarding.md` |
| 10 운영 | `.flowset/ops/{runbook,sla,backup}.md` |

## 7. Phase 진입 / 종료 기준

각 Phase 종료 시:
1. `.flowset/prd-state.json`의 해당 phase status를 `completed`로 업데이트
2. 다음 phase status를 `in_progress`로 전환
3. `fix_plan.md`의 해당 WI를 `[x]`로 체크
4. 산출물이 디렉토리 매핑대로 존재하는지 ls로 확인

## 8. 발견된 실패 패턴 (날짜순 누적)

(아직 없음 — 발견 시 추가)
