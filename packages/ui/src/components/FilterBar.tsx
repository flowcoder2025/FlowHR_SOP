import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
} from 'react';
import { cn } from '../lib/cn';

// 원천: .flowset/wireframes/_design-system/components.css `.filter-bar` / `.filter-chip` / `.filter-panel` (L421-430, OP-02 목록 필터 표준)
// reusable primitive — 필터 상태/적용 로직은 호출측(화면 WI)이 소유.

/** 가로 칩 필터 바 컨테이너 (`.filter-bar`). */
export const FilterBar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg px-4 py-3',
        className,
      )}
      {...props}
    />
  ),
);
FilterBar.displayName = 'FilterBar';

export interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** 필터 칩 (`.filter-chip` + `.is-active`). */
export const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ className, active = false, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(
        'inline-flex h-7 cursor-pointer items-center gap-1 rounded-pill border px-3 text-xs leading-none',
        active
          ? 'border-accent bg-accent-light font-semibold text-primary'
          : 'border-border bg-bg text-text hover:bg-surface-2',
        className,
      )}
      {...props}
    />
  ),
);
FilterChip.displayName = 'FilterChip';

export interface FilterPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  /** 초기화 핸들러(선택) — 지정 시 제목 우측에 초기화 버튼 표시. */
  onClear?: () => void;
  clearLabel?: ReactNode;
}

/** 사이드 필터 패널 (`.filter-panel`). */
export const FilterPanel = forwardRef<HTMLDivElement, FilterPanelProps>(
  ({ className, title, onClear, clearLabel = '초기화', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-border bg-bg p-4 shadow-sm', className)}
      {...props}
    >
      <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-text">
        {title}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer text-xs font-medium text-accent"
          >
            {clearLabel}
          </button>
        )}
      </h3>
      {children}
    </div>
  ),
);
FilterPanel.displayName = 'FilterPanel';
