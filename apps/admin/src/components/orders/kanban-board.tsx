'use client'

import * as React from 'react'
import { CheckCircle2, Clock, Cpu, PackageCheck, Truck } from 'lucide-react'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { extractClosestEdge, type Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
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
  onCardClick?: (order: OrderItemCardData) => void
}

export function KanbanBoard({
  orders,
  countsByStatus,
  onMoveOrder,
  onPrint,
  onCardClick,
}: KanbanBoardProps) {
  // Columns state for horizontal column reordering
  const [columns, setColumns] = React.useState<KanbanColumnConfig[]>(INITIAL_KANBAN_COLUMNS)

  // Track explicit order sequence per column
  const [orderSequenceByColumn, setOrderSequenceByColumn] = React.useState<
    Record<string, Array<string | number>>
  >({})

  // Compute the current order list for a column
  const getColumnOrders = React.useCallback(
    (status: FulfillmentStatus): OrderItemCardData[] => {
      const rawColOrders = orders.filter(
        (o) => o.fulfillmentStatus.toLowerCase() === status.toLowerCase()
      )

      let baseOrders = [...rawColOrders]
      // Increasing date order for Pending (19 Oct at first, then 20 Oct, and so on)
      if (status.toLowerCase() === 'pending') {
        baseOrders.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
      }

      const sequence = orderSequenceByColumn[status]
      if (sequence && sequence.length > 0) {
        baseOrders.sort((a, b) => {
          const idxA = sequence.findIndex((id) => String(id) === String(a.id))
          const idxB = sequence.findIndex((id) => String(id) === String(b.id))

          if (idxA !== -1 && idxB !== -1) return idxA - idxB
          if (idxA !== -1) return idxA - 9999
          if (idxB !== -1) return 9999 - idxB
          return 0
        })
      }

      return baseOrders
    },
    [orders, orderSequenceByColumn]
  )

  // Reorder a card within the SAME column
  const handleReorderCardWithinColumn = React.useCallback(
    (
      status: FulfillmentStatus,
      draggedOrderId: string | number,
      targetOrderId: string | number,
      closestEdge: Edge | null
    ) => {
      const currentOrders = getColumnOrders(status)
      const sourceIndex = currentOrders.findIndex((o) => String(o.id) === String(draggedOrderId))
      const targetIndex = currentOrders.findIndex((o) => String(o.id) === String(targetOrderId))

      if (sourceIndex === -1 || targetIndex === -1) return

      const destinationIndex = getReorderDestinationIndex({
        startIndex: sourceIndex,
        indexOfTarget: targetIndex,
        closestEdgeOfTarget: closestEdge,
        axis: 'vertical',
      })

      if (destinationIndex === sourceIndex) return

      const reorderedIds = reorder({
        list: currentOrders.map((o) => o.id),
        startIndex: sourceIndex,
        finishIndex: destinationIndex,
      })

      setOrderSequenceByColumn((prev) => ({
        ...prev,
        [status]: reorderedIds,
      }))
    },
    [getColumnOrders]
  )

  // Move a card across columns to a SPECIFIC target position
  const handleMoveOrderToStateWithPosition = React.useCallback(
    (
      draggedOrderId: string | number,
      targetStatus: FulfillmentStatus,
      targetOrderId: string | number,
      closestEdge: Edge | null
    ) => {
      const destOrders = getColumnOrders(targetStatus).filter(
        (o) => String(o.id) !== String(draggedOrderId)
      )
      const targetIndex = destOrders.findIndex((o) => String(o.id) === String(targetOrderId))

      let insertIndex = destOrders.length
      if (targetIndex !== -1) {
        insertIndex = closestEdge === 'bottom' ? targetIndex + 1 : targetIndex
      }

      const newSequence = destOrders.map((o) => o.id)
      newSequence.splice(insertIndex, 0, draggedOrderId)

      setOrderSequenceByColumn((prev) => {
        const updated = { ...prev }
        for (const key of Object.keys(updated)) {
          updated[key] = (updated[key] || []).filter((id) => String(id) !== String(draggedOrderId))
        }
        updated[targetStatus] = newSequence
        return updated
      })

      onMoveOrder(draggedOrderId, targetStatus)
    },
    [getColumnOrders, onMoveOrder]
  )

  // Move order across columns (places moved card at the LAST position)
  const handleMoveOrderToState = React.useCallback(
    (orderId: string | number, newStatus: FulfillmentStatus) => {
      setOrderSequenceByColumn((prev) => {
        const destOrders = getColumnOrders(newStatus).filter(
          (o) => String(o.id) !== String(orderId)
        )
        const updatedDestSequence = [...destOrders.map((o) => o.id), orderId]

        const updated = { ...prev }
        for (const key of Object.keys(updated)) {
          updated[key] = (updated[key] || []).filter((id) => String(id) !== String(orderId))
        }
        updated[newStatus] = updatedDestSequence
        return updated
      })

      onMoveOrder(orderId, newStatus)
    },
    [getColumnOrders, onMoveOrder]
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
          const sourceStatus = (source.data.currentStatus as FulfillmentStatus) || ''

          const cardTarget = dropTargets.find((t) => t.data.type === 'order-card-target')
          const columnTarget = dropTargets.find((t) => t.data.type === 'column-target')

          if (cardTarget) {
            const targetOrderId = cardTarget.data.targetOrderId as string | number
            const targetStatus = cardTarget.data.targetStatus as FulfillmentStatus
            const closestEdge = extractClosestEdge(cardTarget.data)

            if (sourceStatus.toLowerCase() === targetStatus.toLowerCase()) {
              // 2a. Reordering within the SAME column
              handleReorderCardWithinColumn(targetStatus, draggedOrderId, targetOrderId, closestEdge)
              return
            } else {
              // 2b. Moving to a DIFFERENT column at a specific card position
              handleMoveOrderToStateWithPosition(
                draggedOrderId,
                targetStatus,
                targetOrderId,
                closestEdge
              )
              return
            }
          } else if (columnTarget) {
            const destinationStatus = columnTarget.data.columnStatus as FulfillmentStatus
            if (destinationStatus && destinationStatus.toLowerCase() !== sourceStatus.toLowerCase()) {
              // 2c. Dropped onto column body -> place at LAST position
              handleMoveOrderToState(draggedOrderId, destinationStatus)
            }
          }
        }
      },
    })
  }, [
    columns,
    handleReorderCardWithinColumn,
    handleMoveOrderToStateWithPosition,
    handleMoveOrderToState,
  ])

  // Smooth auto-scroll while dragging a card near viewport top/bottom
  React.useEffect(() => {
    let animId: number | null = null
    let scrollDirection = 0

    const scrollLoop = () => {
      if (scrollDirection !== 0) {
        const container = document.querySelector('.overflow-y-auto') as HTMLElement | null
        if (container) {
          container.scrollBy({ top: scrollDirection * 14, behavior: 'auto' })
        } else {
          window.scrollBy({ top: scrollDirection * 14, behavior: 'auto' })
        }
        animId = requestAnimationFrame(scrollLoop)
      } else {
        animId = null
      }
    }

    const handleDragOver = (e: DragEvent) => {
      const topThreshold = 100
      const bottomThreshold = window.innerHeight - 100

      if (e.clientY < topThreshold) {
        scrollDirection = -1
        if (!animId) animId = requestAnimationFrame(scrollLoop)
      } else if (e.clientY > bottomThreshold) {
        scrollDirection = 1
        if (!animId) animId = requestAnimationFrame(scrollLoop)
      } else {
        scrollDirection = 0
      }
    }

    const handleDragEnd = () => {
      scrollDirection = 0
      if (animId) {
        cancelAnimationFrame(animId)
        animId = null
      }
    }

    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragend', handleDragEnd)
    window.addEventListener('drop', handleDragEnd)

    return () => {
      scrollDirection = 0
      if (animId) cancelAnimationFrame(animId)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragend', handleDragEnd)
      window.removeEventListener('drop', handleDragEnd)
    }
  }, [])

  return (
    <div className="w-full overflow-x-auto pb-6 scrollbar-thin">
      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4.5 snap-x snap-mandatory scrollbar-none pb-2 items-stretch min-h-[calc(100vh-280px)]">
        {columns.map((col, index) => {
          const sortedOrders = getColumnOrders(col.status)
          const totalCount = countsByStatus[col.status] ?? sortedOrders.length

          return (
            <div
              key={col.status}
              className="w-[82vw] sm:w-[320px] md:w-auto shrink-0 snap-center flex flex-col h-full"
            >
              <KanbanColumn
                column={col}
                index={index}
                orders={sortedOrders}
                totalCount={totalCount}
                onStatusChange={handleMoveOrderToState}
                onPrint={onPrint}
                onCardClick={onCardClick}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
