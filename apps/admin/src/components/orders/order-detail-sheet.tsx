'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  Receipt,
  Truck,
  User,
  X,
  ChevronDown,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatINR } from '@/lib/format'
import { toastSuccess } from '@/components/ui/toast'
import type { FulfillmentStatus } from '@/lib/types'
import type { OrderItemCardData } from './kanban-card'

interface OrderDetailSheetProps {
  order: OrderItemCardData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (orderId: string | number, newStatus: FulfillmentStatus) => void
  onPrint?: (order: OrderItemCardData) => void
}

export function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  onStatusChange,
  onPrint,
}: OrderDetailSheetProps) {
  if (!order) return null

  const handlePrint = () => {
    if (onPrint) onPrint(order)
    else window.print()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl p-0 flex flex-col bg-white dark:bg-card border-t border-slate-200 dark:border-border overflow-hidden"
      >
        {/* Top Handle Bar */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Sheet Header */}
        <div className="px-5 pb-3 border-b border-slate-100 dark:border-border/60 flex items-start justify-between">
          <div>
            <SheetTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-foreground">
              Order {order.number}
            </SheetTitle>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              {order.date}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 px-2.5 py-0.5 text-[11px] font-bold">
                Paid
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  order.fulfillmentStatus === 'Confirmed'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                    : order.fulfillmentStatus === 'Processing'
                      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60'
                      : order.fulfillmentStatus === 'Shipped'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60'
                        : order.fulfillmentStatus === 'Delivered'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
                }`}
              >
                {order.fulfillmentStatus}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-xs">
          {/* Section 1: Customer */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-slate-50/50 dark:bg-slate-900/20 p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-foreground text-xs">
              <User className="h-4 w-4 text-slate-500" />
              <span>Customer</span>
            </div>
            <div className="space-y-1.5 pl-6">
              <p className="font-semibold text-sm text-slate-900 dark:text-foreground">
                {order.customerName}
              </p>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{order.customerEmail || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{order.customerPhone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{order.customerAddress2 || `${order.locationShort}, India`}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Items */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-slate-50/50 dark:bg-slate-900/20 p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-foreground text-xs">
              <Package className="h-4 w-4 text-slate-500" />
              <span>Items ({order.itemsCount})</span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-white dark:bg-card border border-slate-200/80 dark:border-slate-700 shrink-0">
                <Image
                  src={order.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=160&q=80'}
                  alt={order.productName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-foreground truncate">
                  {order.productName}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-0.5">
                  {order.variantLabel || 'Black / L'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-foreground tnum">
                  {formatINR(order.total)}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-muted-foreground mt-0.5">
                  Qty: {order.itemsCount}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Order Summary */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-slate-50/50 dark:bg-slate-900/20 p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-foreground text-xs">
              <Receipt className="h-4 w-4 text-slate-500" />
              <span>Order Summary</span>
            </div>
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{formatINR(order.subtotal ?? order.total)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                <span>{formatINR(order.shippingFee ?? 0)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Discount</span>
                <span>{order.discount ? `- ${formatINR(order.discount)}` : '₹0'}</span>
              </div>
              <div className="border-t border-slate-200/70 dark:border-border/60 pt-2 flex justify-between font-bold text-slate-900 dark:text-foreground text-sm">
                <span>Total Paid</span>
                <span>{formatINR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Payment */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-slate-50/50 dark:bg-slate-900/20 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-foreground text-xs">
                <CreditCard className="h-4 w-4 text-slate-500" />
                <span>Payment</span>
              </div>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 text-[10px] font-bold">
                Paid
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 pt-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {order.paymentMethod || 'Razorpay'}
              </span>
              <div className="text-right">
                <p className="text-[11px] font-mono text-slate-500">{order.paymentId || 'N/A'}</p>
                <p className="text-[10px] text-slate-400">{order.date}</p>
              </div>
            </div>
          </div>

          {/* Section 5: Shipping */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-slate-50/50 dark:bg-slate-900/20 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-foreground text-xs">
                <Truck className="h-4 w-4 text-slate-500" />
                <span>Shipping</span>
              </div>
              <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 px-2 py-0.5 text-[10px] font-bold">
                {order.fulfillmentStatus}
              </span>
            </div>
            <div className="space-y-1 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Standard Delivery</span>
                <span className="font-mono text-[11px] text-slate-500">{order.trackingNumber ? `AWB: ${order.trackingNumber}` : 'AWB: Pending'}</span>
              </div>
              <p className="text-[11px] text-slate-400">Estimated delivery: 27–28 Oct</p>
            </div>
          </div>
        </div>

        {/* Footer Fixed Action Bar */}
        <div className="p-4 border-t border-slate-200/80 dark:border-border bg-white dark:bg-card flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print Invoice</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition-colors"
              >
                <span>Update Status</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-md">
              {(
                ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'] as FulfillmentStatus[]
              ).map((status) => (
                <DropdownMenuItem
                  key={status}
                  disabled={order.fulfillmentStatus === status}
                  onSelect={() => {
                    onStatusChange(order.id, status)
                    toastSuccess(`Order updated to ${status}`)
                  }}
                  onClick={() => {
                    onStatusChange(order.id, status)
                    toastSuccess(`Order updated to ${status}`)
                  }}
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SheetContent>
    </Sheet>
  )
}
