'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Button as ShadcnButton,
  buttonVariants as shadcnButtonVariants,
} from '@/components/ui/button'
import { Badge as ShadcnBadge } from '@/components/ui/badge'
import {
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  Avatar as ShadcnAvatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton'
import { Input as ShadcnInput } from '@/components/ui/input'

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

export const buttonVariants: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs',
  secondary: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  danger: 'bg-destructive text-white shadow-xs hover:bg-destructive/90',
  'danger-ghost': 'text-destructive hover:bg-destructive/10',
  'danger-outline': 'border border-destructive text-destructive hover:bg-destructive/10',
}

type LegacyVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'danger-outline'
type ShadcnVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'

type ButtonProps = Omit<React.ComponentProps<typeof ShadcnButton>, 'variant' | 'size'> & {
  variant?: LegacyVariant | ShadcnVariant
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'default'
}

export function Button({ variant = 'default', size = 'default', className, ...props }: ButtonProps) {
  let mappedVariant: ShadcnVariant = 'default'
  if (variant === 'primary' || variant === 'default') mappedVariant = 'default'
  else if (variant === 'secondary' || variant === 'outline') mappedVariant = 'outline'
  else if (variant === 'ghost' || variant === 'danger-ghost') mappedVariant = 'ghost'
  else if (variant === 'danger' || variant === 'danger-outline' || variant === 'destructive') mappedVariant = 'destructive'
  else mappedVariant = variant as ShadcnVariant

  let mappedSize: 'default' | 'sm' | 'lg' | 'icon' = 'default'
  if (size === 'md' || size === 'default') mappedSize = 'default'
  else if (size === 'sm') mappedSize = 'sm'
  else if (size === 'lg') mappedSize = 'lg'
  else if (size === 'icon') mappedSize = 'icon'

  return (
    <ShadcnButton
      variant={mappedVariant}
      size={mappedSize}
      className={className}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

export const Input = ShadcnInput

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
        className
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 pr-8 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 cursor-pointer',
        'bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-[position:right_10px_center] bg-no-repeat',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Checkbox({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-input text-primary accent-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none cursor-pointer',
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
      <span className="text-xs font-semibold tracking-wide text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs font-medium text-destructive">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground border-border',
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
}

const DOT_CLASSES: Record<Tone, string> = {
  neutral: 'bg-muted-foreground',
  primary: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-destructive',
  info: 'bg-blue-500',
}

type BadgeProps = Omit<React.ComponentProps<typeof ShadcnBadge>, 'variant'> & {
  tone?: Tone
  children: React.ReactNode
  className?: string
  dot?: boolean
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export function Badge({
  tone = 'neutral',
  children,
  className,
  dot,
  variant,
  ...props
}: BadgeProps) {
  if (variant) {
    return (
      <ShadcnBadge variant={variant} className={className} {...props}>
        {dot && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />}
        {children}
      </ShadcnBadge>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT_CLASSES[tone])} />}
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export const Card = ShadcnCard
export { CardTitle, CardDescription, CardContent, CardFooter }

export function CardHeader({
  title,
  subtitle,
  action,
  className,
  children,
  ...props
}: {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
  children?: React.ReactNode
} & React.ComponentProps<typeof ShadcnCardHeader>) {
  if (children && !title) {
    return <ShadcnCardHeader className={className} {...props}>{children}</ShadcnCardHeader>
  }
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-border px-6 py-4', className)}>
      <div>
        {title && <h3 className="text-base font-semibold leading-tight text-foreground">{title}</h3>}
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Skeleton / spinner / avatar                                         */
/* ------------------------------------------------------------------ */

export const Skeleton = ShadcnSkeleton

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

export function Avatar({
  name,
  size = 'md',
  src,
  className,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  src?: string
  className?: string
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <ShadcnAvatar
      className={cn(
        size === 'sm' && 'h-6 w-6 text-[10px]',
        size === 'md' && 'h-8 w-8 text-xs',
        size === 'lg' && 'h-12 w-12 text-base',
        className
      )}
    >
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
        {initials || 'U'}
      </AvatarFallback>
    </ShadcnAvatar>
  )
}