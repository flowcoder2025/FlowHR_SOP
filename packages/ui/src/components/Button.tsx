import { type VariantProps, cva } from 'class-variance-authority';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

// 원천: .flowset/wireframes/_design-system/components.css `.btn`
const buttonVariants = cva(
  'inline-flex cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent font-semibold leading-none transition-all disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-primary',
        secondary: 'border-border bg-bg text-text hover:bg-surface-2',
        ghost: 'bg-transparent text-text-muted hover:bg-surface-2 hover:text-text',
        danger: 'bg-danger text-white hover:opacity-90',
      },
      size: {
        sm: 'h-[30px] gap-1 px-2.5 text-xs',
        md: 'h-9 px-3.5 text-[13px]',
        lg: 'h-11 gap-2 px-5 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
