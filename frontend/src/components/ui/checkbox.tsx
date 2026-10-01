import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          'h-4 w-4 rounded border-neutral-300 text-neutral-900 accent-neutral-900 focus:ring-neutral-900/20 cursor-pointer transition-colors',
          className
        )}
        {...props}
      />
    )
  }
)
Checkbox.displayName = 'Checkbox'
