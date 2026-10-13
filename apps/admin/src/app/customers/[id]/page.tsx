'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, MapPin, Phone, ShoppingCart, User } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Avatar, Card, CardHeader } from '@/components/ui/primitives'
import { OrderBadge } from '@/components/ui/status'
import { formatINR } from '@/lib/format'
import { fetchBackendOrders } from '@/services/commerce'

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = React.use(params)
  const customerId = parseInt(resolvedParams.id, 10)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    void fetchBackendOrders().catch(() => undefined).finally(() => setLoading(false))
  }, [])

  const customers = useAdminStore((s) => s.data.customers)
  const orders = useAdminStore((s) => s.data.orders)
  const returns = useAdminStore((s) => s.data.returns)

  const customer = customers.find((c) => c.id === customerId)
  const customerOrders = orders.filter((o) => o.customerId === customerId)
  const customerReturns = returns.filter((r) => r.customerId === customerId)
  const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0)

  if (loading) {
    return <div><PageHeader title="Customer" /><PageContent><p className="py-12 text-center text-ink-3">Loading customer details…</p></PageContent></div>
  }

  if (!customer) {
    return (
      <div>
        <PageHeader
          title="Customer Not Found"
          breadcrumbs={[{ label: 'Customers', href: '/customers' }, { label: 'Error' }]}
        />
        <PageContent>
          <div className="py-12 text-center text-ink-3">
            Customer with ID #{resolvedParams.id} could not be found.
          </div>
        </PageContent>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={`Customer ID #${customer.id} &bull; First order ${new Date(customer.joinedAt).toLocaleDateString('en-IN')}`}
        breadcrumbs={[{ label: 'Customers', href: '/customers' }, { label: customer.name }]}
      />

      <PageContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Customer Overview Sidebar */}
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={customer.name} size="lg" />
                <div>
                  <h3 className="text-base font-bold text-ink">{customer.name}</h3>
                  <p className="text-xs text-ink-3">Valued Customer</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-divider pt-3 text-xs text-ink-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-ink-3 shrink-0" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-ink-3 shrink-0" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-ink-3 shrink-0" />
                  <span>
                    {customer.city}, {customer.state} ({customer.pincode})
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <CardHeader title="Lifetime Value Metrics" />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-3">Total Orders</span>
                  <span className="font-bold text-ink tnum">{customerOrders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-3">Total Spent</span>
                  <span className="font-bold text-primary tnum">{formatINR(totalSpent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-3">Return Requests</span>
                  <span className="font-bold text-ink tnum">{customerReturns.length}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <CardHeader title="Saved Addresses" />
              {customer.addresses.length === 0 ? (
                <p className="text-xs text-ink-3">No addresses saved.</p>
              ) : (
                customer.addresses.map((addr) => (
                  <div key={addr.id} className="rounded-lg border border-line bg-surface-subtle p-3 text-xs space-y-1">
                    <p className="font-semibold text-ink">{addr.label} Address</p>
                    <p className="text-ink-2">{addr.line1}</p>
                    {addr.line2 && <p className="text-ink-2">{addr.line2}</p>}
                    <p className="text-ink-3">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                    <p className="text-ink-3 pt-1">Phone: {addr.phone}</p>
                  </div>
                ))
              )}
            </Card>
          </div>

          {/* Customer Order History */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader title="Purchase History" subtitle={`All ${customerOrders.length} orders placed by ${customer.name}`} />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Fulfillment</th>
                      <th className="px-4 py-3 font-semibold text-right">Total</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {customerOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-ink-3">
                          No orders placed by this customer yet.
                        </td>
                      </tr>
                    ) : (
                      customerOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-surface-subtle">
                          <td className="px-4 py-3 font-semibold text-ink font-mono">{order.number}</td>
                          <td className="px-4 py-3 text-ink-2">
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-3">
                            <OrderBadge status={order.fulfillmentStatus} />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tnum text-ink">
                            {formatINR(order.total)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/orders/${order.id}`} className="text-xs text-primary font-semibold hover:underline">
                              View Order &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </PageContent>
    </div>
  )
}
