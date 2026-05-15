# 04. 페이지 패턴

> 화면별 콘텐츠 영역 구성 표준. 와이어프레임 작성 시 해당 패턴을 그대로 사용.

## 패턴 카탈로그

| 패턴 | 사용 화면 | 구조 |
|------|---------|------|
| Dashboard | OP-01, TA-01, EM-01 | 필터 → 액션 영역 → KPI row → 차트 row → 활동 row |
| List + Side Filter | OP-02, OP-09 | 좌 사이드 필터 + 우 (액션 + 테이블) |
| List + Top Filter | OP-05, OP-06, OP-07, TA-02, TA-05, TA-07 | 상단 filter-bar → 액션 → 테이블 |
| Detail (Tabs) | OP-03, TA-03, EM-09, OP-12 | 헤더 (info-cards 3) + 탭 + 탭별 콘텐츠 |
| Wizard (Stepper) | OP-04 | 좌 stepper + 우 form-section + form-actions (이전/다음) |
| Settings (Vert Tabs) | OP-11, TA-13 | 좌 vert-tabs + 우 form-section |
| Master-Detail | OP-08, TA-09, EM-05 | 좌 목록 + 우 sticky 상세 패널 |
| Form (Single) | TA-06, EM-03, EM-08 | 단일 form-section + form-actions |

## Dashboard 패턴

```
┌─ filter-bar (기간/요금제/...) ────────────────────────┐
├─ page-action-bar (요약 + 액션 버튼 그룹) ─────────────┤
├─ kpi-row (grid-N: KPI card N개) ──────────────────────┤
├─ chart-row (grid-N: chart card N개) ──────────────────┤
└─ activity-row (grid-N: 테이블 카드 N개) ──────────────┘
```

KPI 카드 수는 화면별: OP-01 = 7, TA-01 = 6, EM-01 = 5 등. `grid-template-columns: repeat(N, 1fr)` 사용.

## List + Side Filter 패턴

```
.layout (grid: 사이드(240px) / 메인 1fr)
├─ aside.filter-panel (sticky)
│   ├─ filter-group (상태)
│   ├─ filter-group (요금제)
│   └─ filter-group (...)
└─ div
    ├─ page-action-bar
    └─ card.card-flat
        ├─ table
        └─ pagination
```

## Detail (Tabs) 패턴

```
breadcrumb
profile-header / tenant-header (회사명 + 도메인 + 배지 + info-cards 3개 + 액션 그룹)
card
├─ tabs (수평)
└─ 탭별 콘텐츠 (form-row 또는 grid-2 또는 테이블 등)
```

## Wizard 패턴

```
.wizard (grid: stepper(260px) / form 1fr)
├─ aside.stepper (sticky, 단계 N개)
└─ .form-section
    ├─ form-section-header (단계 번호 + 제목 + 설명)
    ├─ form-row × N (각 필드)
    ├─ banner.info (도움말)
    └─ form-actions (이전 / 다음)
```

## Settings (Vert Tabs) 패턴

```
.settings-layout (grid: vert-tabs(220px) / 메인 1fr)
├─ aside.vert-tabs (sticky)
└─ card
    ├─ <h2> (탭 제목)
    ├─ <p> (탭 설명)
    ├─ <h3> (섹션 제목)
    ├─ form-row × N
    └─ 우측 정렬 form-actions
```

## Master-Detail 패턴

```
filter-bar
.ticket-layout (grid: 목록 1fr / 상세 380px)
├─ card.card-flat (목록 테이블)
│   tr.selected → 우측 상세 표시
└─ aside.ticket-detail (sticky)
    ├─ 헤더 (ID + 제목 + 상태 + 메타)
    ├─ 컨트롤 그리드 2x2 (유형/우선/담당/상태)
    ├─ banner (SLA)
    ├─ thread (메시지 N)
    └─ 응답 입력 (textarea + 액션)
```

## Form (Single) 패턴

```
.form-section
├─ form-section-header
├─ form-row × N
├─ banner.info (도움말)
└─ form-actions
```

## 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-16 | 초안 — 8 패턴 + 화면 매핑 | KI-037 |
