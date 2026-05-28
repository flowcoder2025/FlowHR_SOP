import { type VariantProps, cva } from 'class-variance-authority';
import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

// 원천: .flowset/wireframes/_design-system/components.css `.banner`
const alertVariants = cva(
  'flex items-start gap-2.5 rounded-md border px-4 py-3.5 text-[13px]',
  {
    variants: {
      variant: {
        info: 'border-accent bg-info-bg text-primary',
        warning: 'border-warning bg-warning-bg text-warning',
        danger: 'border-danger bg-danger-bg text-danger',
        success: 'border-success bg-success-bg text-success',
      },
    },
    defaultVariants: { variant: 'info' },
  },
);

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, role = 'alert', ...props }, ref) => (
    <div ref={ref} role={role} className={cn(alertVariants({ variant }), className)} {...props} />
  ),
);
Alert.displayName = 'Alert';

export { alertVariants };
