'use client'

import * as React from 'react'
import { CheckCircle2, Clock, Cpu, PackageCheck, Truck } from 'lucide-react'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { KanbanColumn, type KanbanColumnConfig } from './kanban-column'
import type { OrderItemCardData } from './kanban-card'
import type { FulfillmentStatus } from '@/lib/types'

const INITIAL_KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    status: 'Pending',
    title: 'Pending',
    icon: Clock,
    colorClass: {
      container: 'bg-[#fffaf5] dark:bg-orange-950/10 border-orange-200/80 dark:border-orange-900/40',
      headerIcon: 'bg-orange-100/80 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400',
      title: 'text-orange-900 dark:text-orange-300',
      countBadge: 'bg-orange-100/70 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    },
  },
  {
    status: 'Confirmed',
    title: 'Confirmed',
    icon: PackageCheck,
    colorClass: {
      container: 'bg-[#f7faff] dark:bg-blue-950/10 border-blue-200/80 dark:border-blue-900/40',
      headerIcon: 'bg-blue-100/80 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-300',
      countBadge: 'bg-blue-100/70 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    },
  },
  {
    status: 'Processing',
    title: 'Processing',
    icon: Cpu,
    colorClass: {
      container: 'bg-[#faf7ff] dark:bg-purple-950/10 border-purple-200/80 dark:border-purple-900/40',
      headerIcon: 'bg-purple-100/80 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
      title: 'text-purple-900 dark:text-purple-300',
      countBadge: 'bg-purple-100/70 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    },
  },
  {
    status: 'Shipped',
    title: 'Shipped',
    icon: Truck,
    colorClass: {
      container: 'bg-[#f6fcf8] dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-900/40',
      headerIcon: 'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      title: 'text-emerald-900 dark:text-emerald-300',
      countBadge: 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
  },
  {
    status: 'Delivered',
    title: 'Delivered',
    icon: CheckCircle2,
    colorClass: {
      container: 'bg-[#f6fcf8] dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-900/40',
      headerIcon: 'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      title: 'text-emerald-900 dark:text-emerald-300',
      countBadge: 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
  },
]

function reorder<T>({
  list,
  startIndex,
  finishIndex,
}: {
  list: T[]
  startIndex: number
  finishIndex: number
}): T[] {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(finishIndex, 0, removed)
  return result
}

function getReorderDestinationIndex({
  startIndex,
  indexOfTarget,
  closestEdgeOfTarget,
  axis,
}: {
  startIndex: number
  indexOfTarget: number
  closestEdgeOfTarget: 'left' | 'right' | 'top' | 'bottom' | null
  axis: 'horizontal' | 'vertical'
}): number {
  if (closestEdgeOfTarget === null) return indexOfTarget

  const isAfter =
    axis === 'horizontal' ? closestEdgeOfTarget === 'right' : closestEdgeOfTarget === 'bottom'

  if (startIndex < indexOfTarget) {
    return isAfter ? indexOfTarget : indexOfTarget - 1
  }
  if (startIndex > indexOfTarget) {
    return isAfter ? indexOfTarget + 1 : indexOfTarget
  }
  return startIndex
}

interface KanbanBoardProps {
  orders: OrderItemCardData[]
  countsByStatus: Record<string, number>
  onMoveOrder: (orderId: string | number, newStatus: FulfillmentStatus) => void
  onPrint?: (order: OrderItemCardData) => void
}

export function KanbanBoard({
  orders,
  countsByStatus,
  onMoveOrder,
  onPrint,
}: KanbanBoardProps) {
  // Columns state for horizontal column reordering
  const [columns, setColumns] = React.useState<KanbanColumnConfig[]>(INITIAL_KANBAN_COLUMNS)

  // Track explicit order sequence per column so that:
  // "when a item moved to next state it should be at last position"
  const [orderSequenceByColumn, setOrderSequenceByColumn] = React.useState<
    Record<string, Array<string | number>>
  >({})

  // Move order across columns (places moved card at the LAST position)
  const handleMoveOrderToState = React.useCallback(
    (orderId: string | number, newStatus: FulfillmentStatus) => {
      setOrderSequenceByColumn((prev) => {
        // Find existing orders currently in the destination status
        const existingInDest = orders
          .filter((o) => o.fulfillmentStatus.toLowerCase() === newStatus.toLowerCase())
          .map((o) => o.id)
          .filter((id) => String(id) !== String(orderId))

        // Get previously known sequence or fallback to existing orders
        const baseSequence = prev[newStatus]
          ? prev[newStatus].filter((id) => String(id) !== String(orderId))
          : existingInDest

        // Ensure all currently visible orders in destination are preserved in sequence
        for (const existingId of existingInDest) {
          if (!baseSequence.some((id) => String(id) === String(existingId))) {
            baseSequence.push(existingId)
          }
        }

        // Place the moved orderId at the VERY LAST position
        const updatedDestSequence = [...baseSequence, orderId]

        const updated = { ...prev }
        // Remove orderId from any other column sequence
        for (const key of Object.keys(updated)) {
          updated[key] = (updated[key] || []).filter((id) => String(id) !== String(orderId))
        }
        updated[newStatus] = updatedDestSequence
        return updated
      })

      // Notify parent
      onMoveOrder(orderId, newStatus)
    },
    [orders, onMoveOrder]
  )

  // Pragmatic Drag and Drop monitor for both horizontal column reorder and card movement
  React.useEffect(() => {
    return monitorForElements({
      onDrop: ({ source, location }) => {
        const dropTargets = location.current.dropTargets
        if (!dropTargets.length) return

        // 1. Column Horizontal Reordering
        if (source.data.type === 'column') {
          const target = dropTargets.find((t) => t.data.type === 'column-target')
          if (!target) return

          const sourceIndex = source.data.index as number
          const targetIndex = target.data.index as number
          const closestEdge = extractClosestEdge(target.data)

          if (sourceIndex === targetIndex && !closestEdge) return

          const destinationIndex = getReorderDestinationIndex({
            startIndex: sourceIndex,
            indexOfTarget: targetIndex,
            closestEdgeOfTarget: closestEdge as any,
            axis: 'horizontal',
          })

          const clampedIndex = Math.max(0, Math.min(destinationIndex, columns.length - 1))
          if (clampedIndex !== sourceIndex) {
            setColumns((prev) =>
              reorder({ list: prev, startIndex: sourceIndex, finishIndex: clampedIndex })
            )
          }
          return
        }

        // 2. Order Card Drag & Drop
        if (source.data.type === 'order-card') {
          const draggedOrderId = source.data.orderId as string | number
          const sourceStatus = source.data.currentStatus as FulfillmentStatus

          const cardTarget = dropTargets.find((t) => t.data.type === 'order-card-target')
          const columnTarget = dropTargets.find((t) => t.data.type === 'column-target')

          let destinationStatus: FulfillmentStatus | undefined

          if (columnTarget) {
            destinationStatus = columnTarget.data.columnStatus as FulfillmentStatus
          } else if (cardTarget) {
            destinationStatus = cardTarget.data.targetStatus as FulfillmentStatus
          }

          if (destinationStatus) {
            // When moved to next / different state, ensure it lands at the LAST position:
            if (destinationStatus !== sourceStatus) {
              handleMoveOrderToState(draggedOrderId, destinationStatus)
            }
          }
        }
      },
    })
  }, [columns, handleMoveOrderToState])

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-thin">
      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4.5 snap-x snap-mandatory scrollbar-none pb-2">
        {columns.map((col, index) => {
          // Filter all orders for this column
          const rawColOrders = orders.filter(
            (o) => o.fulfillmentStatus.toLowerCase() === col.status.toLowerCase()
          )

          // Sort orders according to orderSequenceByColumn so moved orders are at the LAST position
          const sequence = orderSequenceByColumn[col.status]
          let sortedOrders = rawColOrders

          if (sequence && sequence.length > 0) {
            sortedOrders = [...rawColOrders].sort((a, b) => {
              const idxA = sequence.findIndex((id) => String(id) === String(a.id))
              const idxB = sequence.findIndex((id) => String(id) === String(b.id))

              // If both are found in the sequence, follow sequence order
              if (idxA !== -1 && idxB !== -1) return idxA - idxB
              // If only one is in sequence, placed items go to their sequence position
              if (idxA !== -1) return idxA - 9999
              if (idxB !== -1) return 9999 - idxB
              return 0
            })
          }

          const totalCount = countsByStatus[col.status] ?? sortedOrders.length

          return (
            <div
              key={col.status}
              className="w-[82vw] sm:w-[320px] md:w-auto shrink-0 snap-center"
            >
              <KanbanColumn
                column={col}
                index={index}
                orders={sortedOrders}
                totalCount={totalCount}
                onStatusChange={handleMoveOrderToState}
                onPrint={onPrint}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
