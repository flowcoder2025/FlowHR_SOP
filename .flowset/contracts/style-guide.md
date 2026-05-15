# 디자인 / UI 스타일 가이드

> 웹/PWA/네이티브앱 공통 디자인 토큰. 화면 명세 §13(이미지 재생성 프롬프트)과 일치.

## 1. 디자인 원칙

- **Clean modern B2B SaaS** — 정보 밀도 높음, 가독성 우선
- **Korean-first** — 한글 UI 라벨 기본, 영문은 보조
- **Light theme 기본** — 다크 모드는 v1 후순위
- **Accessibility WCAG 2.1 AA** — 명도 대비, 키보드 네비, 스크린리더

## 2. 색상 토큰

| 토큰 | 값 | 사용처 |
|------|----|----|
| `--color-primary` | `#1E40AF` (Navy blue) | CTA 버튼, 로고, 활성 메뉴 |
| `--color-primary-bg` | `#1E3A8A` | 좌측 사이드바 배경 |
| `--color-accent` | `#3B82F6` | 강조, 링크, 포커스 |
| `--color-bg` | `#FFFFFF` | 메인 배경 |
| `--color-surface` | `#F9FAFB` | 카드, 패널 |
| `--color-border` | `#E5E7EB` | 경계선 |
| `--color-text` | `#111827` | 본문 |
| `--color-text-muted` | `#6B7280` | 보조 텍스트 |
| `--color-success` | `#10B981` | 정상, 승인 |
| `--color-warning` | `#F59E0B` | 지각, 미열람 |
| `--color-danger` | `#EF4444` | 결근, 반려, 오류 |
| `--color-info` | `#3B82F6` | 안내 |

## 3. 타이포그래피

- 영문: Inter, system-ui
- 한글: Pretendard
- 크기 토큰: `xs 12 / sm 14 / base 16 / lg 18 / xl 20 / 2xl 24 / 3xl 30`

## 4. 레이아웃

### 웹 (Desktop, 1280px+)
- 좌측 사이드바 240px (네이비 배경, 흰 텍스트)
- 상단 헤더 56px (페이지 타이틀, 검색, 알림, 프로필)
- 메인 컨텐츠 영역 max-width 1440px, 패딩 24px

### PWA (Mobile, ≤768px)
- 상단 헤더 56px (햄버거 메뉴, 타이틀, 알림)
- 하단 탭바 56px (대시보드/출퇴근/휴가/알림/내정보 5탭)
- 사이드바는 드로어로 변환

### 네이티브 앱
- iOS/Android 플랫폼 가이드라인 부분 적용 (Safe area, Status bar)
- PWA와 시각 일관성 유지 (탭바, 색상)

## 5. 컴포넌트 패턴

| 컴포넌트 | 패턴 |
|---------|------|
| 카드 | `border-radius: 12px`, `box-shadow: sm`, `padding: 24px` |
| 버튼 | Primary / Secondary / Ghost / Danger, `height: 40px`, `border-radius: 8px` |
| 입력 필드 | `height: 40px`, `border: 1px solid border`, focus 시 accent ring |
| 테이블 | 헤더 `bg: surface`, 행 hover 시 `bg: gray-50`, 페이지네이션 하단 |
| 상태 배지 | `padding: 2px 8px`, `border-radius: 9999px`, 색상 토큰 매핑 |
| 모달 | 중앙 정렬, `max-width: 600px`, backdrop blur |

## 6. 상태 배지 색상 매핑

| 상태 | 색상 |
|------|------|
| 정상 / 승인 완료 / 활성 / 재직 | success |
| 진행중 / 대기 / 수습 | info |
| 지각 / 미열람 / 만료예정 | warning |
| 결근 / 반려 / 비활성 / 퇴사 / 만료 | danger |
| 휴가 / 휴직 / 보관 | text-muted |

## 7. 한글 라벨 컨벤션

- 버튼: 동사형 (저장, 등록, 승인, 반려, 다운로드)
- 상태: 명사형 (재직, 휴가, 승인 완료, 반려)
- 테이블 헤더: 명사형 (이름, 부서, 입사일)
- 토스트 메시지: 완료 시 "{대상}이(가) {동작}되었습니다", 오류 시 "{원인}으로 {대상}을(를) {동작}할 수 없습니다"

## 8. 아이콘

- Lucide React (웹/PWA)
- 동등한 SF Symbols / Material Icons (네이티브 앱)
- 사이즈: 16/20/24px
