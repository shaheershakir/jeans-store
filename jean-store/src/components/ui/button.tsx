import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/10 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
          variant === 'default' &&
            'bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm active:scale-[0.99]',
          variant === 'outline' &&
            'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 shadow-sm active:scale-[0.99]',
          variant === 'secondary' &&
            'bg-neutral-100 text-neutral-900 hover:bg-neutral-200/80',
          variant === 'ghost' &&
            'hover:bg-neutral-100 hover:text-neutral-900',
          size === 'default' && 'h-11 px-4 py-2.5',
          size === 'sm' && 'h-9 px-3 text-xs',
          size === 'lg' && 'h-12 px-6 text-base',
          size === 'icon' && 'h-10 w-10',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
