# WI-030-feat codex 리뷰 결과

codex 스레드: `019e7fd3-e4d5-7870-ae36-22e2056603ba` (Sprint 2 진입 설계 협의 → WI-030 구현 리뷰 연속).

## 1차 리뷰 — Verdict: WARNING

P0/P1 없음. DS 토큰/클래스 생성 경로 확인(tokens.css @theme + apps/web globals.css `@source` + `@flowhr/ui/styles/tokens.css`). DomainPrefixInput/FilterBar/Stepper/SettingsPane DS SSOT 정합 양호. KI-061 판단 타당.

결함:
- **P2** VerticalTabs ARIA tabs 패턴 불완전 — role=tablist/tab + aria-selected만 있고 aria-controls/tabpanel/roving tabIndex/화살표키 부재 + 모바일 aria-orientation 시각 불일치. 권장: 패널까지 관리하거나, primitive 범위 유지 시 role=tab 제거하고 nav/button list.
- **P2** DataTable 정렬 헤더 마우스 전용 — `th onClick`은 키보드 focus/activation 대상 아님 → 키보드 정렬 불가. 권장: th 내부 `<button>` + aria-sort는 정렬 컬럼에만.
- **P2** 행 클릭 키보드 접근 부재 — `tr onClick`만, focus/Enter/Space 없음. 권장: RowLink 표준 또는 tr tabIndex+keydown.
- **P3** DataTable 기본 셀 fallback 타입 과도하게 느슨(unknown→ReactNode 강제) — 객체/배열 시 런타임 위험. 권장: render 필수화 또는 primitive 제한.
- **P3** 정적 테스트가 상호작용 회귀 미검출 — onSortChange/onStepClick/onChange/onClear jsdom 최소 interaction test 권장.

## 재검증 (hotfix 7a48256 후) — Verdict: PASS

P2 3건 해소 + P3 fallback 가드 적절 + 신규 회귀 없음 확인:
- VerticalTabs: 불완전 tabs 제거 → `<nav aria-label>` + `aria-current="page"` (primitive 범위에 정확).
- DataTable 정렬: 헤더 내부 `<button>` + nextSortState 호출(키보드 활성화). aria-sort 정렬 컬럼에만.
- 행 키보드: tr onKeyDown(Enter/Space) + tabIndex=0.
- fallback: renderCell()이 nullish/object/array 차단(object-as-ReactNode 런타임 위험 해소).
- Stepper currentIndex rename — apps/web 사용처 없어 소비자 깨짐 없음. DS 클래스 SSOT 동치 유지.

→ **PASS_VERIFIED**. 잔존 차단 결함 0.
