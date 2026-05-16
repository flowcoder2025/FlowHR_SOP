---EVAL_RESULT---
PHASE: 5 (와이어프레임 G2 운영)
MODE: doc
WI: WI-G2-wireframes-operator (wf-v0.2.0, OP-02~12, 11 화면 + 11 analysis)
ARTIFACT_PATHS:
  - .flowset/wireframes/html/OP-02.html ~ OP-12.html (11 파일)
  - .flowset/wireframes/analysis/OP-02.md ~ OP-12.md (11 파일)
  - .flowset/VERSION (wf-v0.2.0)
  - .flowset/CHANGELOG.md (L11-40, [wf-v0.2.0] 섹션)

## 객관적 측정

| 측정 | 결과 |
|------|------|
| HTML 구조 sanity (body/html/script 페어) | 11/11 균형 |
| design-system tokens.css + components.css import | 11/11 |
| .state-X 인라인 display 오버라이드 (G1 fix1 결함 회귀) | 0건 |
| body[data-state="..."] 상태 토글 룰 카운트 | 11/11 화면 평균 12+ rule |
| 안티패턴 TBD/TODO/아마/나중에 카운트 | 0건 |
| analysis md "검토" 사용 (Phase 7 분류 외) | OP-02.md L94 1건 (P3 격하 가능) |
| 분석 md 권한 매트릭스 섹션 명시 | OP-02/03 (2/11) 완전 + OP-07/09 부분 |
| CHANGELOG 도입 패턴이 design-system SSOT 등록 여부 | .switch / .toggle-pill / .period-chip / .drawer / .diff-before/after 5종 모두 components.css 미등록 |

## 직전 G1 결함 회귀 확인

| G1 결함 | G2 회귀? | 비고 |
|---------|---------|------|
| .state-X 인라인 display:flex 오버라이드 → 상태 토글 무효 (G1 fix1) | 회귀 없음 | grep 0건 |
| .form-section.state-X flex-direction column 누락 (G1 fix2) | 회귀 없음 | OP-02/03/04 form-section 검증, OP-04 단계 분기 정상 |
| i18n catalog 외 키 사용 (error.* 등) | 일부 결함 | OP-08 screens.op-08.status.* 점-키 표기 — 화면별 screens.op-NN.* 본 규약 자체는 일관 |

## SCORES

### 완성도 (Completeness, 30%): 8.2

**+** 11 화면 × HTML/analysis 페어 11/11 완전. 디자인 시스템 SSOT 두 CSS 11/11 import. 상태 토글 평균 12+ rule (full). OP-04 invite_failed step7 분기 + tenants.status=pending_invite 명시 (HTML L178). OP-12 운영사 보안 강화 명세 완비 (2FA 비활성화 불가 L94/L132 + staff 강제 종료 super 전용 L184 + audit_logs 자동 기록 L275 + 슬랙 알림). OP-09 drawer 480px slide-in + diff-before/after color 분기 + CSV export 모달. OP-11 점검 모드 → CM-06 maintenance + operator_super 우회 명시 (L116).

**−** CHANGELOG가 "패턴 도입"으로 약속한 사항 일부 미충족:
- OP-03 분석 L11 "8 탭" 약속 vs tab-content 패널 3개(basic/usage/audit)만 — 5탭(users/subscription/billing/features/tickets) 클릭 placeholder.
- OP-11 분석 L11 "9 탭" 약속 vs tab-pane 콘텐츠 5탭만 — L22 "4 탭(brand/domain/email/integration) 클릭 placeholder, Phase 7에서 콘텐츠 추가" 솔직 표기 (+0.3) but 약속 미충족 (−0.5).
- OP-04 "7-Step Wizard" → 화면 토글 4 step (1/3/5/7) + invite_failed. step2/4/6 skip — 5 상태 통일 의도에 맞으나 PRD 약속과 미스.

### 정합성 (Consistency, 25%): 7.8

**+** 디자인 시스템 두 CSS 11/11 import. 일반 컴포넌트 (.card / .badge / .table / .btn / .vert-tab) 재정의 0건. G1 fix1 인라인 display 오버라이드 회귀 0건. OP-01과 분석 형식 동일 (PRD 매핑 표 + 5 상태 + i18n + API + Phase 7). OP-11 점검 모드 ↔ CM-06 maintenance 라우팅 정합.

**−** CHANGELOG L29-36 "패턴 도입" 5종 (.switch, .toggle-pill, .period-chip, .drawer, .diff-before/after) 이 design-system SSOT(components.css) 미등록:
- OP-07 L19-22 .toggle-pill 인라인 정의 (3 variant on/off/beta)
- OP-09 L28-33 .drawer, .diff-before/after 인라인 정의
- OP-10 L24-28 .period-chip 인라인 정의
- OP-11 L42-45 .switch 인라인 정의 (cursor + transition + box-shadow 포함)
- OP-12 L229/233/237/241 **.switch 정의 부재 + 인라인 style로 38x22 박스 직접 그림** — OP-11과 미세 비주얼 차이 (cursor/transition 누락)
- review-rubric §5 안티패턴 "인라인 컴포넌트 정의 X" + "디자인 시스템 SSOT 준수" 직접 위반. 화면별로 같은 클래스명을 다르게 정의/사용하여 SSOT 단일 source 원칙 어김.

**−** 분석 md 11개 중 "권한 매트릭스" 섹션 명시: OP-02/03 (2/11) 완전 + OP-07/09 부분 (super 전용 한 줄). OP-04/05/06/08/10/11/12 7화면은 권한 매트릭스 표 부재. review-rubric §5 "권한 매트릭스 누락" 안티패턴 (다만 PRD 측 OP-NN-*.md에는 존재 → 분석 md 재인용 누락 정도).

### 구체성 (Specificity, 25%): 8.4

**+** 분석 md 평균 60줄 (40~104줄)로 5 상태 + PRD 매핑 + i18n + API + Phase 7 변환 가이드 5요소 일관. OP-04 invite_failed 상태에서 tenants.status = pending_invite + request_id + 재발송/수동 발송 액션 분기 명시 (HTML L178). OP-10 차트 placeholder Phase 7 라이브러리 매핑 명시 (recharts/visx/nivo, OP-10.md L46-47). OP-12 강제 종료 audit_logs + 슬랙 알림 자동 기록 명시 (HTML L275). OP-11 점검 모드 24h 사전 공지 + 4단 폴백 (인앱→카카오→SMS→이메일) 명시.

**−** 안티패턴 1건: OP-02.md L94 "모바일 ≤768px — tenants-shell 1 column ... 또는 필터 collapse (Phase 7 검토)" — review-rubric §5 "검토" 안티패턴. 다만 Phase 7로 미루는 결정의 명시이므로 G1 fix1 PASS 평가와 동일하게 P3 격하 가능.

**−** OP-07/10 분석 md 40~49줄 — 비교적 간결하여 OP-02 (104줄) 대비 디테일 부족. 권한 매트릭스 / 검증 체크 / Phase 7 구체 시 추가 디테일 누락. 다만 화면 자체가 단순 패턴(토글 테이블 + 차트)이라 적정 분량 가능.

### 실행가능성 (Actionability, 20%): 8.0

**+** 5 상태 토글 11/11 화면 정상 동작 (G1 fix1 결함 회귀 0건). OP-04 Wizard step1→step3→step5→step7→invite_failed 분기 정상 + 재발송 액션 + tenants 목록 이동 명확. OP-08 master-detail list ↔ detail ↔ reply ↔ internal_memo ↔ closed 5 상태 토글 정상 (CSS L35-49). OP-09 detail_drawer 상태 → drawer slide-in + diff highlight 정상 (CSS L27-33). OP-12 force_logout 상태 → modal-force flex 표시 + onclick 트리거 3/4 staff 행에서 정상.

**−** OP-12 L213 마지막 4번째 staff 강제 종료 버튼에 onclick="applyState(force_logout)" 누락 (앞 3개에는 있음) — UX 일관성 결함 P3.

**−** Phase 7 변환 가이드 권한 미들웨어 / RLS 매핑이 OP-02만 구체 명시 ("미들웨어 users.role.startsWith(operator_) 체크 → 403 redirect", L104), 나머지 분석 md는 Phase 7 변환 섹션이 매우 간결. Phase 7 진입 시 화면별 추가 결정 필요.

**−** .switch SSOT 부재로 인해 Phase 7 React 컴포넌트화 시 (OP-11과 OP-12) 디자인 일관성 위해 추가 정합 작업 필요.

WEIGHTED_TOTAL = (8.2 × 0.30) + (7.8 × 0.25) + (8.4 × 0.25) + (8.0 × 0.20)
              = 2.46 + 1.95 + 2.10 + 1.60
              = **8.11 / 10**

THRESHOLD: 8.0 (각 축 최소 7.5)
- 완성도 8.2 ≥ 7.5 ✅
- 정합성 7.8 ≥ 7.5 ✅ (임계 0.3 여유)
- 구체성 8.4 ≥ 7.5 ✅
- 실행가능성 8.0 ≥ 7.5 ✅

VERDICT: **PASS** (한계 통과)

## ANTI_PATTERNS_FOUND

1. **[P2] 디자인 시스템 SSOT 위반 — CHANGELOG 도입 패턴 5종 인라인 정의** — .switch (OP-11 L42, OP-12 L229 / OP-11과 OP-12에서 정의 비일관), .toggle-pill (OP-07 L19-22), .period-chip (OP-10 L24-28), .drawer (OP-09 L28), .diff-before/after (OP-09 L32-33). 5종 모두 components.css에 미등록. review-rubric §5 "인라인 컴포넌트 정의 X" + "디자인 시스템 SSOT 준수" 직접 위반. 차단 사유는 아니나 (정합성 7.8 ≥ 7.5) wf-v0.2.1 hotfix 또는 G3 진입 전 SSOT 통합 강력 권장.
2. **[P2] 분석 md 권한 매트릭스 섹션 명시 11화면 중 2화면만** — OP-04/05/06/08/10/11/12 7화면 부재. OP-07/09 부분 명시. review-rubric §5 "권한 매트릭스 누락" 안티패턴.
3. **[P3] "Phase 7 검토" 표현 1건** — OP-02.md L94 모바일 반응형. Phase 7 단계 결정 미루기로 합리적 사유 → P3 격하.
4. **[P3] OP-12 L213 강제 종료 버튼 onclick 누락** — 4개 중 3개만 force_logout 트리거. UX 일관성 결함.

## ISSUES (FAIL 사유)
- 없음 — 모든 축 임계 7.5 통과, 가중 총점 8.11.

## NON_BLOCKING_OBSERVATIONS

- **[P2] KI-G2-design-system-ssot-missing** — .switch / .toggle-pill / .period-chip / .drawer / .diff-before / .diff-after 5 컴포넌트 components.css 등록 누락. CHANGELOG가 "패턴 도입"으로 약속한 SSOT가 실제로는 화면별 인라인 정의. Phase 7 React 변환 시 일관성 강제 어려움. wf-v0.2.1 hotfix 권장.
- **[P2] KI-G2-analysis-permission-matrix** — OP-04/05/06/08/10/11/12 7 화면 분석 md에 권한 매트릭스 표 부재. PRD 측에는 명시되어 있으므로 인용 추가 작업으로 처리 가능.
- **[P3] KI-G2-op11-tabs-placeholder** — OP-11 "9 탭" 약속 vs 실제 콘텐츠 5 탭. 4 탭 Phase 7 콘텐츠 추가 명시는 했으나 PRD 매핑 표는 "9 탭" 약속.
- **[P3] KI-G2-op03-tabs-placeholder** — OP-03 "8 탭" 약속 vs 실제 콘텐츠 3 탭 (basic/usage/audit). 분석 md에 placeholder 표시 누락.
- **[P3] KI-G2-op12-force-logout-onclick-missing** — OP-12 L213 4번째 staff 행 onclick 누락. UX 시연 일관성.
- **[P3] KI-G2-op02-mobile-review** — OP-02.md L94 "Phase 7 검토" 표현. "Phase 7 결정" 등으로 표현 권장.

## RECOMMENDATION

- **승인**. WEIGHTED_TOTAL 8.11 / 10. 모든 축 임계 7.5 통과 (정합성 7.8 임계 0.3 여유).
- 정합성 축이 7.8로 가장 낮음 — 5 인라인 컴포넌트 정의가 본 결함의 주된 사유. **wf-v0.2.1 hotfix로 components.css 통합 작업 강력 권장** (G3 작업 전 또는 G3와 병행). 통합 시 OP-11과 OP-12 .switch 정의 비일관(cursor/transition/box-shadow) 동시 해소.
- 분석 md 권한 매트릭스 보강 (OP-04/05/06/08/10/11/12 7건) — PRD 측 권한 표 인용 추가로 즉시 처리 가능. P2 NON_BLOCKING.
- P3 4건은 known-issues/INDEX.md 등록 후 wf-v0.2.1 또는 G3 작업 시 일괄 처리.

## NEXT_ACTION

- PASS: Phase 5 G2 (wf-v0.2.0) 완료 승인. .flowset/eval-results/WI-G2-wireframes-operator.pass 마커 작성.
- 사용자 git tag wf-v0.2.0 머지 후 부여.
- NON_BLOCKING 6건 known-issues/INDEX.md 등록 (P2 2건 + P3 4건).
- G3 (테넌트 매니저 TA-01~14, 14 화면, wf-v0.3.0) 진입 가능. 단 G3 진입 전 design-system SSOT hotfix(wf-v0.2.1) 권장 — 5 컴포넌트 components.css 통합. 미흡 시 G3에서 같은 결함 반복.

---END_EVAL---
