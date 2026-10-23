import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const baseFieldClasses =
  'h-[54px] w-full rounded-[10px] border bg-white px-3 pb-1 pt-5 text-base text-neutral-900 outline-none transition-[border-color,box-shadow] duration-150 sm:text-sm'

const fieldTone = (error?: string) =>
  error
    ? 'border-red-500 ring-4 ring-red-500/10 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
    : 'border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10'

const floatingLabelClasses =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400 transition-all duration-150 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-neutral-500 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-neutral-500 peer-autofill:top-2 peer-autofill:translate-y-0 peer-autofill:text-[11px] peer-autofill:text-neutral-500'

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  error?: string
  optional?: boolean
  trailing?: React.ReactNode
}

export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, id, error, optional, trailing, className, ...props }, ref) => {
    const isOptional = Boolean(optional && !label.toLowerCase().includes('optional'))

    return (
      <div className="min-w-0">
        <div className="relative">
          <input
            ref={ref}
            id={id}
            {...props}
            placeholder=" "
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(
              'peer',
              baseFieldClasses,
              fieldTone(error),
              'placeholder:text-transparent disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500',
              trailing ? 'pr-10' : undefined,
              className
            )}
          />
          <label htmlFor={id} className={floatingLabelClasses}>
            {label}
            {isOptional ? ' (optional)' : ''}
          </label>
          {trailing ? (
            <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
              {trailing}
            </span>
          ) : null}
        </div>
        {error ? (
          <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    )
  }
)
FloatingInput.displayName = 'FloatingInput'

export interface FloatingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  id: string
  error?: string
  optional?: boolean
}

export const FloatingSelect = React.forwardRef<HTMLSelectElement, FloatingSelectProps>(
  ({ label, id, error, optional, className, children, ...props }, ref) => {
    const isOptional = Boolean(optional && !label.toLowerCase().includes('optional'))

    return (
      <div className="min-w-0">
        <div className="relative">
          <select
            ref={ref}
            id={id}
            {...props}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(
              baseFieldClasses,
              fieldTone(error),
              'cursor-pointer appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-neutral-50',
              className
            )}
          >
            {children}
          </select>
          <label
            htmlFor={id}
            className="pointer-events-none absolute left-3 top-2 text-[11px] leading-tight text-neutral-500"
          >
            {label}
            {isOptional ? ' (optional)' : ''}
          </label>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
            aria-hidden="true"
          />
        </div>
        {error ? (
          <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    )
  }
)
FloatingSelect.displayName = 'FloatingSelect'
