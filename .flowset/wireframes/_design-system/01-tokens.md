# 01. 디자인 토큰

> **단일 source**: `tokens.css`. 모든 색·타이포·간격·반경·그림자는 CSS 변수로 정의. 화면에서는 변수 참조만, 하드코딩 금지.

## 색상

### Brand (FlowHR)
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-primary` | `#1E40AF` | 사이드바 배경, 강조 텍스트 |
| `--color-primary-hover` | `#1E3A8A` | 버튼 hover |
| `--color-primary-bg` | `#1E3A8A` | 사이드바 deep |
| `--color-accent` | `#3B82F6` | 주요 액션, 링크, 활성 상태 |
| `--color-accent-light` | `#DBEAFE` | 활성 칩 배경 |

### Surface
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-bg` | `#FFFFFF` | 카드/모달 배경 |
| `--color-surface` | `#F9FAFB` | 콘텐츠 영역 배경 |
| `--color-surface-2` | `#F3F4F6` | 입력 비활성 배경 |
| `--color-border` | `#E5E7EB` | 카드/입력 외곽선 |
| `--color-border-light` | `#F3F4F6` | 테이블 행 구분선 |

### Text
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-text` | `#111827` | 본문 |
| `--color-text-muted` | `#6B7280` | 보조 텍스트 |
| `--color-text-subtle` | `#9CA3AF` | 플레이스홀더 |
| `--color-text-on-primary` | `#FFFFFF` | 사이드바 텍스트 |

### Status (배지/상태 매핑 — db/enums.md §색상 매핑과 정합)
| 토큰 | 값 | 의미 enum |
|------|-----|---------|
| `--color-success` / `--color-success-bg` | `#10B981` / `#D1FAE5` | normal, approved, paid, active, connected, success, issued |
| `--color-warning` / `--color-warning-bg` | `#F59E0B` / `#FEF3C7` | late, overdue, expiring_soon, waiting_user, failed (재시도 가능) |
| `--color-danger` / `--color-danger-bg` | `#EF4444` / `#FEE2E2` | absent, rejected, inactive, expired, denied |
| `--color-info` / `--color-info-bg` | `#3B82F6` / `#DBEAFE` | pending, in_progress, scheduled, beta |

## 타이포그래피

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--font-sans` | `'Pretendard', -apple-system, ...` | 본문 (한글 우선) |
| (모노) | `monospace` | 코드/ID/사업자번호 |

### 사이즈 / 굵기
| 클래스 | 사이즈 | 굵기 | 용도 |
|-------|-------|------|------|
| `.text-page-title` | 18px | 600 | 페이지 헤더 |
| `.text-section-title` | 14~16px | 600~700 | 섹션 헤더 |
| `.text-body` | 13~14px | 400 | 본문 |
| `.text-meta` | 12px | 500 | 보조 정보 |
| `.text-label` | 11~12px | 600 uppercase | 카드 라벨 |

## 간격 / 반경 / 그림자

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--sidebar-w` | `240px` | 사이드바 폭 |
| `--header-h` | `56px` | 헤더 높이 |
| `--tab-bar-mobile-h` | `60px` | 모바일 하단 탭 |
| `--r-sm` | `6px` | 작은 칩/배지 |
| `--r-md` | `8px` | 입력/버튼 |
| `--r-lg` | `12px` | 카드/모달 |
| `--r-pill` | `9999px` | 둥근 칩 |
| `--shadow-sm` | `0 1px 2px ...` | 카드 기본 |
| `--shadow-md` | `0 4px 6px ...` | hover 카드 |
| `--shadow-lg` | `0 10px 15px ...` | 모달/드롭다운 |

## Z-index 계층 (신규 추가)

| 변수 | 값 | 용도 |
|------|-----|------|
| `--z-sticky` | `10` | 헤더 sticky |
| `--z-dropdown` | `100` | 헤더 드롭다운 |
| `--z-modal-backdrop` | `1000` | 모달 백드롭 |
| `--z-modal` | `1010` | 모달 본체 |
| `--z-toast` | `2000` | 토스트 |
| `--z-tooltip` | `3000` | 툴팁 |

## Phase 7 → Tailwind 매핑

`07-react-mapping.md` §1 참조. 모든 토큰은 `tailwind.config.ts`의 `theme.extend.colors` / `spacing` / `borderRadius` / `boxShadow`에 1:1 매핑.
