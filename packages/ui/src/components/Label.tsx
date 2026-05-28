import { type LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

// 원천: .flowset/wireframes/_design-system/components.css `.label`
export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('mb-1.5 block text-[13px] font-semibold text-text', className)}
      {...props}
    >
      {children}
      {required && <span className="text-danger"> *</span>}
    </label>
  ),
);
Label.displayName = 'Label';
