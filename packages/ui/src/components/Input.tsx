import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

// 원천: .flowset/wireframes/_design-system/components.css `.input`
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text',
        'focus:border-accent focus:outline-2 focus:[outline-offset:-1px] focus:outline-accent',
        'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
