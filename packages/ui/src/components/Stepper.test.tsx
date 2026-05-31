import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Stepper } from './Stepper';

const STEPS = [{ label: '회사정보' }, { label: '도메인' }, { label: '요금제' }];

describe('Stepper', () => {
  it('완료 단계는 체크(✓), 활성 단계는 번호 + accent, 예정 단계는 muted', () => {
    const html = renderToStaticMarkup(<Stepper steps={STEPS} current={1} />);
    // 0번: 완료 → ✓
    expect(html).toContain('✓');
    // 2번: 예정 → 번호 3 표시
    expect(html).toContain('>3<');
    // 활성(1번) 단계는 aria-current="step"
    expect(html).toContain('aria-current="step"');
    // 활성 step-num에 accent 배경
    expect(html).toContain('bg-accent');
    expect(html).toContain('회사정보');
    expect(html).toContain('도메인');
  });

  it('onStepClick 미지정 시 모든 단계 disabled(정적)', () => {
    const html = renderToStaticMarkup(<Stepper steps={STEPS} current={1} />);
    // 모든 button이 disabled
    const buttonCount = (html.match(/<button/g) ?? []).length;
    const disabledCount = (html.match(/disabled=""/g) ?? []).length;
    expect(buttonCount).toBe(3);
    expect(disabledCount).toBe(3);
  });

  it('onStepClick 지정 시 완료 단계만 enabled (기본 정책)', () => {
    const html = renderToStaticMarkup(
      <Stepper steps={STEPS} current={1} onStepClick={() => {}} />,
    );
    // current=1 → index 0(완료)만 enabled → disabled는 2개(활성+예정)
    const disabledCount = (html.match(/disabled=""/g) ?? []).length;
    expect(disabledCount).toBe(2);
  });

  it('aria-label로 네비게이션 영역 식별', () => {
    const html = renderToStaticMarkup(<Stepper steps={STEPS} current={0} />);
    expect(html).toContain('aria-label="단계"');
  });
});
