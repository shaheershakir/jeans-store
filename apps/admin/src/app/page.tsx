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
  Warehouse,
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { Sparkline } from '@/components/ui/sparkline'
import { RevenueOrdersTrendChart, type TrendDataPoint } from '@/components/dashboard/revenue-trend-chart'
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

const CATEGORY_IMAGES: Record<string, string> = {
  stripes: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=120&q=80',
  fullsleeve: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=120&q=80',
  drsleeve: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=120&q=80',
  'printed-tees': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=120&q=80',
  'ringer-tees': 'https://images.unsplash.com/photo-1503343394128-c104d54dba01?auto=format&fit=crop&w=120&q=80',
  henley: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=120&q=80',
  waffle: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=120&q=80',
  trackpants: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=120&q=80',
  sweatpants: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=120&q=80',
}

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=120&q=80'

export default function DashboardOverviewPage() {
  const data = useAdminStore((s) => s.data)
  const { products, orders, categories, refunds, payments } = data

  const [dateRange, setDateRange] = React.useState('Last 30 days')
  const [dateLabel, setDateLabel] = React.useState('Last 30 days')
  const [compareEnabled, setCompareEnabled] = React.useState(true)
  const [showSales, setShowSales] = React.useState(true)
  const [showOrders, setShowOrders] = React.useState(true)

  React.useEffect(() => {
    void Promise.all([fetchBackendOrders(), fetchBackendProducts()]).catch(() => undefined)
  }, [])

  const days = React.useMemo(() => {
    if (dateRange === 'Today') return 1
    if (dateRange === 'Last 7 days') return 7
    if (dateRange === 'Last 90 days') return 90
    if (dateRange === 'Year to date') {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime()
      return Math.max(1, Math.floor((Date.now() - startOfYear) / 86400000))
    }
    return 30
  }, [dateRange])

  const now = React.useMemo(() => Date.now(), [])
  const windowStart = now - days * 86400000
  const prevStart = now - days * 2 * 86400000

  const curOrders = React.useMemo(
    () =>
      orders.filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return t >= windowStart && t <= now
      }),
    [orders, windowStart, now]
  )

  const prevOrders = React.useMemo(
    () =>
      orders.filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return t >= prevStart && t < windowStart
      }),
    [orders, prevStart, windowStart]
  )

  const curSales = React.useMemo(
    () => curOrders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.total : 0), 0),
    [curOrders]
  )

  const prevSales = React.useMemo(
    () => prevOrders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.total : 0), 0),
    [prevOrders]
  )

  const curOrdersCount = curOrders.length
  const prevOrdersCount = prevOrders.length

  const curAov = curOrdersCount > 0 ? Math.round(curSales / curOrdersCount) : 0
  const prevAov = prevOrdersCount > 0 ? Math.round(prevSales / prevOrdersCount) : 0

  const deltaPct = (cur: number, prev: number) => {
    if (prev === 0) return cur === 0 ? 0 : 100
    return ((cur - prev) / prev) * 100
  }

  const salesGrowth = deltaPct(curSales, prevSales)
  const ordersGrowth = deltaPct(curOrdersCount, prevOrdersCount)
  const aovGrowth = deltaPct(curAov, prevAov)

  const pendingOrdersCount = orders.filter(
    (o) => o.fulfillmentStatus === 'Pending' || o.fulfillmentStatus === 'Processing'
  ).length

  const lowStockCount = products
    .flatMap((p) => p.variants)
    .filter((v) => v.stock <= 10).length

  const pendingRefundsCount = refunds.filter((r) => r.status === 'Pending').length
  const paymentIssuesCount = payments.filter((p) => p.status === 'Failed').length

  // Generate 12 time-series points for sparklines
  const sparklineSeries = React.useMemo(() => {
    const pointsCount = 12
    const intervalMs = (days * 86400000) / pointsCount
    const salesArr: number[] = new Array(pointsCount).fill(0)
    const ordersArr: number[] = new Array(pointsCount).fill(0)
    const aovArr: number[] = new Array(pointsCount).fill(0)
    const fulfillArr: number[] = new Array(pointsCount).fill(0)

    for (const o of curOrders) {
      const t = new Date(o.createdAt).getTime()
      const bucket = Math.min(pointsCount - 1, Math.max(0, Math.floor((t - windowStart) / intervalMs)))
      ordersArr[bucket] += 1
      if (o.paymentStatus === 'Paid') salesArr[bucket] += o.total
      if (o.fulfillmentStatus === 'Pending' || o.fulfillmentStatus === 'Processing') {
        fulfillArr[bucket] += 1
      }
    }

    for (let i = 0; i < pointsCount; i++) {
      aovArr[i] = ordersArr[i] > 0 ? Math.round(salesArr[i] / ordersArr[i]) : 0
    }

    return {
      sales: salesArr,
      orders: ordersArr,
      aov: aovArr,
      fulfillment: fulfillArr,
    }
  }, [curOrders, days, windowStart])

  // Generate timeline points for Revenue & Orders Trend chart
  const trendData: TrendDataPoint[] = React.useMemo(() => {
    const pointCount = 11
    const intervalMs = (days * 86400000) / pointCount
    const points: TrendDataPoint[] = []

    for (let i = 0; i < pointCount; i++) {
      const bucketStart = windowStart + i * intervalMs
      const bucketEnd = bucketStart + intervalMs
      const prevBucketStart = prevStart + i * intervalMs
      const prevBucketEnd = prevBucketStart + intervalMs

      const bCurOrders = orders.filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return t >= bucketStart && t < bucketEnd
      })
      const bPrevOrders = orders.filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return t >= prevBucketStart && t < prevBucketEnd
      })

      const bSales = bCurOrders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.total : 0), 0)
      const bPrevSales = bPrevOrders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.total : 0), 0)

      const labelDate = new Date(bucketStart)
      const label = labelDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

      points.push({
        label,
        sales: bSales,
        orders: bCurOrders.length,
        prevSales: bPrevSales,
        prevOrders: bPrevOrders.length,
      })
    }

    return points
  }, [days, orders, prevStart, windowStart])

  // Sales by category computed from live data
  const salesByCategory = React.useMemo(() => {
    const catMap = new Map<number, { name: string; slug: string; sales: number; units: number }>()

    for (const c of categories) {
      catMap.set(c.id, { name: c.name, slug: c.slug, sales: 0, units: 0 })
    }

    const prodToCat = new Map(products.map((p) => [p.id, p.categoryId]))

    for (const o of curOrders) {
      for (const item of o.items) {
        const catId = prodToCat.get(item.productId)
        if (catId != null && catMap.has(catId)) {
          const entry = catMap.get(catId)!
          entry.units += item.quantity
          entry.sales += item.total || item.price * item.quantity
        }
      }
    }

    const rows = Array.from(catMap.values())
    const totalSales = rows.reduce((s, r) => s + r.sales, 0)

    return rows
      .map((r) => ({
        ...r,
        pct: totalSales > 0 ? Math.round((r.sales / totalSales) * 100) : 0,
      }))
      .sort((a, b) => b.sales - a.sales)
  }, [categories, curOrders, products])

  // Top products computed from live data
  const topProductsList = React.useMemo(() => {
    const prodStats = new Map<string, { units: number; revenue: number }>()

    for (const o of orders) {
      for (const item of o.items) {
        const entry = prodStats.get(item.productId) ?? { units: 0, revenue: 0 }
        entry.units += item.quantity
        entry.revenue += item.total || item.price * item.quantity
        prodStats.set(item.productId, entry)
      }
    }

    const prodLookup = new Map(products.map((p) => [p.id, p]))

    const rows = Array.from(prodStats.entries())
      .map(([id, stats]) => {
        const product = prodLookup.get(id)
        const totalStock = product?.variants.reduce((sum, v) => sum + v.stock, 0) ?? 0
        return {
          id,
          name: product?.name ?? `Product #${id}`,
          image: product?.image || FALLBACK_PRODUCT_IMAGE,
          units: stats.units,
          revenue: stats.revenue,
          stockStatus: totalStock > 10 ? 'In stock' : 'Low stock',
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((item, idx) => ({ ...item, rank: idx + 1 }))

    return rows
  }, [orders, products])

  // Recent orders sorted desc
  const recentOrdersList = React.useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((o) => {
        const customerName =
          data.customers.find((c) => c.id === o.customerId)?.name ?? 'Customer'
        const formattedDate = new Date(o.createdAt).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        return {
          id: o.number || `TG-${o.id}`,
          customer: customerName,
          date: formattedDate,
          payment: o.paymentStatus,
          fulfillment: o.fulfillmentStatus,
          total: o.total,
        }
      })
  }, [data.customers, orders])

  // Export report handler
  const handleExport = () => {
    const csvContent =
      'Metric,Current Period,Previous Period,Growth\n' +
      `Net Sales,${curSales},${prevSales},${salesGrowth >= 0 ? '+' : ''}${salesGrowth.toFixed(1)}%\n` +
      `Orders,${curOrdersCount},${prevOrdersCount},${ordersGrowth >= 0 ? '+' : ''}${ordersGrowth.toFixed(1)}%\n` +
      `Average Order Value,${curAov},${prevAov},${aovGrowth >= 0 ? '+' : ''}${aovGrowth.toFixed(1)}%\n` +
      `Pending Fulfillment,${pendingOrdersCount},N/A,N/A\n`

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
      {/* 1. Header with Title, Date Range Dropdown, Compare Switch, and Export */}
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
                  setDateLabel('Today')
                }}
              >
                Today
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDateRange('Last 7 days')
                  setDateLabel('Last 7 days')
                }}
              >
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDateRange('Last 30 days')
                  setDateLabel('Last 30 days')
                }}
              >
                Last 30 days
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDateRange('Last 90 days')
                  setDateLabel('Last 90 days')
                }}
              >
                Last 90 days
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDateRange('Year to date')
                  setDateLabel('Year to date')
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
                vs previous period
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

      {/* 2. Top 4 Metric KPI Cards with Sparklines */}
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
              {formatINR(curSales)}
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold text-[11px] ${
                  salesGrowth >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                }`}
              >
                {salesGrowth >= 0 ? '↑' : '↓'} {Math.abs(salesGrowth).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                vs {formatINR(prevSales)}
              </span>
            </div>
            <Sparkline data={sparklineSeries.sales} color="#2563eb" width={96} height={32} />
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
              {curOrdersCount}
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold text-[11px] ${
                  ordersGrowth >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                }`}
              >
                {ordersGrowth >= 0 ? '↑' : '↓'} {Math.abs(ordersGrowth).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                vs {prevOrdersCount}
              </span>
            </div>
            <Sparkline data={sparklineSeries.orders} color="#2563eb" width={96} height={32} />
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
              {formatINR(curAov)}
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold text-[11px] ${
                  aovGrowth >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                }`}
              >
                {aovGrowth >= 0 ? '↑' : '↓'} {Math.abs(aovGrowth).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                vs {formatINR(prevAov)}
              </span>
            </div>
            <Sparkline data={sparklineSeries.aov} color="#2563eb" width={96} height={32} />
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
                {pendingOrdersCount > 0 ? 'Action needed' : 'All clear'}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                in queue
              </span>
            </div>
            <Sparkline data={sparklineSeries.fulfillment} color="#f59e0b" width={96} height={32} />
          </div>
        </Link>
      </div>

      {/* 3. Middle Section: Revenue Trend & Sales by Category */}
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
                      {formatINR(curSales)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        salesGrowth >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {salesGrowth >= 0 ? '↑' : '↓'} {Math.abs(salesGrowth).toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                    Total sales
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <span className="text-sm font-bold text-slate-900 dark:text-foreground tnum">
                      {curOrdersCount}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        ordersGrowth >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {ordersGrowth >= 0 ? '↑' : '↓'} {Math.abs(ordersGrowth).toFixed(1)}%
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
              data={trendData}
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
              {salesByCategory.slice(0, 5).map((cat) => (
                <div key={cat.name} className="flex items-center justify-between py-3.5 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700">
                      <Image
                        src={CATEGORY_IMAGES[cat.slug] || CATEGORY_IMAGES['stripes']}
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
              {salesByCategory.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-muted-foreground">
                  No sales recorded in this period.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Section: Action Required & Top Products */}
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
                  ● {pendingOrdersCount > 0 ? 'High' : 'None'}
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
                  ● {lowStockCount > 0 ? 'Medium' : 'None'}
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
                    {pendingRefundsCount} refunds pending
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-muted-foreground truncate">
                    Customer refund requests require action
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  ● {pendingRefundsCount > 0 ? 'Medium' : 'None'}
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
                  ● {paymentIssuesCount > 0 ? 'High' : 'None'}
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
                {topProductsList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-2 text-center text-slate-400 font-medium tnum">
                      {item.rank}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700">
                          <Image
                            src={item.image}
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
                {topProductsList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-slate-400 dark:text-muted-foreground">
                      No product sales recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: Recent Orders Full-Width Table */}
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
              {recentOrdersList.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-foreground">
                    <Link href="/orders" className="hover:text-blue-600 transition-colors">
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
                        href="/orders"
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
              {recentOrdersList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-slate-400 dark:text-muted-foreground">
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
