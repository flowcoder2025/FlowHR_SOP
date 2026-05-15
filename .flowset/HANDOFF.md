# FlowHR 핸드오프 — 신규 세션 진입 가이드

> **작성**: 2026-05-15, Phase 5 진행 중 발견된 PRD 결함으로 인한 중단.
> **신규 세션 첫 작업**: 본 문서 + `.flowset/PROMPT.md` + `.flowset/guardrails.md` + `.flowset/prd-state.json` + `.flowset/fix_plan.md`를 순서대로 읽고 진입.

## 1. 현재 상태 요약

| Phase | 상태 | 점수 | 비고 |
|-------|------|------|------|
| 0 셋업 | ✓ completed | — | FlowSet 라이트 + git remote + evaluator + known-issues |
| 1 PRD | ✓ completed | 8.15 | 36 화면 / 37 엔티티 matrix.json |
| 2 백로그 | ✓ completed | 8.29 | 12 Epic / 72 Story / 379 SP |
| 3 ERD | ✓ completed | 8.68 | 37 엔티티 × Postgres 스키마 + RLS + 인덱스 |
| 4 API | ✓ completed | 8.78 | 약 280 엔드포인트 + cron + Realtime |
| **5 와이어프레임** | **🛑 중단** | — | **PRD 결함 발견으로 폐기, 신규 세션에서 재시작** |
| 6~10 | pending | — | — |

**Git remote**: https://github.com/flowcoder2025/FlowHR_SOP — main 활성

## 2. 중단 사유 (Phase 5에서 발견된 P1 결함)

PRD가 spec §4 IA를 36 화면으로 분해했지만, **IA에 글로벌 컴포넌트·라우팅·진입점 자체가 없어** Phase 1~4 산출물 전체가 다음을 누락:

### A. 진입점 / 라우팅 — **가장 큰 결함**
- `/` 랜딩 페이지 (비로그인 사용자 진입)
- 역할별 라우팅 매트릭스 (operator/tenant/employee 후 어디로?)
- 서브도메인 전략 (`app.flowhr.kr` vs `{slug}.flowhr.kr`)
- 권한 미일치 라우팅 (403 vs 자동 대시보드 리다이렉트)
- 세션 만료 처리

### B. 글로벌 헤더 컴포넌트 (모든 화면 공통)
- 헤더 우측 프로필 드롭다운 (CM-16) — 클릭 시 메뉴
- 헤더 알림 종 드롭다운 (CM-17) — 최근 10건 미리보기
- 헤더 검색 동작 (CM-18) — MVP에서 어떻게?
- 헤더 도움말 (CM-19)

### C. 사용자 본인 화면 (역할별 빠짐)
- **OP-12 운영사 본인 프로필** — 운영사 사용자 자기 정보·보안 (직원 EM-09 동등)
- 테넌트 관리자 헤더 → 본인 EM-09 동선 명시

### D. 시스템 / 정적 페이지
- 이용약관 / 개인정보처리방침 (CM-03 활성화 시 동의하지만 단독 명세 없음)
- PWA 설치 가이드 화면
- 첫 사용자 온보딩 투어
- 유지보수/공지 배너 (점검 모드 외 사전 공지)

### E. 시스템 보강
- 환영 메일 / 이메일 템플릿 명세
- 언어 / 시간대 / 키보드 단축키 / 다크모드 토글

**근본 원인**: evaluator가 36 화면 정형만 검증, 화면 간 연결·전역 시스템·라우팅 매트릭스는 미검증. PASS 받았지만 실제로는 P1.

## 3. 신규 세션 첫 작업 (우선순위 순)

### 작업 1: 컨텍스트 로드 (필수)
```
1. .flowset/HANDOFF.md (본 문서)
2. .flowset/PROMPT.md
3. .flowset/guardrails.md
4. .flowset/prd-state.json
5. .flowset/fix_plan.md
6. .flowset/known-issues/INDEX.md
7. .flowset/eval-results/phase-{1,2,3,4}.eval.md (요약만)
```

### 작업 2: PRD 누락 명세 전수 점검 (P1)

위 A~E 카탈로그를 시작점으로 **추가 누락**도 함께 찾는다. 점검 시점:

- `spec/FlowHR_screen_spec_v_1.md` §4 IA + §5 공통 + §6~8 화면별 — 글로벌 컴포넌트가 §5 공통에만 표·기능 단위로 있을 뿐, 화면 단위 명세 없음 → 화면 단위 명세화 필요
- `prd/domains/` 36 파일 — 각 화면이 "헤더에서 무슨 일이 일어나는가" 명시 안 됨 → 헤더 컴포넌트 명세를 common.md 또는 신규 화면 ID로 분리
- `db/erd.md` Session/UserSession 엔티티 필요할 수 있음 (현재 users 테이블에 session 없음, Supabase 세션은 별도 관리)
- `api/` 라우팅·세션 갱신·헤더 컴포넌트 API 누락
- 결재 위임/대리 (v1.1 후순위지만 entity 자리는 잡아두기)
- 입사·온보딩 체크리스트 (신규 직원 첫 로그인 후)

### 작업 3: PRD 보강 (단일 batch WI-KI-batch-003)

수정 파일:
- `prd/09-routing.md` 신규 — 진입점/라우팅 매트릭스 (필수)
- `prd/domains/common.md` — CM-16~19 추가 (헤더 컴포넌트 4개)
- `prd/domains/operator/OP-12-profile.md` 신규
- `prd/domains/operator/README.md` 인덱스 갱신
- `prd/06-mvp-scope.md` 카운트 갱신 (36 → 잠정 ~42, 작업 3 완료 시점에 정확 카운트 확정)
- `prd/02-device-matrix.md` PWA 설치 화면 추가 (CM-20)
- `prd/04-data-model.md` 카운트 갱신 (Session 등 신규 엔티티 추가 시)
- `matrix.json` screens_total / screens_to_entities_map 갱신
- `backlog/stories.md` 신규 Story 5~8건 추가
- `db/erd.md` Session 엔티티 (필요 시) 추가
- `api/auth.md`, `api/common.md` — 라우팅·세션·헤더 드롭다운 API 추가

### 작업 4: evaluator.md 보강 [✓ 이미 완료 — 검증만]

> 본 핸드오프 작성 시점에 이미 보강 완료. 신규 세션은 **확인만** 하면 됨.

수정된 파일:
- `.claude/agents/evaluator.md` L38 (완성도 축 설명 보강), L61-64 (안티패턴 4건 추가)
- `.flowset/contracts/review-rubric.md` L91 (Phase 1 추가 검증)

검증된 4 항목 (KI-031):
- 전역 컴포넌트 (헤더 드롭다운/사이드바/모달/푸터/헬프) 명세 존재
- 라우팅 매트릭스 (진입점·역할별·권한 미일치·세션 만료) 명세 존재
- 전이 동선 (화면 A→B) 명세 존재
- 시스템/정적 페이지 (약관·온보딩·PWA 설치) 명세 존재

신규 세션은 두 파일의 변경분이 그대로 있는지 확인 후 KI-031 resolved 처리.

### 작업 5: Phase 1~4 retroactive 재평가

PRD 보강 후 Phase 1~4 evaluator 재호출하여 8.0+ 재확인. 새로운 점수를 `eval-results/phase-{n}.eval.md`에 추가.

### 작업 6: Phase 5 와이어프레임 재시작 (HTML 직접 작성)

**Codex 이미지 폐기 — 사용자 결정**. 신규 방식:
- `.flowset/wireframes/html/` HTML 36~42장 직접 작성 (Tailwind + shadcn 패턴)
- `_design-tokens.css` + `_icons.svg` 공통 자산 (이미 작성됨, 재사용)
- `OP-01.html` 시범 작성됨 — 톤 확인 후 일괄

폐기 자산 (Phase 5 재시작 시 삭제 또는 archive):
- `.flowset/wireframes/images/OP-01.png` (Codex 생성 — archive로 이동)
- `.flowset/wireframes/images/_test.png` (이미 삭제됨)
- `.flowset/wireframes/_design-refs/ref-0{1,2,3}.png` (사용자 참고용 — 유지 OK)
- `.flowset/wireframes/prompts/` (Codex 프롬프트 — archive)
- `.flowset/wireframes/.codex-op01-prompt.txt` (Codex 호출용 — 삭제)

## 4. Known Issues 현황

| KI | 상태 | 보강 위치 |
|----|------|---------|
| KI-001/002/003/004/014/018/019 | resolved | Phase 3/4 |
| KI-005 | scheduled (Phase 2) | Phase 2 PASS 시 carry-over 검토 — INDEX.md 재점검 후 resolved 또는 유지 결정 |
| KI-006 (로깅 도구) | scheduled (Phase 7) | — |
| KI-007 (부하 테스트) | scheduled (Phase 8) | — |
| KI-013 (7 Epic Task 분해) | scheduled (Phase 6) | — |
| KI-016 (NHN Cloud URL) | scheduled (Phase 9) | — |
| KI-017 (rls.md §3 SQL 변환) | scheduled (Phase 7) | — |
| KI-020 (leave_balances trigger 위치) | scheduled (Phase 7) | — |
| KI-023 (Signature zod) | scheduled (v1.2) | — |
| KI-025 (Rate Limiting 차등) | scheduled (Phase 10) | — |
| **KI-027 [신규 P1]** | open | **PRD 라우팅 누락** (작업 3에서 해소) |
| **KI-028 [신규 P1]** | open | **PRD 헤더 글로벌 컴포넌트 누락** (작업 3) |
| **KI-029 [신규 P1]** | open | **OP-12 운영사 본인 프로필 누락** (작업 3) |
| **KI-030 [신규 P1]** | open | **약관/온보딩/PWA 설치 등 정적 페이지 누락** (작업 3) |
| **KI-031 [신규 P1]** | open | **evaluator 검증 축 부족 — 전역·라우팅 미검증** (작업 4) |

## 5. 핵심 디렉토리 / 파일 인덱스

```
.flowset/
├── HANDOFF.md (이 문서)
├── PROMPT.md            ← AI 진행 지시서
├── requirements.md      ← 사용자 원본 SSOT
├── guardrails.md        ← 누적 규칙
├── prd-state.json       ← Phase 상태
├── fix_plan.md          ← WI 트래킹
├── spec/matrix.json     ← 37 엔티티 SSOT
├── contracts/           ← api-standard / data-flow / style-guide / review-rubric / sprint-template
├── eval-results/        ← phase-{1,2,3,4}.eval.md + .pass 마커
├── known-issues/        ← INDEX.md / triggers.md / archive/
├── prd/                 ← 50 파일 (개요 9 + 도메인 README 4 + 화면 36 + matrix)
├── backlog/             ← README/epics/stories/tasks/dependency-graph/estimation 6 파일
├── db/                  ← README/erd/enums/rls/indexes/migrations/seed 7 파일
├── api/                 ← README/conventions/schemas/auth/operator/tenant/employee/common/cron 9 파일
└── wireframes/          ← Phase 5 (중단 — 재구성 필요)
    ├── README.md (Codex 정책 — HTML 정책으로 갱신 필요)
    ├── prompts/ (Codex용 — archive 이동)
    ├── images/ (Codex 생성물 — archive)
    ├── _design-refs/ (사용자 참고 — 유지)
    └── html/ (HTML 와이어프레임 — 새 방식)
        ├── _design-tokens.css ✓ (재사용)
        ├── _icons.svg ✓ (재사용)
        ├── _icons.css ✓ (재사용)
        └── OP-01.html (시범 — 보강 PRD 반영 후 재작성 권장)

.claude/
├── agents/evaluator.md  ← 평가자 (검증 축 추가 보강 필요)
└── rules/project.md

CLAUDE.md
.git/ (remote: github.com/flowcoder2025/FlowHR_SOP)
```

## 6. 정책 변경 사항 (신규 세션에서 즉시 적용)

### 6-1. Codex 이미지 생성 폐기
- Phase 5 와이어프레임은 **HTML 직접 작성**으로 단일 채택
- `wireframes/README.md` §"Codex 호출 정책" 섹션 삭제 또는 정책 변경 명시
- `PROMPT.md` 와이어프레임 단계 처리 방식 갱신

### 6-2. evaluator 검증 축 추가 (작업 4)
신규 세션이 evaluator.md를 보강해야 함. 현재 4축(완성도/정합성/구체성/실행가능성)은 유지하되, **완성도** 축 검증 항목에 다음 추가:
- 글로벌 컴포넌트 (헤더/사이드바/모달/푸터) 명세 존재
- 라우팅 매트릭스 (진입점·역할별·권한 미일치) 명세 존재
- 전이 동선 (화면 A→B) 명세 존재
- 시스템/정적 페이지 (약관/온보딩/PWA 설치 등) 명세 존재

이 4점이 부족하면 완성도 -2.0 패널티.

## 7. 신규 세션 진입 순서 (요약 체크리스트)

```
[ ] 1. 본 HANDOFF.md 정독
[ ] 2. .flowset/PROMPT.md / guardrails.md 정독
[ ] 3. prd-state.json / fix_plan.md / known-issues/INDEX.md 정독
[ ] 4. evaluator.md 보강 (검증 축 추가) → KI-031 resolve
[ ] 5. PRD 누락 전수 점검 (A~E + 추가) → 카탈로그 작성
[ ] 6. WI-KI-batch-003 진행 — PRD 보강 (routing/common/OP-12/...) → KI-027~030 resolve
[ ] 7. Phase 1~4 evaluator 재평가 — 보강 후 8.0+ 유지 확인
[ ] 8. Codex 자산 archive 이동 (wireframes/images, prompts, .codex-*.txt)
[ ] 9. wireframes/README.md 정책 갱신 (HTML 단일 채택)
[ ] 10. Phase 5 HTML 와이어프레임 작성 시작 (OP-01부터 재작성)
[ ] 11. 작업 진행 중 발견되는 추가 누락은 KI로 즉시 등록
```

## 8. 사용자와의 합의 사항

- **eval 임계 8.0 / 각 축 7.5 유지** (변경 없음)
- **Known Issue 트리거** P0=1 / P1=3 / P2=5 / P3=10 (변경 없음)
- **능동적 진행 원칙** — 사용자가 명시 거부 안 한 한 자율 결정 + 즉시 처리
- **추측 금지** — 확인 후 사실만 보고
- **Codex 이미지 생성 폐기** — HTML 직접 작성으로 단일 채택 (본 결정)
- **Claude Design (claude.ai 별도 도구) 미사용** — Claude Code에서 직접 호출 불가, HTML 직접 작성으로 대체

## 9. 컨텍스트 압축 시 우선 보존

신규 세션의 컨텍스트가 압축될 경우 본 HANDOFF.md + `.flowset/PROMPT.md` + `.flowset/guardrails.md`가 항상 가장 먼저 다시 로드되어야 함. 그 외 prd/db/api/backlog는 필요한 화면 단위로 lazy load.
