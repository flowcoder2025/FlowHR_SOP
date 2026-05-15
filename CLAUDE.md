# FlowHR — Claude 작업 지시

> Claude Code는 새 세션 시작 시 이 파일을 자동 로드합니다.

## 프로젝트 정체성

- **이름**: FlowHR (가칭, HR SaaS)
- **유형**: 멀티테넌트 세팅형 HR SaaS
- **클라이언트**: 웹 (Desktop) + PWA (Mobile) + 네이티브 앱 (iOS/Android)
- **백엔드**: Supabase (Postgres + Auth + Storage + Realtime)
- **원본 명세**: `docs/FlowHR_screen_spec_v_1.md` (856줄, 36개 화면)

## FlowSet 라이트 모드

이 프로젝트는 FlowSet v4.0의 라이트 버전을 사용합니다. 자동 차단 hook / Agent Teams / vault / loop는 미사용. Claude가 사용자 명령 단위로 단계별 진행. **각 Phase 종료 시 evaluator 에이전트(`.claude/agents/evaluator.md`)를 Agent 도구로 호출하여 산출물 검증.**

## 필수 시작 절차

새 세션 / 신규 작업 시작 시 반드시 다음 파일을 읽고 진입:

1. `.flowset/PROMPT.md` — 진행 지시서
2. `.flowset/requirements.md` — 사용자 원본 요구사항 SSOT
3. `.flowset/guardrails.md` — 누적 가드레일
4. `.flowset/prd-state.json` — 현재 Phase 상태
5. `.flowset/fix_plan.md` — WI 트래킹

## 핵심 디렉토리

```
.flowset/
├── PROMPT.md              # AI 진행 지시서
├── requirements.md        # 사용자 원본 SSOT (수정 금지)
├── prd-state.json         # Phase 상태
├── fix_plan.md            # WI 진행 트래킹
├── guardrails.md          # 누적 규칙
├── spec/matrix.json       # 데이터 모델 SSOT
├── contracts/             # API / 데이터 / 스타일 / 스프린트 / review-rubric
├── eval-results/          # evaluator 채점 결과 + PASS 마커
├── backlog/               # Phase 2 산출물
├── db/                    # Phase 3 ERD
├── api/                   # Phase 4 OpenAPI
├── wireframes/            # Phase 5 (prompts/images/analysis)
├── sprints/               # Phase 6
├── qa/                    # Phase 8
├── beta/                  # Phase 9
└── ops/                   # Phase 10

docs/
└── FlowHR_screen_spec_v_1.md  # 원본 화면 명세 v1.0

.claude/
├── agents/
│   └── evaluator.md       # 평가 전용 서브에이전트 (Phase 게이트)
└── rules/
    └── project.md         # 프로젝트별 규칙
```

## 10단계 워크플로우

`.flowset/PROMPT.md` 참조.

## 글로벌 규칙

- `~/.claude/rules/wi-global.md` — 커밋/브랜치/PR 규칙
- `~/.claude/rules/wi-utf8.md` — UTF-8 인코딩
- `~/.claude/CLAUDE.md` — 사용자 설정 + 작업 품질 기준

## 환경 특이사항

- **Windows 11 Pro** — bash (Git Bash), UTF-8 강제 필요
- **한글 우선** — 모든 산출물 한글 작성
- **CRLF/LF** — `.gitattributes`로 LF 강제 (Git 셋업 시)
