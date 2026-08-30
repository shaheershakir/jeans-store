'use client'

import * as React from 'react'
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortDir = 'asc' | 'desc'

export interface TableColumn<T> {
  key: string
  label: React.ReactNode
  sortable?: boolean
  hideOnMobile?: boolean
  render: (row: T) => React.ReactNode
}

export function useSort<T>(columns: TableColumn<T>[], initial?: { key: string; dir: SortDir }) {
  const [sort, setSort] = React.useState<{ key: string; dir: SortDir } | null>(initial ?? null)
  const sorted = React.useCallback(
    (rows: T[]) => {
      if (!sort) return rows
      const col = columns.find((c) => c.key === sort.key)
      if (!col?.sortable) return rows
      const dir = sort.dir === 'asc' ? 1 : -1
      return [...rows].sort((a, b) => {
        const av = a[sort.key as keyof T]
        const bv = b[sort.key as keyof T]
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
        return String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true }) * dir
      })
    },
    [sort, columns]
  )
  return { sort, setSort, sorted }
}

export function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: React.ReactNode
  sortKey: string
  sort: { key: string; dir: SortDir } | null
  onSort: (key: string) => void
}) {
  const active = sort?.key === sortKey
  const Icon = !active ? ChevronsUpDown : sort?.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        'group inline-flex items-center gap-1 font-semibold text-ink-2 transition-colors hover:text-ink',
        active && 'text-ink'
      )}
    >
      {label}
      <Icon className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-ink-4 group-hover:text-ink-3')} />
    </button>
  )
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  loadingRows?: number
  empty?: React.ReactNode
  onRowClick?: (row: T) => void
  mobileTitle?: (row: T) => React.ReactNode
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  loadingRows = 6,
  empty,
  onRowClick,
  mobileTitle,
}: TableProps<T>) {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-divider text-left text-xs text-ink-2">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2.5 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {loading
              ? Array.from({ length: loadingRows }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-ink-4/20" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-surface-subtle')}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 align-middle">
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-divider md:hidden">
        {loading
          ? Array.from({ length: loadingRows }).map((_, i) => (
              <div key={i} className="space-y-2 px-4 py-3">
                <div className="h-4 w-1/2 animate-pulse rounded bg-ink-4/20" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-ink-4/20" />
              </div>
            ))
          : rows.map((row) => (
              <div
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('px-4 py-3', onRowClick && 'cursor-pointer active:bg-surface-subtle')}
              >
                {mobileTitle ? (
                  mobileTitle(row)
                ) : (
                  <>
                    <div className="font-medium text-ink">{columns[0]?.render(row)}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      {columns.slice(1, 6).map((col) => (
                        <div key={col.key} className="text-xs text-ink-2">
                          <span className="text-ink-4">{String(col.label)} · </span>
                          {col.render(row)}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
      </div>

      {!loading && rows.length === 0 && empty}
    </div>
  )
}