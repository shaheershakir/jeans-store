'use client'

import * as React from 'react'
import { SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearch } from '@/context/search-provider'
import { Button } from './ui/button'

export function Search({
  className = '',
  placeholder = 'Search...',
  ...props
}: React.ComponentProps<'button'> & { placeholder?: string }) {
  const { setOpen } = useSearch()
  return (
    <Button
      {...props}
      variant="outline"
      className={cn(
        'group relative h-9 w-full flex-1 justify-start rounded-md bg-muted/30 text-sm font-normal text-muted-foreground shadow-none hover:bg-accent sm:w-48 sm:pe-12 md:flex-none lg:w-64',
        className
      )}
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => setOpen(true)}
    >
      <SearchIcon
        aria-hidden="true"
        className="absolute left-2.5 top-1/2 -translate-y-1/2"
        size={16}
      />
      <span className="ml-5 truncate">{placeholder}</span>
      <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 select-none group-hover:bg-accent sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  )
}
