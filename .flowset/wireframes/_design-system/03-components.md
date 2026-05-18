# 03. 컴포넌트 라이브러리

> **단일 source**: `components.css` (CSS 정의) + 본 문서 (Props/Variant/Anatomy 명세).
> **원칙**: 모든 컴포넌트는 Props로 변수화. 텍스트·아이콘·variant·size 등은 prop으로 주입. 동일 컴포넌트의 다른 인스턴스를 별도 컴포넌트로 만들지 않는다.
> 시연: `_showcase.html`. Phase 7 React 매핑: `07-react-mapping.md`.

## 카탈로그 (요약 — 상세는 §컴포넌트 명세)

| 카테고리 | 컴포넌트 | 클래스 | shadcn/ui | Props 핵심 |
|---------|---------|--------|----------|-----------|
| 액션 | Button | `.btn` | `<Button>` | label, variant, size, leadingIcon, trailingIcon, disabled |
| 액션 | IconButton | `.icon-btn` | `<Button size="icon">` | icon, ariaLabel, badge, disabled |
| 입력 | Input | `.input` | `<Input>` | type, value, placeholder, disabled, error |
| 입력 | Select | `.select` | `<Select>` | options, value, placeholder, disabled |
| 입력 | Textarea | `.textarea` | `<Textarea>` | value, placeholder, rows, disabled |
| 입력 | Checkbox | `.checkbox` | `<Checkbox>` | checked, label, disabled |
| 입력 | Toggle | `.toggle` | `<Switch>` | checked, label, disabled |
| 입력 | DomainPrefixInput | `.domain-prefix` | (custom) | value, suffix, disabled |
| 컨테이너 | Card | `.card` | `<Card>` | title?, subtitle?, children |
| 컨테이너 | KpiCard | `.kpi-card` | (custom) | label, icon, value, unit?, delta?, sub?, variant |
| 데이터 | Table | `.table` | `<Table>` | columns, rows, sortBy, onRowClick, rowVariant |
| 데이터 | Pagination | `.pagination` | `<Pagination>` | total, page, pageSize, onChange |
| 디스플레이 | Badge | `.badge` | `<Badge>` | label, variant, icon? |
| 디스플레이 | Avatar | `.avatar` | `<Avatar>` | initials \| src, size, alt |
| 디스플레이 | StatusDot | `.status-dot` | (custom) | variant |
| 디스플레이 | ModuleBadge | `.module-badge` | `<Badge variant="outline">` | label |
| 디스플레이 | **Logo (운영사)** | `.logo` | (custom) | brandName, logoUrl?, size, dark? |
| 디스플레이 | **TenantLogo** | `.tenant-logo` | (custom) | tenantName, logoUrl?, size |
| 네비 | Tabs | `.tabs` | `<Tabs>` | items, activeKey, onChange |
| 네비 | VertTabs | `.vert-tabs` | `<Tabs orientation="vertical">` | items, activeKey, onChange |
| 네비 | Breadcrumb | `.breadcrumb` | `<Breadcrumb>` | items |
| 필터 | FilterChip | `.filter-chip` | (custom) | label, icon?, active, onClick |
| 필터 | FilterBar | `.filter-bar` | (custom) | chips |
| 필터 | FilterPanel | `.filter-panel` | (custom) | groups, onApply, onClear |
| 오버레이 | Dropdown | `.dropdown` | `<DropdownMenu>` | trigger, items, header? |
| 오버레이 | Modal | `.modal` | `<Dialog>` | title, body, footer, onClose |
| 오버레이 | Toast | `.toast` | sonner | message, variant, duration |
| 오버레이 | Tooltip | `[data-tooltip]` | `<Tooltip>` | content |
| 메시지 | Banner | `.banner` | `<Alert>` | title?, description, variant, icon? |
| 메시지 | EmptyState | `.empty-state` | (custom) | icon, title, description, action? |
| 마법사 | Stepper | `.stepper` | (custom) | steps, currentIndex |
| 차트 | LineChart / BarChart / DonutChart / HBar | `.chart-*` / `.h-bar-*` | recharts | data, ... |
| 폼 | FormRow | `.form-row` | (custom) | label, children, required, help, error |
| 폼 | FormSection | `.form-section` | `<Card>` | title, description, children, actions |

---

## 컴포넌트 명세 (Anatomy + Props + Variant)

### Button

**Anatomy**
```
┌──────────────────────────────────┐
│  [leading-icon]  [label]  [trailing-icon]  │  ← gap 6px (md), height 36px (md)
└──────────────────────────────────┘
   ↑ padding-left 14px              padding-right 14px ↑
```

**Props**
```ts
type ButtonProps = {
  label: string;                                          // 버튼 텍스트
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; // default: 'secondary'
  size?: 'sm' | 'md' | 'lg';                              // default: 'md'
  leadingIcon?: IconId;                                   // 좌측 아이콘
  trailingIcon?: IconId;                                  // 우측 아이콘 (chevron-down 등)
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}
```

**Variant × Size matrix (정확 수치)**

| Variant \ Size | sm (height 30) | md (height 36) | lg (height 44) |
|----------------|---------------:|---------------:|---------------:|
| primary | padding 0 10, font 12, gap 4, ico 14 | padding 0 14, font 13, gap 6, ico 16 | padding 0 20, font 14, gap 8, ico 18 |
| secondary | (동일) | (동일) | (동일) |
| ghost | (동일) | (동일) | (동일) |
| danger | (동일) | (동일) | (동일) |

**State**: default / hover / active / disabled / focus

**HTML 사용**
```html
<!-- 단일 Button 컴포넌트, label/icon/variant만 변경 -->
<button class="btn btn-primary">
  <svg class="ico" width="16" height="16"><use href="#i-plus"/></svg>
  신규 등록
</button>

<button class="btn btn-secondary btn-sm">
  <svg class="ico ico-sm" width="14" height="14"><use href="#i-download"/></svg>
  내보내기
</button>

<!-- icon-only -->
<button class="btn btn-ghost btn-icon-only" aria-label="더 보기">
  <svg class="ico" width="16" height="16"><use href="#i-more"/></svg>
</button>
```

**SVG 정렬 의무**: `<svg>`에 `width`/`height` attribute 필수 (CSS만으로는 일부 브라우저에서 native viewBox로 그려지는 문제 방지). components.css의 `.btn > svg` 룰이 추가 강제.

---

### IconButton

**Anatomy**: 정사각형 버튼, 내부 아이콘 18px (md). 배지(badge-dot)는 컨테이너 우상단 외부.

```
┌──────┐ ← 36×36 컨테이너
│  ●3  │← 배지 우상단 외부 (-4, -4), border 2px (배경과 분리)
│ icon │← 아이콘 18×18 가운데
└──────┘
```

**Props**
```ts
type IconButtonProps = {
  icon: IconId;
  ariaLabel: string;       // 접근성 의무
  variant?: 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  badge?: number | string; // 우상단 배지 (CM-17 종 알림 등). 텍스트 길이 따라 자동 폭 (min 12px)
  tooltip?: string;
  disabled?: boolean;
  onClick?: () => void;
}
```

**아이콘 사이즈 (컴포넌트 강제, components.css 자손 셀렉터)**
- md (default): 18px (배지와 안 겹치도록 20 → 18로 축소, 2026-05-16 수정)
- sm: 14px
- lg: 22px

**배지 spec (badge-dot) — 좌측 anchor 고정 (시각 균형 우선)**
- 위치: `top: -4px; left: 24px; right: auto` → 배지 좌측이 항상 동일 위치 (단일/복수 글자 무관)
- 효과: "3"의 위치 = "99+"의 첫 9 위치. 두 배지 모두 동일 좌측 anchor → 시각 균형
- 우측은 가변: "3" → 컨테이너 안, "99+" → 컨테이너 외부로 ~14px 확장
- 사이즈: min-width 16, height 16 (텍스트 길이 따라 우측 확장)
- border: 2px solid var(--color-bg) (배경과 시각 분리)
- box-sizing: border-box (border 포함 사이즈)
- 정렬: 종 18px (9,9)~(27,27) 우측 27. 배지 좌측 24 → 종 우상단 3px 가림 (종 본체 보임)
- 검증: "3" / "99" / "99+" 모두 첫 글자 좌측 동일 + 종 본체 보임 (사용자 결정 2026-05-16)

**인접 컴포넌트 최소 gap 의무 (사용자 결정 2026-05-16)**
- 배지가 컨테이너 외부로 ~14px 확장 → 인접 IconButton/컴포넌트와 충돌 가능
- IconButton들이 가로로 나열될 때 부모 컨테이너 `gap ≥ 16px` 의무 (`.header-actions { gap: 16px }`)
- gap 16 미만이면 배지 99+가 다음 IconButton 영역 침범
- showcase / 모든 화면 HTML / Phase 7 React에서 동일 의무 적용

**HTML**
```html
<!-- 헤더 알림 종 (CM-17) -->
<button class="icon-btn" data-tooltip="알림 (3건 미읽음)" aria-label="알림 (3건 미읽음)">
  <svg class="ico" width="18" height="18"><use href="#i-bell"/></svg>
  <span class="badge-dot">3</span>
</button>

<!-- 헤더 도움말 (CM-19, 배지 없음) -->
<button class="icon-btn" data-tooltip="도움말" aria-label="도움말">
  <svg class="ico" width="18" height="18"><use href="#i-help"/></svg>
</button>
```

---

### Input

**Anatomy**
```
┌────────────────────────────────────┐
│  placeholder / value               │  height 40 (default), 30 (sm)
└────────────────────────────────────┘
   ↑ padding 0 12                     ↑
```

**Props**
```ts
type InputProps = {
  value?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date';
  size?: 'sm' | 'md';
  disabled?: boolean;
  error?: string;          // 표시되면 input-error 추가
  success?: string;        // 표시되면 input-success 추가
  help?: string;           // input-help 추가
  prefix?: string;         // 좌측 고정 텍스트 (DomainPrefix)
  suffix?: string;         // 우측 고정 텍스트
}
```

**FormRow와 함께 사용**
```html
<div class="form-row">
  <label class="label label-required">사업자번호</label>
  <div>
    <input class="input" placeholder="123-45-67890" />
    <div class="input-error">
      <svg class="ico ico-sm" width="14" height="14"><use href="#i-alert-c"/></svg>
      형식이 올바르지 않습니다
    </div>
  </div>
</div>
```

---

### Select

```ts
type SelectProps = {
  options: Array<{value: string; label: string; disabled?: boolean}>;
  value?: string;
  placeholder?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}
```

---

### Toggle (Switch)

**Anatomy**: 36×20 트랙 + 16×16 동그라미 슬라이더.

```ts
type ToggleProps = {
  checked: boolean;
  label?: string;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}
```

```html
<label class="toggle">
  <input type="checkbox" checked>
  <span class="toggle-slider"></span>
</label>
```

---

### Logo (운영사) / TenantLogo (고객사)

**Anatomy** — 이미지 + 텍스트(옵션) 또는 fallback (이미지 없을 때 initials 박스).

```
┌─────────────────────┐
│ [img]  [brand text] │  md (default, height 32)
└─────────────────────┘
```

**Props (Logo — 운영사)**
```ts
type LogoProps = {
  brandName: string;          // 'FlowHR' (system_settings.brand_name)
  logoUrl?: string;           // system_settings.brand_logo_url (없으면 initials fallback)
  logoUrlDark?: string;       // 사이드바(다크 배경)용 — system_settings.brand_logo_url_dark
  size?: 'sm' | 'md' | 'lg';  // sm 24h / md 32h / lg 48h
  context?: 'header' | 'sidebar' | 'login' | 'email';  // 다크 vs 라이트 배경 자동 선택
  showText?: boolean;         // 사이드바는 logo+text, 사이즈 작은 헤더는 logo only
}
```

**Props (TenantLogo — 고객사)**
```ts
type TenantLogoProps = {
  tenantName: string;
  logoUrl?: string;           // tenants.logo_url (없으면 initials fallback)
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}
```

**사용처 매트릭스**
| 위치 | 컴포넌트 | size | showText | 사용 시점 |
|------|---------|------|----------|----------|
| 운영사 사이드바 좌상단 | `<Logo context="sidebar">` | md | ✓ | 모든 OP-* 화면 |
| 테넌트 사이드바 좌상단 | `<TenantLogo>` | md | ✓ | 모든 TA-* + EM-* 화면 (테넌트별 로고) |
| 로그인 화면 | `<Logo context="login">` | lg | ✓ | CM-01 |
| OP-03 테넌트 상세 헤더 | `<TenantLogo>` | lg | ✓ | OP-03 (해당 테넌트 로고) |
| 이메일 발신 | `<Logo context="email">` | md | ✓ | CM-15 이메일 템플릿 |
| 결재 메일 | `<TenantLogo>` | md | — | 결재 알림 (테넌트 로고) |
| 급여명세서 PDF | `<TenantLogo>` | lg | ✓ | EM-06 / TA-10 PDF |
| 푸터 | (텍스트만) | — | — | © 2026 FlowHR (Logo 컴포넌트 미사용) |

**HTML — 자체 완성 클래스**
```html
<!-- 운영사 (이미지 + 텍스트) -->
<div class="logo">
  <img src="[brand_logo_url]" alt="[brand]" class="logo-img">
  <span class="logo-text">[brand]</span>
</div>

<!-- fallback (이미지 없을 때) -->
<div class="logo">
  <div class="logo-fallback">[F]</div>
  <span class="logo-text">[brand]</span>
</div>

<!-- 사이드바 (다크) -->
<nav class="sidebar">
  <div class="logo">
    <img src="[brand_logo_url_dark]" alt="[brand]" class="logo-img">
    <span class="logo-text">[brand]</span>
  </div>
  ...
</nav>

<!-- 테넌트 (큰 사이즈, OP-03 헤더) -->
<div class="tenant-logo tenant-logo-lg">
  <img src="[tenant.logo_url]" alt="[tenant.name]" class="tenant-logo-img">
  <span class="tenant-logo-text">[tenant.name]</span>
</div>
```

**DB 매핑**
- 운영사: `system_settings.brand_name` / `.brand_logo_url` / `.brand_logo_url_dark` (db/erd.md §운영사 도메인)
- 테넌트: `tenants.logo_url` (이미 존재) — OP-04 마법사에서 업로드 또는 OP-03/TA-13에서 변경

---

### Avatar

**Anatomy**: 원형 컨테이너 + 텍스트(initials) 또는 이미지.

```
 ╭──╮      ╭────╮      ╭──────────╮
 │AB│  sm  │ AB │  md  │    AB    │  lg
 ╰──╯      ╰────╯      ╰──────────╯
 24×24     32×32       80×80
```

**Props**
```ts
type AvatarProps = {
  initials?: string;        // 1-2자 (예: "김", "JD")
  src?: string;              // 이미지 URL (있으면 initials 무시)
  alt?: string;              // 이미지 alt
  size?: 'sm' | 'md' | 'lg'; // default 'md'
}
```

**사이즈 매트릭스 (정확 수치)**
| size | 컨테이너 | font-size | font-weight |
|------|----------|----------|------------|
| sm | 24×24 | 11px | 600 |
| md (default) | 32×32 | 13px | 600 |
| lg | 80×80 | 28px | 700 |

**HTML — 자체 완성 클래스 (단독 사용 가능)**
```html
<div class="avatar">[I]</div>          <!-- 32px -->
<div class="avatar-sm">[I]</div>       <!-- 24px -->
<div class="avatar-lg">[I]</div>       <!-- 80px -->
```

**원칙**: `.avatar-sm` / `.avatar-lg`는 `.avatar` 확장이 아닌 **자체 완성 클래스** — background/color/border-radius/flex 정렬을 모두 자체 정의 (단독 사용 시 깨짐 방지, 2026-05-16 수정).

---

### Badge

**Anatomy**
```
┌────────────────────┐
│ [icon?] [label]    │  padding 2 8, font 12, line-height 18
└────────────────────┘
```

**Props**
```ts
type BadgeProps = {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'muted';  // default: 'muted'
  icon?: IconId;
}
```

**Variant 사용처 (db/enums.md §색상 매핑과 정합)**
| variant | 의미 | enum 예시 |
|---------|------|---------|
| success | 정상/완료 | active, paid, approved, success |
| warning | 주의 | overdue, expiring_soon, waiting_user |
| danger | 위험/실패 | rejected, denied, failed, expired |
| info | 진행 | pending, in_progress, beta, scheduled |
| muted | 중립 | cancelled, archived, draft |

```html
<span class="badge success">활성</span>
<span class="badge warning"><svg class="ico" width="12" height="12"><use href="#i-alert-c"/></svg>SLA 임박</span>
```

---

### KpiCard

**Anatomy**
```
┌─────────────────────────────┐
│ [icon] label                │  ← .kpi-label
│                             │
│ value [unit?]               │  ← .kpi-value (28px / 22px sm)
│                             │
│ [↑] +delta (period?)        │  ← .kpi-delta (선택)
│ sub text                    │  ← .kpi-sub (선택, delta와 택1)
└─────────────────────────────┘
```

**Props**
```ts
type KpiCardProps = {
  label: string;
  icon?: IconId;
  value: string | number;            // 포맷팅 후 문자열 권장 (₩3,117,500)
  unit?: string;                     // "명", "건", "%"
  delta?: {
    direction: 'up' | 'down';
    value: string;                   // "+₩205,000"
    note?: string;                   // "(전월 대비)"
  };
  sub?: string;                      // delta 대신 보조 텍스트
  variant?: 'default' | 'warning';   // 미수금 카드 같은 강조
  size?: 'md' | 'sm';                // sm: value 22px (OP-10 6열용)
}
```

```html
<div class="kpi-card">
  <div class="kpi-label">
    <svg class="ico" width="16" height="16"><use href="#i-trending-up"/></svg>
    MRR
  </div>
  <div class="kpi-value">₩3,117,500</div>
  <div class="kpi-delta up">
    <svg class="ico" width="12" height="12"><use href="#i-arrow-up"/></svg>
    +₩205,000
  </div>
</div>
```

---

### FilterChip + FilterBar

**FilterChip Anatomy**
```
┌──────────────────────────┐
│ [icon?] label [chevron?] │  height 28, padding 6 12
└──────────────────────────┘
```

**Props**
```ts
type FilterChipProps = {
  label: string;
  icon?: IconId;
  active?: boolean;
  hasDropdown?: boolean;   // chevron-down 표시
  onClick?: () => void;
}

type FilterBarProps = {
  chips: FilterChipProps[];
  // 또는 자유 children 패턴 — divider, 라벨 등
}
```

```html
<div class="filter-bar">
  <span style="font-size:12px;color:var(--color-text-muted);align-self:center;">필터</span>
  <button class="filter-chip is-active">
    <svg class="ico" width="12" height="12"><use href="#i-calendar-days"/></svg>
    이번달
    <svg class="ico" width="12" height="12"><use href="#i-chevron-down"/></svg>
  </button>
  <button class="filter-chip">전체 요금제</button>
</div>
```

---

### FilterPanel (사이드)

**Anatomy**
```
┌──────────────────────────┐
│ 필터          초기화     │
│ ──────────────────────   │
│ ▼ 상태                   │
│   ☑ 활성    42           │
│   ☐ 비활성   5           │
│ ▼ 요금제                 │
│   ☐ 기본                 │
│   ...                    │
│                          │
│ [           적용       ] │
└──────────────────────────┘
```

```ts
type FilterPanelProps = {
  groups: Array<{
    key: string;
    title: string;
    type: 'checkbox' | 'radio' | 'date-range' | 'select';
    options?: Array<{value: string; label: string; count?: number}>;
  }>;
  values: Record<string, string[]>;
  onChange: (values: Record<string, string[]>) => void;
  onApply: () => void;
  onClear: () => void;
}
```

---

### Tabs (수평) / VertTabs (수직)

**Anatomy (수평)**
```
─ tab1 ─ tab2 ─ [active tab3] ─ tab4 ─
                ─────────────  ← border-bottom 2px var(--color-accent)
```

```ts
type TabsProps = {
  items: Array<{key: string; label: string; icon?: IconId; disabled?: boolean}>;
  activeKey: string;
  onChange?: (key: string) => void;
  variant?: 'horizontal' | 'vertical';
}
```

```html
<div class="tabs">
  <button class="tab is-active">기본정보</button>
  <button class="tab">사용자 / 조직</button>
  <button class="tab">구독</button>
</div>
```

---

### Dropdown (CM-16 프로필 등)

**Anatomy**
```
┌──────────────────────────┐
│ ┌──────────────────────┐ │  ← .dropdown-header (선택)
│ │ name                 │ │
│ │ meta                 │ │
│ └──────────────────────┘ │
│ [icon] item              │  ← .dropdown-item
│ [icon] item              │
│ ───────                  │  ← .dropdown-divider
│ [icon] danger item       │  ← .dropdown-item.danger
└──────────────────────────┘
```

```ts
type DropdownProps = {
  trigger: ReactNode;        // 드롭다운 여는 버튼/아바타
  header?: {
    name: string;
    meta?: string;
  };
  items: Array<{
    key: string;
    label: string;
    icon?: IconId;
    variant?: 'default' | 'danger';
    disabled?: boolean;
    onClick?: () => void;
    href?: string;
  }>;
  align?: 'left' | 'right';   // 트리거 기준 정렬
  width?: number;             // default 220
}
```

```html
<!-- CM-16 프로필 드롭다운 (모든 인증 화면 동일 구조) -->
<div class="dropdown dropdown-right-0" style="width:280px;">
  <div class="dropdown-header">
    <div class="dropdown-name">[사용자명]</div>
    <div class="dropdown-meta">[role] · [회사명]</div>
  </div>
  <a class="dropdown-item"><svg class="ico" width="16" height="16"><use href="#i-user"/></svg>내 프로필</a>
  <a class="dropdown-item"><svg class="ico" width="16" height="16"><use href="#i-shield"/></svg>보안 설정</a>
  <a class="dropdown-item"><svg class="ico" width="16" height="16"><use href="#i-bell"/></svg>알림 설정</a>
  <a class="dropdown-item"><svg class="ico" width="16" height="16"><use href="#i-help"/></svg>도움말</a>
  <div class="dropdown-divider"></div>
  <a class="dropdown-item danger"><svg class="ico" width="16" height="16"><use href="#i-logout"/></svg>로그아웃</a>
</div>
```

---

### Modal

**Anatomy**
```
┌──────────────────────────────┐
│ title              [×]       │  ← .modal-header
├──────────────────────────────┤
│                              │
│ body                         │  ← .modal-body
│                              │
├──────────────────────────────┤
│        [Cancel] [Confirm]    │  ← .modal-footer
└──────────────────────────────┘
```

```ts
type ModalProps = {
  title: string;
  body: ReactNode;
  footer?: {
    primaryLabel: string;
    primaryVariant?: 'primary' | 'danger';
    secondaryLabel?: string;
    onPrimary: () => void;
    onSecondary?: () => void;
  };
  size?: 'sm' | 'md' | 'lg';   // max-width 480 / 600 / 800
  onClose: () => void;
}
```

---

### Toast

```ts
type ToastProps = {
  message: string;
  variant: 'success' | 'warning' | 'danger' | 'info';
  duration?: number;          // ms, default 3000
  action?: { label: string; onClick: () => void };
}
```

---

### Banner / Alert

**Anatomy**
```
┌─────────────────────────────────────────┐
│ [icon]  [title]                         │
│         description text                │  ← .banner-content
└─────────────────────────────────────────┘
```

```ts
type BannerProps = {
  title?: string;
  description: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  icon?: IconId;       // 자동: variant별 default (info→i-info, warning→i-alert-c, danger→i-alert-t, success→i-check-circle)
  dismissable?: boolean;
}
```

---

### Stepper (마법사)

```ts
type StepperProps = {
  steps: Array<{
    title: string;
    summary?: string;     // 완료된 단계 요약 (예: "(주)치킨매니아")
  }>;
  currentIndex: number;   // 0-based
}
```

각 단계 상태:
- `index < currentIndex`: done (체크 아이콘 + 초록)
- `index === currentIndex`: active (번호 + 파랑)
- `index > currentIndex`: pending (번호 + 회색)

---

### Table

```ts
type TableProps<T> = {
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (row: T) => ReactNode;
  }>;
  rows: T[];
  rowVariant?: (row: T) => 'default' | 'highlight-warning' | 'highlight-danger';
  onRowClick?: (row: T) => void;
  rowAction?: (row: T) => DropdownItem[];   // 점 3개 메뉴
  sortBy?: { key: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort) => void;
  emptyState?: EmptyStateProps;
}
```

---

### Pagination

```ts
type PaginationProps = {
  total: number;
  page: number;            // 1-based
  pageSize: number;
  pageSizeOptions?: number[];   // [20, 50, 100]
  onChange: (page: number, pageSize: number) => void;
}
```

---

### EmptyState

**Anatomy** (모든 자식 가운데 정렬)
```
┌─────────────────────────────┐
│                             │
│            [icon]           │  ← 48x48, opacity 0.4 (.ico-empty)
│                             │
│         [title]             │  ← 14px / 600
│      [description]          │  ← 13px / muted
│                             │
│        [CTA button]         │  ← 선택, primary or secondary
│                             │
└─────────────────────────────┘
   text-align: center +
   display: flex; flex-direction: column; align-items: center
   (block svg를 정렬하기 위해 flex 의무, 2026-05-16 수정)
```

```ts
type EmptyStateProps = {
  icon: IconId;
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: IconId;
    variant?: 'primary' | 'secondary';
    onClick: () => void;
  };
  variant?: 'default' | 'error';
}
```

---

### FormRow / FormSection

**FormRow Anatomy** (label-input 좌우 배치)
```
┌──────────────┬──────────────────────────┐
│ Label *      │ [input]                  │  ← grid-template-columns: 200px 1fr
│              │ help text                │
└──────────────┴──────────────────────────┘
```

```ts
type FormRowProps = {
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;     // input/select/...
  layout?: 'inline' | 'stacked';  // stacked: label 위, input 아래
}

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;    // form-actions 영역 (이전/다음 등)
}
```

---

### Modal (Dialog Overlay)

**Anatomy**
```
[modal-overlay (배경 + flex 중앙 정렬)]
  └─ [modal-box (.modal-box-sm/md/lg/xl)]
        ├─ [modal-header — title + close]
        ├─ [modal-body]
        └─ [modal-footer — actions]
```

**Variant**
| Variant | 클래스 | maxWidth |
|---------|--------|----------|
| sm      | `.modal-box .modal-box-sm` | 360px |
| md      | `.modal-box .modal-box-md` | 480px |
| lg      | `.modal-box .modal-box-lg` | 560px |
| xl      | `.modal-box .modal-box-xl` | 720px |

**Code (HTML)**
```html
<div class="modal-overlay is-open" role="dialog" aria-modal="true" aria-labelledby="mt1">
  <div class="modal-box modal-box-md">
    <div class="modal-header"><h3 id="mt1">제목</h3></div>
    <div class="modal-body">본문</div>
    <div class="modal-footer"><button class="btn btn-ghost">취소</button><button class="btn btn-primary">확인</button></div>
  </div>
</div>
```

**Props (React)**
```ts
interface ModalProps {
  open: boolean; onClose: () => void;
  title: string; body: ReactNode; footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

---

### Switch (Toggle)

**Anatomy**: `.switch` (38×22 pill 배경) + `::after` (18×18 thumb, transition: left 0.15s).

**Variant**
| 상태 | 클래스 |
|------|--------|
| off  | `.switch` |
| on   | `.switch.is-on` (배경 색=accent, thumb left=18px) |

**Code**
```html
<div class="switch is-on" role="switch" aria-checked="true" tabindex="0"></div>
```

**Props**: `{ checked: boolean; onChange: (v) => void; ariaLabel: string; disabled? }`.

---

### Stepper (Wizard)

**Anatomy**
```
[stepper (column flex)]
  └─ [step (.is-completed | .is-active | (기본))]
        ├─ [step-num + step-num-text]
        └─ [step-label]
```

**Variant**
| 상태 | 클래스 | 표시 |
|------|--------|------|
| 미진행 | `.step` | 회색 번호 |
| 완료   | `.step.is-completed` | 성공색 + `✓` (번호 숨김) |
| 진행중 | `.step.is-active` | accent 배경 + 강조 라벨 |

**Code**
```html
<div class="stepper">
  <div class="step is-completed"><div class="step-num"><span class="step-num-text">1</span></div><div class="step-label">회사정보</div></div>
  <div class="step is-active"><div class="step-num">2</div><div class="step-label">모듈 선택</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-label">검토</div></div>
</div>
```

**Props (React)**
```ts
interface StepperProps {
  steps: { label: string }[];
  currentIndex: number;  // 0-based; 이전은 completed, 같은 인덱스는 active
}
```

---

### Toggle Pill (Status Pill)

**Anatomy**: `.toggle-pill` (inline-flex pill, 11px font, 700 weight) + variant 클래스.

**Variant**
| 상태 | 클래스 | 배경 / 색 |
|------|--------|----------|
| 활성 | `.toggle-pill.is-on`   | success-bg / success |
| 비활성 | `.toggle-pill.is-off` | surface-2 / muted |
| 베타 | `.toggle-pill.is-beta` | warning-bg / warning |

**Code**
```html
<span class="toggle-pill is-on">● ON</span>
<span class="toggle-pill is-off">○ OFF</span>
<span class="toggle-pill is-beta">⚙ 베타</span>
```

**Props**: `{ label: string; variant: 'on' | 'off' | 'beta'; onClick? }`.

---

### Period Chip

**Anatomy**: `.period-chip` (4px×14px pill, border + bg) + `.is-active` (accent 채움).

**Code**
```html
<span class="period-chip">이번달</span>
<span class="period-chip is-active">분기</span>
<span class="period-chip">연간</span>
```

**Props**: `{ label: string; active: boolean; onClick: () => void }`.

---

### Drawer (Side Panel)

**Anatomy**
```
[drawer (.is-open — fixed, right 0, width 480px, full height)]
  ├─ [drawer-header — title + close]
  ├─ [drawer-body — scroll-y, flex:1]
  └─ [drawer-footer — actions]
```

**Code**
```html
<div class="drawer is-open" role="dialog" aria-modal="true" aria-labelledby="dt1">
  <div class="drawer-header"><h3 id="dt1">상세</h3><button class="icon-btn"><svg class="ico"><use href="#i-x"/></svg></button></div>
  <div class="drawer-body">...</div>
  <div class="drawer-footer"><button class="btn btn-ghost">닫기</button></div>
</div>
```

**Props**: `{ open: boolean; onClose; title; body; footer? }`.

---

### Diff (Before/After Highlight)

**Anatomy**: 인라인 `<span class="diff-before">old</span> → <span class="diff-after">new</span>` 형식.

**Variant**
| 클래스 | 배경 / 색 |
|--------|----------|
| `.diff-before` | danger-bg / danger |
| `.diff-after`  | success-bg / success |

**Code**
```html
<div class="diff-row">
  <span class="diff-before">manager</span> → <span class="diff-after">hr_admin</span>
</div>
```

---

### File Input (.file-input wrapper)

**Anatomy**
```
[label.file-input (clickable wrap, 점선 border)]
  ├─ [input.sr-only type=file]
  ├─ [span.file-input-btn — 아이콘 + "파일 선택"]
  └─ [span.file-input-filename (.is-empty시 italic)]
```

**Variant**: `.is-error` (danger border), `.is-disabled`.

**Code**
```html
<label class="file-input">
  <input type="file" class="sr-only">
  <span class="file-input-btn"><svg class="ico"><use href="#i-upload"/></svg> 파일 선택</span>
  <span class="file-input-filename is-empty">선택된 파일 없음</span>
</label>
```

**Props (React)**: `{ accept?; multiple?; onChange: (files: FileList) => void; error?: string }`.

---

### Date Input (.date-input wrapper)

**Anatomy**: `.date-input > .input[type="date"]` + `::after` (캘린더 아이콘).

**Code**
```html
<label class="date-input">
  <input class="input" type="date">
</label>
```

**Variant**: `.date-input.is-error > .input` (danger border).

**Props (React)**: `{ value: string; onChange; min?; max?; error? }`.

---

### Select Wrap (.select-wrap + chevron)

**Anatomy**: `.select-wrap > .select` (chevron은 .select 자체의 background-image로 표시).

**Code**
```html
<label class="select-wrap">
  <select class="select"><option>옵션 1</option><option>옵션 2</option></select>
</label>
```

**Variant**: `.select-wrap.is-error > .select`, `.select-wrap.is-disabled > .select`.

**Props (React)**: `{ options: { value; label }[]; value; onChange; disabled?; error? }`.

---

## 컴포넌트 사용 규칙

### 1. 변수화 의무
- 텍스트, 아이콘, variant, 카운트 등은 모두 prop으로 주입
- "신규 등록 버튼"과 "신규 테넌트 등록 버튼"을 별도 컴포넌트로 만들지 말고, **하나의 Button 컴포넌트**에 다른 label만 전달
- 와이어프레임 HTML은 prop 시연용 인스턴스. 실제 React 변환 시 1개 컴포넌트로 통합

### 1-1. 변수 표기 정책 (Variable Notation)

**`_showcase.html` 규칙**: 모든 도메인 텍스트는 `[변수명]` 표기. 컴포넌트 자체 식별 라벨만 예외.

| 위치 | 표기 | 예시 |
|------|------|------|
| 컴포넌트 인스턴스 텍스트 | `[label]` / `[title]` / `[value]` | `<button>[label]</button>` |
| Empty/Banner/Toast 본문 | `[empty title]` / `[banner description]` | (도메인 텍스트 금지) |
| Table 행/컬럼 | `[col 1]` / `[row link]` / `[code]` / `[number]` | (회사명·금액 등 금지) |
| KPI 카드 | `[label]` / `[value]` / `[delta]` / `[sub]` | "MRR" / "₩3.12M" 등 금지 |
| Dropdown menu items | `[item]` / `[user name]` / `[role]` | "내 프로필" / "김운영" 등 금지 |
| Tab/FilterChip slot | `[tab N]` / `[chip]` / `[group title]` | "기본정보" / "활성" 등 금지 |
| 컴포넌트 식별 라벨 (예외 — 유지) | `Primary` / `Secondary` / `Ghost` / `Danger` / `success` / `warning` 등 variant 이름 | (그대로 유지) |
| 아이콘 ID (식별용) | `i-plus`, `i-bell`, `i-chevron-down` 등 | (그대로 유지) |

**`html/*.html` 규칙 (화면 HTML)**: 도메인 텍스트 그대로 사용 — "신규 테넌트 등록", "(주)치킨매니아", "MRR ₩3,117,500" 등. PRD §3 spec과 1:1 일치.

→ **showcase는 컴포넌트 spec 시연**, **화면 HTML은 컴포넌트 인스턴스화**. 두 영역의 텍스트 표기 기준이 다르다.

### 2. 정렬 의무
- 모든 SVG는 `width`/`height` attribute 명시 (CSS만으로 부족, 일부 브라우저에서 native size로 fallback)
- 컴포넌트 내부 svg는 `.btn > svg`, `.badge > svg` 등 자손 셀렉터로 추가 강제 (components.css)
- 텍스트 line-height는 컴포넌트 단위로 명시 (1, 1.2, 1.4 등) — baseline 떨림 방지

### 2. 정렬 의무
- 모든 SVG는 `width`/`height` attribute 명시 (CSS만으로 부족, 일부 브라우저에서 native size로 fallback)
- 컴포넌트 내부 svg는 `.btn > svg`, `.badge > svg` 등 자손 셀렉터로 추가 강제 (components.css)
- 텍스트 line-height는 컴포넌트 단위로 명시 (1, 1.2, 1.4 등) — baseline 떨림 방지

### 2-1. 텍스트 가변성 검증
- showcase 인스턴스에 짧은 label (`[label]`, 4-6자) + 긴 label (`[label long]`, 14자) 둘 다 시연 → padding/wrap 정상 확인
- 장문 label은 `text-overflow: ellipsis` + `max-width` 또는 줄바꿈 정책 명시
- 다국어(영문 vs 한글) 가변폭 — 한글이 더 넓음 + 줄간격 다름 — 컴포넌트별 line-height/padding 검증 의무

### 2-2. i18n 정책 (ko + en MVP, 2026-05-16)

08-i18n.md 참조. 핵심:

- **컴포넌트 자체 텍스트** (CTA "취소"/"확인"/"다음", placeholder, error message) → 공용 키 `messages/{locale}/components.json`
  - 본 문서 §컴포넌트 명세에 등장하는 모든 라벨은 i18n 키 정의 의무 (08-i18n.md §4)
- **화면별 도메인 텍스트** (페이지 타이틀, KPI 라벨, 컬럼명 등) → `messages/{locale}/screens/{screen-id}.json`
- **enum 라벨** → `messages/{locale}/enums.json` (db/enums.md `enumLabels`와 동기화)
- **사용자 입력 데이터** (회사명, 직원명) → i18n 미적용 (DB 그대로)
- **차이 가변폭** → ko 텍스트가 일반적으로 영문보다 넓음 (한글 글자 폭 ≈ 영문 1.3~1.7배). 컴포넌트 max-width 설정 시 ko 기준 + 영문은 truncate
- 와이어프레임 화면 HTML(`html/*.html`)은 한글 텍스트 그대로 + Phase 7에서 키 추출

### 3. 새 컴포넌트 추가 절차
1. 본 문서에 Anatomy + Props + Variant matrix 추가
2. `components.css`에 CSS 추가 (자손 svg 사이즈 강제 포함)
3. `_showcase.html`에 변수 시연 (variant × size × state 그리드)
4. 변경 이력 갱신
5. **그 다음에** 화면 HTML에서 사용

### 4. Phase 7 React 변환 (07-react-mapping.md §3 참조)
- 본 문서의 Props 인터페이스 → React 컴포넌트 props 1:1 매핑
- shadcn/ui 컴포넌트 + variant 확장 + custom 컴포넌트로 packages/ui 구성
- Tailwind config는 tokens.css와 1:1 매핑

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-16 | 초안 — 40+ 컴포넌트 카탈로그 + shadcn/ui 매핑 | KI-037 batch-004 |
| 2026-05-16 | Anatomy + Props + Variant matrix + 정렬 의무 + svg attribute 강제 | 사용자 지적 (변수화 누락 + 버튼 정렬 깨짐) |
| 2026-05-16 | Variable Notation 정책 §1-1 + 텍스트 가변성 검증 §2-1 추가 | 사용자 지적 (showcase 도메인 텍스트 하드코딩) |
| 2026-05-16 | 신규 8 컴포넌트 섹션 등록 (Modal / Switch / Stepper / Toggle Pill / Period Chip / Drawer / Diff / File Input / Date Input / Select Wrap) | KI-batch-006-fix2 hotfix2 — evaluator/codex 양 평가자 P1 지적 |
| 2026-05-18 | G3 신규 9 패턴 사양 추가 (§G3.1~G3.9) | KI-053 / G3 hotfix2 — evaluator Hard gate "DS SSOT 결함" 해소 |

---

## G3 신규 9 패턴 사양 (wf-v0.3.0 hotfix2, 2026-05-18)

### §G3.1 Profile Card + Summary Grid

**적용**: TA-03 직원 상세, EM-09 본인 프로필

**Anatomy**:
- `.header-cards` (grid 280px / 1fr, gap 16px) — 페이지 wrapper
- 좌측: `.card.profile-card` (flex, gap 14px, padding 16px)
  - `.profile-avatar-lg` (64×64 원형, accent bg, 24px font 600, flex-shrink 0)
  - `.profile-meta` (13px text-muted, line-height 1.6)
- 우측: `.card > .summary-grid` (grid repeat(4, 1fr), gap 12px, padding 16px)
  - `.summary-cell` × 4 (flex column, gap 4px)
    - `.summary-label` (11px uppercase letter-spacing 0.5px text-muted)
    - `.summary-value` (16px font 600 text)

**Props 변수**: 직원명 / 사번 / 직급 / 부서 / 고용형태 / 재직상태 배지 / 4 KPI (잔여연차 / 최근근태 / 결재진행 / 재직기간)

**Variant**: 본인 프로필(EM-09)에서는 4 KPI가 본인 데이터, manager view는 일부 KPI hidden

**모바일**: `@media (max-width: 768px)` grid-template-columns: 1fr

### §G3.2 Org Tree 3-Pane

**적용**: TA-04 조직도

**Anatomy**:
- `.org-shell` (grid 280px / 1fr / 1.2fr, align-items: start, gap 16px)
- 좌측: `.card.org-tree` (padding 12px, min-h 480px)
  - `.tree-node` (flex gap 6px, padding 6px 8px, radius 4px, cursor: pointer, font 13px)
    - `:hover` surface-2 bg
    - `.is-active` (accent bg, white, font 600)
    - `.tree-meta` (11px text-muted, margin-left: auto — 인원수)
  - `.tree-children` (padding-left 14px, border-left 1px dashed border-light, margin-left 12px)
- 중앙: `.card > .form-section` (부서 상세 — `.form-readonly` ↔ `.form-edit` 토글)
- 우측: `.card > .table` (구성원 — 이름/직급/입사일/상태/액션)

**Props 변수**: 부서 트리 (계층) / 부서명 / 부서 코드 / 부서장 / 상위 / 활성 여부 / 구성원 리스트

**Phase 7**: react-arborist 또는 react-complex-tree + 드래그앤드롭 + URL ?dept=NN 동기화

### §G3.3 Calendar Grid (직원×일자)

**적용**: TA-07 휴가 관리

**Anatomy**:
- `.calendar-grid` (grid, gap 1px, border 1px, page-local `grid-template-columns: 160px repeat(31, minmax(28px, 1fr))`)
- `.calendar-cell` (bg, padding 6px 4px, font 11px, min-h 30px)
  - `.day-header` (surface-2 bg, text-muted, center, font 600, padding 8px 2px)
  - `.name-cell` (font 12px 500, padding 8px 12px)
  - `.weekend` (surface-2 bg, text-muted)
- `.leave-badge` (inline-block, height 16px, radius 2px, font 10px, padding 1px 4px, white, line-height 14px)
  - `.l-full` (#3B82F6 blue, width 100%) — 연차
  - `.l-half` (#10B981 green, width 50%) — 반차
  - `.l-sick` (#F59E0B amber, width 100%) — 병가

**Props 변수**: 직원 리스트 / 일자 (월/주) / 휴가 배치 (직원 × 일자) / 휴가 유형

**Variant**: 월 뷰 (31 cols) / 주 뷰 (7 cols, Phase 7 토글)

**모바일**: `@media (max-width: 768px)` overflow-x: auto

### §G3.4 Approval Timeline + Sticky Action

**적용**: TA-08 휴가 신청 상세 (PWA 결재 핵심)

**Anatomy**:
- `.info-cards` (grid repeat(2, 1fr), gap 16px, margin-bottom 16px) + `> .card-wide` span 2
- `.info-cell` (padding 8px 0, flex gap 12px, font 13px)
  - `> .info-label` (90px width, text-muted)
  - `> .info-value` (text, flex 1)
- `.timeline-step` (flex gap 12px, padding 10px 0, border-bottom 1px border-light)
  - `:last-child` border-bottom: none
  - `.timeline-marker` (28×28 원형, surface-2 bg, text-muted, font 12px 600, flex-shrink 0)
    - `.is-done` (success bg, white)
    - `.is-pending` (warning bg, white)
- `.sticky-actions` (position: sticky, bottom 16px, flex gap 8px, padding 12px, bg, border 1px, radius var(--r-md), shadow-md)

**Props 변수**: 신청자 / 휴가 정보 / 잔여 (현재 + 승인 후) / 결재라인 단계 / 본문 / 첨부 / 처리 이력

**Variant**: state default (대기 — 1단계 pending) / state filtered (진행중 — 1단계 done) / state empty (취소 — sticky 숨김)

**PWA**: `bottom: env(safe-area-inset-bottom)` notch 대응

### §G3.5 Approval Master-Detail Inbox

**적용**: TA-09 결재 / 승인

**Anatomy**:
- `.approval-shell` (grid 380px / 1fr, align-items: start, min-h 600px, gap 16px)
- 좌측: `.card.inbox-sidebar` (padding 0)
  - `.inbox-tabs` (flex, border-bottom 1px border-light)
    - `.inbox-tab` (flex 1, padding 10px 8px, center, font 13px, text-muted, border-bottom 2px transparent)
      - `.is-active` (accent color, accent border-bottom-color, font 600)
    - `.count-chip` (inline-block, warning bg, white, radius 10px, padding 1px 6px, font 11px 600, margin-left 4px)
  - `.approval-row` (padding 12px, border-bottom 1px border-light, cursor: pointer, font 13px)
    - `:hover` surface-2 bg
    - `.is-active` (accent-bg, border-left 3px accent, padding-left 9px)
    - `.row-head` (flex space-between gap 6px, margin-bottom 4px)
    - `.row-title` (font 600 text)
    - `.row-meta` (font 11px text-muted)
- 우측: `.card` (상세 — Approval Timeline 변종 재사용)

**Props 변수**: 인박스 카운트 (warning chip — 받은 결재 대기 N) / 결재 종류 (휴가/근태/증명서/문서) / 요청자 (이름+부서) / SLA 임박 (warning badge — "1h" / "23m") / 단계 표기 ("1/2" 형식) / 본인 처리 여부 / 일괄 처리 가능 카운트

**Variant**: 받은(default) / 보낸(filtered) / 위임(v1.1 small) / 완료. 행 선택 — `.approval-row.is-active` accent border-left + 우측 상세 동기화

**Phase 7**: shadcn/ui ResizablePanel (좌/우 width 조절) + Sheet (모바일 drawer 풀스크린 전환) + react-swipeable (좌 스와이프 승인 / 우 반려) + Realtime channel `approvals:tenant_id={id}` (신규/단계 전이/SLA 임박 알림) + 일괄 승인 zod (같은 type만)

### §G3.6 Report List + Chart Canvas

**적용**: TA-12 리포트

**Anatomy**:
- `.report-shell` (grid 260px / 1fr, align-items: start, gap 16px)
- 좌측: `.card.report-list` (padding 8px)
  - `.report-item` (padding 12px, radius 6px, cursor: pointer, font 13px, flex gap 10px align-center, margin-bottom 4px)
    - `:hover` surface-2 bg
    - `.is-active` (accent-bg, accent color, font 600)
    - `.is-disabled` (text-muted, cursor: not-allowed, opacity 0.7 — v1.3 커스텀)
- 우측: `.chart-grid` (grid 1fr 1fr, gap 16px) + `> .card-wide` span 2

**Props 변수**: 리포트 종류 (5+v1.3) / 기간 / 부서 필터 / 직급 필터 / 차트 데이터 (Line/Bar/Donut/Stacked/Radar) / 임박 alert (52h) / PDF/Excel 다운로드 핸들러

**Variant**: 인력 / 근태 / 휴가 / 초과근무 (warning) / 부서비교 / 커스텀 (v1.3 disabled)

**Phase 7**: recharts 또는 visx (LineChart/BarChart/DonutChart/StackedBar/Radar) + shadcn/ui Card + Puppeteer (PDF 생성) + SheetJS (Excel 내보내기). 머터리얼라이즈드 뷰 (성능 — 부서별 사전 집계).

### §G3.7 Settings Vertical Tabs Pane

**적용**: TA-13 회사 설정 (OP-11 vert-tabs 변종)

**Anatomy**:
- `.settings-shell` (grid 220px / 1fr, align-items: start, gap 16px)
- 좌측: `.vert-tabs` + `.vert-tab` (기존 컴포넌트 — `.is-active` SSOT components.css 등록)
- 우측: `.pane-canvas` (position: relative) with `.card.pane` × 9

**Props 변수**: 9 탭 (회사정보 / 근무정책 / 휴가정책 / 결재라인 / 역할권한 / 알림 / 문서양식 / 보안 / 감사로그) / 변경 이력 (audit_logs) / 적용 시점 (date-input) / 권한 매트릭스 (super/hr_admin/manager/employee)

**Variant**: state default = super 9 pane / state filtered = hr_admin 6 pane (scope-hr 부착) / state empty = 보안 단독

**Phase 7**: shadcn/ui Tabs (orientation=vertical) + URL ?tab=X + react-hook-form + zod (탭별 schema) + 적용 예정 cron (매 00:00 status=scheduled→active) + Supabase RLS audit_logs `tenant_id`

### §G3.8 Integration Card Grid

**적용**: TA-14 외부 연동

**Anatomy**:
- `.integration-grid` (grid repeat(3, 1fr), gap 16px)
- `.int-card` (padding 16px, flex column, gap 10px)
  - `.is-coming` (opacity 0.65 — v1.2/v1.3 disabled)
  - `.int-head` (flex gap 10px align-center)
    - `.int-icon` (40×40, radius 8px, surface-2 bg, flex-shrink 0)
  - `.int-meta` (font 12px text-muted)
- `.seg-btn` (padding 6px 14px, font 13px, border 1px, bg, cursor: pointer)
  - `:first-child` radius 6px 0 0 6px, border-right: none
  - `:last-child` radius 0 6px 6px 0

**Props 변수**: 연동 종류 (카카오 알림톡 / SMS / SMTP / 전자계약 / Calendar / Slack / SSO / 출퇴근기기 / Webhook) / 상태 (connected/pending/error/disconnected) / 마지막 발송 / 24h 실패 / 템플릿 카운트 / API Key (이름/마스킹키/권한/만료/24h 호출)

**Variant**: connected (success badge) / pending (muted) / error / disconnected. `.is-coming` v1.2/v1.3 디저블드. 세그먼트 토글 채널 ↔ API Key (`.seg-btn[data-seg="channels"]` vs `[data-seg="apikeys"]`).

**Phase 7**: shadcn/ui Card + Dialog (연결 설정 모달) + react-hook-form (API 키 발급) + Supabase Vault (인증 정보 암호화) + Realtime channel `integrations:tenant_id={id}` + react-day-picker (만료일)

### §G3.9 Side Detail Drawer with Diff

**적용**: TA-06 근태 수정 요청, OP-09 감사 로그 (drawer 일관 패턴)

**Anatomy**:
- `.req-shell` (grid 1fr → state filtered 시 1fr/360px, transition grid-template-columns 0.2s, gap 16px)
- `.req-drawer` (display: none → state filtered display block, position: sticky top 16px)
- `.diff-row` (flex gap 8px align-baseline, padding 6px 0, font 13px)
  - `> .diff-label` (64px width, text-muted, font 12px)
- diff highlight: 원기록 text-decoration: line-through + text-muted / 요청값 success color + font 600

**Props 변수**: 요청 정보 (직원/대상일/요청유형) / 원기록 (출근시각 등) / 요청값 / 사유 (textarea) / 증빙 (file-input — 사진/문서) / 결재라인 단계별 (timeline reuse) / 액션 (승인/반려/의견)

**Variant**: state default = 목록 1fr / state filtered = 목록 + drawer 1fr/360px transition 0.2s. OP-09 감사 로그에서도 동일 drawer 패턴 (diff highlight 재사용 — before→after)

**Phase 7**: shadcn/ui Sheet (drawer) + URL `?id=req-XXX` 동기화 + react-hook-form (반려 사유 textarea + zod validate) + react-dropzone (증빙) + diff library (react-diff-view 또는 자체 highlight)

### 모바일 override 일괄 (G3 신규 9 패턴 + Approval/Report/Settings/Integration)

```css
@media (max-width: 768px) {
  .header-cards,
  .summary-grid,
  .org-shell,
  .approval-shell,
  .report-shell,
  .settings-shell,
  .integration-grid,
  .info-cards,
  .chart-grid { grid-template-columns: 1fr !important; }
  .info-cards > .card-wide,
  .chart-grid > .card-wide { grid-column: span 1; }
  .calendar-grid { overflow-x: auto; }
}
```

## G4 신규 6 패턴 사양 (wf-v0.4.0 — Employee 도메인, 2026-05-18)

### G4.1 ClockCard — 출퇴근 시계 + 액션 그룹

**Anatomy** (EM-01 / EM-02):
- `.clock-card` — flex column gap 12px (card 내부)
- `.clock-display` — 중앙 정렬 — `.clock-now` (36px 700 mono) + `.clock-date` (12px muted)
- `.clock-meta` — 4-col grid, 8px gap — `.clock-meta-item` (surface-2 bg, r-sm, 8/10 padding) × 4 (출근/퇴근/휴게/근무)
- `.clock-meta-label` — 11px muted with 4px gap (icon optional)
- `.clock-meta-value` — 13px 600 with 4px gap (success check-circle optional)
- `.clock-actions` — auto-fit minmax(120px, 1fr) — `.btn.btn-lg` 액션 그룹 (상태별 활성)

**Props (Phase 7 React)**:
- `state`: `'unclocked' | 'working' | 'on_break' | 'clocked_out' | 'missing'`
- `now`: Date — 현재 시각 (실시간)
- `attendance`: `{ clockIn, clockOut, breakMinutes, workHours, location }`
- `onClockIn`/`onClockOut`/`onBreakStart`/`onBreakEnd`: () => void

**Phase 7**: PWA 모바일 GPS — `navigator.geolocation.getCurrentPosition` + 회사 좌표 비교 + 오프라인 IndexedDB 큐 (`workbox-background-sync`).

### G4.2 LeaveBalanceCard — 잔여 휴가 강조

**Anatomy** (EM-01 / EM-04):
- `.leave-balance-card` — flex column gap 12px
- `.leave-balance-main` — 중앙 정렬, 12px padding — `.leave-balance-num` (48px 700 accent) + `.leave-balance-unit` (18px 600 muted "일")
- `.leave-balance-sub` — 12px muted ("사용 5 / 총 15")
- `.leave-balance-row` — flex justify-between, border-bottom — `.leave-balance-key` (muted) + `.leave-balance-val` (600)
- 하단 풀폭 CTA `.btn.btn-primary` ("휴가 신청" — 100% width, center justify)

**Props**:
- `balance`: number — 잔여 일수
- `granted`: number — 총 부여
- `used`: number — 사용
- `nextLeave?`: string — 다음 휴가 일자
- `monthUsed?`: number — 이번달 사용

**모바일 ≤768px**: leave-balance-num 40px.

### G4.3 StatMiniList — 미니 리스트 (요청/알림/일정 3건)

**Anatomy** (EM-01 3-col dash-row):
- `.stat-mini-list` — flex column gap 4px (card 내부)
- `.stat-mini-row` — flex 8px gap, 8/10 padding, surface-2 bg, r-sm, 13px, decoration-none color text
- `a.stat-mini-row:hover` — accent-bg transition
- 내부 옵션 1: `.stat-mini-type` (11px badge info-bg, "휴가"/"증명서"/...) + `.stat-mini-title` (ellipsis flex 1) + `.badge` (상태)
- 내부 옵션 2: `.stat-mini-icon` (muted, flex-shrink 0) + `.stat-mini-title` + `.stat-mini-time` (11px muted "3시간 전")

**Props**:
- `items`: `Array<{ id, type?, icon?, title, badge?, time?, href? }>`
- 최대 3건 (PRD §3 명세) — 초과 시 "전체 →" CTA card-head

### G4.4 CalcSummary — 자동 계산 박스

**Anatomy** (EM-03 우측):
- `.calc-summary` — flex column gap 6px
- `.calc-row` — flex justify-between, 6px padding, 13px
- `.calc-key` — muted with icon optional
- `.calc-val` — 600 — 사용일수 row의 calc-val 22px 700 accent (강조)
- 신청 후 잔여 row — border-top + bold
- 하단 calc-row 12px muted info — "주말/공휴일 제외 (회사 설정)"

**Variant**:
- default — calc-val accent
- error — 잔여 부족 시 calc-val color danger + "-N일 (부족)"

**Phase 7**: server-side `POST /leaves/calculate-days` debounce 500ms 또는 client-side date-fns + work_policy.

### G4.5 ChartPlaceholder — Donut 차트 placeholder

**Anatomy** (EM-04 좌측 1.2fr):
- `.chart-placeholder` — 140px/1fr grid, 20px gap, align-center
- `.chart-placeholder-donut` — 140×140 relative
  - `.chart-donut-svg` — inline SVG viewBox 36 36, stroke-dasharray "X,Y" (사용/잔여) + transform rotate(-90)
  - `.chart-placeholder-donut-inner` — absolute inset 0, center — `.chart-placeholder-num` (28px 700 accent) + `.chart-placeholder-sub` (11px muted "일 사용")
- `.chart-placeholder-legend` — flex column 6px gap
  - `.legend-row` × N (4종 — 연차/병가/경조사/공가) — `.legend-dot` (10px, color별) + `.legend-label` + `.legend-val` (muted 600 우측)
- `.chart-placeholder-note` — grid-column 1/-1, 11px muted, dashed border-top, 8px padding — "Phase 7 chart lib 교체 예정"

**Phase 7 교체**: recharts `<PieChart>` 또는 visx `<Pie>` — 본 placeholder는 시각 검수용. 동일 grid + legend 유지.

### G4.6 NotifRow — 알림 카드 리스트

**Anatomy** (EM-10):
- `.notif-card` — padding 0 (card variant)
- `.notif-row` — flex 10px gap, align-center, 12/16 padding, border-bottom, decoration-none text color, cursor-pointer
- variant `.notif-row.is-unread` — bg info-bg, hover accent-bg
- 내부:
  - `.notif-row-dot` — is-unread 시만, absolute left 6px center, 6×6 accent dot
  - `.notif-row-icon` — 32×32 circle, surface-2 bg muted color, is-unread 시 white bg accent color
  - `.notif-row-body` — flex 1 column 2px gap — `.notif-row-title` (13px 600) + `.notif-row-desc` (12px muted, ellipsis nowrap)
  - `.notif-row-type` — flex-shrink 0, 11px badge (결재 info / 시스템 warning / 공지 neutral)
  - `.notif-row-time` — 11px muted

**Props**:
- `notification`: `{ id, type, title, desc, time, isRead, href? }`
- `onClick`: () => void — 자동 read mark + navigate

**Realtime**: `realtime:notifications:user-{id}` 구독 → 새 알림 prepend + 헤더 종 배지 갱신 + PWA push 발송.

### G4 모바일 override

`components.css` 끝 `@media (max-width: 768px)` 신규 5 규칙:
- `.clock-meta` → 2-col
- `.clock-actions` → 1-col stack
- `.chart-placeholder` → 1-col + donut 가운데 정렬
- `.notif-row` → flex-wrap + desc nowrap 해제
- `.leave-balance-num` → 40px (48 → 40 축소)
