# WI-KI-batch-004 — 디자인 시스템 evaluator 검증

- **Date**: 2026-05-16
- **WI**: WI-KI-batch-004-design-system
- **Mode**: doc
- **검증 사유**: KI-037 (P1) 디자인 시스템 SSOT 구축 후 사용자 요청 검증

## SCORES

| 축 | 가중 | 점수 | 핵심 근거 |
|----|------|------|---------|
| 완성도 | 30% | 8.5 | _design-system/ 12 파일 모두 존재 + 16+ 컴포넌트 Anatomy/Props/Variant matrix. wireframes/README stale + showcase 일부 컴포넌트 미시연 + html/ 잔존 구 파일 (차기 batch) |
| 정합성 | 25% | 8.7 | 토큰·사이드바·CM-16·Tailwind config 1:1 매핑 정상. 단, 03-components.md "SVG attribute 필수" vs components.css "권장" 정책 모순 + _layout-shell.html svg attribute 미명시 |
| 구체성 | 25% | 8.8 | TBD/추후 0건. Variant×Size 정확 수치, 토큰 hex+용도, components.css 자손 셀렉터 + EmptyState 회귀 방지 주석, Variable Notation 정책 §1-1 표 매우 구체적 |
| 실행가능성 | 20% | 8.4 | 07-react-mapping Tailwind config 완전 코드 + shadcn 24 매핑 + custom 12 + 8 항목 검증 체크리스트. 단, _layout-shell svg attribute 누락은 신규 화면 작성 시 정책 확산 위험 |

**WEIGHTED_TOTAL**: 8.61/10
**THRESHOLD**: 8.0 (각 축 7.5)
**VERDICT**: ✅ **PASS**

## 6대 의무 검증

| 의무 | 상태 | 증거 |
|------|:---:|------|
| 변수화 완성도 | ✅ | 03-components.md 16+ 컴포넌트 Anatomy+Props+Variant matrix + Variable Notation §1-1 |
| 정렬 강제 | ✅ | components.css L21~L31 자손 셀렉터 + display:block !important + 컴포넌트별 svg !important |
| descendant 누설 차단 | ✅ | EmptyState `.empty-state > svg.ico-empty` 자손 + 회귀 방지 주석 L417~L419 |
| SSOT 무결성 | ✅ | tokens/components/icons/_layout-shell 단일 source, OP-01.html link 정상 |
| 글로벌 컴포넌트 일관성 | ✅ | _layout-shell CM-16~19 + 푸터, OP-01.html 동일 적용 |
| React 매핑 | ✅ | Tailwind config + shadcn 24 + custom 12 + 검증 체크리스트 8 |

## NON_BLOCKING (8건)

**즉시 처리 (P2 2건)**:
- [P2] 03-components.md L102 "필수" vs components.css L11 "권장" 정책 모순 → 통일 (즉시)
- [P2] `_layout-shell.html` svg attribute 미명시 (정책 자기 위반) → attribute 추가 (즉시)

**KI-038~043 (P3 6건, 차기 batch)**:
- [P3] OP-01.html icon-btn/sidebar-item/profile-trigger svg attribute가 컴포넌트 강제 사이즈와 불일치
- [P3] _showcase.html L532 profile-trigger avatar "김" 도메인 텍스트 잔존
- [P3] _showcase.html 누락 컴포넌트 (breadcrumb/tooltip/popover/maintenance-banner/form-row/sidebar)
- [P3] wireframes/README.md 구 SSOT 참조 잔존
- [P3] 03-components.md §2 정렬 의무 중복 텍스트 (편집 잔재)
- [P3] html/ 디렉토리 구 _design-tokens.css/_icons.css/_icons.svg + OP-02~12 12 HTML (차기 재작성 후 archive)

## NEXT_ACTION

- ✅ PASS: `.flowset/eval-results/WI-KI-batch-004-design-system.pass` 마커 생성
- P2 2건 즉시 처리 → Phase 5 게이트 클린
- P3 6건 → KI-038~041 등록 → 차기 batch (OP-02~12 + TA + EM + CM 일괄 재작성)에서 처리
- 다음: OP-02~12 + TA-01~14 + EM-01~11 + CM-01~22 동일 SSOT 적용 일괄 진행

## 사용자 검수 후속 결함 (2026-05-16, 사후 발견)

evaluator가 잡지 못한 시각 결함 2건을 사용자 직접 검수에서 발견 → 즉시 수정:

1. **avatar-lg / avatar-sm 배경 누락** — `.avatar-lg { width: 80px }` 만 정의, `.avatar` background/color/border-radius inherit 못 받음 (단독 클래스 사용 시) → `.avatar, .avatar-sm, .avatar-lg` 공통 셀렉터로 모든 속성 명시 (자체 완성 클래스로 전환)
2. **icon-btn 종 + 배지 겹침 (재발)** — 배지 사이즈/위치 조정에도 종 본체 가려짐 → 종 18px (20→18) + 배지 위치 -4 -4 (외부로 더 빼냄) + min-width 12 + border-box로 컴팩트화
3. 03-components.md IconButton spec + Avatar spec 신설/갱신 (Anatomy + 사이즈 매트릭스 + 자체 완성 원칙)

**교훈**: evaluator는 정렬·정합성 매트릭스 검증에 강하나, 시각적 시연 결함(배경 누락, 컴포넌트 간 겹침)은 직접 시각 검수 의무. _showcase.html 시연 인스턴스에 대한 시각 검수 체크리스트가 추가 필요.
