# 05. 레이아웃 (AppShell + 글로벌 컴포넌트)

> **모든 인증 영역 화면(`/operator/*`, `/admin/*`, `/me/*`)은 AppShell 구조를 따른다.**
> 09-routing.md §6 글로벌 컴포넌트 명세와 정합.

## AppShell 구조

```
<body>
  <svg style="display:none"> ... </svg>          ← icons.svg 외부 참조 (인라인 금지)

  <div class="app-shell">
    <nav class="sidebar"> ... </nav>             ← 글로벌 사이드바 (역할별)

    <div class="main">
      <header class="header"> ... </header>      ← 글로벌 헤더 (CM-16~19 의무)
      <div class="maintenance-banner"> ... </div> ← 점검 사전 공지 (조건부)
      <main class="content"> ... </main>         ← 페이지 콘텐츠
      <footer class="footer"> ... </footer>      ← 글로벌 푸터
    </div>
  </div>
</body>
```

## 의무 컴포넌트 (모든 인증 화면)

| 컴포넌트 | 위치 | spec |
|---------|------|------|
| 사이드바 | 좌측 240px | 역할별 메뉴 (operator 9 / tenant 8 / employee 8) |
| 헤더 로고 + 페이지 타이틀 | 상단 좌측 | `.page-title` |
| CM-18 헤더 검색 | 상단 중앙 | `.header-search-wrap` (MVP △ disabled + v1.1 배지) |
| CM-19 도움말 ? | 상단 우측 | `.icon-btn` + `i-help` |
| CM-17 알림 종 + 배지 | 상단 우측 | `.icon-btn` + `i-bell` + `.badge-dot` |
| CM-16 프로필 드롭다운 | 상단 우측 | `.profile-trigger` + `.avatar` + `i-chevron-down` |
| 푸터 | 콘텐츠 하단 | © + 약관/개인정보/도움말/문의 + 버전 |

## 사이드바 메뉴 (역할별)

### operator (9 메뉴)
```
대시보드 (i-dashboard)        → /operator → OP-01
테넌트 (i-building)           → /operator/tenants → OP-02 (+OP-03/04)
구독 / 요금제 (i-credit-card) → /operator/plans → OP-05
청구 / 정산 (i-receipt)       → /operator/billing → OP-06
기능 권한 (i-flag)            → /operator/feature-flags → OP-07
지원 티켓 (i-ticket)          → /operator/tickets → OP-08
감사 로그 (i-scroll)          → /operator/audit-logs → OP-09
운영 리포트 (i-chart)         → /operator/reports → OP-10
시스템 설정 (i-settings)      → /operator/system-settings → OP-11
```
(OP-12 본인 프로필은 사이드바 메뉴 X — 헤더 CM-16 드롭다운에서만 진입)

### tenant_super / hr_admin / manager (8 메뉴)
```
대시보드 (i-dashboard)         → /admin → TA-01
직원 (i-users)                 → /admin/employees → TA-02 (+TA-03/04)
근태 (i-clock)                 → /admin/attendance → TA-05 (+TA-06)
휴가 (i-calendar-days)         → /admin/leaves → TA-07 (+TA-08)
결재 (i-check-square)          → /admin/approvals → TA-09
급여 / 문서 (i-file-text)      → /admin/payroll → TA-10 (+TA-11)
리포트 (i-chart)               → /admin/reports → TA-12
설정 (i-settings)              → /admin/settings → TA-13 (+TA-14)
```
(EM-09 본인 프로필은 헤더 CM-16에서만)

### employee (8 메뉴)
```
대시보드 (i-dashboard)         → /me → EM-01
출퇴근 (i-clock)               → /me/attendance → EM-02
휴가 (i-calendar-days)         → /me/leaves → EM-04 (+EM-03)
결재 (i-check-square)          → /me/approvals → EM-05 (+EM-11)
급여 (i-file-text)             → /me/payslips → EM-06
문서 (i-file-text)             → /me/documents → EM-07 (+EM-08)
알림 (i-bell)                  → /me/notifications → EM-10
내 정보 (i-user)               → /me/profile → EM-09
```

## CM-16 프로필 드롭다운 메뉴 (역할별 매트릭스)

09-routing.md §6-1 + common.md CM-16 표 기반.

| 메뉴 | operator | tenant | employee | 라우트 |
|------|:--------:|:------:|:--------:|--------|
| 사용자명 + 역할 + 회사명 (display) | ✓ | ✓ | ✓ | — |
| 내 프로필 | ✓ → OP-12 | ✓ → EM-09 | ✓ → EM-09 | navigate |
| 보안 설정 (2FA · 세션) | ✓ | ✓ | ✓ | `?tab=security` |
| 알림 설정 | ✓ | ✓ | ✓ | `?tab=notification` |
| 도움말 | ✓ → CM-19 | ✓ → CM-19 | ✓ → CM-19 | panel |
| 운영팀 문의 (티켓) | — | ✓ → OP-08 | ✓ → OP-08 | modal |
| 로그아웃 | ✓ | ✓ | ✓ | `POST /auth/logout` → /login |

## 사용 규칙

### 1. AppShell 복사
- 신규 화면 작성 시 `_layout-shell.html` 전체 복사 → 사이드바 active만 변경 + 페이지 타이틀 + 콘텐츠 영역 채움
- **헤더/푸터는 절대 변경 금지** (디자인 시스템 SSOT)

### 2. 비인증 영역 (CM-01~06, CM-20~21)
- AppShell 사용 X
- 별도 layout: `_layout-auth.html` (로그인/약관/PWA 설치 등 단순 헤더+푸터만)

### 3. 모바일 변형
- ≤768px: 사이드바 → 햄버거 (`i-menu`) → 전체 오버레이
- ≤768px: 헤더 검색바 숨김 (햄버거 메뉴 안 검색 항목)
- ≤768px: 푸터 옵션 숨김 (`.footer-mobile-hidden`)

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-16 | 초안 — AppShell + 사이드바 역할별 + CM-16 매트릭스 | KI-037 |
