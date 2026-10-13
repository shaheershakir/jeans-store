'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Send,
  ShieldCheck,
  Truck,
  User,
  XCircle,
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import {
  transitionOrder,
  setOrderPaymentStatus,
  addOrderNote,
  setOrderTracking,
} from '@/services/commerce'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, CardHeader, Field, Input, Select, Textarea } from '@/components/ui/primitives'
import { OrderBadge, PaymentBadge } from '@/components/ui/status'
import { toastSuccess, toastError } from '@/components/ui/toast'
import { formatINR } from '@/lib/format'
import type { FulfillmentStatus, PaymentStatus } from '@/lib/types'
import { fetchBackendOrders } from '@/services/commerce'

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = React.use(params)
  const orderId = parseInt(resolvedParams.id, 10)

  const orders = useAdminStore((s) => s.data.orders)
  const customers = useAdminStore((s) => s.data.customers)

  const order = orders.find((o) => o.id === orderId)
  const customer = customers.find((c) => c.id === order?.customerId)

  const [noteText, setNoteText] = React.useState('')
  const [carrier, setCarrier] = React.useState('Delhivery')
  const [trackingNumber, setTrackingNumber] = React.useState('')
  const [showTrackingModal, setShowTrackingModal] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [fetching, setFetching] = React.useState(!order)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (order) return
    let active = true
    void fetchBackendOrders()
      .catch((error) => { if (active) setLoadError(error instanceof Error ? error.message : 'Could not load order.') })
      .finally(() => { if (active) setFetching(false) })
    return () => { active = false }
  }, [order])

  if (fetching) {
    return <div><PageHeader title="Loading order…" /><PageContent><div className="py-12 text-center text-muted-foreground">Loading order details…</div></PageContent></div>
  }

  if (!order) {
    return (
      <div>
        <PageHeader
          title="Order Not Found"
          breadcrumbs={[{ label: 'Orders', href: '/orders' }, { label: 'Error' }]}
        />
        <PageContent>
          <div className="py-12 text-center text-ink-3">
            {loadError ?? `Order #${resolvedParams.id} could not be found.`}
          </div>
        </PageContent>
      </div>
    )
  }

  const handleTransition = async (to: FulfillmentStatus) => {
    if (to === 'Shipped' && (!order.carrier || !order.trackingNumber)) {
      setShowTrackingModal(true)
      return
    }

    try {
      setLoading(true)
      await transitionOrder(order.id, to)
      toastSuccess(`Order ${order.number} transitioned to ${to}.`)
    } catch (err: any) {
      toastError(err?.message || 'Transition failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleSetTracking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carrier.trim() || !trackingNumber.trim()) {
      return toastError('Please enter carrier and tracking number.')
    }

    try {
      setLoading(true)
      await setOrderTracking(order.id, carrier, trackingNumber)
      await transitionOrder(order.id, 'Shipped')
      toastSuccess(`Saved tracking & marked ${order.number} as Shipped.`)
      setShowTrackingModal(false)
    } catch (err: any) {
      toastError(err?.message || 'Failed to set tracking.')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentStatus = async (status: PaymentStatus) => {
    try {
      setLoading(true)
      await setOrderPaymentStatus(order.id, status)
      toastSuccess(`Payment for ${order.number} updated to ${status}.`)
    } catch (err: any) {
      toastError(err?.message || 'Payment status update failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return

    try {
      setLoading(true)
      await addOrderNote(order.id, noteText.trim(), true)
      toastSuccess('Internal note added.')
      setNoteText('')
    } catch (err: any) {
      toastError(err?.message || 'Failed to add note.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={`Order ${order.number}`}
        description={`Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`}
        breadcrumbs={[{ label: 'Orders', href: '/orders' }, { label: order.number }]}
      >
        <div className="flex items-center gap-2">
          <OrderBadge status={order.fulfillmentStatus} />
          <PaymentBadge status={order.paymentStatus} />
        </div>
      </PageHeader>

      <PageContent>
        {/* Action Controls Bar */}
        <Card className="p-4 bg-surface-subtle">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-2">Status Actions:</span>

              {order.fulfillmentStatus === 'Pending' && (
                <Button size="sm" onClick={() => handleTransition('Confirmed')} disabled={loading}>
                  <CheckCircle className="h-3.5 w-3.5" /> Confirm Order
                </Button>
              )}

              {order.fulfillmentStatus === 'Confirmed' && (
                <Button size="sm" onClick={() => handleTransition('Processing')} disabled={loading}>
                  <Package className="h-3.5 w-3.5" /> Start Processing
                </Button>
              )}

              {order.fulfillmentStatus === 'Processing' && (
                <Button size="sm" onClick={() => setShowTrackingModal(true)} disabled={loading}>
                  <Truck className="h-3.5 w-3.5" /> Ship Order
                </Button>
              )}

              {order.fulfillmentStatus === 'Shipped' && (
                <Button size="sm" onClick={() => handleTransition('Delivered')} disabled={loading}>
                  <CheckCircle className="h-3.5 w-3.5" /> Mark Delivered
                </Button>
              )}

              {order.fulfillmentStatus !== 'Cancelled' &&
                order.fulfillmentStatus !== 'Delivered' &&
                order.fulfillmentStatus !== 'Returned' && (
                  <Button
                    variant="danger-outline"
                    size="sm"
                    onClick={() => handleTransition('Cancelled')}
                    disabled={loading}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancel Order
                  </Button>
                )}
            </div>

            {/* Payment Quick Actions */}
            {order.paymentStatus !== 'Paid' && order.paymentStatus !== 'Refunded' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePaymentStatus('Paid')}
                disabled={loading}
              >
                Mark Payment as Paid
              </Button>
            )}
          </div>
        </Card>

        {/* Tracking Modal */}
        {showTrackingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
            <Card className="w-full max-w-md p-6 space-y-4 shadow-modal bg-surface">
              <div className="flex items-center justify-between border-b border-divider pb-3">
                <h3 className="text-base font-semibold text-ink">Shipping & Tracking</h3>
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="text-ink-3 hover:text-ink text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSetTracking} className="space-y-4">
                <Field label="Shipping Carrier" required>
                  <Select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                    <option value="Delhivery">Delhivery</option>
                    <option value="BlueDart">BlueDart</option>
                    <option value="Bluedart">Bluedart Express</option>
                    <option value="Ecom Express">Ecom Express</option>
                    <option value="DTDC">DTDC</option>
                    <option value="India Post">India Post</option>
                  </Select>
                </Field>

                <Field label="Tracking / AWB Number" required>
                  <Input
                    placeholder="e.g. IN982736412"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTrackingModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={loading}>
                    Confirm & Ship Order
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Items & Financials */}
          <div className="space-y-6 lg:col-span-2">
            {/* Order Items Table */}
            <Card>
              <CardHeader title="Order Items" subtitle={`${order.items.length} items purchased`} />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Item & Variant</th>
                      <th className="px-4 py-3 font-semibold">SKU</th>
                      <th className="px-4 py-3 font-semibold text-right">Price</th>
                      <th className="px-4 py-3 font-semibold text-center">Qty</th>
                      <th className="px-4 py-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-ink">{item.productName}</p>
                          <p className="text-[11px] text-ink-3">{item.variantLabel}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-ink-2">{item.sku}</td>
                        <td className="px-4 py-3 text-right tnum">{formatINR(item.price)}</td>
                        <td className="px-4 py-3 text-center font-semibold tnum">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-semibold tnum text-ink">
                          {formatINR(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Financial Summary */}
            <Card className="p-5">
              <div className="max-w-xs ml-auto space-y-2 text-xs">
                <div className="flex justify-between text-ink-2">
                  <span>Subtotal</span>
                  <span className="tnum font-medium text-ink">{formatINR(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span className="tnum font-medium">-{formatINR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-2">
                  <span>Shipping Fee</span>
                  <span className="tnum font-medium text-ink">
                    {formatINR(order.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-ink-2">
                  <span>Estimated Tax (12% GST)</span>
                  <span className="tnum font-medium text-ink">{formatINR(order.tax)}</span>
                </div>
                <div className="border-t border-divider pt-2 flex justify-between text-sm font-bold text-ink">
                  <span>Total Amount</span>
                  <span className="tnum text-primary">{formatINR(order.total)}</span>
                </div>
              </div>
            </Card>

            {/* Timeline & Notes */}
            <Card className="p-5 space-y-4">
              <CardHeader title="Internal Notes & History" />

              <form onSubmit={handleAddNote} className="space-y-2">
                <Textarea
                  rows={2}
                  placeholder="Add an internal note about this order..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={loading || !noteText.trim()}>
                    <Send className="h-3.5 w-3.5" /> Post Note
                  </Button>
                </div>
              </form>

              {/* Notes List */}
              {order.notes.length > 0 && (
                <div className="space-y-2 border-t border-divider pt-3">
                  {order.notes.map((n) => (
                    <div key={n.id} className="rounded-lg bg-surface-subtle p-3 text-xs">
                      <div className="flex justify-between text-ink-3 mb-1">
                        <span className="font-semibold text-ink">{n.by}</span>
                        <span>
                          {new Date(n.at).toLocaleDateString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-ink-2">{n.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Timeline */}
              <div className="border-t border-divider pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-ink">Order Activity Timeline</h4>
                <div className="relative pl-4 space-y-3 border-l-2 border-divider">
                  {order.timeline.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      <p className="text-xs font-semibold text-ink">{event.status}</p>
                      {event.note && <p className="text-[11px] text-ink-3">{event.note}</p>}
                      <p className="text-[10px] text-ink-4">
                        By {event.by} &bull;{' '}
                        {new Date(event.at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Customer & Shipping Sidebar */}
          <div className="space-y-6">
            <Card className="p-5 space-y-3">
              <CardHeader title="Customer Details" />

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-xs">
                  {customer?.name.charAt(0) ?? 'C'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink">{customer?.name ?? 'Guest User'}</p>
                  <p className="text-[11px] text-ink-3">{customer?.email}</p>
                  <p className="text-[11px] text-ink-3">{customer?.phone}</p>
                </div>
              </div>

              {customer && (
                <div className="pt-2">
                  <Link href={`/customers/${customer.id}`} className="text-xs font-medium text-primary hover:underline">
                    View Customer Profile &rarr;
                  </Link>
                </div>
              )}
            </Card>

            <Card className="p-5 space-y-3">
              <CardHeader title="Shipping Address" />

              {order.shippingAddress ? (
                <div className="text-xs text-ink-2 space-y-1">
                  <p className="font-semibold text-ink">{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
                    <span className="font-semibold">{order.shippingAddress.pincode}</span>
                  </p>
                  <p className="pt-1 text-ink-3">Phone: {order.shippingAddress.phone}</p>
                </div>
              ) : (
                <p className="text-xs text-ink-3">No address recorded.</p>
              )}
            </Card>

            <Card className="p-5 space-y-3">
              <CardHeader title="Fulfillment & Carrier" />

              <div className="text-xs space-y-2">
                <div>
                  <span className="text-ink-3 block">Carrier</span>
                  <span className="font-semibold text-ink">{order.carrier ?? 'Not assigned'}</span>
                </div>

                <div>
                  <span className="text-ink-3 block">Tracking Number</span>
                  <span className="font-mono text-ink">
                    {order.trackingNumber ?? 'Not available'}
                  </span>
                </div>

                {order.shippedAt && (
                  <div>
                    <span className="text-ink-3 block">Shipped Date</span>
                    <span className="text-ink">
                      {new Date(order.shippedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </PageContent>
    </div>
  )
}
