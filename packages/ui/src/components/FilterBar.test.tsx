import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FilterBar, FilterChip, FilterPanel } from './FilterBar';

describe('FilterBar', () => {
  it('컨테이너 + children 렌더', () => {
    const html = renderToStaticMarkup(
      <FilterBar>
        <span>칩</span>
      </FilterBar>,
    );
    expect(html).toContain('flex flex-wrap');
    expect(html).toContain('칩');
  });
});

describe('FilterChip', () => {
  it('active=true → accent-light 배경 + aria-pressed true', () => {
    const html = renderToStaticMarkup(<FilterChip active>활성</FilterChip>);
    expect(html).toContain('bg-accent-light');
    expect(html).toContain('aria-pressed="true"');
  });

  it('active 미지정 → 기본 테두리 + aria-pressed false', () => {
    const html = renderToStaticMarkup(<FilterChip>비활성</FilterChip>);
    expect(html).toContain('border-border');
    expect(html).toContain('aria-pressed="false"');
  });

  it('type 기본값 button', () => {
    const html = renderToStaticMarkup(<FilterChip>칩</FilterChip>);
    expect(html).toContain('type="button"');
  });
});

describe('FilterPanel', () => {
  it('제목 렌더, onClear 미지정 시 초기화 버튼 없음', () => {
    const html = renderToStaticMarkup(
      <FilterPanel title="필터">
        <div>본문</div>
      </FilterPanel>,
    );
    expect(html).toContain('필터');
    expect(html).toContain('본문');
    expect(html).not.toContain('초기화');
  });

  it('onClear 지정 시 초기화 버튼 표시 (clearLabel 기본 "초기화")', () => {
    const html = renderToStaticMarkup(
      <FilterPanel title="필터" onClear={() => {}}>
        <div>본문</div>
      </FilterPanel>,
    );
    expect(html).toContain('초기화');
    expect(html).toContain('text-accent');
  });
});
