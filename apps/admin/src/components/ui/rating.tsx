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
            i <= Math.round(value)
              ? 'fill-amber-400 text-amber-400 dark:fill-amber-400 dark:text-amber-400'
              : 'fill-muted text-muted-foreground/30'
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
          className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
        >
          <Star
            className={cn(
              'h-5 w-5 transition-colors',
              i <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40 hover:text-amber-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}