import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

// 원천: .flowset/wireframes/_design-system/components.css `.settings-shell` / `.pane-canvas` (L959-960) + `.vert-tabs` / `.vert-tab` (L760-772 + 모바일 L798-801, TA-13 회사설정 9탭 표준)
// reusable primitive — 탭 정의/활성 상태/패널 내용은 호출측(화면 WI)이 소유.

export interface VerticalTab {
  id: string;
  label: ReactNode;
  /** 좌측 아이콘(선택) */
  icon?: ReactNode;
}

export interface VerticalTabsProps {
  tabs: VerticalTab[];
  activeId: string;
  onChange: (id: string) => void;
  /** 네비게이션 영역 aria-label (기본 '설정 탭') */
  ariaLabel?: string;
  className?: string;
}

// 설정 탭은 패널 콘텐츠를 화면 WI가 소유하므로(primitive 범위에서 tabpanel 연결 불가),
// 불완전한 ARIA tabs 패턴 대신 nav + aria-current로 정직하게 구현(codex WI-030 권고).
/** 세로 탭 네비게이션 (`.vert-tabs` / `.vert-tab`). 모바일에서 가로 스크롤. */
export function VerticalTabs({ tabs, activeId, onChange, ariaLabel = '설정 탭', className }: VerticalTabsProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn('flex flex-col gap-0.5 max-md:flex-row max-md:overflow-x-auto', className)}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex w-full cursor-pointer items-center gap-2 rounded-md border-l-[3px] px-3.5 py-2.5 text-left text-[13px]',
              'max-md:w-auto max-md:shrink-0 max-md:border-l-0 max-md:border-b-[3px]',
              active
                ? 'border-l-accent bg-accent-bg font-bold text-accent max-md:border-b-accent'
                : 'border-transparent text-text-muted hover:bg-surface-2 hover:text-text',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
VerticalTabs.displayName = 'VerticalTabs';

export interface SettingsPaneProps {
  /** 좌측 네비게이션 (보통 <VerticalTabs/>) */
  nav: ReactNode;
  children: ReactNode;
  className?: string;
}

/** 설정 화면 셸 (`.settings-shell` 220px+1fr 그리드 + `.pane-canvas`). 모바일에서 단일 컬럼. */
export function SettingsPane({ nav, children, className }: SettingsPaneProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[220px_1fr] items-start gap-4 max-md:grid-cols-1',
        className,
      )}
    >
      <aside>{nav}</aside>
      <div className="relative">{children}</div>
    </div>
  );
}
SettingsPane.displayName = 'SettingsPane';
