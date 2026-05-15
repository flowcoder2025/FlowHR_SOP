# 02. 디바이스 매트릭스

## 1. 3-클라이언트 전략

| 클라이언트 | 코드명 | 대상 사용자 | 범위 | 기술 | 배포 |
|-----------|-------|----------|------|------|------|
| **Web** | `apps/web` | 운영사 / 테넌트 관리자 / 직원 | 풀 기능 (데스크톱 브라우저 1280px+) | Next.js 15 (App Router) + Tailwind + shadcn/ui | Vercel |
| **PWA** | `apps/web` (동일 코드, 반응형) | 직원 / 테넌트 관리자 모바일 결재 | 풀 기능 (모바일 ≤768px) | Next.js PWA (next-pwa, Service Worker, manifest.json) | Vercel + manifest 설치 |
| **Tauri Desktop** | `apps/desktop` | 테넌트 관리자 / 직원 데스크톱 | 풀 기능 + 트레이/단축키/다중창 | Tauri 2.x (Rust + WebView, `apps/web` 빌드 임베드) | Tauri 빌드 → GitHub Releases + 자동 업데이트 |

**단일 코드베이스 원칙**: 3 클라이언트 모두 동일 Next.js 페이지/컴포넌트를 공유. Tauri는 빌드된 정적 자산을 임베드. 플랫폼 분기는 `@flowhr/platform` 추상화 계층 한 곳에서.

## 2. 화면별 가용성 매트릭스 (36 화면 × 3 클라이언트)

### 운영사 (OP-01 ~ OP-11)

| ID | 화면 | Web | PWA | Tauri | 비고 |
|----|------|:---:|:---:|:---:|------|
| OP-01 | 운영사 대시보드 | ✓ | △ | ✓ | PWA는 카드 우선, 차트 단순화 |
| OP-02 | 테넌트 관리 | ✓ | △ | ✓ | PWA는 검색·상태변경만 |
| OP-03 | 테넌트 상세 | ✓ | △ | ✓ | PWA는 탭 스택 |
| OP-04 | 신규 테넌트 등록 | ✓ | — | ✓ | 7단계 폼 — 모바일 비권장 |
| OP-05 | 구독/요금제 관리 | ✓ | — | ✓ | — |
| OP-06 | 청구/정산 | ✓ | △ | ✓ | PWA는 조회만 |
| OP-07 | 기능 플래그 | ✓ | — | ✓ | — |
| OP-08 | 지원 티켓 | ✓ | ✓ | ✓ | PWA에서 응대 가능 |
| OP-09 | 감사 로그 | ✓ | △ | ✓ | PWA는 최근 100건만 |
| OP-10 | 운영 리포트 | ✓ | △ | ✓ | PWA는 KPI 카드 |
| OP-11 | 시스템 설정 | ✓ | — | ✓ | — |

### 테넌트 관리자 (TA-01 ~ TA-14)

| ID | 화면 | Web | PWA | Tauri | 비고 |
|----|------|:---:|:---:|:---:|------|
| TA-01 | 관리자 대시보드 | ✓ | ✓ | ✓ | — |
| TA-02 | 직원 관리 | ✓ | △ | ✓ | PWA는 검색·조회·초대 |
| TA-03 | 직원 상세 | ✓ | △ | ✓ | PWA는 탭 스택 |
| TA-04 | 조직도/부서 | ✓ | △ | ✓ | PWA는 단순 트리 |
| TA-05 | 근태 관리 | ✓ | △ | ✓ | PWA는 이상자 알림 우선 |
| TA-06 | 근태 수정 요청 | ✓ | ✓ | ✓ | — |
| TA-07 | 휴가 관리 | ✓ | ✓ | ✓ | — |
| TA-08 | 휴가 신청 상세/승인 | ✓ | ✓ | ✓ | **모바일 결재 핵심** |
| TA-09 | 결재/승인 | ✓ | ✓ | ✓ | **모바일 결재 핵심** |
| TA-10 | 급여/문서 관리 | ✓ | △ | ✓ | PWA는 발송 상태 모니터링 |
| TA-11 | 문서함/전자계약 | ✓ | △ | ✓ | PWA는 서명 요청 확인 |
| TA-12 | 리포트 | ✓ | △ | ✓ | PWA는 KPI 카드 |
| TA-13 | 회사 설정 | ✓ | — | ✓ | 모바일 비권장 (대량 설정) |
| TA-14 | 외부 연동 | ✓ | — | ✓ | 모바일 비권장 |

### 직원 (EM-01 ~ EM-11)

| ID | 화면 | Web | PWA | Tauri | 비고 |
|----|------|:---:|:---:|:---:|------|
| EM-01 | 내 대시보드 | ✓ | ✓ | ✓ | **모바일 진입점** |
| EM-02 | 출퇴근 | ✓ | ✓ | ✓ | **모바일 핵심 — GPS 인증** |
| EM-03 | 휴가 신청 | ✓ | ✓ | ✓ | — |
| EM-04 | 내 휴가 현황 | ✓ | ✓ | ✓ | — |
| EM-05 | 내 결재/진행현황 | ✓ | ✓ | ✓ | — |
| EM-06 | 급여명세서 조회 | ✓ | ✓ | ✓ | — |
| EM-07 | 문서 조회 | ✓ | ✓ | ✓ | — |
| EM-08 | 증명서 요청 | ✓ | ✓ | ✓ | — |
| EM-09 | 내 정보/프로필 | ✓ | ✓ | ✓ | — |
| EM-10 | 알림함 | ✓ | ✓ | ✓ | **푸시 진입** |
| EM-11 | 요청 내역 | ✓ | ✓ | ✓ | — |

범례: ✓ = 풀 기능 / △ = 축소·조회 위주 / — = 미지원

## 3. 반응형 브레이크포인트

| 브레이크포인트 | 폭 | 적용 |
|-------------|----|----|
| mobile | ≤ 640px | PWA 기본 |
| tablet | 641~1024px | PWA 또는 Web 축소 |
| desktop | 1025~1440px | Web 기본 |
| wide | 1441px+ | Web wide |

## 4. PWA 알려진 제약 + 대응 (requirements.md 인용)

| 제약 | 영향 화면 | 대응 |
|------|----------|------|
| iOS 푸시: 16.4+ + 홈화면 추가 필수 | EM-10 알림함, TA-08/TA-09 결재 알림 | 첫 진입 시 PWA 설치 가이드 모달 (`/install`) + 카카오 알림톡/SMS 폴백 채널 |
| iOS 백그라운드 위치 불가 | EM-02 출퇴근 | 출퇴근은 포그라운드 클릭 시점 `navigator.geolocation` 단발 호출. 자동 추적 X. 미허용 시 안내 토스트 |
| 카메라/파일 권한 일부 제한 | EM-08 증명서 첨부, TA-11 계약서 첨부 | 증빙 사진은 `<input type="file" accept="image/*" capture="environment">`, 일반 첨부는 표준 file picker |
| 오프라인 동기화 제한 | EM-02 출퇴근만 | Service Worker로 출퇴근 기록을 IndexedDB 큐잉 → 온라인 복귀 시 재전송. 그 외 화면은 온라인 전제 |
| iOS Safari localStorage 정리 정책 | 인증 토큰 | Supabase 세션은 cookie + localStorage 이중 저장, 만료 시 자동 재인증 시도 후 로그인 페이지 fallback |

## 5. Tauri Desktop 특화 기능

| 기능 | 설명 | 대상 화면 |
|------|------|----------|
| 시스템 트레이 | 결재 대기 / 알림 미열람 카운트 배지 | TA-09, EM-10 |
| 전역 단축키 | `Ctrl+Shift+H` → 출근 / `Ctrl+Shift+B` → 퇴근 | EM-02 |
| 다중 윈도우 | 운영사 → 다수 테넌트 동시 비교 / 관리자 → 결재함 + 직원관리 동시 | OP-02 ↔ OP-03, TA-09 ↔ TA-02 |
| 자동 업데이트 | `tauri-updater` + GitHub Releases | 전역 |
| 로컬 알림 | OS 네이티브 알림 (macOS Notification Center, Windows Toast) | EM-10, TA-09 |
| 파일 시스템 접근 | 급여명세서 일괄 다운로드 → 폴더 선택 | TA-10 |

## 6. 디바이스 분기 코드 추상화

```typescript
// packages/platform/index.ts
export const platform = {
  isWeb: typeof window !== 'undefined' && !('__TAURI__' in window),
  isPWA: typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
  isTauri: typeof window !== 'undefined' && '__TAURI__' in window,
  isMobile: typeof window !== 'undefined' && window.innerWidth <= 640,
};

export async function showNotification(opts: NotificationOptions) {
  if (platform.isTauri) return tauriNotify(opts);
  if (platform.isPWA && 'Notification' in window) return webNotify(opts);
  return toast(opts); // 폴백 — 페이지 내 토스트
}
```

플랫폼 분기는 본 추상화 계층 한 곳에서만. 페이지/컴포넌트에 직접 분기 금지.

## 7. 변경 이력

| 일자 | 변경 | 사유 |
|------|------|------|
| 2026-05-15 | 초안 + 36화면 매트릭스 채움 | Phase 1 진입 |
