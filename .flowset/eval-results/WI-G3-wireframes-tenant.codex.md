# G3 와이어프레임 (wf-v0.3.0) Codex 리뷰 결과

## 1. Codex 호출 메타

- 시각: 2026-05-17T22:35:42+09:00
- 모델: GPT-5 Codex (`mcp__codex__codex`, ChatGPT account, default model)
- 모드: full review (사용자 결정 — G3 14 화면 단일 PR이라 codex 부담 수용)
- sandbox: read-only
- approval-policy: never
- thread_id: `019e3621-fa68-74e3-b84f-8928d67c823e`
- 검토 파일: 14 HTML + 14 analysis + VERSION + CHANGELOG + component-usage-matrix.json
- 호출자: Claude Opus 4.7 (FlowSet 라이트, .claude/agents — codex 호출 위탁)
- 비고: `git rev-parse`는 실행 정책에 차단되어 commit `bf0c1d5`는 로컬 명령으로 재확인하지 못함. 파일 기준 정적 리뷰.

## 2. 5항목 체크리스트 결과

| 항목 | 결과 | 증거 |
|---|---:|---|
| 1. file:// asset compatibility | PASS | TA-01~TA-14 모두 inline sprite 있음: 예 `TA-01.html:50`, `TA-14.html:52`. `_layout-shell.html:25`, `_layout-auth.html:33`도 inline sprite 보유. `../_design-system/icons.svg` 및 non-fragment `<use href>` 0건. |
| 2. native control visual compliance | PASS | `<select>`는 `.select-wrap > select.select`: `TA-02.html:147-150`, `TA-13.html:161`. file input은 `.file-input`: `TA-02.html:344-347`, `TA-10.html:169-172`. date input은 `.date-input`: `TA-02.html:195-199`, `TA-13.html:193-194`. |
| 3. showcase-to-usage consistency | FAIL 4건 이상 | matrix가 실제 G3 패턴을 포괄하지 않음. 예: TA-14 integration grid 사용 `TA-14.html:16-20`, `162-226`이나 matrix에는 Integration 패턴 없음. TA-07 calendar/leave-badge `TA-07.html:18-26`도 미매핑. Date Input matrix는 `TA-05`, `TA-07`만 포함 `component-usage-matrix.json:116-117`인데 실제 `TA-02`, `TA-13`에서 사용. |
| 4. rendered evidence requirement | FAIL 5건 | AppShell 구조는 일관됨. 그러나 inline `<style>`에서 DS/패턴 클래스를 재정의: `.kpi-row` `TA-01.html:17`, `TA-05.html:16`, `.calendar-grid/.leave-badge` `TA-07.html:18-26`, `.vert-tab` 상태 styling `TA-13.html:30-32`, `.integration-grid/.int-card` `TA-14.html:16-20`. Playwright 렌더 검증은 본 리뷰에서 미실행. |
| 5. cross-screen pattern drift | FAIL 48건 | sidebar 8메뉴, `.is-active`, state-debug 5상태, sidebar footer는 일관. 하지만 `href="#"` placeholder 48건: 예 `TA-01.html:332-336`, `TA-02.html:143`, `TA-10.html:195-235`, `TA-11.html:177-213`, 전 화면 footer 도움말/문의 다수. |

## 3. PRD 매핑 정합

- **TA-01**: KPI 6개 `TA-01.html:191-218`, 차트 4종 `TA-01.html:225-226`, 활동 테이블 3개 `TA-01.html:283`, 공지 `TA-01.html:328` 확인. 단, 공지 링크가 모두 `#`.
- **TA-03**: PRD 탭 9개는 버튼으로 존재 `TA-03.html:155-163`. 그러나 실제 pane은 기본정보/인사정보 2개뿐 `TA-03.html:196`, `TA-03.html:210`; 계약/근태/휴가/급여/문서/결재이력/변경이력 본문이 없음.
- **TA-07**: KPI 5개와 캘린더는 존재 `TA-07.html:133-153`, `TA-07.html:188-300`. 다만 calendar/leave-badge는 DS matrix 미등록 page-local 구현.
- **TA-13**: vert-tabs 9개 존재 `TA-13.html:134-142`. 실제 pane은 근무정책/휴가정책/보안 3개뿐 `TA-13.html:156`, `207`, `243`; 회사정보/결재라인/역할권한/알림/문서양식/감사로그 본문 없음.
- **analysis 14개**는 PRD 매핑, 5상태 매트릭스, DS 사용, API/권한, Phase 7 변환 섹션을 대체로 갖춤. 다만 page-local 클래스를 "컴포넌트 재정의 X"로 선언한 내용이 matrix/§17 정책과 충돌함: 예 `TA-03.md:46`, `TA-07.md:46`.

## 4. 발견 결함

| ID | 등급 | 화면 | 설명 | 위치 (file:line) |
|----|------|------|------|-----------------|
| G3-CDX-001 | P1 | 공통 | `href="#"` placeholder 48건. G2 라우팅 placeholder 재발이며 checklist 0건 조건 위반. | `TA-01.html:332-336`, `TA-10.html:195-235`, `TA-11.html:177-213` |
| G3-CDX-002 | P1 | 공통/SSOT | `component-usage-matrix.json`이 G3 실제 패턴을 포괄하지 못함. Integration Grid, Calendar, Org Tree, Request Drawer 등 미등록. | `component-usage-matrix.json:27-130`, `TA-14.html:16-20`, `TA-07.html:18-26` |
| G3-CDX-003 | P1 | 공통/DS | inline `<style>`에서 DS/패턴 클래스를 재정의. "page-grid layout만 허용" 범위를 넘음. | `TA-01.html:17`, `TA-05.html:16`, `TA-13.html:30-32`, `TA-14.html:16-20` |
| G3-CDX-004 | P2 | TA-13 | PRD 탭 9개 중 실제 본문 pane은 3개뿐. 결재라인/역할권한/알림/문서양식/감사로그 등 핵심 설정 화면 부재. | `TA-13.html:134-142`, `TA-13.html:156`, `207`, `243` |
| G3-CDX-005 | P2 | TA-03 | 탭 9개 버튼은 있으나 실제 content pane은 기본정보/인사정보만 구현. 통합 직원 상세로 보기에는 PRD coverage 부족. | `TA-03.html:155-163`, `TA-03.html:196`, `210` |
| G3-CDX-006 | P2 | 공통 | icon-only 버튼 다수가 `aria-label` 없이 `data-tooltip`만 사용. 접근성 결함 재발. | `TA-02.html:107-108`, `TA-02.html:259`, `TA-04.html:252-256`, `TA-07.html:338-344` |
| G3-CDX-007 | P2 | TA-01/05/07/14 | 화면별 fixed grid가 별도 mobile override 없이 정의됨. DS global media query가 page-local grids를 보장하지 못함. | `TA-01.html:17-19`, `TA-07.html:16-18`, `TA-14.html:16` |
| G3-CDX-008 | P2 | Matrix | Date Input applicable_screens가 실제 사용 화면과 불일치. 실제는 TA-02/TA-13, matrix는 TA-05/TA-07. | `component-usage-matrix.json:116-117`, `TA-02.html:195-199`, `TA-13.html:193-194` |

## 5. 종합 점수 + verdict

- 종합 점수: **6.1 / 10**
- VERDICT: **FAIL**
  - P0는 없음.
  - P1 3건으로 FAIL 기준 충족 (review-system.md §3 — P1 3건 이상 → FAIL).
  - G2 관심사 중 DS SSOT 위반, href placeholder, 접근성 누락, 모바일 취약성이 G3에서 재발.

## 6. 권고

- **현재 상태로 머지 비권고**.
- **hotfix 필수** (P1):
  1. `href="#"` 48건 실제 route 또는 button으로 정리 (G3-CDX-001)
  2. matrix에 G3 실제 패턴 추가/정정 — Integration Grid, Calendar, Org Tree, Profile Card, Approval Shell, Report Shell, Settings Shell, Timeline 등 (G3-CDX-002)
  3. inline component styling을 `components.css` 또는 허용된 page layout class로 이동 (G3-CDX-003)
- **사용자 결정 필요**: TA-03/TA-13은 "탭 버튼만 있음"을 허용할지 결정. full PRD coverage가 목표라면 누락 pane을 추가해야 함 (G3-CDX-004, G3-CDX-005).
- **유지**: native controls와 file:// sprite 정책은 이번 G3에서 잘 지켜졌으므로 해당 축은 유지 가능 (체크리스트 1, 2 PASS).

---

## 7. review-system.md §4 통합 판정 입력값

본 결과를 evaluator 결과와 통합 판정 시 입력값:

- **codex verdict**: FAIL
- **codex 점수**: 6.1 / 10
- **codex P1**: 3건 (G3-CDX-001, 002, 003)
- **codex P2**: 5건 (G3-CDX-004, 005, 006, 007, 008)
- **codex P0**: 0건

evaluator가 PASS여도 codex FAIL → 통합 판정 **BLOCKED_FOR_HOTFIX** (§4 매트릭스).
evaluator도 FAIL이면 통합 판정 **FAIL** (정정 후 재호출).
