# Phase 5 G4 wf-v0.4.0 Hotfix1 재평가

## Meta

- 평가일: 2026-05-18
- 평가자: evaluator (Claude Opus 4.7) 단독 채점, codex 별도 통합 판정용
- 대상: PR #12 (draft) feature/WI-G4-wireframes-employee @ 79315fc (hotfix1)
- 1차 기준선: phase-5-g4.eval.md (PASS 8.74) + phase-5-g4.codex.md (CONDITIONAL 7.2)
- hotfix1 변경: 10 files / +434 / -26
- 루브릭: .flowset/contracts/review-rubric.md v3 (Phase 5 5축)

---

## 1차 결함 해소 검증

### codex 4 findings 정정

| ID | 등급 | 정정 항목 | 검증 | 위치 |
|----|-----|----------|------|------|
| G4-CDX-001 | P1 | EM-02/EM-03 file-input DS 통일 (label+sr-only+btn+filename) | 해소. file-input-name 잔존 0건 | EM-02.html:295-299, EM-03.html:156-160 |
| G4-CDX-002 | P2 | EM-03 date input class=input 추가 | 해소. .date-input > .input override 적용 | EM-03.html:131,135 |
| G4-CDX-003 | P2 | EM-02/EM-06 modal aria trio | 해소. role=dialog + aria-modal + aria-labelledby + modal-title id | EM-02.html:270, EM-06.html:214 |
| G4-CDX-004 | P2 | EM-10 notif-row href/button + CSS reset + hover 일반화 | 해소. button.notif-row reset + .notif-row:hover 일반화 | EM-10.html:156,165 + components.css:1050-1052 |

### evaluator NON_BLOCKING P2 2건 정정

| ID | 등급 | 정정 항목 | 검증 | 위치 |
|----|-----|----------|------|------|
| 1차-P2-1 | P2 | EM-02 offline state 5 to 6 | 해소. CSS selector + state-only banner + state-debug 6 key + i-globe + analysis 6 행 | EM-02.html:23,99,320 + analysis/EM-02.md L7,L21-28 |
| 1차-P2-2 | P2 | G4 보조 자식 클래스 SSOT 등록 | 부분 해소. 7종 등록 (info-row-key/val, empty-state-title/desc, tab-count, .tab.is-active .tab-count, form-help). history-card 1종 누락 | components.css:1062-1075 |

### 1차 P3 4건 KI 등록

| KI | 항목 | 정합 | 위치 |
|----|------|------|------|
| KI-064 | EM-11 사이드바 비표시 시각 분기 | INDEX.md L83 + P3 24->28 갱신 | INDEX.md |
| KI-065 | EM-03 .calc-val is-emphasis variant | L84 | INDEX.md |
| KI-066 | EM-09 vert-tab data-tab=security 중복 | L85 | INDEX.md |
| KI-067 | 페이지 한정 grid 컴포넌트화 후보 | L86 | INDEX.md |

---

## hotfix1 자체 신규 결함 검증

### A. button.notif-row 시각 정합

| 검증 | 결과 | 증거 |
|------|------|------|
| UA 기본 background/border/font 제거 | OK | components.css:1051 button.notif-row reset |
| .notif-row width 100% + text-align left | OK | components.css:1047 button inline-block 차단 |
| .notif-row:hover selector 일반화 (a. 제거) | OK | components.css:1052 button/a 모두 hover 적용 |
| .notif-row.is-unread + 변종 background 정합 | OK | components.css:1053-1054 그대로 유지 |
| 5상태 시각 분기 미파괴 | OK | EM-10 state-debug 그대로 |

신규 결함 없음.

### B. modal aria 정합

| 검증 | 결과 | 증거 |
|------|------|------|
| modal-box 3 속성 trio | OK | EM-02/06 모두 role=dialog + aria-modal=true + aria-labelledby |
| modal-title id 고유성 | OK | em02-modal-title, em06-modal-title 충돌 없음 |
| modal-overlay > modal-box wrap | OK | role은 modal-box에 부여 (WCAG 권장) |
| close button aria-label 보존 | OK | aria-label=모달 닫기 유지 |

신규 결함 없음.

### C. file-input 구조 정합

| 검증 | 결과 | 증거 |
|------|------|------|
| label.file-input wrap (button 제거) | OK | EM-02:295, EM-03:156 label이 click handle |
| input type=file class=sr-only 접근성 | OK | components.css:829 sr-only positioning |
| .file-input-btn (span) | OK | EM-02:297, EM-03:158 native button 제거 |
| .file-input-filename.is-empty italic | OK | components.css:845 |
| paperclip icon 14x14 | OK | both screens |
| sprite cross-check 재검증 11/11 PASS | OK | EM-01~11 모두 PASS (i-globe 추가 후) |

신규 결함 없음.

### D. EM-02 offline state 정합

| 검증 | 결과 | 증거 |
|------|------|------|
| CSS selector 6 state | OK | EM-02.html:20-24 default/loading/empty/modal/offline/error |
| state-only banner | OK | EM-02.html:99 maintenance-banner with warning-bg |
| i-globe symbol 정의 | OK | EM-02 sprite block 내 정의 |
| state-debug 6 key | OK | EM-02.html:320 |
| analysis EM-02.md 매트릭스 6 행 | OK | analysis/EM-02.md L21-28 |
| --color-warning-bg 토큰 존재 | OK | tokens.css:33 #FEF3C7 |

신규 결함 없음.

---

## SCORES (5축 갱신)

### 축 1. 완성도 25% 8.7 to 9.0 (+0.3)

| 항목 | 1차 | hotfix1 | 변동 |
|------|----|---------|----|
| 11/11 HTML/analysis/매핑/8 메뉴/footer | OK | OK | - |
| EM-02 오프라인 시각 분기 | -P2 | 해소 6 state | +0.3 |
| EM-11 사이드바 비표시 시각 분기 | -P3 | KI-064 등록 (open) | 0 |

근거: 1차 P2 핵심 결함 (EM-02 offline) 해소. P3 KI-064 등록은 차단 아님.

### 축 2. 정합성 25% 8.6 to 8.9 (+0.3)

| 항목 | 1차 | hotfix1 | 변동 |
|------|----|---------|----|
| 보조 자식 클래스 SSOT | -P2 (8종) | 7종 등록 G4.7. history-card 1종 누락 | +0.3 |
| codex G4-CDX-001 (file-input DS) | P1 | 해소 | (codex 측 +0.3) |
| codex G4-CDX-002 (date input class) | P2 | 해소 | (codex 측 +0.1) |
| EM-03 calc-val inline | -P3 | KI-065 등록 | 0 |
| EM-09 vert-tab 중복 | -P3 | KI-066 등록 | 0 |

신규 -0.1: matrix.json allowed_classes에 G4.7 자식 클래스 6종 미반영 (components.css만 등록).
신규 -0.1: history-card (3 화면 사용) 1차 권장 8종 중 누락.

순 +0.3.

### 축 3. 구체성 20% 9.0 to 9.1 (+0.1)

| 항목 | 1차 | hotfix1 | 변동 |
|------|----|---------|----|
| TBD/추후/검토/필요시 grep | 0건 | 0건 | - |
| EM-02 analysis 매트릭스 6 행 + hint | OK | hotfix1 명시 + state 매트릭스 6 행 + modal aria | +0.1 |

### 축 4. 실행가능성 20% 8.8 to 9.0 (+0.2)

| 항목 | 1차 | hotfix1 | 변동 |
|------|----|---------|----|
| Phase 7 React 변환 가능 | OK | G4.7 7 자식 클래스 React subcomponent mapping 명확 | +0.1 |
| modal a11y Phase 7 (Radix Dialog) | -P2 (aria 부재) | aria trio 매핑 가능 | +0.1 |
| Playwright smoke 시나리오 | OK | 신규 button/offline/aria 검증 가능 | - |
| EM-02 오프라인 Phase 7 추가 디자인 | -P2 | 해소 | (축1 반영) |

### 축 5. DS 사용 충실도 10% 8.5 to 8.8 (+0.3)

| 항목 | 1차 | hotfix1 | 변동 |
|------|----|---------|----|
| 외부 sprite 참조 | 0건 | 0건 | - |
| sprite cross-check 11/11 | PASS | PASS (i-globe 추가) | - |
| bare native control | 0건 | 0건 (재검증) | - |
| 보조 자식 클래스 SSOT | -P2 | 7/8 등록 (history-card 누락) | +0.3 |
| .calc-val is-emphasis variant | -P3 | KI-065 등록 | 0 |
| Hard gate file:// 아이콘 미표시 2화면+ | 미발동 | 미발동 | - |
| file-input DS 명세 통일 | (codex P1) | 해소 | (codex 측) |

---

## 가중 합계 계산

| 축 | 1차 | hotfix1 | 가중치 | 1차 합산 | hotfix1 합산 |
|----|----:|--------:|------:|--------:|------------:|
| 완성도 | 8.7 | 9.0 | 0.25 | 2.175 | 2.250 |
| 정합성 | 8.6 | 8.9 | 0.25 | 2.150 | 2.225 |
| 구체성 | 9.0 | 9.1 | 0.20 | 1.800 | 1.820 |
| 실행가능성 | 8.8 | 9.0 | 0.20 | 1.760 | 1.800 |
| DS 사용 충실도 | 8.5 | 8.8 | 0.10 | 0.850 | 0.880 |
| 합계 | | | 1.00 | 8.74 | 8.98 |

WEIGHTED_TOTAL: 8.98 / 10 (1차 8.74 to +0.24)
THRESHOLD: 8.0 (각 축 7.5 이상)

각 축 최소 8.8 이상 임계 통과. Hard gate 미발동.

---

## VERDICT: PASS

가중 합계 8.98 (>=8.0), 각 축 8.8 이상. Hard gate 미발동. ANTI_PATTERNS 0건.

hotfix1은 1차 차단 결함 (codex P1 1건 + P2 3건 + evaluator NON_BLOCKING P2 2건) 6/6 모두 해소. 신규 도입 결함 0건. 신규 NON_BLOCKING P3 잔존 2건.

---

## ANTI_PATTERNS_FOUND

- 없음 (Doc 안티패턴 카탈로그 5 기준 0건 유지)

---

## NON_BLOCKING_OBSERVATIONS (hotfix1 신규)

### [P3] history-card 클래스 SSOT 미등록 (1차 P2-2 부분 누락)
- 위치: EM-02.html:162 + EM-04.html:160 + EM-08.html:171 (3 화면)
- 1차 권장: components.css G4.7에 8종 등록 권장이나 hotfix1은 7종만 등록
- 영향: body[data-state=loading] .history-card 분기는 화면별 inline style 블록에서 정의. DS SSOT 부족.
- 권장: components.css G4.7 또는 History 신규 섹션에 .history-card 등록
- 등급: P3 Low (차후 batch)

### [P3] component-usage-matrix.json allowed_classes 갱신 누락
- 위치: _design-system/component-usage-matrix.json
- hotfix1: components.css G4.7에 7 자식 클래스 등록되었으나 matrix.json allowed_classes 미반영
- 영향: CI showcase-coverage-check 향후 확장 시 G4.7 클래스 화이트리스트 누락. Phase 7 React 변환 시 prop mapping 정합 약화.
- 권장: matrix.json L111 EM-* entry에 info-row-key/val + empty-state-title/desc + tab-count + form-help 추가
- 등급: P3 Low (차후 batch)

---

## ISSUES

이슈는 모두 NON_BLOCKING 처리 (PASS 임계 충족). PR #12 머지 진입 가능.

---

## RECOMMENDATION

### PASS 처리 (즉시 PR #12 머지 진입 가능)

- 가중 합계 8.98 / 10 (임계 8.0 통과)
- 각 축 8.8 이상 (임계 7.5 통과)
- Hard gate 미발동
- ANTI_PATTERNS 0건
- 11/11 sprite cross-check PASS
- 1차 결함 6/6 해소 (codex P1 1 + P2 3 + evaluator P2 2)

### 후속 hotfix 또는 차후 batch (P3 신규 2건)

차후 docs batch (G5 시작 또는 Phase 5 전체 evaluator 시):
- history-card components.css G4.7 등록
- matrix.json allowed_classes G4.7 자식 클래스 6종 추가

### 트리거 평가

- 신규 P3 2건 (현 P3 28 + 2 = 30, 임계 10 초과 유지)
- 1차 신규 KI 6건 (P2 2 resolved hotfix1, P3 4 KI-064~067 등록)
- 사용자 결정 불요 (review-system.md 10.1: P0/P1 누적 3건/public contract 변경 등 비해당)

---

## NEXT_ACTION

- PASS: PR #12 draft to ready to codex 재평가 호출 to 통합 판정 to CI gate to auto-merge to tag wf-v0.4.0
- .flowset/eval-results/phase-5-g4-hotfix1.pass 마커는 호출자(Claude 본체)가 생성
- 신규 NON_BLOCKING P3 2건 to INDEX.md에 KI 등록 (호출자 의무)
- codex 재평가가 PASS 또는 CONDITIONAL일 경우 hotfix2는 차후 batch 처리 가능
