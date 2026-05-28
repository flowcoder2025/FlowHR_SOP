import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

// 원천: .flowset/wireframes/_design-system/components.css `.card`
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-border bg-bg p-5 shadow-sm', className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('mb-3 text-sm font-semibold text-text', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardSubtitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-text-muted', className)} {...props} />
  ),
);
CardSubtitle.displayName = 'CardSubtitle';
