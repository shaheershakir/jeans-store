'use client'

import * as React from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from './card'

export interface KpiProps {
  label: string
  value: string
  change: number | null
  changeLabel: string
  positiveIsGood?: boolean
  icon?: React.ReactNode
  hint?: string
}

export function KpiCard({
  label,
  value,
  change,
  changeLabel,
  positiveIsGood = true,
  icon,
  hint,
}: KpiProps) {
  const good = change != null && (positiveIsGood ? change >= 0 : change <= 0)
  const neutral = change == null || Math.abs(change) < 0.05

  return (
    <Card className="gap-0 p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {icon && <span className="text-muted-foreground/80">{icon}</span>}
      </div>
      <p className="tnum mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold text-xs',
            neutral
              ? 'bg-muted text-muted-foreground'
              : good
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-destructive/10 text-destructive'
          )}
        >
          {change == null ? (
            '—'
          ) : (
            <>
              {change >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(change).toFixed(1)}%
            </>
          )}
        </span>
        <span className="text-muted-foreground">{changeLabel}</span>
      </div>
      {hint && <p className="mt-2 text-[11px] text-muted-foreground/80">{hint}</p>}
    </Card>
  )
}

export function StatPill({
  label,
  value,
  tone,
}: {
  label: string
  value: React.ReactNode
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}) {
  const color =
    tone === 'success'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : tone === 'warning'
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        : tone === 'danger'
          ? 'bg-destructive/10 text-destructive border-destructive/20'
          : tone === 'info'
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
            : 'bg-muted/50 text-foreground border-border'

  return (
    <div className={cn('rounded-lg border px-3.5 py-2.5 transition-colors', color)}>
      <p className="text-[11px] font-medium opacity-75 uppercase tracking-wider">{label}</p>
      <p className="tnum text-lg font-bold tracking-tight mt-0.5">{value}</p>
    </div>
  )
}