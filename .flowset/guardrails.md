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

- **Stop hook B1~B7 미적용** — 자동 차단 없음, evaluator 수동 호출로 대체
- **Agent Teams 미사용** — Claude 단독 진행
- **evaluator 사용** — `.claude/agents/evaluator.md` (Agent 도구로 명시 호출)
- **vault/Obsidian 미연동** — 상태는 `.flowset/` 파일로만 관리
- **launch-loop 미사용** — 사용자 명령 단위로 진행
- 위 항목은 프로젝트가 커지면 풀버전으로 전환 검토

## 5-1. evaluator 게이트 규칙 (필수)

각 Phase 종료 또는 코드 WI 완료 시 **evaluator 호출 의무**. 통과 임계 **8.0**, 각 축 임계 **7.5**.

1. 산출물 생성 직후 Claude 본체가 Agent 도구로 evaluator 호출
   - `subagent_type: "evaluator"`
   - 프롬프트에 `phase`, `mode` (`doc`|`code`), `artifact_paths`, `context_files`, `wi_id`(선택) 전달
2. evaluator가 채점표(`---EVAL_RESULT---`) 반환 — `ISSUES` + `NON_BLOCKING_OBSERVATIONS` 모두 P0~P3 라벨링
3. 채점표를 `.flowset/eval-results/phase-{n}.eval.md` 또는 `WI-{ID}.eval.md`에 저장
4. **PASS** (총점 ≥ 8.0 AND 각 축 ≥ 7.5):
   - `NON_BLOCKING_OBSERVATIONS`를 `.flowset/known-issues/INDEX.md`에 KI-NNN으로 등록
   - 카운트 표 재계산 + 트리거 임계 도달 검사
   - `.flowset/eval-results/phase-{n}.pass` 마커 생성 → 다음 Phase 진입
5. **FAIL** (총점 < 8.0 OR 한 축 < 7.5):
   - ISSUES 수정 → 재호출 (동일 단위 최대 3회, 초과 시 사용자 에스컬레이션)
   - 재호출 후에도 잔존하는 비차단 ISSUES는 known-issues로 적재 (수정 보류)
6. **사용자 보고 시 채점표 요약 포함** — Total/Verdict/ISSUES + NON_BLOCKING + 트리거 도달 여부

## 5-2. Known Issue Registry 룰 (필수)

`.flowset/known-issues/` 운영 정책 — 자세한 트리거는 `triggers.md`.

| 룰 | 내용 |
|----|------|
| **단일 진실** | `INDEX.md`가 활성 이슈의 SSOT. 다른 곳에 산재 금지 |
| **즉시 등록** | 발견 즉시 KI-NNN 부여 + 카운트 갱신 (지연 등록 금지) |
| **카운트 갱신 시점** | 이슈 등록 / 해결 / 심각도 재조정 직후 |
| **트리거 자동 점검** | 매 작업 종료 시 임계 도달 여부 검사, 도달 시 사용자 보고 |
| **P0 즉시 진행** | P0 1건 발견 → 진행 중 작업 일시 정지, batch WI 즉시 생성, 자동 승인 |
| **P1/P2/P3 누적** | 임계(3/5/10건) 도달 시 사용자 승인 받아 batch WI 생성 |
| **Phase 종료 게이트** | P0/P1 잔존 0건 + 베타/운영 진입 전 P2도 0건 |
| **아카이브** | 해결 시 `archive/YYYY-MM-DD-batch-NNN.md`로 이동, INDEX 활성 표에서 제거 |
| **batch 후 재평가** | batch WI 완료 후 영향 영역 evaluator 재호출 → PASS 재확인 |

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
| (전 단계) | Known Issue: `.flowset/known-issues/{INDEX,triggers}.md`, `archive/` |
| (전 단계) | Eval 결과: `.flowset/eval-results/phase-N.{eval.md,pass}` |

## 7. Phase 진입 / 종료 기준

각 Phase 종료 시 (반드시 이 순서):

1. 산출물이 `§6 디렉토리 매핑`대로 존재하는지 ls로 확인
2. **evaluator 호출** (Agent 도구, `subagent_type: "evaluator"`)
3. 채점표를 `.flowset/eval-results/phase-{n}.eval.md`에 저장
4. PASS 시 (총점 ≥ 8.0 AND 각 축 ≥ 7.5):
   - **NON_BLOCKING_OBSERVATIONS**를 `known-issues/INDEX.md`로 등록 (P0~P3 라벨링)
   - 카운트 표 재계산 + 트리거 임계 도달 검사
   - **Phase 종료 게이트 검사** — `triggers.md §3` 시점 룰 확인
     - Phase 종료 직전 P0/P1 잔존 → batch WI 의무
     - 베타/운영 진입 전 P2도 0건 의무
   - `.flowset/eval-results/phase-{n}.pass` 마커 생성
   - `.flowset/prd-state.json`의 해당 phase status를 `completed`로 업데이트
   - 다음 phase status를 `in_progress`로 전환
   - `fix_plan.md`의 해당 WI를 `[x]`로 체크
   - 사용자에게 PASS 보고 + 채점표 요약 + known-issue 카운트
5. FAIL 시 (총점 < 8.0 OR 한 축 < 7.5):
   - ISSUES 수정 후 재호출
   - 3회 연속 FAIL → 사용자 에스컬레이션
   - 잔존 비차단 ISSUES → known-issues 적재

## 8. 발견된 실패 패턴 (날짜순 누적)

- **2026-05-19 — 유료 기능 무단 산입**: Phase 1 PRD 작성 시 Claude가 사용자 명시 동의 없이 유료 기능(Supabase Pro / Vercel Pro / Sentry Team / NHN 알림톡 / Tauri 코드 서명)을 "보수적 권고"로 산출물에 산입 → `project.md §5`(외부 비용 발생 시 사용자 확인 필수) + `CLAUDE.md`(추측성 작업 금지) 위반. Phase 2~6 산출물이 이를 그대로 인용·확장. WI-InfraPolicy-docs로 전면 정정. **방지책: §9 원칙 + §10 정책 준수**.

## 9. 외부 비용 / 유료 기능 산입 금지 원칙 (2026-05-19 신규 — 재발 방지)

1. 외부 비용 발생 항목(유료 플랜/구독/인증서/외부 통신 단가)은 **사용자 명시 승인 전까지 산출물 본문에 의무/기본값으로 명시 금지**
2. 산입 필요 시 "옵션 (사용자 승인 시)" 또는 별도 보류 표(`prd/07-risks.md §5 Pending Decisions`)에만 기록
3. Free/무료 대안을 항상 먼저 제시 + 비용/위험 비교표 동반
4. 비용 추정은 단계별(개발 무료 / 전환 시 유료)로 분리
5. `.claude/rules/project.md §5` 사용자 확인 필수 시점 준수 — 외부 비용은 결정 전 진행 금지

## 10. 인프라 운영 정책 (Free 시작 + Pro 전환 트리거, 2026-05-19 사용자 결정)

> **컨텍스트**: 1인 운영 + 소기업(20~50명) 2~3사 대상 (약 150 MAU). codex 3차 협의 + 사용자 결정. **본 §이 모든 산출물의 인프라/비용 결정 SSOT**.

### 10-1. 운영 전략 (codex 역제안)

- Vercel preview: Supabase 미연동 mock UI
- PR 검증: GitHub Actions ephemeral Supabase (`supabase start` 컨테이너) — RLS/audit/Realtime smoke (Claude 작성)
- staging: Supabase Free 1개 (`flowhr-staging`) — merge 후 자동 push
- production: 서비스 런칭 시 Pro 전환
- 개발/CI 작성/디버깅/유지보수는 Claude+codex 수행, 사용자는 의사결정 + 외부 가입만

### 10-2. 서비스별 시작 정책

| 서비스 | 시작 | 전환 |
|------|----|----|
| Supabase | Free | 5트리거(§10-3) 도달 시 Pro |
| Vercel | 무료 (Hobby 개발 / Cloudflare Pages·Netlify 상업적 무료) | 서비스 런칭 시 (Pro 또는 무료 대안 유지) |
| Sentry | Free Developer | 월 5,000 이벤트 초과 시 Team |
| 알림 | 인앱 + 이메일(Resend 3,000건/월 무료) | 카카오 알림톡 / SMS는 테넌트별 옵션 (`tenant_settings`) |
| Tauri 코드 서명 | 자체 인증서 (0원, 설치 가이드) | 설치 UX 개선 필요 시 유료 (Mac $99 / Win OV $90~EV $250) |

### 10-3. Supabase Pro 전환 5트리거 (어느 하나라도 도달 시 사용자 승인)

1. **테넌트 3사 입점** (`tenants` row count)
2. **DB 400MB 도달** (Free 500MB의 80%)
3. **Storage 800MB 도달** (Free 1GB의 80%)
4. **Connection 60 도달 위험 신호** (출퇴근 동시 접속)
5. **유료 SLA / 대기업 컴플라이언스 / TDE 요구** (계약·외부 이벤트)

전환 시 PITR / branch compute / CI 자동화 강화를 한 번에 묶어 처리.

### 10-4. 모니터링 의무 (Claude 셋업 + Sprint 회고 점검)

- Sprint 회고마다(2주) Supabase dashboard DB/Storage/Connection peak 점검
- Supabase 용량 경고 이메일 알림 설정
- staging weekly ping cron (7일 idle 방지)
- staging `db push` 실패 시 Slack/이메일 알림

### 10-5. staging 데이터 정책

- synthetic 데이터만 (실고객 PII 금지 — 반입 필요 시 즉시 Pro 전환 검토)
- storage prefix `tenants/{tenantId}/`
- PR 데이터는 `tenant_id` namespace로 RLS 격리
