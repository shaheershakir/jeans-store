'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Minimal dropdown menu. Renders inline children; caller provides the
 * trigger. Closes on outside pointer / Escape.
 */
export function Dropdown({
  button,
  children,
  align = 'right',
}: {
  button: React.ReactNode
  children: React.ReactNode | ((close: () => void) => React.ReactNode)
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((v) => !v)}>{button}</div>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-30 mt-1 min-w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-pop',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-surface-subtle',
        danger ? 'text-danger' : 'text-ink'
      )}
    >
      {children}
    </button>
  )
}

export function MenuDivider() {
  return <div className="my-1 border-t border-divider" />
}