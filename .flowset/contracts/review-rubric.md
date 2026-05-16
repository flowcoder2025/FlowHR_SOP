# Review Rubric (FlowHR 라이트)

> evaluator 에이전트(`.claude/agents/evaluator.md`)가 사용하는 채점 루브릭 SSOT.
> Phase별로 `mode=doc` 또는 `mode=code`로 분기 채점.

## 1. 통과 게이트

- 각 축 최소 임계값 모두 충족 **AND** 가중 총점 ≥ **8.0** → PASS
- 한 축이라도 임계 미달이면 FAIL (총점 무관)
- 가중 총점은 소수 둘째 자리 반올림 (`printf "%.2f"`)
- **NON_BLOCKING_OBSERVATIONS**: PASS 했어도 evaluator가 발견한 비차단 우려를 P0~P3 라벨링하여 보고 → 호출자가 `.flowset/known-issues/INDEX.md`에 적재

## 2. Doc 모드 채점표 (Phase 1~6, 8~10)

| 축 | 가중치 | 최소 임계값 | 검증 방법 |
|----|--------|-----------|----------|
| 완성도 (Completeness) | 30% | ≥ 7.5 | 필수 섹션 ls, 디렉토리 매핑 일치, placeholder 0건 |
| 정합성 (Consistency) | 25% | ≥ 7.5 | requirements.md / matrix.json / 이전 산출물 대조 |
| 구체성 (Specificity) | 25% | ≥ 7.5 | grep "TBD\|추후\|검토\|아마도", 추측성 표현 카운트 |
| 실행가능성 (Actionability) | 20% | ≥ 7.5 | 다음 Phase 진입 시 추가 질의 필요 항목 카운트 |

**가중 합 = (Completeness × 0.30) + (Consistency × 0.25) + (Specificity × 0.25) + (Actionability × 0.20)**
**통과: 가중 합 ≥ 8.0 AND 각 축 ≥ 7.5**

## 3. Code 모드 채점표 (Phase 7)

| 축 | 가중치 | 최소 임계값 | 검증 방법 |
|----|--------|-----------|----------|
| 기능 완성도 | 30% | ≥ 7.5 | 수용 기준 항목별 충족, stub/TODO grep, 엣지 케이스 |
| 코드 품질 | 25% | ≥ 7.5 | lint, 중복 패턴 grep, `any` 카운트, 함수 길이 |
| 테스트 커버리지 | 25% | ≥ 7.5 | `npm test` 실행, 권한 음성/양성 케이스, RLS 검증 |
| 계약 준수 | 20% | ≥ 7.5 | api-standard 응답 형식, matrix.json 엔드포인트, RLS 정책 |

**가중 합 = (기능 × 0.30) + (품질 × 0.25) + (테스트 × 0.25) + (계약 × 0.20)**
**통과: 가중 합 ≥ 8.0 AND 각 축 ≥ 7.5**

## 4. 채점 캘리브레이션

### 점수대 기준

| 점수 | 의미 | 처리 |
|------|------|------|
| 9.0~10.0 | 우수 — 즉시 승인 수준 | PASS (증거 필수) |
| 8.0~8.9 | 통과 — 권장 사항 일부 있음 | PASS (NON_BLOCKING 등록) |
| 7.0~7.9 | 경계 부족 — 수정 후 재평가 | FAIL |
| 5.0~6.9 | 부족 — 재작업 필요 | FAIL |
| 0.0~4.9 | 실패 — 근본적 재작업 | FAIL |

### 9.0+ 증거 요건

평가자가 같은 모델이라 자기 판단 신뢰도가 낮음. 9.0 이상은 다음 증거 모두 필요:
- 파일:줄번호로 검증 위치 명시
- grep/실행 결과 인용
- 안티패턴 0건 재확인

증거 없는 9.0+는 자동으로 8.0으로 강등.

## 5. 안티패턴 카탈로그

### Doc 안티패턴 (해당 축 -2.0 이상)

| 패턴 | 영향 축 |
|------|--------|
| "TBD", "추후 결정", "검토 필요", "필요시" | 구체성 |
| "~일 것이다", "아마도", "보통은", "대체로" | 구체성 |
| 화면 ID 표기 불일치 (OP-01 vs op_01 혼재) | 정합성 |
| 권한 매트릭스 누락 또는 spec §9와 불일치 | 정합성 |
| 한글 라벨과 코드 식별자 매핑 부재 | 실행가능성 |
| 표만 있고 의사결정 근거 없음 | 구체성 |
| 빈 섹션 또는 placeholder 문구 | 완성도 |
| 이전 Phase 산출물 인용 누락 | 정합성 |

### Code 안티패턴 (해당 축 -2.0 이상)

| 패턴 | 영향 축 |
|------|--------|
| `// TODO`, `// FIXME`, 빈 함수 | 기능 완성도 |
| `catch (e) {}` 에러 삼키기 | 코드 품질 |
| `any` 타입 남용 | 코드 품질 |
| 하드코딩된 tenant_id / role | 계약 준수 |
| RLS 미적용 query | 계약 준수 |
| 테스트 없이 "완료" 주장 | 테스트 |
| API 응답이 envelope 형식 위반 | 계약 준수 |
| 동일 로직 3회 이상 복사 | 코드 품질 |
| 영문 라벨만 사용 (한글 누락) | 계약 준수 |

## 6. Phase별 추가 검증 항목

| Phase | Doc 모드 추가 검증 |
|-------|------------------|
| 1 PRD | 디바이스 매트릭스(Web/PWA/Tauri) 명시, 기술 스택 확정, MVP 범위 명시, 36 화면 전체 다룸, **(2026-05-15 추가, KI-031) 진입점·라우팅 매트릭스(09-routing.md) + 글로벌 헤더 컴포넌트(CM-16~19) + 운영사 본인 프로필(OP-12) + 약관/온보딩/PWA 설치 정적 페이지 명세 존재** |
| 2 백로그 | matrix.json entities 채워짐, Epic→Story→Task 트리 완전, WI-NNN 형식 |
| 3 ERD | Mermaid 다이어그램 존재, RLS 정책 모든 테이블, 인덱스 명시, FK 관계 정의 |
| 4 API | OpenAPI 형식 또는 동등, 모든 엔드포인트 에러 응답 포함, 권한 매트릭스 매핑 |
| 5 와이어프레임 | 36 화면 analysis/*.md 모두 존재, 이미지 파일 1:1 대응, 컴포넌트/필드/액션 명시 |
| 6 스프린트 | sprint-NNN.md 종속성 그래프, Gherkin 수용 기준, 스프린트별 WI 매핑 |
| 8 QA | 권한 매트릭스 음성/양성, 골든 패스 + 엣지 케이스, E2E 시나리오 |
| 9 베타 | 온보딩 체크리스트, 피드백 채널 정의, 트리아지 SOP |
| 10 운영 | SLA 수치, 백업 RTO/RPO, 모니터링 알림 임계, 장애 대응 절차 |

## 7. 평가 결과 저장

evaluator의 채점표는 `.flowset/eval-results/`에 저장:

| 단위 | 파일명 | 내용 |
|------|--------|------|
| Phase | `phase-{n}.eval.md` | 평가 결과 전문 |
| Phase 통과 마커 | `phase-{n}.pass` | PASS 시 빈 파일 (Claude 본체가 생성) |
| WI | `WI-{ID}.eval.md` | WI 단위 평가 (Phase 7 코드) |
| WI 통과 마커 | `WI-{ID}.pass` | PASS 시 빈 파일 |

evaluator는 채점표만 반환, 마커는 호출자(Claude 본체)가 생성.

## 8. 재평가 정책

- FAIL 시: 호출자가 ISSUES를 수정 후 같은 phase/WI로 재호출
- 동일 WI/Phase 최대 3회 재평가
- 3회 연속 FAIL → 사용자에게 에스컬레이션 (스코프/요구사항 재검토 권고)

## 9. Codex 통합 (Review System v2, 2026-05-16)

본 rubric은 **evaluator 단독 평가 룰**. 통합 평가 시스템은 `.flowset/contracts/review-system.md` 참조.

### 9-1. 두 평가자의 역할 분리

| 평가자 | 본 rubric 적용 | 추가 평가 |
|--------|--------------|----------|
| evaluator (Claude sub-agent) | ✅ 본 문서 4축 가중 | — |
| codex (gpt-5 MCP) | ❌ 별도 verdict 체계 | 구현 전환 리스크 / UX / 접근성 / 모바일 / 라우팅 / cross-link |

### 9-2. 통합 판정 시 evaluator 점수 활용

- evaluator 가중 합계 점수는 통합 판정에서 **doc 완성도 축**으로 활용
- 머지 게이트는 점수 평균이 아닌 `verdict + severity + trigger + phase gate` 판정 (review-system.md §4)
- evaluator FAIL은 단독으로 차단 사유 (review-system.md §4 매트릭스)

### 9-3. evaluator NON_BLOCKING_OBSERVATIONS → KI 등록

evaluator가 식별한 NON_BLOCKING 결함은 호출자(Claude 본체)가 `.flowset/known-issues/INDEX.md`에 등록 — 등급 매핑은 review-system.md §5/§6 참조.

codex가 동일 결함을 더 높은 등급으로 지적한 경우 **상위 등급 채택 + `source: both` 병합** (review-system.md §6).

## 10. Phase 5 와이어프레임 5번째 축 — 디자인 시스템 사용 충실도 (v3, 2026-05-16)

Codex 협의 합의안 반영 (`review-system.md §17` + `review-system-v3-draft.md §6`).
G2 운영 후 사용자 검수에서 발견된 검증 누락(아이콘 미표시 / native control / showcase 분리) 대응.

### 10-1. 적용 범위

- **Phase 5 와이어프레임 doc 모드 한정** (다른 Phase 4축 그대로)
- 적용 시점: 2026-05-16 이후 G1 hotfix + G2 hotfix + G3/G4/전체 evaluator

### 10-2. 가중치 재조정

| 축 | v2 (기존) | **v3 (Phase 5)** |
|---|---:|---:|
| 완성도 | 30% | **25%** |
| 정합성 | 25% | **25%** |
| 구체성 | 25% | **20%** |
| 실행가능성 | 20% | **20%** |
| **DS 사용 충실도** (신규) | — | **10%** |
| 합계 | 100% | 100% |

### 10-3. DS 사용 충실도 채점 기준 (Codex 안 그대로)

평가 목적: 화면 HTML이 디자인 시스템을 단순 참조하는 수준을 넘어, **실제 렌더링 결과**와 컴포넌트 계약까지 일관되게 따르는지 평가.

| 점수 | 기준 |
|---:|---|
| 10 | 모든 화면이 DS token/component/shell 사용, 외부 sprite 없이 `file://` 아이콘 렌더링, native control은 DS 패턴으로 wrap, showcase·spec·React mapping 일치 |
| 8 | 주요 화면 일관, 경미한 showcase 누락 또는 보조 상태 누락만. file:// 렌더링 결함 없음 |
| 6 | DS 클래스 대체로 사용, 일부 화면에 bare native control / inline 재정의 / showcase 불일치. 시각 불일치 일부 체감 |
| 4 | 공통 컴포넌트 화면별 분기, native/browser 기본 UI 반복 노출. DS SSOT 신뢰도 낮음 |
| 2 | showcase와 실제 화면 구조적 분리, 아이콘/입력/상태 다수 깨짐 |
| 0 | DS 사용 근거 없음 또는 `file://` 주요 UI 미렌더링 |

### 10-4. Hard gate (Codex 안 그대로)

다음 경우 자동 적용:

- **`file://` 아이콘 미표시 2 화면 이상** → 5번째 축 **최대 4점**, 전체 verdict **최소 WARNING**
- **외부 sprite 참조** 검수 대상 화면에 잔존 → **P1**
- **bare `input[type=file]`** → **P1**
- **bare `select` / `date` / `datetime-local`** 반복 사용 → **P2 이상**
- **신규 컴포넌트가 components.css / _showcase.html / 03-components.md 중 하나라도 빠짐** → **DS SSOT 결함**

### 10-5. 검수 의무

evaluator는 정적 코드 분석만 가능 — 다음을 호출자(Claude 본체)가 보장:

- **외부 sprite 검색**: `grep "icons.svg#" wireframes/html/*.html` → 인라인 sprite 없는 화면 카운트
- **native control 검색**: `grep -E "<select|<input[^>]+type=\"(file|date|datetime)" wireframes/html/*.html`
- **showcase 매핑 확인**: `component-usage-matrix.json` 매핑 존재
- **Playwright smoke** (`.github/workflows/pr-checks.yml` `playwright-smoke` job): file:// 렌더링 + console error + svg use bbox + native appearance

evaluator는 위 정적 결과를 **채점 시 반영 의무**. 채점 결과에 명시.
