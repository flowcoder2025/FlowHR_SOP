# G2 Codex 독립 리뷰

## 종합 평가
- 전체 점수: 6.8 / 10
- 한 줄 요약: WARNING — 와이어프레임 골격과 5상태 토글은 대체로 갖췄지만, DS SSOT·모바일·라우팅·접근성 보강 전 main 머지는 위험합니다.

## 강점
- OP-02~OP-12 모두 `tokens.css` / `components.css`를 참조하고 AppShell 구조를 유지합니다.
- 모든 화면에 5개 `data-state` 디버그 토글과 URL query 동기화가 있습니다.
- analysis 문서가 PRD/API/i18n/Phase 7 변환 항목을 대부분 포함합니다.
- OP-09/OP-11/OP-12는 감사 로그, 보안 정책, 운영자 세션 관리 의도가 명확합니다.
- 상태별 empty/error/modal 패턴이 화면별로 빠짐없이 시각화되어 있습니다.

## 결함 / 개선 권고

### P0 Critical
- 없음.

### P1 High
- 디자인 시스템 SSOT 위반: OP-04가 DS에 이미 있는 `.stepper`, `.step`, `.step-num`을 재정의합니다. OP-03/OP-12도 DS `.tab`과 유사한 탭 클래스를 화면 내부에서 재정의합니다. OP-03/05/06/07/09/12는 DS `.modal-backdrop`/`.modal` 대신 `.modal-overlay`, `.modal-box`, `.modal-*`를 반복 구현합니다.
- 모바일 대응 부재: OP-02~OP-12 HTML에서 `@media (max-width: 768px)` 전환이 없습니다. `240px 1fr`, `280px 1fr`, `360px 1fr`, `repeat(5/6, 1fr)` 같은 고정 grid와 10~11컬럼 테이블이 모바일에서 깨질 가능성이 큽니다.
- 라우팅 정합 부족: 사이드바는 대부분 대시보드만 `href="/operator"`이고 나머지 메뉴는 `href`가 없습니다. OP-02의 테넌트명 링크는 OP-03 상세로 이동하지 않고, 신규 등록 CTA도 OP-04 링크가 아닙니다. OP-06 청구 행, OP-08 티켓, OP-09 로그 상세도 실제 cross-link보다 상태 토글/placeholder 중심입니다.

### P2 Medium
- 접근성 부족: icon-only 버튼에 `aria-label`이 거의 없고, role은 OP-02 error alert 정도만 확인됩니다. 모달/drawer에는 `role="dialog"`, `aria-modal`, label 연결이 없습니다. `<a>` without `href`, clickable `<div>`, clickable `<tr>`가 많아 키보드 접근성이 약합니다.
- 권한 표현이 analysis에 치우침: `operator_super`/`operator_staff` 차이는 문서에는 있으나 HTML에서 staff 모드 disabled/hidden 상태가 충분히 표현되지 않습니다. 특히 OP-03 비활성화, OP-06 환불, OP-09 CSV export, OP-11 시스템 설정은 staff 제한 상태가 별도 state로 보이지 않습니다.
- 상태 토글은 동작하지만 일부 상태의 의미가 얕습니다. OP-10의 quarter/year/custom은 칩 active만 바뀌고 데이터/기간 표시 변화가 거의 없습니다. OP-08은 analysis의 detail 상태 설명과 실제 reply-form 표시 규칙이 다소 어긋납니다.
- 긴 도메인 텍스트 대응 부족: 고정 colgroup 테이블, flex row, badge/금액 영역에 `min-width:0`, `overflow-wrap`, `text-overflow`, 모바일 table scroll 전략이 부족합니다. 긴 회사명, 이메일, 금액, 도메인에서 overflow 위험이 있습니다.
- DS 컴포넌트 일관성: OP-12 알림 채널은 DS `.toggle` 대신 inline `label.switch`를 직접 구현합니다. OP-07 `toggle-pill`도 실제 스위치 의미가 있지만 button/checkbox semantics가 없습니다.

### P3 Low / Nice-to-have
- 푸터의 도움말/운영팀 문의 링크가 여러 화면에서 `href` 없이 남아 있습니다.
- operator 메뉴 수 기준이 문서/요청 간 다릅니다. 현재 레이아웃은 operator 9 메뉴인데 요청에는 8 메뉴로 되어 있어 기준 정리가 필요합니다.
- Phase 7에서 제거할 `.state-debug` 패널이 모든 화면에 있으므로 변환 체크리스트에 공통 제거 항목을 명시하면 좋습니다.

## 화면별 코멘트
- OP-02: 목록/필터/empty/error 상태는 좋지만 OP-03 상세 및 OP-04 신규 등록 링크가 실제 `href`로 연결되지 않습니다. 10컬럼 테이블 모바일 대응이 필요합니다.
- OP-03: 상세/탭/비활성화 모달 구조는 명확합니다. 다만 DS `.tab`/modal 재정의와 staff 권한 disabled 상태 부재가 큽니다.
- OP-04: wizard 흐름과 실패 상태가 잘 잡혀 있습니다. 그러나 `.stepper` 계열 DS 재정의가 가장 명확한 SSOT 위반입니다.
- OP-05: 요금제 CRUD와 inactive 상태 표현은 충분합니다. 모달을 DS modal로 통합하고 액션 `<a>`를 button 또는 href로 정리해야 합니다.
- OP-06: 청구 KPI와 환불 super-only 의도는 좋습니다. 11컬럼 테이블, 환불 권한 guard, 청구 상세/인보이스 링크가 보강 대상입니다.
- OP-07: 기능 플래그/예외/이력 상태가 잘 드러납니다. toggle-pill은 시각적 표시를 넘어 접근 가능한 switch/button semantics가 필요합니다.
- OP-08: master-detail 티켓 UX는 적절합니다. 360px+1fr 고정 레이아웃과 reply/detail 상태 불일치를 정리해야 합니다.
- OP-09: 감사 로그 필터와 drawer 구성이 강점입니다. CSV export super 권한과 drawer 접근성(role/aria/focus trap)을 명시해야 합니다.
- OP-10: 리포트 정보 구조는 좋지만 6 KPI + 4 chart grid가 모바일에서 취약합니다. 기간 state별 데이터 변화도 더 분명해야 합니다.
- OP-11: 설정 탭과 위험 영역 안내가 좋습니다. 9개 탭 중 5개만 상태화되어 있어 Phase 7 범위와 placeholder 정책을 분리해야 합니다.
- OP-12: 운영자 보안 정책과 staff 세션 종료 플로우는 강합니다. 사이드바 active 부재, inline switch, password toggle aria 누락이 보입니다.

## Phase 7 변환 시 주의사항
- DS 컴포넌트는 React 컴포넌트로 단일화하고, 화면별 `.tab`, `.stepper`, `.modal-box`, `.switch` 재정의는 제거하세요.
- 모든 라우팅은 Next.js route/link 기준으로 실제 `href`를 부여하세요: OP-02→OP-03, OP-02→OP-04, OP-03→OP-05/06/07/08/09, OP-06→invoice detail/PDF 등.
- 권한은 UI 숨김만으로 끝내지 말고 middleware + server action/API + RLS에서 `operator_super`/`operator_staff`를 재검증해야 합니다.
- audit 대상 액션은 공통 mutation wrapper로 묶어 actor, target, before/after, result, request_id를 자동 기록하세요.
- 모바일 기준에서 sidebar, filter panel, wide table은 별도 responsive 패턴을 정하세요: drawer filter, horizontal table scroll, card list 변환 중 하나가 필요합니다.
- 모달/drawer는 focus trap, Escape close, `role="dialog"`, `aria-modal`, labelledby/describedby를 기본값으로 가져가야 합니다.
- 긴 한글/회사명/도메인/금액은 `min-width:0`, `overflow-wrap:anywhere`, table scroll wrapper, 숫자 column nowrap 정책을 함께 적용하세요.

## 결론
G2는 화면 범위와 운영사 도메인 시나리오를 충분히 덮고 있으나, main 머지 전 최소 P1은 수정해야 합니다. 특히 OP-04 DS 재정의, 공통 modal/tab 재구현, 모바일 CSS 부재, 실제 라우팅 누락은 Phase 7 변환 비용을 키우므로 와이어프레임 단계에서 정리하는 편이 낫습니다.
