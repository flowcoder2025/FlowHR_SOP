import { type AnchorHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

// 원천: .flowset/wireframes/_design-system/components.css `.table` / `.row-link` / `.row-highlight-*` / `.pagination`(별도) (L378-401, OP-02 목록 표준)
// 제네릭 reusable primitive — 데이터 fetching/정렬 로직/필터는 호출측(화면 WI)이 소유. 본 컴포넌트는 표시 + 정렬 토글 신호만 담당.

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  /** 컬럼 식별자 (정렬 key + render 미지정 시 row[key] 접근) */
  key: string;
  header: ReactNode;
  /** 셀 렌더러 (미지정 시 row[key] 그대로 표시) */
  render?: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** 헤더 클릭 정렬 토글 허용 (onSortChange 동반 필요) */
  sortable?: boolean;
  /** colgroup 너비 (예: '18%', '120px') */
  width?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** 행 React key 추출 */
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** 행 강조 클래스 (예: rowHighlight.warning) */
  rowClassName?: (row: T) => string | undefined;
  sort?: SortState;
  onSortChange?: (next: SortState) => void;
  /** data가 0건일 때 표시할 내용 */
  empty?: ReactNode;
  className?: string;
}

/** `.row-highlight-*` SSOT → Tailwind 토큰 매핑. rowClassName에서 사용. */
export const rowHighlight = {
  warning: 'bg-warning-bg',
  danger: 'bg-danger-bg',
} as const;

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

/** `.table .row-link` — 표 셀 내 링크 헬퍼 (cell render에서 사용). */
export function RowLink({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn('cursor-pointer font-semibold text-accent hover:underline', className)}
      {...props}
    />
  );
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  rowClassName,
  sort,
  onSortChange,
  empty,
  className,
}: DataTableProps<T>) {
  const hasWidths = columns.some((c) => c.width != null);

  function toggleSort(key: string) {
    if (!onSortChange) return;
    const direction: SortDirection =
      sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ key, direction });
  }

  return (
    <table
      className={cn(
        'w-full border-collapse text-[13px] [&>tbody>tr:last-child>td]:border-b-0',
        className,
      )}
    >
      {hasWidths && (
        <colgroup>
          {columns.map((c) => (
            <col key={c.key} style={c.width != null ? { width: c.width } : undefined} />
          ))}
        </colgroup>
      )}
      <thead>
        <tr>
          {columns.map((c) => {
            const sortableNow = c.sortable === true && onSortChange != null;
            const isSorted = sort?.key === c.key;
            const ariaSort = c.sortable
              ? isSorted
                ? sort?.direction === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none'
              : undefined;
            return (
              <th
                key={c.key}
                aria-sort={ariaSort}
                onClick={sortableNow ? () => toggleSort(c.key) : undefined}
                className={cn(
                  'whitespace-nowrap border-b border-border bg-surface px-3 py-2.5 text-xs font-semibold text-text-muted',
                  alignClass[c.align ?? 'left'],
                  sortableNow && 'cursor-pointer select-none',
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {c.header}
                  {c.sortable === true && (
                    <span aria-hidden className="text-text-subtle">
                      {isSorted ? (sort?.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  )}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 && empty != null ? (
          <tr>
            <td colSpan={columns.length} className="px-3 py-3 align-middle">
              {empty}
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'hover:bg-surface',
                onRowClick && 'cursor-pointer',
                rowClassName?.(row),
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'border-b border-border-light px-3 py-3 align-middle',
                    alignClass[c.align ?? 'left'],
                  )}
                >
                  {c.render ? c.render(row) : ((row as Record<string, unknown>)[c.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
