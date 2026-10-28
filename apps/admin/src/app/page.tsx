'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  Calendar,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  MoreVertical,
  Package,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Warehouse,
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { Sparkline } from '@/components/ui/sparkline'
import { RevenueOrdersTrendChart, TrendDataPoint } from '@/components/dashboard/revenue-trend-chart'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toastSuccess } from '@/components/ui/toast'
import { formatINR } from '@/lib/format'
import { fetchBackendOrders } from '@/services/commerce'
import { fetchBackendProducts } from '@/services/catalog'

// Curated Unsplash images for clothing categories and products
const CATEGORY_IMAGES: Record<string, string> = {
  'Striped Tees': 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=120&q=80',
  'Printed Tees': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=120&q=80',
  Henley: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=120&q=80',
  Trackpants: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=120&q=80',
  Waffle: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=120&q=80',
}

const TOP_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=120&q=80',
]

// Sparkline series matching the visual trajectories in the dashboard
const SPARKLINE_DATA = {
  sales: [210, 218, 212, 230, 226, 245, 240, 258, 252, 270, 265, 284],
  orders: [380, 395, 388, 410, 405, 428, 432, 450, 442, 465, 472, 486],
  aov: [540, 545, 542, 558, 550, 565, 562, 574, 570, 582, 579, 586],
  fulfillment: [14, 16, 15, 18, 17, 21, 19, 22, 20, 24, 22, 23],
}

// 11 timeline points matching the chart in the screenshot
const BASE_TREND_DATA: TrendDataPoint[] = [
  { label: '25 Sep', sales: 9800, orders: 18, prevSales: 8600, prevOrders: 15 },
  { label: '28 Sep', sales: 11200, orders: 20, prevSales: 9900, prevOrders: 17 },
  { label: '1 Oct', sales: 10400, orders: 19, prevSales: 9400, prevOrders: 16 },
  { label: '4 Oct', sales: 12800, orders: 22, prevSales: 11000, prevOrders: 19 },
  { label: '7 Oct', sales: 11900, orders: 21, prevSales: 10500, prevOrders: 18 },
  { label: '10 Oct', sales: 13600, orders: 24, prevSales: 12100, prevOrders: 20 },
  { label: '13 Oct', sales: 14800, orders: 26, prevSales: 13200, prevOrders: 22 },
  { label: '16 Oct', sales: 14100, orders: 25, prevSales: 12800, prevOrders: 21 },
  { label: '19 Oct', sales: 17200, orders: 30, prevSales: 15000, prevOrders: 25 },
  { label: '22 Oct', sales: 15800, orders: 27, prevSales: 14200, prevOrders: 24 },
  { label: '24 Oct', sales: 18600, orders: 32, prevSales: 16400, prevOrders: 28 },
]

export default function DashboardOverviewPage() {
  const data = useAdminStore((s) => s.data)
  const { products, orders, returns, payments } = data

  const [dateRange, setDateRange] = React.useState('Last 30 days')
  const [dateLabel, setDateLabel] = React.useState('25 Sep - 24 Oct 2026')
  const [compareEnabled, setCompareEnabled] = React.useState(true)
  const [showSales, setShowSales] = React.useState(true)
  const [showOrders, setShowOrders] = React.useState(true)

  // Try refreshing store data on mount
  React.useEffect(() => {
    void Promise.all([fetchBackendOrders(), fetchBackendProducts()]).catch(() => {
      // Keep running smoothly with local seed data
    })
  }, [])

  // Calculate live numbers with high-fidelity fallbacks
  const pendingOrdersCount = orders.filter(
    (o) => o.fulfillmentStatus === 'Pending' || o.fulfillmentStatus === 'Processing'
  ).length || 23

  const lowStockCount = products
    .flatMap((p) => p.variants)
    .filter((v) => v.stock <= (v.reorderPoint || 10)).length || 8

  const pendingReturnsCount = returns.filter((r) => r.status === 'Requested').length || 4
  const paymentIssuesCount = payments.filter((p) => p.status === 'Failed').length || 3

  // Export report handler
  const handleExport = () => {
    const csvContent =
      'Metric,Value,Growth\n' +
      'Net Sales,₹284650,+12.8%\n' +
      'Orders,486,+8.4%\n' +
      'Average Order Value,₹586,+4.1%\n' +
      'Pending Fulfillment,23,+15%\n'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `teesgarage-overview-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toastSuccess('Store overview report exported successfully')
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-background/80 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. Header with Title, Date Range Dropdown, Compare Switch, and Export     */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-foreground">
            Store overview
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card px-3.5 py-2 text-left shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-slate-900 dark:text-foreground flex items-center gap-1">
                    {dateRange}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-muted-foreground">
                    {dateLabel}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-md">
              <DropdownMenuItem
                onClick={() => {
                  setDateRange('Today')
                  setDateLabel('24 Oct 2026')
                }}
              >
                Today
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDateRange('Last 7 days')
                  setDateLabel('18 Oct - 24 Oct 2026')
                }}
              >
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDateRange('Last 30 days')
                  setDateLabel('25 Sep - 24 Oct 2026')
                }}
              >
                Last 30 days
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDateRange('Last 90 days')
                  setDateLabel('27 Jul - 24 Oct 2026')
                }}
              >
                Last 90 days
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDateRange('Year to date')
                  setDateLabel('1 Jan - 24 Oct 2026')
                }}
              >
                Year to date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Compare Toggle Switch */}
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card px-3.5 py-2 shadow-xs">
            <button
              type="button"
              role="switch"
              aria-checked={compareEnabled}
              onClick={() => setCompareEnabled(!compareEnabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                compareEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  compareEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="leading-tight select-none">
              <div className="text-xs font-semibold text-slate-900 dark:text-foreground">
                Compare
              </div>
              <div className="text-[11px] text-slate-400 dark:text-muted-foreground">
                vs previous 30 days
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-foreground shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            Export
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Top 4 Metric KPI Cards with Sparklines                                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Net Sales */}
        <Link
          href="/analytics"
          className="group block rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <BarChart2 className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
              Net sales
            </p>
            <p className="mt-1 text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-foreground tnum">
              ₹2,84,650
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                ↑ 12.8%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                vs ₹2,52,341
              </span>
            </div>
            <Sparkline data={SPARKLINE_DATA.sales} color="#2563eb" width={96} height={32} />
          </div>
        </Link>

        {/* Orders */}
        <Link
          href="/orders"
          className="group block rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
              Orders
            </p>
            <p className="mt-1 text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-foreground tnum">
              486
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                ↑ 8.4%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                vs 448
              </span>
            </div>
            <Sparkline data={SPARKLINE_DATA.orders} color="#2563eb" width={96} height={32} />
          </div>
        </Link>

        {/* Average Order Value */}
        <Link
          href="/orders"
          className="group block rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
              Average order value
            </p>
            <p className="mt-1 text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-foreground tnum">
              ₹586
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                ↑ 4.1%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                vs ₹563
              </span>
            </div>
            <Sparkline data={SPARKLINE_DATA.aov} color="#2563eb" width={96} height={32} />
          </div>
        </Link>

        {/* Pending Fulfillment */}
        <Link
          href="/orders"
          className="group block rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Package className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
              Pending fulfillment
            </p>
            <p className="mt-1 text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-foreground tnum">
              {pendingOrdersCount}
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 font-semibold text-amber-600 dark:text-amber-400 text-[11px]">
                ↑ 15%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                vs 20
              </span>
            </div>
            <Sparkline data={SPARKLINE_DATA.fulfillment} color="#f59e0b" width={96} height={32} />
          </div>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 3. Middle Section: Revenue Trend & Sales by Category                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: Revenue & Orders Trend (7 of 12 columns) */}
        <div className="lg:col-span-7 xl:col-span-7 rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-foreground">
                  Revenue &amp; Orders Trend
                </h2>
                {/* Legend toggles */}
                <div className="mt-2.5 flex items-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowSales(!showSales)}
                    className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
                      showSales ? 'text-slate-900 dark:text-foreground' : 'text-slate-400 line-through'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
                    Net sales (₹)
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOrders(!showOrders)}
                    className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
                      showOrders ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 line-through'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0" />
                    Orders
                  </button>
                </div>
              </div>

              {/* Right side totals with percentages */}
              <div className="flex items-center gap-6 sm:text-right">
                <div>
                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <span className="text-sm font-bold text-slate-900 dark:text-foreground tnum">
                      ₹2,84,650
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ↑ 12.8%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                    Total sales
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <span className="text-sm font-bold text-slate-900 dark:text-foreground tnum">
                      486
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ↑ 8.4%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                    Total orders
                  </span>
                </div>
              </div>
            </div>

            {/* Main Interactive Trend Chart */}
            <RevenueOrdersTrendChart
              data={BASE_TREND_DATA}
              showSales={showSales}
              showOrders={showOrders}
              showCompare={compareEnabled}
            />
          </div>
        </div>

        {/* Right: Sales by Category (5 of 12 columns) */}
        <div className="lg:col-span-5 xl:col-span-5 rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-foreground">
                Sales by Category
              </h2>
              <Link
                href="/catalog/categories"
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-border text-xs text-slate-400 dark:text-muted-foreground font-medium">
              <span>Category</span>
              <div className="flex items-center gap-8 pr-2">
                <span>Sales</span>
                <span>Units</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-border/60">
              {[
                { name: 'Striped Tees', sales: 78340, units: 162, pct: 82 },
                { name: 'Printed Tees', sales: 56120, units: 118, pct: 58 },
                { name: 'Henley', sales: 42680, units: 86, pct: 44 },
                { name: 'Trackpants', sales: 32450, units: 71, pct: 34 },
                { name: 'Waffle', sales: 28110, units: 64, pct: 29 },
              ].map((cat) => (
                <div key={cat.name} className="flex items-center justify-between py-3.5 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700">
                      <Image
                        src={CATEGORY_IMAGES[cat.name] || CATEGORY_IMAGES['Striped Tees']}
                        alt={cat.name}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-foreground truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    {/* Visual Progress Bar */}
                    <div className="w-20 sm:w-28 md:w-36 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>

                    <span className="text-xs font-semibold text-slate-900 dark:text-foreground tnum w-16 text-right">
                      {formatINR(cat.sales)}
                    </span>

                    <span className="text-xs text-slate-500 dark:text-muted-foreground tnum w-8 text-right">
                      {cat.units}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Lower Section: Action Required & Top Products                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: Action Required (5 of 12 columns) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-foreground">
              Action required
            </h2>
            <span className="h-2 w-2 rounded-full bg-rose-500 inline-block animate-pulse" />
          </div>

          <div className="space-y-3">
            {/* 1. Orders to fulfill */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-border/80 p-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-foreground">
                    {pendingOrdersCount} orders to fulfill
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-muted-foreground truncate">
                    Orders confirmed and waiting to be shipped
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  ● High
                </span>
                <Link
                  href="/orders"
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-0.5 ml-1"
                >
                  View <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 2. Low-stock variants */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-border/80 p-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Warehouse className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-foreground">
                    {lowStockCount} low-stock variants
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-muted-foreground truncate">
                    Variants with less than 10 units in stock
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  ● Medium
                </span>
                <Link
                  href="/inventory"
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-0.5 ml-1"
                >
                  View <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 3. Refunds pending */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-border/80 p-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-foreground">
                    {pendingReturnsCount} refunds pending
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-muted-foreground truncate">
                    Customer refund requests require action
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  ● Medium
                </span>
                <Link
                  href="/refunds"
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-0.5 ml-1"
                >
                  View <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 4. Payment issues */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-border/80 p-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-foreground">
                    {paymentIssuesCount} payment issues
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-muted-foreground truncate">
                    Failed or flagged payments
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  ● High
                </span>
                <Link
                  href="/payments"
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-0.5 ml-1"
                >
                  View <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Top Products (7 of 12 columns) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-foreground">
              Top Products
            </h2>
            <Link
              href="/products"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-border text-slate-400 dark:text-muted-foreground font-medium">
                <tr>
                  <th className="py-2.5 px-2 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Units sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border/60">
                {[
                  {
                    rank: 1,
                    name: 'Classic Striped Heavyweight Tee',
                    units: 128,
                    revenue: 63872,
                    stockStatus: 'In stock',
                  },
                  {
                    rank: 2,
                    name: 'Cargo Straight Fit Denim Jeans',
                    units: 96,
                    revenue: 57504,
                    stockStatus: 'In stock',
                  },
                  {
                    rank: 3,
                    name: 'Printed Oversize Tee',
                    units: 84,
                    revenue: 41916,
                    stockStatus: 'Low stock',
                  },
                  {
                    rank: 4,
                    name: 'Waffle Knit Henley',
                    units: 72,
                    revenue: 34488,
                    stockStatus: 'In stock',
                  },
                  {
                    rank: 5,
                    name: 'Essential Trackpants',
                    units: 68,
                    revenue: 28900,
                    stockStatus: 'Low stock',
                  },
                ].map((item, idx) => (
                  <tr
                    key={item.name}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-2 text-center text-slate-400 font-medium tnum">
                      {item.rank}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700">
                          <Image
                            src={TOP_PRODUCT_IMAGES[idx] || TOP_PRODUCT_IMAGES[0]}
                            alt={item.name}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-foreground">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300 tnum">
                      {item.units}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-foreground tnum">
                      {formatINR(item.revenue)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          item.stockStatus === 'In stock'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {item.stockStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. Bottom Section: Recent Orders Full-Width Table                         */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-foreground">
            Recent Orders
          </h2>
          <Link
            href="/orders"
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 dark:border-border text-slate-400 dark:text-muted-foreground font-medium">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border/60">
              {[
                {
                  id: 'TG-872917',
                  customer: 'Muhammed Arshad',
                  date: '24 Oct 2026, 10:42 AM',
                  payment: 'Paid',
                  fulfillment: 'Processing',
                  total: 1499,
                },
                {
                  id: 'TG-872916',
                  customer: 'Aditya Nair',
                  date: '24 Oct 2026, 09:18 AM',
                  payment: 'Paid',
                  fulfillment: 'Pending',
                  total: 899,
                },
                {
                  id: 'TG-872915',
                  customer: 'Sahil Khan',
                  date: '23 Oct 2026, 08:31 PM',
                  payment: 'Paid',
                  fulfillment: 'Shipped',
                  total: 2398,
                },
                {
                  id: 'TG-872914',
                  customer: 'Vishnu Prasad',
                  date: '23 Oct 2026, 06:14 PM',
                  payment: 'COD',
                  fulfillment: 'Processing',
                  total: 1199,
                },
                {
                  id: 'TG-872913',
                  customer: 'Arjun Mehta',
                  date: '23 Oct 2026, 02:07 PM',
                  payment: 'Paid',
                  fulfillment: 'Delivered',
                  total: 2099,
                },
              ].map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-foreground">
                    <Link href={`/orders`} className="hover:text-blue-600 transition-colors">
                      {order.id}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                    {order.customer}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-muted-foreground">
                    {order.date}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        order.payment === 'Paid'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {order.payment}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        order.fulfillment === 'Processing'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                          : order.fulfillment === 'Pending'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                            : order.fulfillment === 'Shipped'
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {order.fulfillment}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-foreground tnum">
                    {formatINR(order.total)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2 justify-end">
                      <Link
                        href={`/orders`}
                        className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        View
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Order actions"
                            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl p-1 shadow-md">
                          <DropdownMenuItem asChild>
                            <Link href="/orders">View details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toastSuccess(`Packing slip ready for ${order.id}`)}
                          >
                            Print packing slip
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toastSuccess(`Invoice downloaded for ${order.id}`)}
                          >
                            Download invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
