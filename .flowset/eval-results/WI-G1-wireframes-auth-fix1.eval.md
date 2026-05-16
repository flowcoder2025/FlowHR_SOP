---EVAL_RESULT---
PHASE: 5 (와이어프레임 G1 재평가)
MODE: doc
WI: WI-G1-wireframes-auth-fix1 (직전 FAIL 7.84/10 정정 후 재호출)
ARTIFACT_PATHS:
  - .flowset/wireframes/html/CM-04.html
  - .flowset/wireframes/html/CM-21.html
  - .flowset/wireframes/analysis/CM-01.md
  - .flowset/wireframes/analysis/CM-04.md
  - .flowset/wireframes/analysis/CM-05.md
  - .flowset/wireframes/analysis/CM-06.md
  - .flowset/wireframes/_design-system/08-i18n.md
  - .flowset/CHANGELOG.md
  - (브랜치) feature/WI-G1-wireframes-auth @ 3f7769e

## 직전 P2 5건 정정 검증

| ID | 결함 (직전 FAIL) | 정정 검증 | 결과 |
|----|---------------|---------|------|
| P2-1 | CM-04.html L76 인라인 `display:flex; flex-direction:column` 가 `.state-only` display:none을 영구 오버라이드 → recovery/done 상태에서 OTP 폼 강제 표시 | CM-04.html L17~27: state-otp-form 단일 클래스 + CSS `body[data-state="input|loading|error"] .state-otp-form { display: flex }`. 인라인 display 0건 (node script 검증). state-error-alert / state-loading-spinner 별도 토글. L81 `style="flex-direction:column"`만 잔존 (display 미포함, base 룰과 충돌 없음) | ✅ HEAL → P3 격하 |
| P2-2 | CM-21.html L103-131 인라인 display 8건 → 5 상태별 메타/본문/동의 박스 동시 표시 | CM-21.html L24-42: `body[data-state=...] .legal-meta .state-... { display: inline }` / `body[...] .legal-body > p.state-... { display: block }` / `body[...] .legal-consent .state-... { display: inline }` / `.legal-consent`는 force_consent / new_version에서만 flex. 인라인 display 0건 (node script). 상태 5종 격리 정상. | ✅ HEAL → P3 격하 |
| P2-3 | CM-04.md L74 "Phase 7에서 httpOnly cookie 가능 여부 검토" — "검토" 안티패턴 | CM-04.md L74 = "Phase 7에서 httpOnly + Secure cookie 채택 (XSS 안전성 우선, `Set-Cookie: temp_token=...; HttpOnly; Secure; SameSite=Lax; Max-Age=300`). sessionStorage는 와이어프레임 단계 시뮬레이션 한정." 안티패턴 0건. | ✅ HEAL → 완전 제거 |
| P2-4 | analysis 키 (`auth.*`/`legal.*`/`install.*`) vs catalog 키 (`screens.*`/`system.*`) 도메인 네임스페이스 분열 | 08-i18n.md §4 (L164-177) "G1 비인증 영역 도메인 키" 신규 등록 + §9 (L300-315) G1 8개 화면 catalog 정합 매핑 표. system.error.{forbidden|notFound|internal|maintenance|serviceUnavailable|network} 6 코드 §4 (L157-162) 등록. 도메인 병용 정책 + 충돌 시 screens.* 우선 명시. | ✅ HEAL → 완전 제거 |
| P2-5 | CM-05/CM-06 `error.403.*` / `system.error.403.*` / `system.error.forbidden.*` 3 키 분열 | CM-05.md L38-46: `system.error.forbidden.{title|role|tenant|session|contact|backHome|prev}` 7 키 단일. CM-06.md L40-49: `system.error.{notFound|internal|maintenance|serviceUnavailable|network}.*` 10 키 단일. 키 grep 검증 — 잔존 `error.403.*` 0건. | ✅ HEAL → 완전 제거 |

## P3 동시 처리 검증
- CM-01.md L166: "v1.1: 매직 링크 로그인 미포함 (MVP scope 외, 06-mvp-scope.md 참조)" — concrete decision ✅
- CHANGELOG.md L46: `[wf-v0.0.0]` 단일 (이전 중복 헤더 제거) ✅

## 객관적 측정

- **CM-04 인라인 display 카운트**: 0 (직전 6) ✅
- **CM-21 인라인 display 카운트**: 0 (직전 8) ✅
- **G1 analysis 8 파일 안티패턴 (`TBD|추후|검토|나중에|TODO|필요시|아마`) 카운트**: 0 (직전 1)
- **G1 analysis 8 파일 `error.[0-9]+\.` 키 잔존**: 0 (직전 5+) ✅
- **HTML 구조 sanity (body/html/script 페어)**: 8/8 화면 모두 균형 ✅

## SCORES

- 완성도 (Completeness, 30%): 8.8 | 8 비인증 화면 × 5 상태 × HTML/analysis 페어 완전. 디자인 시스템 SSOT 정합. 글로벌 헤더/푸터/라우팅 매트릭스 반영. CM-04 L81 잔존 `flex-direction:column` 인라인은 display 미포함 → 결함 아님.
- 정합성 (Consistency, 25%): 8.9 | i18n catalog §4/§9 정합화로 직전 분열 5건 모두 해소. CM-05/06 키 단일화. 단 — 08-i18n.md L58 §2 "예시" 표에 `system.error.403.title` 한 줄 잔존 (deprecation note L177 + §4 catalog L157과 미세 불일치). 예시 표 성격으로 P3 등급.
- 구체성 (Specificity, 25%): 9.0 | P2-3 "검토" → 구체적 cookie 정책 명시 (HttpOnly + Secure + SameSite=Lax + Max-Age=300). P3 "매직 링크" → "MVP scope 외" 확정. 안티패턴 grep 0건.
- 실행가능성 (Actionability, 20%): 8.7 | 직전 7.3 → CM-04 state 토글 정상 동작 회복 (recovery/done 상태에서 OTP 폼 hidden, error 상태에서 error-alert만 표시, loading 상태에서 spinner만 표시). CM-21 5 상태 메타/본문/동의 박스 격리 동작 회복. Phase 7 React 변환 시 키 추출 ambiguity 제거. 임계 7.5 충족.

WEIGHTED_TOTAL = (8.8 × 0.30) + (8.9 × 0.25) + (9.0 × 0.25) + (8.7 × 0.20)
              = 2.64 + 2.225 + 2.25 + 1.74
              = **8.86 / 10**

THRESHOLD: 8.0 (각 축 최소 7.5) — 모든 축 8.7+ 충족
VERDICT: **PASS**

## NON_BLOCKING_OBSERVATIONS

- **[P3] 08-i18n.md L58 `system.error.403.title` 예시 표 잔존** — §2 키 컨벤션 예시 표에 deprecated 키 한 줄. L177 deprecation note + L157 정식 catalog와 미세 불일치. KI-G1-i18n-example-stale 등록 권장. 예시 표 성격이라 차단 사유 아님.
- **[P3] CM-21 L97 "변경 부분은 `<span class="version-change">하이라이트</span>로 표시됩니다"** — i18n 매핑 누락. 다른 시스템 메시지는 키 추출 완료. v0.1.1 hotfix에서 `legal.terms.version_change_label` 키 추가 권장.
- **[P3] CM-04.html L81 `<div class="form-section state-only state-otp-form" style="flex-direction: column;">` 인라인 flex-direction 잔존** — display 미포함 + base 룰과 충돌 없으므로 동작 정상. 그러나 페이지 한정 CSS로 이동 (`body[data-state=...] .state-otp-form { display: flex; flex-direction: column }`) 권장 — 표기 일관성.
- **[P3] CM-04.html .state-error-alert / .state-loading-spinner는 .state-otp-form 자손 노드** — 부모 .state-otp-form이 recovery/done 상태에서 display:none이므로 자손도 hidden. 정상 동작이지만 CSS 룰 selector 명시성 (e.g., `body[data-state="error"] .state-otp-form .state-error-alert`) 보강 권장. 현 룰 (`body[data-state="error"] .state-error-alert`)은 작동하지만 ancestor 가시성에 의존.

## ANTI_PATTERNS_FOUND

- 직전 안티패턴 5건 (TBD/추후/검토/나중에/TODO + 인라인 display 오버라이드 + 안티패턴 키 분열) → **모두 해소** ✅

## ISSUES (FAIL 사유)

- 없음 — 임계 통과

## RECOMMENDATION

- **승인**. WEIGHTED_TOTAL 8.86 / 10. 모든 축 임계 통과.
- P3 (NON_BLOCKING) 3건은 known-issues/INDEX.md에 KI-G1-i18n-example-stale / KI-G1-version-change-i18n / KI-G1-css-specificity로 등록. wf-v0.1.1 hotfix 또는 G2 작업 시 일괄 처리.
- 직전 평가에서 발견된 P2 5건 모두 P3로 격하 또는 완전 제거되어 차단 사유 없음.

## NEXT_ACTION

- PASS: Phase 5 G1 (wf-v0.1.0) 완료 승인. `.flowset/eval-results/WI-G1-wireframes-auth-fix1.pass` 마커 작성.
- 직전 FAIL 평가 파일 (WI-G1-wireframes-auth.eval.md) 유지 (재평가 이력).
- G2 (운영, OP-02~12, 11 화면) 진입 가능.
- 사용자 git tag `wf-v0.1.0` 머지 후 부여 권장.

---END_EVAL---
