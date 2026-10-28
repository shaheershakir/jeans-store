'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, MoreHorizontal, Truck } from 'lucide-react'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatINR } from '@/lib/format'
import { toastSuccess } from '@/components/ui/toast'
import type { FulfillmentStatus } from '@/lib/types'

export interface OrderItemCardData {
  id: string | number
  number: string
  productName: string
  variantLabel?: string
  customerName: string
  customerAddress1?: string
  customerAddress2?: string
  locationShort: string
  date: string
  rawDate: string
  paymentStatus: string
  paymentMethod: string
  fulfillmentStatus: FulfillmentStatus
  total: number
  itemsCount: number
  images: string[]
  state: string
}

interface KanbanCardProps {
  order: OrderItemCardData
  onStatusChange: (orderId: string | number, newStatus: FulfillmentStatus) => void
  onPrint?: (order: OrderItemCardData) => void
}

export function KanbanCard({ order, onStatusChange, onPrint }: KanbanCardProps) {
  const cardRef = React.useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isOver, setIsOver] = React.useState(false)

  React.useEffect(() => {
    const element = cardRef.current
    if (!element) return

    return combine(
      draggable({
        element,
        getInitialData: () => ({
          type: 'order-card',
          orderId: order.id,
          currentStatus: order.fulfillmentStatus,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) =>
          source.data.type === 'order-card' && source.data.orderId !== order.id,
        getData: () => ({
          type: 'order-card-target',
          targetOrderId: order.id,
          targetStatus: order.fulfillmentStatus,
        }),
        onDragEnter: () => setIsOver(true),
        onDragLeave: () => setIsOver(false),
        onDrop: () => setIsOver(false),
      })
    )
  }, [order.id, order.fulfillmentStatus])

  const copyOrderNumber = () => {
    void navigator.clipboard?.writeText(order.number)
    toastSuccess(`Copied ${order.number} to clipboard`)
  }

  const isShipped = order.fulfillmentStatus === 'Shipped'

  return (
    <div
      ref={cardRef}
      className={`group relative rounded-2xl border bg-white dark:bg-card p-4 transition-all duration-150 select-none cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-40 scale-[0.98] ring-2 ring-blue-500 shadow-md'
          : isOver
            ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/20 shadow-md'
            : 'border-slate-200/80 dark:border-border hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md shadow-xs'
      }`}
    >
      {/* Top Header: Order Number & Items Count */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/orders/${order.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-bold text-xs sm:text-[13px] tracking-tight text-slate-900 dark:text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {order.number}
        </Link>
        <span className="text-[11px] font-medium text-slate-400 dark:text-muted-foreground whitespace-nowrap">
          {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Middle Section: Thumbnails, Product Name, and Customer Info */}
      <div className="flex items-center gap-3 my-3">
        {/* Thumbnails row */}
        <div className="flex items-center gap-1.5 shrink-0">
          {order.images.slice(0, 3).map((imgUrl, idx) => (
            <div
              key={idx}
              className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/80"
            >
              <Image
                src={imgUrl}
                alt={`${order.productName} preview ${idx + 1}`}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Product Name, Customer & Location */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p
            className="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-foreground truncate leading-tight"
            title={order.productName}
          >
            {order.productName}
          </p>
          <p className="font-medium text-[11px] text-slate-600 dark:text-slate-400 truncate">
            {order.customerName}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-muted-foreground truncate">
            <MapPin className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
            <span className="truncate">{order.locationShort}</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Price, Shipped tag, Date, and Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-border/60">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-foreground tnum">
            {formatINR(order.total)}
          </span>

          {/* Shipped Status Pill if in Shipped */}
          {isShipped && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-md">
              <Truck className="h-3 w-3" />
              Shipped
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-400 dark:text-muted-foreground whitespace-nowrap">
            {order.date}
          </span>

          {/* 3-dots Menu Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Options for order ${order.number}`}
                onClick={(e) => e.stopPropagation()}
                className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-md">
              <DropdownMenuItem asChild>
                <Link href={`/orders/${order.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyOrderNumber}>Copy Order Number</DropdownMenuItem>
              {onPrint && (
                <DropdownMenuItem onClick={() => onPrint(order)}>Print Address Slip</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Move Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40 rounded-xl p-1 shadow-md">
                  {(
                    ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'] as FulfillmentStatus[]
                  ).map((status) => (
                    <DropdownMenuItem
                      key={status}
                      disabled={order.fulfillmentStatus === status}
                      onClick={() => onStatusChange(order.id, status)}
                    >
                      {status}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
