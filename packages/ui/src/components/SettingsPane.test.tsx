import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SettingsPane, VerticalTabs, type VerticalTab } from './SettingsPane';

const TABS: VerticalTab[] = [
  { id: 'company', label: '회사정보' },
  { id: 'work', label: '근무정책' },
  { id: 'security', label: '보안' },
];

describe('VerticalTabs', () => {
  it('nav(aria-label) + 모든 탭 렌더', () => {
    const html = renderToStaticMarkup(
      <VerticalTabs tabs={TABS} activeId="company" onChange={() => {}} />,
    );
    expect(html).toContain('aria-label="설정 탭"');
    expect(html).toContain('회사정보');
    expect(html).toContain('근무정책');
    expect(html).toContain('보안');
  });

  it('활성 탭 → aria-current page + accent 강조', () => {
    const html = renderToStaticMarkup(
      <VerticalTabs tabs={TABS} activeId="work" onChange={() => {}} />,
    );
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('border-l-accent');
    expect(html).toContain('bg-accent-bg');
    // 비활성 탭은 muted
    expect(html).toContain('text-text-muted');
  });

  it('아이콘(선택) 렌더', () => {
    const withIcon: VerticalTab[] = [{ id: 'a', label: '탭', icon: <i data-icon="lock" /> }];
    const html = renderToStaticMarkup(
      <VerticalTabs tabs={withIcon} activeId="a" onChange={() => {}} />,
    );
    expect(html).toContain('data-icon="lock"');
  });
});

describe('SettingsPane', () => {
  it('220px+1fr 그리드 셸 + nav/children 슬롯', () => {
    const html = renderToStaticMarkup(
      <SettingsPane nav={<nav>좌측탭</nav>}>
        <div>패널 본문</div>
      </SettingsPane>,
    );
    expect(html).toContain('grid-cols-[220px_1fr]');
    expect(html).toContain('좌측탭');
    expect(html).toContain('패널 본문');
    // pane-canvas relative
    expect(html).toContain('relative');
  });

  it('모바일 단일 컬럼 override', () => {
    const html = renderToStaticMarkup(
      <SettingsPane nav={<nav />}>
        <div />
      </SettingsPane>,
    );
    expect(html).toContain('max-md:grid-cols-1');
  });
});
