'use client'

import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Tone } from './primitives'
import { Badge } from './primitives'

export function PageHeader({
  title,
  description,
  children,
  breadcrumbs,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-background px-4 py-5 sm:px-6 sm:py-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
              {b.href ? (
                <Link href={b.href} className="transition-colors hover:text-foreground">
                  {b.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <Badge tone={tone}>{label}</Badge>
}

export function PageContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6', className)} {...props} />
}