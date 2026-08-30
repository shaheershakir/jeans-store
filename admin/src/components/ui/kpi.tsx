'use client'

import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from './primitives'

export interface KpiProps {
  label: string
  value: string
  change: number | null
  changeLabel: string
  positiveIsGood?: boolean
  icon?: React.ReactNode
  hint?: string
}

export function KpiCard({ label, value, change, changeLabel, positiveIsGood = true, icon, hint }: KpiProps) {
  const good = change != null && (positiveIsGood ? change >= 0 : change <= 0)
  const neutral = change == null || Math.abs(change) < 0.05
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-ink-2">{label}</p>
        {icon && <span className="text-ink-3">{icon}</span>}
      </div>
      <p className="tnum mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{value}</p>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium',
            neutral ? 'bg-ink-4/10 text-ink-2' : good ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
          )}
        >
          {change == null ? (
            '—'
          ) : (
            <>
              {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </>
          )}
        </span>
        <span className="text-ink-3">{changeLabel}</span>
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-ink-4">{hint}</p>}
    </Card>
  )
}

export function StatPill({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }) {
  const color =
    tone === 'success'
      ? 'bg-success-soft text-success'
      : tone === 'warning'
        ? 'bg-warning-soft text-warning'
        : tone === 'danger'
          ? 'bg-danger-soft text-danger'
          : tone === 'info'
            ? 'bg-info-soft text-info'
            : 'bg-surface-subtle text-ink-2'
  return (
    <div className={cn('rounded-lg border px-3 py-2', color === 'bg-surface-subtle text-ink-2' ? 'border-line' : 'border-transparent')}>
      <p className="text-[11px] font-medium opacity-70">{label}</p>
      <p className="tnum text-lg font-semibold">{value}</p>
    </div>
  )
}