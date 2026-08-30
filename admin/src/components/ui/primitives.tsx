'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

export const buttonVariants: Record<string, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover shadow-card disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface-subtle hover:border-line-strong disabled:opacity-50',
  ghost: 'text-ink-2 hover:text-ink hover:bg-surface-subtle disabled:opacity-50',
  danger: 'bg-danger text-white hover:bg-red-700 disabled:opacity-50',
  'danger-ghost': 'text-danger hover:bg-danger-soft disabled:opacity-50',
  'danger-outline': 'border border-danger text-danger hover:bg-danger-soft disabled:opacity-50',
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants
  size?: 'sm' | 'md' | 'icon'
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        size === 'sm' && 'h-8 px-2.5 text-[13px]',
        size === 'md' && 'h-9 px-3.5 text-sm',
        size === 'icon' && 'h-8 w-8',
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-4',
        'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15',
        'disabled:bg-surface-subtle disabled:text-ink-4 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-4',
        'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15',
        'disabled:bg-surface-subtle disabled:text-ink-4',
        className
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-9 w-full appearance-none rounded-lg border border-line bg-surface px-3 pr-8 text-sm text-ink',
        'bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23667085%27 stroke-width=%272.5%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-[position:right_10px_center] bg-no-repeat',
        'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-line-strong accent-primary',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        className
      )}
      {...props}
    />
  )
}

export function Field({
  label,
  error,
  hint,
  children,
  className,
  required,
}: {
  label: string
  error?: string | null
  hint?: string
  children: React.ReactNode
  className?: string
  required?: boolean
}) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="text-[13px] font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-ink-3">{hint}</span>
      ) : null}
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

const TONE_STYLES: Record<Tone, string> = {
  neutral: 'bg-ink-4/10 text-ink-2 border border-line',
  primary: 'bg-primary-soft text-primary border border-primary/15',
  success: 'bg-success-soft text-success border border-success/15',
  warning: 'bg-warning-soft text-warning border border-warning/15',
  danger: 'bg-danger-soft text-danger border border-danger/15',
  info: 'bg-info-soft text-info border border-info/15',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
  dot,
}: {
  tone?: Tone
  children: React.ReactNode
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_STYLES[tone],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColor(tone))} />}
      {children}
    </span>
  )
}

function dotColor(tone: Tone): string {
  switch (tone) {
    case 'success':
      return 'bg-success'
    case 'warning':
      return 'bg-warning'
    case 'danger':
      return 'bg-danger'
    case 'info':
      return 'bg-info'
    case 'primary':
      return 'bg-primary'
    default:
      return 'bg-ink-3'
  }
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-[var(--radius-card)] border border-line bg-surface shadow-card', className)}
      {...props}
    />
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-divider px-4 py-3.5 sm:px-5', className)}>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Skeleton / spinner / avatar                                         */
/* ------------------------------------------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-ink-4/30', className)} />
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-4 w-4 animate-spin text-current', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

const AVATAR_COLORS = [
  'bg-primary-soft text-primary',
  'bg-success-soft text-success',
  'bg-warning-soft text-warning',
  'bg-info-soft text-info',
  'bg-danger-soft text-danger',
]

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
  const color = AVATAR_COLORS[name.length % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        size === 'sm' && 'h-6 w-6 text-[10px]',
        size === 'md' && 'h-8 w-8 text-xs',
        size === 'lg' && 'h-12 w-12 text-base',
        color
      )}
    >
      {initials}
    </span>
  )
}