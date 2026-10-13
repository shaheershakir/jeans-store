'use client'

import * as React from 'react'
import Link from 'next/link'
import { Banknote, CheckCircle, RefreshCw } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { processRefund } from '@/services/commerce'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card } from '@/components/ui/primitives'
import { RefundBadge } from '@/components/ui/status'
import { toastSuccess, toastError } from '@/components/ui/toast'
import { formatINR } from '@/lib/format'

export default function RefundsPage() {
  const refunds = useAdminStore((s) => s.data.refunds)
  const orders = useAdminStore((s) => s.data.orders)
  const customers = useAdminStore((s) => s.data.customers)

  const [loading, setLoading] = React.useState(false)

  const handleProcessRefund = async (refundId: number) => {
    try {
      setLoading(true)
      await processRefund(refundId)
      toastSuccess('Refund processed successfully.')
    } catch (err: any) {
      toastError(err?.message || 'Failed to process refund.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Refunds & Payouts"
        description="Review refund ledger, payment methods, and settlement status"
      />

      <PageContent>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
                  <th className="px-4 py-3 font-semibold">Refund #</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-3">
                      No refunds issued yet.
                    </td>
                  </tr>
                ) : (
                  refunds.map((ref) => {
                    const order = orders.find((o) => o.id === ref.orderId)
                    const customer = customers.find((c) => c.id === ref.customerId)

                    return (
                      <tr key={ref.id} className="hover:bg-surface-subtle transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-ink">{ref.number}</td>
                        <td className="px-4 py-3">
                          <Link href={`/orders/${ref.orderId}`} className="text-primary hover:underline font-medium">
                            {order?.number ?? `Order #${ref.orderId}`}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-ink-2">{customer?.name ?? 'Customer'}</td>
                        <td className="px-4 py-3 text-ink">{ref.method}</td>
                        <td className="px-4 py-3 text-right font-semibold tnum text-ink">
                          {formatINR(ref.amount)}
                        </td>
                        <td className="px-4 py-3 text-ink-2 max-w-xs truncate">{ref.reason}</td>
                        <td className="px-4 py-3">
                          <RefundBadge status={ref.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {ref.status === 'Pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleProcessRefund(ref.id)}
                              disabled={loading}
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Process Payment
                            </Button>
                          )}
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
