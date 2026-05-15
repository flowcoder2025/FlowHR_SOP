# 공통 스타일 프롬프트

> 모든 36 화면 프롬프트가 이 파일을 prefix로 사용. Codex 호출 시 결합.

```text
Create a single full-screen desktop web app UI screenshot for a Korean HR SaaS product called "FlowHR".

Do not create a collage, montage, grid, overview board, or multiple screens.
Only one individual screen must be shown.

Style:
- Clean modern B2B SaaS dashboard (visual reference: Linear, Vercel, Notion enterprise dashboard)
- Korean language UI text (Pretendard font, light weight for body, semibold for headings)
- White background (#FFFFFF)
- Navy left sidebar (#1E3A8A) with white text and subtle dividers
- Blue accent color (#3B82F6) for primary CTA buttons and active menu state
- Surface color #F9FAFB for cards and panels
- Border color #E5E7EB for separators
- Rounded cards (border-radius: 12px), subtle shadow (shadow-sm)
- Dense but readable enterprise dashboard layout (16px base padding, 24px card padding)
- Realistic web application screenshot (NOT a UI kit, NOT an infographic, NOT a presentation slide)
- 16:9 aspect ratio, 1440x900 viewport
- High resolution, sharp anti-aliased text
- No purple/pink gradients, no glowing effects, no AI-stock aesthetic

Layout:
- Left sidebar (240px wide, full height) — Navy background, white text
  - Top: "FlowHR" logo (white, bold)
  - Menu items with Lucide-style icons (16px)
  - Active menu item: blue accent left border (4px) + light tint background
- Top header (56px) — White bg, bottom border
  - Left: page title (semibold, 18px)
  - Center: search input (placeholder: "검색...")
  - Right: notification bell with badge + user avatar (circle, 32px)
- Main content area (rest of viewport, 24px padding)
  - Cards, tables, filters, charts, or forms depending on screen

Korean UI conventions:
- Buttons: verb form (저장 / 등록 / 승인 / 반려 / 다운로드)
- Status badges: pill shape, padding 2px 8px, semibold 12px text
  - Success (정상/승인 완료/활성/재직): green #10B981 bg
  - Info (진행중/대기/수습): blue #3B82F6 bg
  - Warning (지각/미열람/만료예정): amber #F59E0B bg
  - Danger (결근/반려/비활성/퇴사/만료): red #EF4444 bg
  - Muted (휴가/휴직/보관): gray #6B7280 bg
- Table headers: gray surface bg, semibold text
- Realistic Korean business data: 회사명 (예: "(주)테스트컴퍼니"), 직원명 (한글 이름), 부서명, 사번 (예: "EMP-2024-001"), 금액 (₩ + 천 단위 콤마)

Avoid (anti-patterns):
- Multiple screens or collage
- Concept board or moodboard
- Random unrelated HR widgets
- English-only text (all body text must be Korean)
- Generic stock UI elements
- Purple/blue gradients with white card overlays (typical AI dashboard slop)
```

## 모바일(PWA) 변형용 추가 지시

PWA 화면은 위 prefix 뒤에 다음을 덧붙임:

```text
[MOBILE OVERRIDE]
- 9:16 aspect ratio, 390x844 viewport (iPhone 14 Pro standard)
- No left sidebar — replace with top header (56px) + bottom tab bar (60px, 5 tabs)
- Bottom tab bar: 홈 / 출퇴근 / 휴가 / 알림 / 내 정보 (each with icon)
- Tap-friendly: minimum 44x44px tap targets
- Single column content stack, no horizontal scroll
```

## Tauri Desktop 변형용 추가 지시

```text
[TAURI DESKTOP OVERRIDE]
- macOS-style title bar at top (window controls left, draggable region)
- Or Windows-style title bar (window controls right)
- Optional: subtle window shadow around the entire screenshot
- Same 1440x900 content area as Web
```
