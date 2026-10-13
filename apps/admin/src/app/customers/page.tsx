'use client'

import * as React from 'react'
import Link from 'next/link'
import { Eye, Search, Users } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Avatar, Button, Card, Input } from '@/components/ui/primitives'
import { formatINR } from '@/lib/format'

export default function CustomersPage() {
  const customers = useAdminStore((s) => s.data.customers)
  const orders = useAdminStore((s) => s.data.orders)

  const [query, setQuery] = React.useState('')

  const filteredCustomers = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers

    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q)
    )
  }, [customers, query])

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`Manage customer directory, address books, and purchase behavior (${customers.length} total customers)`}
      />

      <PageContent>
        {/* Search */}
        <Card className="p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <Input
              type="text"
              placeholder="Search by customer name, email, phone, city..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </Card>

        {/* Customer Directory Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Contact Info</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold text-center">Total Orders</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Spent</th>
                  <th className="px-4 py-3 font-semibold">Joined Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-3">
                      No customers found matching search query.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const customerOrders = orders.filter((o) => o.customerId === customer.id)
                    const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0)

                    return (
                      <tr key={customer.id} className="hover:bg-surface-subtle transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={customer.name} size="sm" />
                            <div>
                              <Link
                                href={`/customers/${customer.id}`}
                                className="font-semibold text-ink hover:text-primary"
                              >
                                {customer.name}
                              </Link>
                              <span className="block text-[11px] text-ink-3">
                                ID #{customer.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-2">
                          <p className="font-medium text-ink">{customer.email}</p>
                          <p className="text-[11px] text-ink-3">{customer.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-ink-2">
                          {customer.city}, {customer.state}
                          <span className="block text-[10px] text-ink-4">{customer.pincode}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold tnum text-ink">
                          {customerOrders.length}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tnum text-ink">
                          {formatINR(totalSpent)}
                        </td>
                        <td className="px-4 py-3 text-ink-3">
                          {new Date(customer.joinedAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/customers/${customer.id}`}>
                            <Button variant="secondary" size="sm">
                              <Eye className="h-3.5 w-3.5" /> Profile
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
