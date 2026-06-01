import { type AnchorHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';

// 원천: .flowset/wireframes/_design-system/components.css `.table` / `.row-link` / `.row-highlight-*` (L378-401, OP-02 목록 표준)
// 제네릭 reusable primitive — 데이터 fetching/정렬 로직/필터는 호출측(화면 WI)이 소유. 본 컴포넌트는 표시 + 정렬 토글 신호만 담당.

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

/** 정렬 토글 순수 로직 — 같은 컬럼 재클릭 시 asc→desc, 그 외 asc. (호출측 재사용 + 단위 검증용 export) */
export function nextSortState(current: SortState | undefined, key: string): SortState {
  const direction: SortDirection =
    current?.key === key && current.direction === 'asc' ? 'desc' : 'asc';
  return { key, direction };
}

export interface DataTableColumn<T> {
  /** 컬럼 식별자 (정렬 key + render 미지정 시 row[key] 접근) */
  key: string;
  header: ReactNode;
  /** 셀 렌더러 (미지정 시 row[key]를 primitive로 표시. 객체/배열 값은 render 필수) */
  render?: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** 헤더 클릭/Enter 정렬 토글 허용 (onSortChange 동반 필요) */
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

/** render 미지정 컬럼의 안전 출력 — primitive만 렌더, 객체/배열은 무시(render 필수). */
function renderCell(value: unknown): ReactNode {
  if (value == null) return null;
  if (typeof value === 'object') return null;
  return value as string | number | boolean;
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

  function handleRowKeyDown(e: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick?.(row);
    }
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
            const isSorted = sort?.key === c.key;
            const sortableNow = c.sortable === true && onSortChange != null;
            // aria-sort는 현재 정렬 중인 컬럼에만 부여(ARIA 권장).
            const ariaSort = isSorted
              ? sort?.direction === 'asc'
                ? 'ascending'
                : 'descending'
              : undefined;
            const indicator = c.sortable === true && (
              <span aria-hidden className="text-text-subtle">
                {isSorted ? (sort?.direction === 'asc' ? '↑' : '↓') : '↕'}
              </span>
            );
            return (
              <th
                key={c.key}
                aria-sort={ariaSort}
                className={cn(
                  'whitespace-nowrap border-b border-border bg-surface px-3 py-2.5 text-xs font-semibold text-text-muted',
                  alignClass[c.align ?? 'left'],
                )}
              >
                {sortableNow ? (
                  <button
                    type="button"
                    onClick={() => onSortChange(nextSortState(sort, c.key))}
                    className="inline-flex cursor-pointer select-none items-center gap-1 font-semibold text-text-muted"
                  >
                    {c.header}
                    {indicator}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {indicator}
                  </span>
                )}
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
              onKeyDown={onRowClick ? (e) => handleRowKeyDown(e, row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
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
                  {c.render ? c.render(row) : renderCell((row as Record<string, unknown>)[c.key])}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
