'use client'

import * as React from 'react'
import Link from 'next/link'
import { Eye, Search, Printer, CheckSquare } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, Input, Select } from '@/components/ui/primitives'
import { OrderBadge, PaymentBadge } from '@/components/ui/status'
import { formatINR } from '@/lib/format'
import type { FulfillmentStatus } from '@/lib/types'
import { fetchBackendOrders } from '@/services/commerce'

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All Orders', value: 'all' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'Processing', value: 'Processing' },
  { label: 'Shipped', value: 'Shipped' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'Returned', value: 'Returned' },
]

export default function OrdersPage() {
  const orders = useAdminStore((s) => s.data.orders)
  const customers = useAdminStore((s) => s.data.customers)
  const settings = useAdminStore((s) => s.data.settings)

  const [activeTab, setActiveTab] = React.useState('all')
  const [query, setQuery] = React.useState('')
  const [paymentFilter, setPaymentFilter] = React.useState('all')
  const [regionFilter, setRegionFilter] = React.useState('all')
  const [selectedOrderIds, setSelectedOrderIds] = React.useState<number[]>([])
  const [printOrders, setPrintOrders] = React.useState<typeof orders>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    void fetchBackendOrders()
      .catch((error) => { if (active) setLoadError(error instanceof Error ? error.message : 'Could not load orders.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      const customer = customers.find((c) => c.id === order.customerId)
      const q = query.trim().toLowerCase()

      const matchesQuery =
        !q ||
        order.number.toLowerCase().includes(q) ||
        customer?.name.toLowerCase().includes(q) ||
        customer?.email.toLowerCase().includes(q) ||
        order.shippingAddress?.city?.toLowerCase().includes(q)

      const matchesTab = activeTab === 'all' || order.fulfillmentStatus === activeTab
      const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter
      const isKerala = order.shippingAddress?.state?.trim().toLowerCase() === 'kerala'
      const matchesRegion = regionFilter === 'all' || (regionFilter === 'kerala' ? isKerala : !isKerala)

      return matchesQuery && matchesTab && matchesPayment && matchesRegion
    })
  }, [orders, customers, query, activeTab, paymentFilter, regionFilter])

  React.useEffect(() => {
    if (!printOrders.length) return
    const timer = window.setTimeout(() => window.print(), 100)
    const reset = () => setPrintOrders([])
    window.addEventListener('afterprint', reset)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('afterprint', reset)
    }
  }, [printOrders])

  const toggleSelected = (orderId: number) => {
    setSelectedOrderIds((current) => current.includes(orderId)
      ? current.filter((id) => id !== orderId)
      : [...current, orderId])
  }

  const visibleSelected = filteredOrders.filter((order) => selectedOrderIds.includes(order.id))
  const allVisibleSelected = filteredOrders.length > 0 && visibleSelected.length === filteredOrders.length
  const toggleVisible = () => {
    setSelectedOrderIds((current) => allVisibleSelected
      ? current.filter((id) => !filteredOrders.some((order) => order.id === id))
      : [...new Set([...current, ...filteredOrders.map((order) => order.id)])])
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`Manage customer orders and fulfillment workflows (${orders.length} total orders)`}
      />

      <PageContent>
        {printOrders.length > 0 && (
          <div className="print-sheet" aria-hidden="true">
            {printOrders.map((order) => {
              const recipient = customers.find((customer) => customer.id === order.customerId)
              const address = order.shippingAddress
              return (
                <article className="address-slip" key={order.id}>
                  <div className="slip-order">Order: {order.number}</div>
                  <div className="slip-columns">
                    <section>
                      <h2>From</h2>
                      <strong>{settings.storeName || 'TEESGARAGE'}</strong>
                      {settings.address && <p>{settings.address}</p>}
                      {settings.supportPhone && <p>Phone: {settings.supportPhone}</p>}
                    </section>
                    <section>
                      <h2>To</h2>
                      <strong>{recipient?.name || 'Customer'}</strong>
                      {[address?.line1, address?.line2, address?.city, address?.state, address?.pincode]
                        .filter(Boolean).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
                      {address?.phone && <p>Phone: {address.phone}</p>}
                    </section>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex border-b border-line overflow-x-auto scrollbar-thin">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.value === 'all'
                ? orders.length
                : orders.filter((o) => o.fulfillmentStatus === tab.value).length
            const active = activeTab === tab.value

            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-2 hover:border-line-strong hover:text-ink'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? 'bg-primary-soft text-primary' : 'bg-surface-subtle text-ink-3'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search & Secondary Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
              <Input
                type="text"
                placeholder="Search order #, customer name, email, city..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="w-44">
              <Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <option value="all">All Payment Statuses</option>
                <option value="Pending">Pending Payment</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </Select>
            </div>
            <div className="w-48">
              <Select aria-label="Filter by delivery region" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
                <option value="all">All delivery regions</option>
                <option value="kerala">Inside Kerala</option>
                <option value="outside">Outside Kerala</option>
              </Select>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="secondary" size="sm" disabled={filteredOrders.length === 0 || loading} onClick={() => setPrintOrders(filteredOrders)}>
                <Printer className="h-3.5 w-3.5" /> Print visible ({filteredOrders.length})
              </Button>
              <Button variant="primary" size="sm" disabled={visibleSelected.length === 0 || loading} onClick={() => setPrintOrders(visibleSelected)}>
                <CheckSquare className="h-3.5 w-3.5" /> Print selected ({visibleSelected.length})
              </Button>
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
                  <th className="px-4 py-3"><input aria-label="Select all visible orders" type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} /></th>
                  <th className="px-4 py-3 font-semibold">Order Number</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Fulfillment</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {loadError ? (
                  <tr><td colSpan={8} className="py-8 text-center text-destructive">{loadError}</td></tr>
                ) : loading ? (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Loading orders…</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-3">
                      {orders.length === 0 ? 'No customer orders yet.' : 'No orders match these filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const customer = customers.find((c) => c.id === order.customerId)

                    return (
                      <tr key={order.id} className="hover:bg-surface-subtle transition-colors">
                        <td className="px-4 py-3"><input aria-label={`Select ${order.number}`} type="checkbox" checked={selectedOrderIds.includes(order.id)} onChange={() => toggleSelected(order.id)} /></td>
                        <td className="px-4 py-3 font-semibold text-ink">
                          <Link href={`/orders/${order.id}`} className="hover:text-primary hover:underline">
                            {order.number}
                          </Link>
                          <span className="block text-[10px] text-ink-3 font-normal">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">{customer?.name ?? 'Guest'}</p>
                          <p className="text-[11px] text-ink-3">
                            {customer?.city ?? ''}, {customer?.state ?? ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-ink-2">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <PaymentBadge status={order.paymentStatus} />
                            <span className="block text-[10px] text-ink-3">
                              {order.paymentMethod}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <OrderBadge status={order.fulfillmentStatus} />
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tnum text-ink">
                          {formatINR(order.total)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setPrintOrders([order])}>
                              <Printer className="h-3.5 w-3.5" /> Print
                            </Button>
                            <Link href={`/orders/${order.id}`}>
                              <Button variant="secondary" size="sm"><Eye className="h-3.5 w-3.5" /> View Order</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>
      <style jsx global>{`
        .print-sheet { display: none; }
        @media print {
          @page { size: A4; margin: 12mm; }
          body * { visibility: hidden !important; }
          .print-sheet, .print-sheet * { visibility: visible !important; }
          .print-sheet {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            color: #111;
            font-family: Arial, sans-serif;
          }
          .address-slip {
            box-sizing: border-box;
            height: 128mm;
            padding: 10mm;
            border: 1px solid #222;
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 8mm;
          }
          .slip-order { font-size: 11pt; margin-bottom: 12mm; }
          .slip-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; }
          .slip-columns h2 { font-size: 18pt; margin: 0 0 7mm; text-transform: uppercase; }
          .slip-columns strong { font-size: 12pt; }
          .slip-columns p { font-size: 11pt; line-height: 1.45; margin: 2mm 0 0; overflow-wrap: anywhere; }
          .address-slip:nth-child(2n) { break-after: page; page-break-after: always; }
        }
      `}</style>
    </div>
  )
}
