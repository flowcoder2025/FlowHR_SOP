# 02. 아이콘 카탈로그

> **단일 source**: `icons.svg`. 모든 화면이 외부 참조 (`<use href="../_design-system/icons.svg#i-..."/>`).
> 라이브러리: **Lucide outline** (https://lucide.dev). React 변환 시 `lucide-react` 패키지 1:1 매핑.

## 사용 규칙

- 화면 HTML 안에 SVG sprite 인라인 정의 **금지**
- 외부 참조만: `<svg class="ico"><use href="../_design-system/icons.svg#i-dashboard"/></svg>`
- 새 아이콘 필요 시 본 카탈로그에 추가 → `icons.svg`에 SVG path 추가 → 화면에서 사용

## 카탈로그 (사용처별 그룹)

### 사이드바 / 도메인 메뉴
| ID | Lucide 명 | 사용처 |
|----|----------|--------|
| `i-dashboard` | layout-dashboard | 대시보드 (OP-01, TA-01, EM-01) |
| `i-building` | building | 테넌트, 회사 (OP-02/03/04, TA-13) |
| `i-credit-card` | credit-card | 구독/요금제 (OP-05) |
| `i-receipt` | receipt | 청구/정산 (OP-06) |
| `i-flag` | flag | 기능 플래그 (OP-07) |
| `i-ticket` | ticket | 지원 티켓 (OP-08) |
| `i-scroll` | scroll | 감사 로그 (OP-09) |
| `i-chart` | bar-chart-3 | 리포트 (OP-10, TA-12) |
| `i-settings` | settings | 시스템 설정 (OP-11, TA-13) |
| `i-clock` | clock | 근태 (TA-05/06, EM-02) |
| `i-calendar-days` | calendar-days | 휴가 (TA-07/08, EM-03/04) |
| `i-check-square` | check-square | 결재 (TA-09, EM-05) |
| `i-file-text` | file-text | 문서/계약 (TA-10/11, EM-06/07/08) |
| `i-users` | users | 직원 관리 (TA-02/03), 조직도 (TA-04) |
| `i-network` | network | 조직도 (TA-04) |
| `i-link` | link | 외부 연동 (TA-14) |

### 헤더 / 글로벌
| ID | Lucide 명 | 사용처 |
|----|----------|--------|
| `i-search` | search | 헤더 검색 (CM-18) |
| `i-bell` | bell | 헤더 알림 종 (CM-17) |
| `i-help` | help-circle | 헤더 도움말 (CM-19) |
| `i-user` | user | 프로필 메뉴 (CM-16) |
| `i-shield` | shield | 보안 설정 (EM-09, OP-12) |
| `i-logout` | log-out | 로그아웃 (CM-16) |
| `i-info` | info | 안내 메시지 |

### 액션 / 컨트롤
| ID | Lucide 명 | 사용처 |
|----|----------|--------|
| `i-plus` | plus | 신규 추가 |
| `i-edit` | pencil | 수정 |
| `i-copy` | copy | 복제 |
| `i-trash` | trash-2 | 삭제 |
| `i-download` | download | 다운로드/내보내기 |
| `i-upload` | upload | 업로드 |
| `i-save` | save | 저장 |
| `i-send` | send | 전송 |
| `i-paperclip` | paperclip | 첨부 |
| `i-pdf` | file | PDF 다운로드 |
| `i-excel` | file-spreadsheet | Excel 다운로드 |
| `i-eye` | eye | 상세 보기 |
| `i-history` | history | 변경 이력 |
| `i-tool` | wrench | 점검 모드 |
| `i-key` | key | API 키 |
| `i-database` | database | 데이터 보관 |
| `i-mail` | mail | 메일 |
| `i-monitor` | monitor | 데스크톱 세션 |
| `i-smartphone` | smartphone | 모바일 세션 |
| `i-more` | more-vertical | 행 액션 메뉴 (점 3개) |
| `i-more-h` | more-horizontal | 가로 점 3개 |

### 네비게이션
| ID | Lucide 명 | 사용처 |
|----|----------|--------|
| `i-chevron-down` | chevron-down | 드롭다운 화살표 |
| `i-chevron-up` | chevron-up | |
| `i-chevron-left` | chevron-left | 페이지네이션, 마법사 이전 |
| `i-chevron-right` | chevron-right | 페이지네이션, 마법사 다음 |
| `i-arrow-up` | arrow-up | KPI 상승 |
| `i-arrow-down` | arrow-down | KPI 하락 |
| `i-arrow-right` | arrow-right | 링크 강조 |
| `i-arrow-left` | arrow-left | 뒤로 |
| `i-x` | x | 닫기 (모달/토스트) |
| `i-menu` | menu | 햄버거 (모바일) |

### 상태 / 알림
| ID | Lucide 명 | 사용처 |
|----|----------|--------|
| `i-check` | check | 체크 (마법사 단계 완료) |
| `i-check-circle` | check-circle-2 | 성공 상태 |
| `i-alert-c` | alert-circle | 경고 |
| `i-alert-t` | alert-triangle | 위험 |
| `i-loader` | loader | 로딩 (스피너) |
| `i-activity` | activity | 시스템 상태 |
| `i-trending-up` | trending-up | MRR 상승 |
| `i-zap` | zap | Realtime |

## React 변환 매핑 (Phase 7)

```tsx
// packages/ui/icons.ts
import {
  LayoutDashboard, Building, CreditCard, Receipt, Flag, Ticket, Scroll,
  BarChart3, Settings, Clock, CalendarDays, CheckSquare, FileText,
  Users, Network, Link, Search, Bell, HelpCircle, User, Shield, LogOut, Info,
  Plus, Pencil, Copy, Trash2, Download, Upload, Save, Send, Paperclip,
  Eye, History, Wrench, Key, Database, Mail, Monitor, Smartphone, MoreVertical, MoreHorizontal,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowRight, ArrowLeft, X, Menu,
  Check, CheckCircle2, AlertCircle, AlertTriangle, Loader, Activity, TrendingUp, Zap
} from 'lucide-react';

export const Icons = {
  dashboard: LayoutDashboard,
  building: Building,
  // ... 위 카탈로그와 1:1 매핑
};
```

기본 사이즈: 16px (`.ico`), 14px (`.ico-sm`), 20px (`.ico-lg`).
