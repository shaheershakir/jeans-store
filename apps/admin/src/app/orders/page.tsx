'use client'

import * as React from 'react'
import Link from 'next/link'
import { Eye, Search, Plus, ShoppingCart, Filter } from 'lucide-react'
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

  const [activeTab, setActiveTab] = React.useState('all')
  const [query, setQuery] = React.useState('')
  const [paymentFilter, setPaymentFilter] = React.useState('all')
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

      return matchesQuery && matchesTab && matchesPayment
    })
  }, [orders, customers, query, activeTab, paymentFilter])

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`Manage customer orders and fulfillment workflows (${orders.length} total orders)`}
      />

      <PageContent>
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
          </div>
        </Card>

        {/* Orders Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
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
                  <tr><td colSpan={7} className="py-8 text-center text-destructive">{loadError}</td></tr>
                ) : loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading orders…</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-3">
                      {orders.length === 0 ? 'No customer orders yet.' : 'No orders match these filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const customer = customers.find((c) => c.id === order.customerId)

                    return (
                      <tr key={order.id} className="hover:bg-surface-subtle transition-colors">
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
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="secondary" size="sm">
                              <Eye className="h-3.5 w-3.5" /> View Order
                            </Button>
                          </Link>
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
    </div>
  )
}
