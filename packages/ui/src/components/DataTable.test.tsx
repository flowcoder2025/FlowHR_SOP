import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataTable, RowLink, rowHighlight, type DataTableColumn } from './DataTable';

interface Row {
  id: string;
  name: string;
  amount: number;
  state: 'ok' | 'warn';
}

const DATA: Row[] = [
  { id: 't1', name: '플로우상사', amount: 990000, state: 'ok' },
  { id: 't2', name: '치킨플러스', amount: 350000, state: 'warn' },
];

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'name', header: '회사명', sortable: true, render: (r) => <RowLink>{r.name}</RowLink> },
  { key: 'amount', header: '월요금', align: 'right' },
];

describe('DataTable', () => {
  it('헤더 + 셀(render/기본 접근)을 렌더', () => {
    const html = renderToStaticMarkup(
      <DataTable columns={COLUMNS} data={DATA} rowKey={(r) => r.id} />,
    );
    expect(html).toContain('회사명');
    expect(html).toContain('월요금');
    // render 적용 → RowLink(accent)
    expect(html).toContain('플로우상사');
    expect(html).toContain('text-accent');
    // render 미지정 컬럼 → row[key] 값 그대로
    expect(html).toContain('990000');
  });

  it('align=right → 우측 정렬 클래스', () => {
    const html = renderToStaticMarkup(
      <DataTable columns={COLUMNS} data={DATA} rowKey={(r) => r.id} />,
    );
    expect(html).toContain('text-right');
  });

  it('정렬 미적용 sortable 컬럼은 ↕ 표시 + aria-sort none', () => {
    const html = renderToStaticMarkup(
      <DataTable columns={COLUMNS} data={DATA} rowKey={(r) => r.id} onSortChange={() => {}} />,
    );
    expect(html).toContain('↕');
    expect(html).toContain('aria-sort="none"');
  });

  it('정렬 적용 시 방향 지시자(↑) + aria-sort ascending', () => {
    const html = renderToStaticMarkup(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        rowKey={(r) => r.id}
        sort={{ key: 'name', direction: 'asc' }}
        onSortChange={() => {}}
      />,
    );
    expect(html).toContain('↑');
    expect(html).toContain('aria-sort="ascending"');
  });

  it('rowClassName으로 행 강조(rowHighlight)', () => {
    const html = renderToStaticMarkup(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        rowKey={(r) => r.id}
        rowClassName={(r) => (r.state === 'warn' ? rowHighlight.warning : undefined)}
      />,
    );
    expect(html).toContain('bg-warning-bg');
    expect(rowHighlight.warning).toBe('bg-warning-bg');
    expect(rowHighlight.danger).toBe('bg-danger-bg');
  });

  it('data 0건 + empty → empty 노드를 colSpan으로 표시', () => {
    const html = renderToStaticMarkup(
      <DataTable
        columns={COLUMNS}
        data={[]}
        rowKey={(r) => r.id}
        empty={<span>결과 없음</span>}
      />,
    );
    expect(html).toContain('결과 없음');
    expect(html).toContain('colSpan="2"');
  });
});
