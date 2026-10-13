'use client'

import * as React from 'react'
import Link from 'next/link'
import { Check, RotateCcw, X } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { transitionReturn } from '@/services/commerce'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card } from '@/components/ui/primitives'
import { ReturnBadge } from '@/components/ui/status'
import { toastSuccess, toastError } from '@/components/ui/toast'
import { formatINR } from '@/lib/format'
import type { ReturnStatus } from '@/lib/types'

export default function ReturnsPage() {
  const returns = useAdminStore((s) => s.data.returns)
  const orders = useAdminStore((s) => s.data.orders)
  const customers = useAdminStore((s) => s.data.customers)

  const [loading, setLoading] = React.useState(false)

  const handleTransition = async (returnId: number, to: ReturnStatus) => {
    try {
      setLoading(true)
      await transitionReturn(returnId, to)
      toastSuccess(`Return request updated to ${to}.`)
    } catch (err: any) {
      toastError(err?.message || 'Failed to update return status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Returns Management"
        description="Process customer return requests, pickups, and restock operations"
      />

      <PageContent>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
                  <th className="px-4 py-3 font-semibold">Return ID</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Reason & Details</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-3">
                      No return requests recorded.
                    </td>
                  </tr>
                ) : (
                  returns.map((ret) => {
                    const order = orders.find((o) => o.id === ret.orderId)
                    const customer = customers.find((c) => c.id === ret.customerId)

                    return (
                      <tr key={ret.id} className="hover:bg-surface-subtle transition-colors">
                        <td className="px-4 py-3 font-semibold text-ink font-mono">{ret.number}</td>
                        <td className="px-4 py-3">
                          <Link href={`/orders/${ret.orderId}`} className="font-medium text-primary hover:underline">
                            {order?.number ?? `Order #${ret.orderId}`}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-ink-2">{customer?.name ?? 'Customer'}</td>
                        <td className="px-4 py-3 text-ink">
                          <p className="font-semibold">{ret.reason}</p>
                          <p className="text-[11px] text-ink-3">{ret.details}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tnum text-ink">
                          {formatINR(ret.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <ReturnBadge status={ret.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {ret.status === 'Requested' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleTransition(ret.id, 'Approved')}
                                  disabled={loading}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger-outline"
                                  size="sm"
                                  onClick={() => handleTransition(ret.id, 'Rejected')}
                                  disabled={loading}
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {ret.status === 'Approved' && (
                              <Button
                                size="sm"
                                onClick={() => handleTransition(ret.id, 'Pickup Scheduled')}
                                disabled={loading}
                              >
                                Schedule Pickup
                              </Button>
                            )}

                            {ret.status === 'Pickup Scheduled' && (
                              <Button
                                size="sm"
                                onClick={() => handleTransition(ret.id, 'Received')}
                                disabled={loading}
                              >
                                Mark Received
                              </Button>
                            )}

                            {ret.status === 'Received' && (
                              <Button
                                size="sm"
                                onClick={() => handleTransition(ret.id, 'Refunded')}
                                disabled={loading}
                              >
                                Trigger Refund
                              </Button>
                            )}
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
    </div>
  )
}
