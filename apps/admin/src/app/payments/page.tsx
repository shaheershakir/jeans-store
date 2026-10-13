'use client'

import * as React from 'react'
import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/primitives'
import { PaymentBadge } from '@/components/ui/status'
import { formatINR } from '@/lib/format'
import { fetchBackendOrders } from '@/services/commerce'

export default function PaymentsPage() {
  const payments = useAdminStore((s) => s.data.payments)
  const orders = useAdminStore((s) => s.data.orders)

  React.useEffect(() => {
    void fetchBackendOrders().catch(() => undefined)
  }, [])

  return (
    <div>
      <PageHeader title="Payment Transactions" description="Gateway audit log, payment methods breakdown, and settlement records" />

      <PageContent>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
                  <th className="px-4 py-3 font-semibold">Payment ID</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Gateway</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-right">Gateway fee</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {payments.map((p) => {
                  const order = orders.find((o) => o.id === p.orderId)

                  return (
                    <tr key={p.id} className="hover:bg-surface-subtle transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-ink">PAY-{p.id}</td>
                      <td className="px-4 py-3">
                        <Link href={`/orders/${p.orderId}`} className="font-medium text-primary hover:underline">
                          {order?.number ?? `Order #${p.orderId}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink">{p.method}</td>
                      <td className="px-4 py-3 text-ink-2">{p.gateway}</td>
                      <td className="px-4 py-3 text-right font-semibold tnum text-ink">{formatINR(p.amount)}</td>
                      <td className="px-4 py-3 text-right tnum text-ink-3">{p.gatewayFee == null ? '—' : formatINR(p.gatewayFee)}</td>
                      <td className="px-4 py-3">
                        <PaymentBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-2">
                        {p.settled ? (
                          <span className="text-success font-semibold">Yes</span>
                        ) : (
                          <span className="text-warning font-semibold">Pending</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>
    </div>
  )
}
