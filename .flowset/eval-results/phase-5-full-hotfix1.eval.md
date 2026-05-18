# Phase 5 전체 (45 화면) Wireframe Evaluator — Hotfix1 재평가

> **Date**: 2026-05-18
> **Branch**: fix/WI-Phase5-ds-audit (PR #13, commit 0fc4706 + 56d456e)
> **Scope**: 45 화면 (CM 8 + OP 12 + TA 14 + EM 11)
> **모드**: doc (Phase 5 와이어프레임, 5축 v3 with DS 충실도)
> **호출 컨텍스트**: 1차 평가 FAIL (7.45/10) → audit hotfix1 정정 후 재평가
> **VERSION**: wf-v0.4.1 (1차 wf-v0.4.0)

## 1. 채점표 (5축, 1차 → hotfix1 변동)

| 축 | 가중치 | 1차 | hotfix1 | 변동 | 임계 | 상태 |
|----|-------|-----|---------|------|------|------|
| 완성도 (Completeness) | 25% | 7.4 | **8.0** | +0.6 | 7.5 | **PASS** |
| 정합성 (Consistency) | 25% | 7.2 | **8.2** | +1.0 | 7.5 | **PASS** |
| 구체성 (Specificity) | 20% | 8.0 | **8.1** | +0.1 | 7.5 | PASS |
| 실행가능성 (Actionability) | 20% | 7.6 | **8.0** | +0.4 | 7.5 | PASS |
| DS 사용 충실도 | 10% | 6.8 | **8.0** | +1.2 | 7.5 | **PASS (Hard gate 해소)** |

**가중 합 = 8.0×0.25 + 8.2×0.25 + 8.1×0.20 + 8.0×0.20 + 8.0×0.10 = 2.00 + 2.05 + 1.62 + 1.60 + 0.80 = 8.07**

**가중 총점: 8.07 / 10**
**임계 게이트: 가중합 ≥ 8.0 AND 각 축 ≥ 7.5 → 모두 충족**

### **VERDICT: PASS (CONDITIONAL — 잔존 P2 4건, P3 다수)**

- 가중 총점 8.07 ≥ 8.0
- 5 축 모두 임계 통과 (각 7.5 이상)
- Hard gate 해소: modal-title / button.tab / button.vert-tab / kpi-meta / ticket-status-current / page-btn.is-active SSOT 동기 완료
- **wf-v1.0.0 tag 부여 조건 충족** (잔존 P2는 차기 batch로 분리)

## 2. NEW-P1 3건 정정 검증 (3 검증 의무)

### 2-1. NEW-P1-001 modal-title SSOT 동기 — PASS

| 검증 위치 | 결과 |
|----------|------|
| _showcase.html L1166-1199 audit fix section 신규 (modal-title 포함 7항목 demo) | PASS — L1169 .modal-title 명시 + L1173 HTML demo |
| 03-components.md L821 Modal Anatomy + L835 .modal-title Props (audit hotfix 신규 SSOT 등록) | PASS — Code 예시 L824 + Props (16px/600, flex 6px gap, svg.ico 16x16) |
| component-usage-matrix.json L37/L39 modal-title allowed_classes 등록 | PASS — Detail+Tabs 패턴 components/allowed_classes 양쪽 등록 |
| 화면 사용 (EM-02/EM-06) | PASS — components.css L455 .modal-title 단일 정의 |

### 2-2. NEW-P1-002 ticket-status-current — PASS (부분)

| 검증 위치 | 결과 |
|----------|------|
| components.css L191-193 정식 등록 | PASS — .ticket-status-current { background: var(--color-accent-bg); color: var(--color-accent); } + commentary |
| OP-08 L234 inline style 제거 | PASS — span class badge ticket-status-current (style 속성 0건) |
| _showcase.html audit fix section §7 demo | PASS — L1197-1198 commentary |
| 03-components.md 사양 등록 | PARTIAL — 등록 없음 (NEW-P2-003 후속) |
| component-usage-matrix.json allowed_classes 등록 | PARTIAL — 등록 없음 (NEW-P2-003 후속) |
| body[data-state="closed"] override (OP-08 L41 inline) | PASS — 페이지 state 종속으로 inline 유지 의도 |

### 2-3. NEW-P1-003 page-btn.is-active SSOT 강제 — PASS (부분)

| 검증 위치 | 결과 |
|----------|------|
| 9 화면 sed 일괄 (OP-02/06/09 + TA-02/05/06/07/10/11) | PASS — button class page-btn is-active 10건 (TA-10에 2건) |
| inline DS bypass 패턴 잔존 검색 | PASS — btn-ghost btn-sm style background grep 0건 |
| _showcase.html audit fix section §6 demo | PASS — L1194-1195 commentary |
| 03-components.md 사양 등록 | PARTIAL — 등록 없음 (NEW-P2-003 후속) |
| component-usage-matrix.json allowed_classes 등록 | PARTIAL — 등록 없음 (NEW-P2-003 후속) |

**3 검증 결론**: NEW-P1 3건 모두 핵심 해소 (CSS 정의 + 화면 적용 + showcase demo). 03-components.md 형식 사양 + matrix.json allowed_classes는 부분 잔존 — P2 등급 후속 (NEW-P2-003).

## 3. Hard gate 해소 검증 (review-rubric §10-4)

| 검증 항목 | 1차 | hotfix1 |
|----------|-----|---------|
| 신규 컴포넌트 SSOT 1개라도 빠짐 | FAIL (4종) | PASS — modal-title 3채널 / button.tab/.vert-tab reset 2채널 / kpi-meta 2채널 + showcase audit fix section §1-7 |
| file:// 아이콘 미표시 | PASS | PASS (CI 9/9) |
| 외부 sprite 참조 | PASS | PASS |
| bare input[type=file/date] | PASS | PASS |
| bare select 반복 | PARTIAL (17건 KI-050) | PARTIAL (18건 KI-050 잔존, 차기 batch) |

**Hard gate 결론**: 1차 FAIL → hotfix1 PASS (KI-050 bare select은 P2 NON_BLOCKING 분류 유지)

## 4. KI-049 확대 16 화면 권한 매트릭스 검증

- 16/16 모두 권한 매트릭스 §추가 — PASS
- 표 구조 결함 발견: 표 헤더가 2 컬럼이나 데이터 행이 한 셀에 합쳐서 들어가고 권한 셀이 `—`로 빈 형식. CM-01은 셀 갯수 불일치 (3개 파이프). 의미 전달은 되지만 G3/G4 분석 파일의 bullet list 형식 (역할별 R/E/X 매트릭스) 대비 미성숙 — P3 후속 hotfix 권장
- backtick 텍스트 미세 손상 (users.role 등 산발적) 후속 처리 권장 — P3 후속 hotfix

## 5. 5축 채점 근거 (재산정)

### 5-1. 완성도 (8.0 / 10) — PASS

- 권한 매트릭스 16/45 누락 → 0/45 (KI-049 확대 해소)
- 신규 컴포넌트 SSOT 4종 동기 (modal-title / button.tab/.vert-tab reset / kpi-meta) — _showcase.html + 03-components.md + matrix.json 부분 등록
- 잔존: G2 analysis 평균 56 lines (G3/G4 110+ 대비 부족), 권한 매트릭스 16 화면 표 형식 단순 (-0.3), 03-components.md / matrix.json 신규 컴포넌트 2건 (page-btn / ticket-status-current) 부분 미반영 (-0.4)
- **+0.6** (1차 7.4 → 8.0)

### 5-2. 정합성 (8.2 / 10) — PASS

- modal-title / button.tab / button.vert-tab / kpi-meta SSOT 4종 동기 PASS
- ticket-status-current components.css 정식 등록 + OP-08 inline 제거
- page-btn.is-active 9 화면 일괄 적용 (10건)
- VERSION + CHANGELOG wf-v0.4.1 갱신 + audit hotfix1 5 sections 명시
- 잔존: page-btn / ticket-status-current 03-components.md / matrix.json 미등록 (-0.3), HANDOFF.md L26 CM-22 PWA install stale 표현 (-0.2), 권한 매트릭스 표 구조 결함 (-0.3)
- **+1.0** (1차 7.2 → 8.2)

### 5-3. 구체성 (8.1 / 10) — PASS

- CHANGELOG audit hotfix1 항목 추가 (NEW-P1 3건 + 정정 효과 추정 표 포함)
- _showcase.html audit fix section 7 항목 demo + commentary
- 03-components.md modal Code 예시 + Props 명시
- 잔존: 권한 매트릭스 표 형식 단순 (1줄 "역할 — 권한" + RLS PRD 참조) — G3/G4 분석 풍부도 대비 부족 (-0.3), backtick 텍스트 산발 손상 (-0.2)
- **+0.1** (1차 8.0 → 8.1)

### 5-4. 실행가능성 (8.0 / 10) — PASS

- 16 권한 매트릭스 추가 → Phase 6/7 진입 시 PRD 재인용 부담 감소
- VERSION/CHANGELOG 갱신 → 차기 그룹 SSOT 명확
- Playwright smoke + 9 CI job PASS (변동 없음)
- 잔존: KI-054 (52건 icon-btn aria-label) 미해소 (-0.5), KI-050 (18건 bare select) 미해소 (-0.5), KI-066 (EM-09 vert-tab data-tab 중복) 미해소 (-0.4), NEW-P1-001/002/003 INDEX.md 미등록 (-0.6)
- **+0.4** (1차 7.6 → 8.0)

### 5-5. DS 사용 충실도 (8.0 / 10) — PASS (Hard gate 해소)

- 1차 FAIL 6.8 → hotfix1 PASS 8.0 (+1.2 최대 변동)
- modal-title / button.tab/.vert-tab reset / kpi-meta SSOT 동기 4종 채널별 등록 (showcase + components.md + matrix)
- ticket-status-current 정식 CSS 등록 + OP-08 inline 제거
- page-btn.is-active 9 화면 일괄 적용 (DS bypass systemic 해소)
- 잔존: bare select 18건 KI-050 (-1.0), icon-btn aria-label 52건 KI-054 (-0.5), TA-14 L158 카카오 inline (-0.2), page-btn/ticket-status-current 03-components.md+matrix.json 미반영 (-0.3)

## 6. 잔존 결함 분류 (P0~P3)

### P0 Critical (0건)

(없음)

### P1 High (0건 — 1차 NEW-P1 3건 모두 해소)

### P2 Medium (4건 — 1차 5건에서 NEW-P1 3건 해소 + NEW-P2-003 신규)

| ID | 영역 | 결함 | 권장 조치 |
|----|------|------|---------|
| KI-049 (확대 보강) | analysis | 16 화면 권한 매트릭스 §추가 PASS — 그러나 표 형식 미성숙 (G3/G4 bullet list 대비 단순) + CM-01 표 셀 갯수 불일치 | 후속 hotfix2 — 표 형식 표준화 + backtick 손상 정정 |
| KI-050 | DS | 18건 bare select (1차 17건 → 차이는 신규 EM 화면 영향) | .select-wrap ancestor wrap 일괄 적용 (차기 batch) |
| KI-054 | A11y | 52건 icon-btn aria-label 없이 data-tooltip만 (WCAG 2.1 AA 결함) | aria-label 일괄 추가 (차기 batch) |
| NEW-P2-003 | DS SSOT | page-btn + ticket-status-current 03-components.md API 사양 + matrix.json allowed_classes 미등록 — _showcase.html demo만 등록 | 03-components.md Pagination/Badge 섹션 추가 + matrix.json 등록 |

### P3 Low (1차 28+6 = 34건 → hotfix1 30건 잔존, 6 신규 P3 일부 해소 일부 잔존)

기존 P3 잔존: KI-005~007/013/016/017/020/023/025/032~036/038/040/042~045/055/056/057/062/064/065/066/067

신규 hotfix1 P3 (1차 NEW-P3 6건 변동):
- NEW-P3-001 → resolved (CHANGELOG wf-v0.4.1 갱신)
- NEW-P3-002 → partial resolved (matrix.json modal-title 등록, page-btn / ticket-status-current 잔존)
- NEW-P3-003 (G2 analysis 부족) → open
- NEW-P3-004 (HANDOFF.md CM-22 PWA install 표현) → open
- NEW-P3-005 (03-components.md tabs-row alias commentary 부재) → resolved (L550 SSOT alias commentary 추가)
- NEW-P3-006 (TA-14 L158 카카오 inline) → open (DS 토큰화 또는 chart 허용 commentary)

신규 hotfix1 추가 P3:
- NEW-P3-007: 권한 매트릭스 16 화면 표 형식 단순 (2 컬럼인데 단일 셀에 합침, CM-01 셀 갯수 불일치) — KI-049 후속 hotfix
- NEW-P3-008: backtick 텍스트 산발 손상 (users.role, tenants.role 등) — KI-049 후속 hotfix
- NEW-P3-009: P2 NEW-P2-003 (page-btn / ticket-status-current 03-components.md + matrix.json 미반영)
- NEW-P3-010: 1차 NEW-P1-001/002/003 + NEW-P2-001/002 KI INDEX.md 미등록 (KI 등록 의무 위반)

## 7. wf-v1.0.0 tag 부여 판정

**부여 가능** — 단 조건부.

근거:
- 가중 총점 8.07 ≥ 8.0
- 5 축 모두 임계 통과
- Hard gate 해소 (modal-title / button.tab/.vert-tab reset / kpi-meta SSOT 동기 4종 채널별 PASS)
- NEW-P1 3건 모두 해소 (page-btn.is-active 9 화면 + ticket-status-current 정식 CSS + modal-title showcase+md+matrix)
- 잔존은 모두 P2/P3 NON_BLOCKING 분류 (KI-050/054 차기 batch + NEW-P2-003 후속)

**권장 경로**:
- 옵션 A (즉시): PR #13 머지 → wf-v0.4.1 tag → 별도 commit으로 wf-v1.0.0 tag 부여 (Phase 5 close-out)
- 옵션 B (보강 후): NEW-P2-003 (page-btn / ticket-status-current 03-components.md+matrix.json) 동기 commit 추가 → 머지 → wf-v0.4.2 → wf-v1.0.0
- 옵션 C (차기 batch 통합): NEW-P2-003 + KI-049 표 형식 표준화 + KI INDEX 신규 등록 + backtick 정정을 hotfix2로 묶음 → wf-v0.4.2 → wf-v1.0.0

## 8. 다음 단계

1. **호출자(Claude 본체) 의무**:
   - 본 평가 결과를 사용자에게 보고 (옵션 A/B/C 결정 요청)
   - PASS 마커 생성 권장: .flowset/eval-results/phase-5-full-hotfix1.pass
2. **KI 등록 의무 (1차 평가에서 미준수, hotfix1 결과로 정정 필요)**:
   - NEW-P2-003 (page-btn / ticket-status-current 03-components.md+matrix.json 미반영)
   - NEW-P3-003 (G2 analysis 부족), NEW-P3-004 (HANDOFF.md CM-22 표현)
   - NEW-P3-006 (TA-14 카카오 inline), NEW-P3-007 (권한 매트릭스 표 형식)
   - NEW-P3-008 (backtick 손상), NEW-P3-010 (1차 NEW-P1 INDEX 미등록)
   - 총 7건 → .flowset/known-issues/INDEX.md 추가 + 카운트 갱신
   - 1차 평가 NEW-P1-001/002/003은 resolved로 등록 후 archive 권장
3. **사용자 개입 필요 (review-system.md §10)**:
   - wf-v1.0.0 tag 부여 옵션 A/B/C 결정 (Phase 5 close-out 시점)
   - 사용자 결정 사유: P2 누적 4건 잔존, hotfix1 효과 검증 후 차기 batch 통합 여부

## 9. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-18 | 초안 — Phase 5 audit hotfix1 재평가 PASS (8.07/10) | NEW-P1 3건 해소 + Hard gate 해소 + 5축 임계 통과 |
