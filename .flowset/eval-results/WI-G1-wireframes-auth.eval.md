# WI-G1-wireframes-auth Phase 5 와이어프레임 평가

**평가일**: 2026-05-16
**평가자**: evaluator 서브에이전트 (Opus)
**모드**: doc (Phase 5 와이어프레임 산출물)
**버전**: wf-v0.1.0 (.flowset/VERSION)
**브랜치**: feature/WI-G1-wireframes-auth (base = main 4f3c63c)

## 평가 대상

- 디자인 시스템: _layout-auth.html 신규 + components.css +101라인 (auth 클래스 30종) + icons.svg +4종
- 8 비인증 화면 HTML: CM-01/02/03/04/05/06/20/21 (각 5 상태 + 디버그 패널)
- 8 analysis 파일: PRD 매핑 + i18n + API + 라우팅 + Phase 7 변환 가이드
- 자동화: .claude/rules/project.md §6 추가 / VERSION wf-v0.1.0 / CHANGELOG 갱신

## 채점표 (review-rubric.md §2 Doc 모드)

### 완성도 (Completeness) — 30% 가중

점수: 8.5/10

근거:
- 8 화면 모두 _layout-auth.html 표준 헤더/푸터 100% 일관성 (grep auth-shell 8/8, auth-header 8/8, auth-lang-toggle 8/8, i-help 8/8, logo-text>FlowHR 8/8)
- 각 화면 5 상태 정확히 구현 (data-state-key × 5 통일, 디버그 패널)
- 8 analysis 파일 모두 PRD 매핑 + 상태 매트릭스(5행) + i18n 키 + API 매핑 + Phase 7 변환 섹션 보유
- 09-routing.md §2-1 비로그인 영역 12개 라우트 모두 8 화면에 1:1 매핑
- 글로벌 헤더 (logo + 언어 토글 + 도움말) 8 화면 통일
- 글로벌 푸터 (저작권 + 4 링크 + 버전) 8 화면 통일

소폭 감점:
- .flowset/wireframes/README.md가 G1 산출물 (CM-20/21 신규) 미반영 (P3)
- spec/matrix.json screens_to_entities_map에 CM-01~06 누락 (P3)
- .flowset/CHANGELOG.md L46+48 [wf-v0.0.0] 중복 헤더 (P3)

### 정합성 (Consistency) — 25% 가중

점수: 7.7/10

근거:
- 디자인 시스템 SSOT 준수: 8 화면 모두 인라인 컴포넌트 정의 없음 (grep .btn|.input|.card|.auth-shell 모두 0건)
- _layout-auth.html이 components.css 신규 클래스 (auth-shell, auth-card, auth-alert, otp-group, auth-hero, legal-shell, install-grid)를 정의 > 화면에서 재사용 100%
- icons.svg 4종 추가 (i-globe, i-eye-off, i-lock, i-smartphone-share) 모두 정의됨, 사용한 모든 아이콘 ID가 svg에 존재
- 09-routing.md §3 진입 매트릭스 (operator/tenant/employee 분기), §6 글로벌 컴포넌트와 8 화면 헤더/푸터 일치

중대 정합성 결함 — i18n 키 catalog 불일치 (P2):
- 08-i18n.md §2의 키 catalog 명명 규약은 screens.{screen-id}.* / system.error.* / components.* 네임스페이스 사용 (예: screens.op-01.title, system.error.forbidden.title)
- G1 analysis 파일들은 auth.login.title, auth.two_fa.title, error.403.title, legal.terms_title, install.title 등 catalog와 다른 네임스페이스 사용 > Phase 7 빌드 시점에 충돌
- CM-05.md L38 error.403.title vs catalog L58 system.error.403.title vs catalog L157 system.error.forbidden.* > 3개 분열

비참조 결함 (P3):
- analysis 8개 중 7개 (CM-02/03/04/06/20/21)가 09-routing.md SSOT를 본문에서 인용 안 함 (CM-01, CM-05만 인용)
- analysis 8개 중 7개 (CM-02/03/04/05/06/20/21)가 08-i18n.md catalog를 인용 안 함

### 구체성 (Specificity) — 25% 가중

점수: 7.6/10

근거:
- 각 화면 5 상태 모두 구체적 라벨/URL/에러 코드 명시 (AUTH_INVALID_CREDENTIALS, AUTH_LOCKED, AUTH_2FA_REQUIRED, AUTH_2FA_INVALID, AUTH_RESET_TOKEN_EXPIRED, INVITATION_EXPIRED, ROLE_INSUFFICIENT, TENANT_MISMATCH, SESSION_EXPIRED, CONTACT_OPERATOR, NETWORK_ERROR)
- 수치 명시: 60분 토큰 만료(CM-02), 7일 활성화(CM-03), 5분 잠금/04:32(CM-01), 30초 OTP 갱신(CM-04), 8개 복구코드(CM-03/04), iOS 16.4+(CM-20), 30일 dismiss(CM-20), request_id(CM-06)
- API 엔드포인트 구체: POST /api/v1/auth/login, POST /api/v1/auth/forgot-password, POST /api/v1/auth/reset-password, POST /api/v1/auth/activate, POST /api/v1/auth/login/two-factor, POST /api/v1/auth/login/recovery, GET /api/v1/auth/invitation
- Gherkin 시나리오 인용 (CM-01, CM-02, CM-03, CM-04, CM-21)

구체성 결함 (안티패턴 적발):
- CM-04.md L74: "Phase 7에서 httpOnly cookie 가능 여부 검토" — review-rubric.md §5 안티패턴 "검토" 적발 (P2)
- CM-01.md L166: "MVP v1.1: 매직 링크 로그인 검토 (현재 미명세)" — 안티패턴 "검토" 적발 (P3)
- CM-03.md L70 "건너뛰기 vs 활성화 완료 버튼 라벨 분기 (직원/운영사)" — HTML L164-166은 두 버튼 항상 표시. 운영사일 때 건너뛰기 숨김 처리 미명시 (P3)

### 실행가능성 (Actionability) — 20% 가중

점수: 7.3/10

근거 (긍정):
- 각 analysis가 Phase 7 변환 가이드 명시 (next-intl, RHF + zod, react-otp-input, react-markdown, qrcode.react, beforeinstallprompt)
- 09-routing.md §3 진입 매트릭스로 다음 Phase에서 미들웨어 구현 가능
- 모든 라우트 vs 화면 1:1 매핑 완비
- 상태 토글 / 비밀번호 보이기 / OTP 자동 next focus / 디바이스 감지 함수 모두 PoC 수준 코드 포함

중대 실행가능성 결함 — HTML 기능 결함 (P2):
- CM-04.html L76: form-section state-only state-input state-loading state-error 요소에 style=display:flex 인라인이 state-only(display:none)를 영구 오버라이드. body[data-state=recovery] 또는 body[data-state=done] 시에도 OTP 입력 폼이 계속 표시됨 > 5 상태 토글이 사실상 작동 안 함 (recovery/done 시 OTP+recovery 동시 노출)
- CM-21.html L103-107, L117-118, L131: 8건의 state-only 요소에 style=display:inline 또는 style=display:block 인라인 오버라이드 > 모든 5 메타 버전이 동시 표시, 모든 본문 변형이 동시 표시, 동의 박스의 두 버전 번호 동시 표시 > 5 상태 분기 사실상 작동 안 함
- Phase 7 React state 변환 시 동일 안티패턴 답습 위험. analysis CM-21.md L77-78 "5 상태 토글 + 상단 banner / consent 영역 / meta 텍스트 분기"는 시각 검수 항목이지만 실제 HTML에서 작동 안 함 > analysis 주장과 HTML 동작 불일치

기타 결함 (P3):
- 점검 사전 공지 배너(.maintenance-banner 09-routing §6-4)는 components.css에 정의되어 있으나 CM-06 화면에 시범 적용 X (의도적 제외 가능)

## 가중 합산

- 완성도: 8.5 × 0.30 = 2.55
- 정합성: 7.7 × 0.25 = 1.925
- 구체성: 7.6 × 0.25 = 1.90
- 실행가능성: 7.3 × 0.20 = 1.46

WEIGHTED_TOTAL = 7.835 (소수 둘째 자리 7.84)

THRESHOLD: 8.0 (각 축 7.5)

축별 임계 검증:
- 완성도 8.5 >= 7.5 OK
- 정합성 7.7 >= 7.5 OK
- 구체성 7.6 >= 7.5 OK
- 실행가능성 7.3 < 7.5 FAIL > 임계 미달

VERDICT: FAIL (실행가능성 축 7.3 < 7.5 임계 미달 + 가중 합산 7.84 < 8.0)

## ANTI_PATTERNS_FOUND

1. CM-04.md L74: "Phase 7에서 httpOnly cookie 가능 여부 검토" — review-rubric.md §5 안티패턴 "검토" (P2 구체성)
2. CM-01.md L166: "MVP v1.1: 매직 링크 로그인 검토" — 안티패턴 "검토" (P3)
3. CM-04.html L76: 인라인 style=display:flex가 .state-only 메커니즘 무력화 (P2 실행가능성)
4. CM-21.html L103-107, L117-118, L131: 인라인 style=display:inline/block 8건이 .state-only 메커니즘 무력화 (P2 실행가능성 + 정합성 분석문서-HTML 불일치)
5. i18n 키 catalog 분열: 08-i18n.md는 screens.{id}.* / system.* / components.* 규약, G1 analysis는 auth.* / legal.* / install.* / error.* 사용 (P2 정합성)
6. .flowset/CHANGELOG.md L46+48 중복 헤더 [wf-v0.0.0] (P3 문서)

## ISSUES (우선순위 순)

### P2 (수정 필수, FAIL 사유)

- [P2] .flowset/wireframes/html/CM-04.html:76 — state-only 클래스에 인라인 style=display:flex 강제로 5 상태 토글 작동 안 함. recovery/done 상태에서도 OTP 입력 폼 계속 표시 > 인라인 display 제거 후 CSS rule을 body[data-state=input] .state-input, body[data-state=loading] .state-input, body[data-state=error] .state-input { display: flex } 형식으로 명시적 다중 상태 매칭 변경
- [P2] .flowset/wireframes/html/CM-21.html:103-107, 117-118, 131 — 8건의 state-only 요소 인라인 style=display:... 제거. 대신 CSS rule에 display: inline 또는 display: block을 매칭하는 state별 명시 selector 추가
- [P2] .flowset/wireframes/analysis/CM-04.md:74 — "Phase 7에서 httpOnly cookie 가능 여부 검토" > "Phase 7에서 httpOnly cookie 채택 (XSS 안전성 우선)" 또는 결정사항 명시로 변경
- [P2] .flowset/wireframes/analysis/CM-{02,03,04,06,20,21}.md i18n 키 catalog 정합화 — 08-i18n.md §2-3 규약 screens.cm-XX.* 네임스페이스로 키 통일 또는 08-i18n.md에 auth.* / legal.* / install.* / error.* 네임스페이스 정식 등록
- [P2] CM-05.md L38 error.403.title vs 08-i18n.md L58 system.error.403.title vs L157 system.error.forbidden.title 3개 분열 > 단일 키로 통일

### P3 (NON_BLOCKING 권장)

- [P3] .flowset/wireframes/README.md G1 산출물 인벤토리 갱신 (CM-20/21 신규 화면 + wf-v0.1.0 milestone)
- [P3] .flowset/spec/matrix.json screens_to_entities_map에 CM-01~06 권한 매핑 추가
- [P3] .flowset/CHANGELOG.md L46-48 중복 헤더 [wf-v0.0.0] 제거 (한 건만 유지)
- [P3] .flowset/wireframes/analysis/CM-{02,03,04,06,20,21}.md 본문에 09-routing.md §관련 인용 추가
- [P3] CM-01.md L166 "매직 링크 로그인 검토" > "v1.1 매직 링크 검토 (MVP 미포함)" 명시
- [P3] CM-03.html — 운영사 계정 활성화 시 "건너뛰기 (직원)" 버튼 숨김 처리

## NON_BLOCKING_OBSERVATIONS (재평가 시 PASS 시 known-issues 등록 권장)

- 위 P3 항목 5건은 known-issues INDEX 등록 후 batch 단위 정리
- .flowset/wireframes/_design-system/components.css L555-643 신규 auth 클래스는 design-system 03-components.md에 신규 컴포넌트 카드 (Auth Layout, Auth Hero, Legal Shell, Install Grid)로 등록 권장

## RECOMMENDATION

FAIL 사유 요약:
1. CM-04 + CM-21의 HTML 구현이 5 상태 토글이 실제로 작동하지 않음 (인라인 display 오버라이드). analysis가 주장하는 "5 상태 분기"와 실제 HTML 동작 불일치 > 이 한 건만으로도 실행가능성 축 임계 미달
2. i18n 키 catalog 정합성 결여 (analysis와 08-i18n.md 네임스페이스 분열) > Phase 7 빌드 시 키 매핑 실패 위험
3. analysis CM-04.md "검토" 안티패턴

최소 수정 사항 (재평가 통과 조건):
1. CM-04.html L76 인라인 style=display:flex 제거 + state-only CSS rule을 input/loading/error 다중 매칭으로 보강
2. CM-21.html L103-107, L117-118, L131 인라인 display 제거 + state-only CSS rule 보강
3. CM-04.md L74 "검토" 표현 제거 + 결정사항 명시
4. analysis 6개 파일의 i18n 키를 08-i18n.md 규약과 정합화

수정 후 재평가 시 실행가능성 8.0+, 정합성 8.0+ 기대 가능 > 가중 합산 8.0+ 도달 가능.

## NEXT_ACTION

FAIL > 호출자(Claude 본체)가 위 P2 5건 수정 후 evaluator 재호출. WI-G1-wireframes-auth 재평가 라벨 권장: WI-G1-wireframes-auth-fix1.

3회 연속 FAIL 시 사용자 에스컬레이션 (review-rubric.md §8).
