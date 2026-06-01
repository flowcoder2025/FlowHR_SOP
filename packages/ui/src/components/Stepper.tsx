import { cn } from '../lib/cn';

// 원천: .flowset/wireframes/_design-system/components.css `.stepper` / `.step` (§Stepper Wizard 좌측 7-step, OP-04 표준, L715-730 + 모바일 L804-805)
// KI-061 해소: G3 list 형식을 SSOT로 채택(G2 카드형 dead code 미사용). 컴포넌트화로 `.step` 자식 구조 정합.
// 비즈니스 로직 없는 reusable primitive — 단계 정의/검증/이동 제어는 호출측(화면 WI) 책임.

export interface StepperStep {
  /** 단계 라벨 */
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** 0-based 현재 활성 단계 인덱스 (03-components.md SSOT 명칭) */
  currentIndex: number;
  /** 단계 클릭 핸들러(선택). 미지정 시 모든 단계는 정적 표시(클릭 불가). */
  onStepClick?: (index: number) => void;
  /** 단계별 클릭 허용 판정(선택). 기본: 완료된 단계(index < currentIndex)만 클릭 가능. */
  isStepEnabled?: (index: number) => boolean;
  className?: string;
}

type StepStatus = 'completed' | 'active' | 'upcoming';

function statusOf(index: number, currentIndex: number): StepStatus {
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'active';
  return 'upcoming';
}

export function Stepper({ steps, currentIndex, onStepClick, isStepEnabled, className }: StepperProps) {
  return (
    <nav
      aria-label="단계"
      className={cn(
        'flex flex-col gap-1 p-4 max-md:flex-row max-md:overflow-x-auto max-md:p-2',
        className,
      )}
    >
      {steps.map((step, index) => {
        const status = statusOf(index, currentIndex);
        const enabled =
          onStepClick != null &&
          (isStepEnabled ? isStepEnabled(index) : status === 'completed');
        return (
          <button
            key={index}
            type="button"
            disabled={!enabled}
            aria-current={status === 'active' ? 'step' : undefined}
            onClick={enabled ? () => onStepClick?.(index) : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] max-md:shrink-0',
              enabled ? 'cursor-pointer hover:bg-surface-2' : 'cursor-default',
              status === 'active' && 'bg-accent-bg',
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                status === 'completed' && 'bg-success text-white',
                status === 'active' && 'bg-accent text-white',
                status === 'upcoming' && 'bg-surface-2 text-text-muted',
              )}
            >
              {status === 'completed' ? '✓' : index + 1}
            </span>
            <span className={cn(status === 'active' ? 'font-bold text-accent' : 'text-text')}>
              {step.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
Stepper.displayName = 'Stepper';
