import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';
import { Input } from './Input';

// 원천: .flowset/wireframes/_design-system/components.css `.domain-prefix` / `.domain-suffix` (L355-357, OP-04 슬러그 입력 표준)
// 입력값 뒤에 고정 도메인 접미사를 붙이는 reusable primitive (예: [myco].flowhr.kr).

export interface DomainPrefixInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 입력 뒤에 고정 표시되는 도메인 접미사 (예: '.flowhr.kr') */
  suffix: string;
}

export const DomainPrefixInput = forwardRef<HTMLInputElement, DomainPrefixInputProps>(
  ({ className, suffix, ...props }, ref) => (
    <div className="flex items-stretch">
      <Input ref={ref} className={cn('rounded-r-none border-r-0', className)} {...props} />
      <span className="flex items-center rounded-r-md border border-l-0 border-border bg-surface-2 px-4 font-mono text-sm text-text-muted">
        {suffix}
      </span>
    </div>
  ),
);
DomainPrefixInput.displayName = 'DomainPrefixInput';
