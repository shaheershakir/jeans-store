'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, MoreHorizontal, Truck, User } from 'lucide-react'
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
  onCardClick?: (order: OrderItemCardData) => void
}

export function KanbanCard({ order, onStatusChange, onPrint, onCardClick }: KanbanCardProps) {
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
      onClick={() => onCardClick?.(order)}
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

      {/* Middle Section: Prominent Image(s), Product Name, and Customer Info */}
      <div className="my-3">
        {/* Thumbnails Display: Main large image + optional stacked secondary thumbnails */}
        <div className="flex items-center gap-2">
          {/* Main Large Thumbnail */}
          <div className="relative h-[104px] w-[104px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/80 shrink-0">
            <Image
              src={order.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80'}
              alt={`${order.productName} preview 1`}
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>

          {/* Secondary Stacked Thumbnails (when multiple items) */}
          {order.images.length > 1 && (
            <div className="flex flex-col gap-2 shrink-0">
              {order.images.slice(1, 3).map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative h-[48px] w-[48px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/80"
                >
                  <Image
                    src={imgUrl}
                    alt={`${order.productName} preview ${idx + 2}`}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                  {idx === 1 && order.itemsCount > 3 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-[10px]">
                      +{order.itemsCount - 3}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Name, Customer & Location Below Images */}
        <div className="mt-2.5 space-y-1">
          <p
            className="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-foreground truncate leading-snug"
            title={order.productName}
          >
            {order.productName}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
            <User className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
            <span className="truncate">{order.customerName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-muted-foreground truncate">
            <MapPin className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
            <span className="truncate">{order.locationShort}</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Price, Shipped tag, Date, and Actions */}
      <div className="flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-slate-100 dark:border-border/60">
        <div className="flex items-center gap-2 flex-wrap">
          {isShipped ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
              <Truck className="h-3 w-3" />
              Shipped
            </span>
          ) : (
            <span className="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-foreground tnum">
              {formatINR(order.total)}
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
                      onSelect={() => onStatusChange(order.id, status)}
                      onClick={(e) => {
                        e.stopPropagation()
                        onStatusChange(order.id, status)
                      }}
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
