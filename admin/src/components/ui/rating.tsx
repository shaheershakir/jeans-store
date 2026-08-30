'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Rating({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            i <= Math.round(value) ? 'fill-warning text-warning' : 'fill-ink-4/25 text-ink-4/25'
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          onClick={() => onChange(i)}
          className="p-0.5"
        >
          <Star
            className={cn('h-5 w-5 transition-colors', i <= value ? 'fill-warning text-warning' : 'text-ink-4')}
          />
        </button>
      ))}
    </div>
  )
}