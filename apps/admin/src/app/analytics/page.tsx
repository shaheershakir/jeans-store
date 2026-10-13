'use client'

import * as React from 'react'
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, Package } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { fetchBackendProducts } from '@/services/catalog'
import { fetchBackendOrders } from '@/services/commerce'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi'
import { Card, CardHeader } from '@/components/ui/primitives'
import {
  RevenueAreaChart,
  OrdersLineChart,
  BreakdownBarChart,
  DonutChart,
  CHART_COLORS,
} from '@/components/ui/charts'
import { kpis, series, salesByFit, salesByColor } from '@/lib/analytics'
import { formatINR } from '@/lib/format'

export default function AnalyticsPage() {
  const data = useAdminStore((s) => s.data)

  React.useEffect(() => {
    void Promise.all([fetchBackendProducts(), fetchBackendOrders()]).catch(() => undefined)
  }, [])

  const kpiData = React.useMemo(() => kpis(data, 30), [data])
  const dailySeries = React.useMemo(() => series(data, 30), [data])
  const fitsData = React.useMemo(() => salesByFit(data).map((x) => ({ key: x.key, value: x.revenue })), [data])
  const colorsData = React.useMemo(() => salesByColor(data).map((x) => ({ key: x.key, value: x.units })), [data])

  return (
    <div>
      <PageHeader
        title="Analytics & Performance"
        description="Comprehensive store reports, sales velocity, and category breakdowns"
      />

      <PageContent>
        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Gross Sales"
            value={formatINR(kpiData.revenue.value)}
            change={kpiData.revenue.change}
            changeLabel="vs last month"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <KpiCard
            label="Total Orders"
            value={kpiData.orders.value.toString()}
            change={kpiData.orders.change}
            changeLabel="vs last month"
            icon={<ShoppingBag className="h-4 w-4" />}
          />
          <KpiCard
            label="Avg Order Value"
            value={formatINR(kpiData.aov.value)}
            change={kpiData.aov.change}
            changeLabel="vs last month"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KpiCard
            label="Conversion Rate"
            value={`${kpiData.conversion.value.toFixed(1)}%`}
            change={kpiData.conversion.change}
            changeLabel="vs last month"
            icon={<BarChart3 className="h-4 w-4" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <CardHeader title="Revenue Trajectory" subtitle="Daily revenue in INR (₹)" />
            <RevenueAreaChart data={dailySeries} />
          </Card>

          <Card className="p-5">
            <CardHeader title="Order Volume" subtitle="Daily orders count" />
            <OrdersLineChart data={dailySeries} />
          </Card>
        </div>

        {/* Category & Color Breakdown */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <CardHeader title="Revenue by product fit" subtitle="Fit performance distribution" />
            <BreakdownBarChart data={fitsData} color="#4f46e5" valueName="Revenue (₹)" />
          </Card>

          <Card className="p-5">
            <CardHeader title="Color popularity" subtitle="Units sold by product color" />
            <DonutChart data={colorsData} colorMap={CHART_COLORS} centerLabel="Shades" />
          </Card>
        </div>
      </PageContent>
    </div>
  )
}
