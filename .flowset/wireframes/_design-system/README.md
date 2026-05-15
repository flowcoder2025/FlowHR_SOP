# FlowHR 디자인 시스템 (SSOT)

> **단일 진실 출처 (Single Source of Truth)**. 모든 와이어프레임·React 컴포넌트가 본 시스템을 참조한다.
> 변경은 본 디렉토리에서만. 화면별 인라인 정의 절대 금지.

## 폴더 구조

```
_design-system/
├── README.md                  ← 본 문서 (인덱스 + 사용 규칙)
├── 01-tokens.md               ← 디자인 토큰 spec (색/타이포/간격/반경/그림자)
├── 02-icons.md                ← 아이콘 카탈로그 (Lucide outline 매핑)
├── 03-components.md           ← 컴포넌트 라이브러리 spec (Button/Input/Table/...)
├── 04-patterns.md             ← 페이지 패턴 (Dashboard/List/Detail/Wizard/Settings)
├── 05-layouts.md              ← AppShell + 글로벌 헤더/사이드바/푸터/배너
├── 06-states.md               ← Empty/Loading/Error/Success 상태 패턴
├── 07-react-mapping.md        ← Phase 7 React (shadcn/ui + Tailwind) 1:1 매핑
├── 08-i18n.md                 ← i18n (ko + en MVP) 정책 + 키 catalog + next-intl 매핑
├── tokens.css                 ← 모든 디자인 토큰 (CSS 변수 — 단일 source)
├── components.css             ← 모든 컴포넌트 CSS (단일 source)
├── icons.svg                  ← 모든 아이콘 SVG sprite (외부 참조)
└── _layout-shell.html         ← AppShell HTML 템플릿 (사이드바+헤더+콘텐츠+푸터)
```

## 사용 규칙 (의무)

### 1. 화면 HTML 작성 시
```html
<link rel="stylesheet" href="../_design-system/tokens.css">
<link rel="stylesheet" href="../_design-system/components.css">
<!-- 콘텐츠 안에서 -->
<svg class="ico"><use href="../_design-system/icons.svg#i-dashboard"/></svg>
```

**금지**:
- 화면 HTML 안에 `<style>` 태그로 컴포넌트 CSS 정의 (페이지 고유 보강은 OK, 컴포넌트 재정의 금지)
- 화면 HTML 안에 SVG sprite 인라인 복사 (icons.svg 참조만)
- 디자인 토큰 값 하드코딩 (`#3B82F6` 대신 `var(--color-accent)`)

**예외 허용**:
- 페이지 고유 grid layout (예: OP-10의 `.kpi-row { grid-template-columns: repeat(6, 1fr) }`)
- 페이지 고유 강조 (예: 특정 카드의 inline style)

### 2. 글로벌 컴포넌트 (헤더/사이드바/푸터)
- `_layout-shell.html` 구조를 그대로 복사 + 페이지별 active 메뉴 / 페이지 타이틀 / 콘텐츠만 변경
- CM-16 프로필 드롭다운, CM-17 알림 종, CM-18 검색바, CM-19 도움말 — **모든 인증 화면 의무 포함**
- 푸터 4 링크 + 버전 — **모든 인증 화면 의무 포함**

### 3. 신규 컴포넌트 추가 시
1. 본 디렉토리 `03-components.md`에 spec 추가
2. `components.css`에 CSS 추가
3. `_showcase.html`에 시연 추가
4. **그 다음에** 화면 HTML에서 사용

### 4. Phase 7 React 변환
- 본 디자인 시스템 → `packages/ui` 1:1 매핑 (`07-react-mapping.md` 참조)
- shadcn/ui + Tailwind config (tokens → tailwind.config.ts)
- 와이어프레임 컴포넌트와 React 컴포넌트는 1:1 대응 — 누락/추가 금지

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-16 | 초안 — 디자인 시스템 SSOT 구축 | KI-037 batch-004 (사용자 지적) |
| 2026-05-16 | 08-i18n.md 추가 (ko + en MVP 정책 + 키 catalog) | 사용자 결정 batch-005 |
