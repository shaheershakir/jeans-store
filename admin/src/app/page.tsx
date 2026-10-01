'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeAlert,
  Clock,
  Package,
  Plus,
  RotateCcw,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Warehouse,
  LayoutTemplate,
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { KpiCard, StatPill } from '@/components/ui/kpi'
import { Button, Card, CardHeader, Badge } from '@/components/ui/primitives'
import { RevenueAreaChart, BreakdownBarChart, DonutChart, CHART_COLORS } from '@/components/ui/charts'
import { OrderBadge } from '@/components/ui/status'
import { kpis, series, salesByFit, salesByColor } from '@/lib/analytics'
import { formatINR } from '@/lib/format'

export default function DashboardPage() {
  const data = useAdminStore((s) => s.data)
  const { products, orders, returns } = data

  // Calculate analytics metrics
  const kpiData = React.useMemo(() => kpis(data, 30), [data])
  const dailySeries = React.useMemo(() => series(data, 14), [data])
  const fitsData = React.useMemo(() => salesByFit(data).map((x) => ({ key: x.key, value: x.units })), [data])

  const pendingOrders = orders.filter((o) => o.fulfillmentStatus === 'Pending' || o.fulfillmentStatus === 'Processing')
  const lowStockCount = products.flatMap((p) => p.variants).filter((v) => v.stock <= v.reorderPoint).length
  const pendingReturns = returns.filter((r) => r.status === 'Requested')

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of INFIT store performance, orders, inventory and fulfillment"
      >
        <Link href="/settings/homepage">
          <Button variant="outline" size="sm">
            <LayoutTemplate className="h-4 w-4 mr-1.5 text-primary" /> Edit Homepage
          </Button>
        </Link>
        <Link href="/products/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </Link>
        <Link href="/ai">
          <Button variant="secondary" size="sm">
            <Sparkles className="h-4 w-4 text-primary" /> AI Insights
          </Button>
        </Link>
      </PageHeader>

      <PageContent>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total Revenue"
            value={formatINR(kpiData.revenue.value)}
            change={kpiData.revenue.change}
            changeLabel="vs last month"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KpiCard
            label="Total Orders"
            value={kpiData.orders.value.toString()}
            change={kpiData.orders.change}
            changeLabel="vs last month"
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <KpiCard
            label="Average Order Value"
            value={formatINR(kpiData.aov.value)}
            change={kpiData.aov.change}
            changeLabel="vs last month"
            icon={<Package className="h-4 w-4" />}
          />
          <KpiCard
            label="Pending Fulfillment"
            value={pendingOrders.length.toString()}
            change={pendingOrders.length > 3 ? -15.0 : 0}
            changeLabel="needs action"
            positiveIsGood={false}
            icon={<Clock className="h-4 w-4 text-warning" />}
          />
        </div>

        {/* Action Banners / Quick Alerts */}
        {(lowStockCount > 0 || pendingReturns.length > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {lowStockCount > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning-soft p-3.5 text-xs text-warning">
                <div className="flex items-center gap-2.5">
                  <BadgeAlert className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>{lowStockCount} product variants</strong> are at or below reorder threshold.
                  </span>
                </div>
                <Link href="/inventory" className="font-semibold underline hover:text-amber-800">
                  Restock Inventory &rarr;
                </Link>
              </div>
            )}

            {pendingReturns.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-info/30 bg-info-soft p-3.5 text-xs text-info">
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>{pendingReturns.length} return requests</strong> awaiting review.
                  </span>
                </div>
                <Link href="/returns" className="font-semibold underline hover:text-blue-800">
                  Review Returns &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Revenue & Growth"
              subtitle="Daily revenue performance and sales trajectory"
            />
            <div className="p-4 sm:p-5">
              <RevenueAreaChart data={dailySeries} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Fit Sales Distribution"
              subtitle="Units sold by denim fit"
            />
            <div className="p-4 sm:p-5">
              <DonutChart data={fitsData} colorMap={CHART_COLORS} centerLabel={`${products.length} Fits`} />
            </div>
          </Card>
        </div>

        {/* Recent Orders & Top Products Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="Recent Orders"
              subtitle="Latest customer orders placed on INFIT store"
              action={
                <Link href="/orders">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {orders.slice(0, 5).map((order) => {
                    const customer = data.customers.find((c) => c.id === order.customerId)
                    return (
                      <tr key={order.id} className="hover:bg-surface-subtle transition-colors">
                        <td className="px-4 py-3 font-medium text-ink">
                          <Link href={`/orders/${order.id}`} className="hover:text-primary hover:underline">
                            {order.number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-ink-2">
                          {customer?.name ?? 'Guest'}
                          <span className="block text-[11px] text-ink-3">{customer?.city ?? ''}</span>
                        </td>
                        <td className="px-4 py-3">
                          <OrderBadge status={order.fulfillmentStatus} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium tnum text-ink">
                          {formatINR(order.total)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader
              title="Top Products"
              subtitle="Catalog items by interest & views"
              action={
                <Link href="/products">
                  <Button variant="ghost" size="sm">
                    Catalog &rarr;
                  </Button>
                </Link>
              }
            />
            <div className="divide-y divide-divider">
              {products.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-3 hover:bg-surface-subtle transition-colors">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-line bg-canvas">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${product.id}`} className="block truncate text-xs font-semibold text-ink hover:text-primary">
                      {product.name}
                    </Link>
                    <p className="text-[11px] text-ink-3">
                      {product.fit} fit &bull; {product.wash}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-ink tnum">{formatINR(product.price)}</p>
                    <Badge tone={product.status === 'Active' ? 'success' : 'neutral'}>
                      {product.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </PageContent>
    </div>
  )
}
