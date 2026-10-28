'use client'

import * as React from 'react'
import { GripVertical, MoreHorizontal, Package, type LucideIcon } from 'lucide-react'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { KanbanCard, type OrderItemCardData } from './kanban-card'
import type { FulfillmentStatus } from '@/lib/types'

export interface KanbanColumnConfig {
  status: FulfillmentStatus
  title: string
  icon: LucideIcon
  colorClass: {
    container: string
    headerIcon: string
    title: string
    countBadge: string
  }
}

interface KanbanColumnProps {
  column: KanbanColumnConfig
  index: number
  orders: OrderItemCardData[]
  totalCount: number
  onStatusChange: (orderId: string | number, newStatus: FulfillmentStatus) => void
  onPrint?: (order: OrderItemCardData) => void
}

export function KanbanColumn({
  column,
  index,
  orders,
  totalCount,
  onStatusChange,
  onPrint,
}: KanbanColumnProps) {
  const columnRef = React.useRef<HTMLDivElement | null>(null)
  const dragHandleRef = React.useRef<HTMLButtonElement | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isCardOver, setIsCardOver] = React.useState(false)
  const [closestEdge, setClosestEdge] = React.useState<Edge | null>(null)

  React.useEffect(() => {
    const element = columnRef.current
    const dragHandle = dragHandleRef.current
    if (!element) return

    return combine(
      draggable({
        element,
        dragHandle: dragHandle || undefined,
        getInitialData: () => ({
          type: 'column',
          status: column.status,
          index,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) =>
          source.data.type === 'column' || source.data.type === 'order-card',
        getData: ({ input, element: el }) => {
          return attachClosestEdge(
            {
              type: 'column-target',
              columnStatus: column.status,
              index,
            },
            {
              input,
              element: el,
              allowedEdges: ['left', 'right'],
            }
          )
        },
        onDragEnter: ({ source, self }) => {
          if (source.data.type === 'column') {
            if (source.data.index !== index) {
              setClosestEdge(extractClosestEdge(self.data))
            }
          } else {
            setIsCardOver(true)
          }
        },
        onDrag: ({ source, self }) => {
          if (source.data.type === 'column') {
            if (source.data.index !== index) {
              setClosestEdge(extractClosestEdge(self.data))
            }
          }
        },
        onDragLeave: () => {
          setClosestEdge(null)
          setIsCardOver(false)
        },
        onDrop: () => {
          setClosestEdge(null)
          setIsCardOver(false)
        },
      })
    )
  }, [column.status, index])

  const Icon = column.icon

  return (
    <div
      ref={columnRef}
      className={`group/column relative flex flex-col rounded-3xl border p-3.5 transition-all duration-150 min-h-[640px] ${
        column.colorClass.container
      } ${
        isDragging
          ? 'opacity-40 scale-[0.98] ring-2 ring-blue-500 shadow-lg'
          : isCardOver
            ? 'ring-2 ring-blue-500/70 border-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
            : ''
      }`}
    >
      {/* Horizontal Reorder Drop Indicators */}
      {closestEdge === 'left' && (
        <div className="pointer-events-none absolute left-0 top-2 bottom-2 w-1.5 bg-blue-600 rounded-full z-30 -translate-x-1 shadow-md animate-pulse" />
      )}
      {closestEdge === 'right' && (
        <div className="pointer-events-none absolute right-0 top-2 bottom-2 w-1.5 bg-blue-600 rounded-full z-30 translate-x-1 shadow-md animate-pulse" />
      )}

      {/* Column Header */}
      <div className="flex items-center justify-between px-1 py-1 mb-3">
        <div className="flex items-center gap-1.5">
          {/* Drag Handle for Horizontal Column Reorder */}
          <button
            ref={dragHandleRef}
            type="button"
            aria-label={`Drag to reorder ${column.title} column horizontally`}
            className="cursor-grab active:cursor-grabbing p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Drag to reorder column horizontally"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div
            className={`flex h-6 w-6 items-center justify-center rounded-lg ${column.colorClass.headerIcon}`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <h2 className={`font-bold text-sm tracking-tight ${column.colorClass.title}`}>
            {column.title}
          </h2>
          <span
            className={`ml-1 text-xs font-semibold px-2 py-0.5 rounded-full ${column.colorClass.countBadge}`}
          >
            {totalCount}
          </span>
        </div>

        {/* 3-dots Column Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Column options for ${column.title}`}
              className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl p-1 shadow-md">
            <DropdownMenuItem
              onClick={() => {
                orders.forEach((o) => {
                  const nextMap: Record<FulfillmentStatus, FulfillmentStatus> = {
                    Pending: 'Confirmed',
                    Confirmed: 'Processing',
                    Processing: 'Shipped',
                    Shipped: 'Delivered',
                    Delivered: 'Delivered',
                    Cancelled: 'Pending',
                    Returned: 'Pending',
                    'Out for Delivery': 'Delivered',
                    Refunded: 'Refunded',
                  }
                  const nextStatus = nextMap[column.status]
                  if (nextStatus && nextStatus !== column.status) {
                    onStatusChange(o.id, nextStatus)
                  }
                })
              }}
              disabled={orders.length === 0 || column.status === 'Delivered'}
            >
              Move all to next stage
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (orders.length > 0 && onPrint) {
                  onPrint(orders[0])
                }
              }}
              disabled={orders.length === 0}
            >
              Print column orders
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Orders Cards Drop Area */}
      <div className="flex-1 flex flex-col gap-3 min-h-[200px]">
        {orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-white dark:bg-card border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
              <Package className="h-6 w-6 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No {column.title.toLowerCase()} orders
            </p>
            <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-0.5 max-w-[180px]">
              {column.title} orders will appear here
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <KanbanCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
              onPrint={onPrint}
            />
          ))
        )}
      </div>
    </div>
  )
}
