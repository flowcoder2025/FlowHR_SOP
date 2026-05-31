import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DomainPrefixInput } from './DomainPrefixInput';

describe('DomainPrefixInput', () => {
  it('input + 고정 suffix 렌더 (suffix는 mono 폰트)', () => {
    const html = renderToStaticMarkup(
      <DomainPrefixInput suffix=".flowhr.kr" placeholder="회사 슬러그" />,
    );
    expect(html).toContain('.flowhr.kr');
    expect(html).toContain('font-mono');
    expect(html).toContain('placeholder="회사 슬러그"');
  });

  it('input은 우측 radius/테두리 제거(suffix와 시각 연결)', () => {
    const html = renderToStaticMarkup(<DomainPrefixInput suffix=".flowhr.kr" />);
    expect(html).toContain('rounded-r-none');
    expect(html).toContain('border-r-0');
  });

  it('input 속성(defaultValue 등) 전달', () => {
    const html = renderToStaticMarkup(
      <DomainPrefixInput suffix=".flowhr.kr" defaultValue="myco" />,
    );
    expect(html).toContain('value="myco"');
  });
});
