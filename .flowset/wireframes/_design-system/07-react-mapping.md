# 07. Phase 7 React 매핑 (shadcn/ui + Tailwind)

> 와이어프레임 디자인 시스템 → `apps/web` React 코드 1:1 변환 가이드.
> 스택: Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui (PRD 03-tech-architecture).

## 1. 디자인 토큰 → tailwind.config.ts

```ts
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', '../../packages/ui/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1E40AF', hover: '#1E3A8A', bg: '#1E3A8A' },
        accent: { DEFAULT: '#3B82F6', light: '#DBEAFE' },
        bg: '#FFFFFF',
        surface: { DEFAULT: '#F9FAFB', '2': '#F3F4F6' },
        border: { DEFAULT: '#E5E7EB', light: '#F3F4F6' },
        text: { DEFAULT: '#111827', muted: '#6B7280', subtle: '#9CA3AF', 'on-primary': '#FFFFFF' },
        success: { DEFAULT: '#10B981', bg: '#D1FAE5' },
        warning: { DEFAULT: '#F59E0B', bg: '#FEF3C7' },
        danger: { DEFAULT: '#EF4444', bg: '#FEE2E2' },
        info: { DEFAULT: '#3B82F6', bg: '#DBEAFE' },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: { sm: '6px', md: '8px', lg: '12px' },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
        md: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)',
      },
      zIndex: { sticky: '10', dropdown: '100', 'modal-backdrop': '1000', modal: '1010', toast: '2000', tooltip: '3000' },
      spacing: { 'sidebar': '240px', 'header': '56px' },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

Pretendard 폰트는 `app/layout.tsx`에서 `<link>` 또는 `next/font` 로드.

## 2. 컴포넌트 → shadcn/ui

| 와이어프레임 클래스 | shadcn 컴포넌트 | 설치 |
|-------------------|---------------|------|
| `.btn`, `.btn-*` | `<Button variant="default|secondary|ghost|destructive">` | `npx shadcn add button` |
| `.input` | `<Input>` | `add input` |
| `.select` | `<Select>` | `add select` |
| `.textarea` | `<Textarea>` | `add textarea` |
| `.checkbox` | `<Checkbox>` | `add checkbox` |
| `.toggle` | `<Switch>` | `add switch` |
| `.label` | `<Label>` | `add label` |
| `.card` | `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>` | `add card` |
| `.badge` | `<Badge variant="default|secondary|destructive">` | `add badge` (variant 확장) |
| `.table` | `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>` | `add table` |
| `.tabs` / `.tab` | `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>` | `add tabs` |
| `.vert-tabs` | `<Tabs orientation="vertical">` | (위와 동일) |
| `.dropdown` | `<DropdownMenu>`, `<DropdownMenuTrigger>`, `<DropdownMenuContent>`, `<DropdownMenuItem>` | `add dropdown-menu` |
| `.modal` / `.modal-backdrop` | `<Dialog>`, `<DialogTrigger>`, `<DialogContent>`, `<DialogHeader>` | `add dialog` |
| `.toast` | sonner `<Toaster>` + `toast()` | `add sonner` |
| `[data-tooltip]` | `<Tooltip>`, `<TooltipTrigger>`, `<TooltipContent>` | `add tooltip` |
| `.popover` | `<Popover>` | `add popover` |
| `.banner.*` | `<Alert>` | `add alert` |
| `.skeleton` | `<Skeleton>` | `add skeleton` |
| `.avatar` | `<Avatar>`, `<AvatarFallback>` | `add avatar` |
| `.breadcrumb` | `<Breadcrumb>` | `add breadcrumb` |
| `.pagination` | `<Pagination>` | `add pagination` |

## 3. Custom 컴포넌트 (`packages/ui`)

shadcn에 없는 컴포넌트는 `packages/ui/src/components/`에 신규 작성:

```
packages/ui/src/components/
├── KpiCard.tsx          ← .kpi-card
├── ModuleBadge.tsx      ← .module-badge
├── StatusDot.tsx        ← .status-dot
├── FilterBar.tsx        ← .filter-bar + .filter-chip
├── FilterPanel.tsx      ← .filter-panel + .filter-group + .filter-checkbox
├── Stepper.tsx          ← .stepper + .step
├── HBar.tsx             ← .h-bar-row (사용량 바)
├── DomainPrefix.tsx     ← .domain-prefix (input + suffix)
├── SessionRow.tsx       ← .session-row (활성 세션)
├── InfoRow.tsx          ← .info-row (label-value)
├── EmptyState.tsx       ← .empty-state
└── MaintenanceBanner.tsx ← .maintenance-banner
```

## 4. Layout (AppShell)

```
apps/web/app/(operator)/layout.tsx     ← AppShell + operator 사이드바
apps/web/app/(tenant)/layout.tsx       ← AppShell + tenant 사이드바
apps/web/app/(employee)/layout.tsx     ← AppShell + employee 사이드바
apps/web/app/(auth)/layout.tsx         ← 비인증 layout (단순 헤더+푸터)

packages/ui/src/layouts/
├── AppShell.tsx         ← 사이드바 + 헤더 + 콘텐츠 + 푸터
├── Sidebar.tsx          ← 역할별 메뉴 매트릭스 (props로 role 전달)
├── GlobalHeader.tsx     ← CM-16~19 통합 (검색 + 도움말 + 종 + 프로필)
├── ProfileDropdown.tsx  ← CM-16
├── NotificationsDropdown.tsx ← CM-17
├── HelpPanel.tsx        ← CM-19
├── GlobalFooter.tsx     ← 푸터
└── MaintenanceBanner.tsx ← 점검 배너
```

## 5. 아이콘 (lucide-react)

```tsx
// packages/ui/src/icons.tsx
import {
  LayoutDashboard, Building, CreditCard, Receipt, Flag, Ticket, Scroll,
  BarChart3, Settings, Search, Bell, HelpCircle, User, Shield, LogOut,
  Plus, Pencil, Copy, Trash2, Download, Upload, Save, Send, ChevronDown,
  ChevronLeft, ChevronRight, Check, CheckCircle2, AlertCircle, X
} from 'lucide-react';

// 02-icons.md 카탈로그와 1:1 매핑
export const icons = { dashboard: LayoutDashboard, building: Building, /* ... */ };
```

기본 사이즈 16px (`size={16}`). lucide-react는 stroke-width 2 outline을 기본으로 — 와이어프레임 SVG와 동일.

## 6. 색상 클래스 사용 예 (Tailwind)

```tsx
// 와이어프레임: <span class="badge success">활성</span>
// React:
<Badge variant="success" className="bg-success-bg text-success">활성</Badge>

// 와이어프레임: <button class="btn btn-primary">신규</button>
// React:
<Button variant="default" className="bg-accent hover:bg-primary text-white">신규</Button>
```

## 7. 패턴 → 페이지 컴포넌트

| 와이어프레임 패턴 | React 페이지 |
|-----------------|------------|
| Dashboard | `app/(operator)/page.tsx` (OP-01) |
| List + Side Filter | `app/(operator)/tenants/page.tsx` (OP-02) |
| Detail + Tabs | `app/(operator)/tenants/[id]/page.tsx` (OP-03) |
| Wizard | `app/(operator)/tenants/new/page.tsx` (OP-04) |
| Settings | `app/(operator)/system-settings/page.tsx` (OP-11) |
| Master-Detail | `app/(operator)/tickets/page.tsx` (OP-08) |

## 8. i18n (next-intl) 매핑

08-i18n.md §8 Phase 7 React 변환 참조. 요약:

```
packages/i18n/                    ← 신규 패키지
├── messages/{ko,en}/
│   ├── components.json
│   ├── system.json
│   ├── enums.json
│   ├── notifications.json
│   └── screens/{op-01,...}.json
└── src/
    ├── config.ts (next-intl)
    ├── locale-detection.ts (Accept-Language 매칭)
    └── format.ts (날짜·통화)

apps/web/i18n/request.ts          ← next-intl getRequestConfig
apps/web/app/[locale]/layout.tsx  ← <NextIntlClientProvider>
```

설치: `npx shadcn add` 외 추가 — `pnpm add next-intl@3` (PRD 03-tech-architecture L23 확정).

각 페이지 컴포넌트:
```tsx
'use client';
import { useTranslations } from 'next-intl';

export default function OperatorDashboard() {
  const t = useTranslations('screens.op-01');
  return <h1>{t('title')}</h1>;
}
```

알림 발송 (CM-15):
```ts
// 수신자 locale별 본문 + 채널 분기 (ko: 카카오 → SMS → 이메일 / en: SMS → 이메일)
import { getTranslations } from 'next-intl/server';
const t = await getTranslations({ locale: user.locale, namespace: 'notifications' });
const body = t('approval.pending', { count: 3 });
```

## 9. 검증 체크리스트

Phase 7 진입 시 본 매핑 가이드를 그대로 따랐는지:
- [ ] tailwind.config.ts 토큰이 _design-system/01-tokens.md와 1:1 일치
- [ ] shadcn/ui 컴포넌트 설치 + variant 매핑 완료
- [ ] custom 컴포넌트(`packages/ui/src/components/`)가 _design-system/03-components.md "shadcn/ui 없음" 항목과 1:1 일치
- [ ] AppShell + 글로벌 컴포넌트가 _design-system/05-layouts.md spec과 일치
- [ ] 사이드바 메뉴 매트릭스가 09-routing.md §6-2와 일치
- [ ] CM-16 드롭다운 메뉴가 common.md CM-16 표 + 05-layouts.md 매트릭스와 일치
- [ ] icon 카탈로그(_design-system/02-icons.md)와 lucide-react import가 일치
- [ ] next-intl 설치 + `packages/i18n/` 패키지 + `messages/{ko,en}/` 키 set 1:1 일치 (08-i18n.md §8-4 검증)
- [ ] 모든 사용자 텍스트 i18n 키로 추출 (하드코딩 0건)
- [ ] CM-16 프로필 드롭다운 "언어/Language" 메뉴 + 즉시 전환 + cookie 저장 + reload

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-16 | 초안 — Tailwind config + shadcn/ui 매핑 + custom 컴포넌트 + AppShell 구조 + 검증 체크리스트 | KI-037 |
| 2026-05-16 | §8 next-intl 매핑 + i18n 검증 체크리스트 추가 | 사용자 결정 batch-005 |
