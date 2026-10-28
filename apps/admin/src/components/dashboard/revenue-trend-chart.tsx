'use client'

import * as React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatINR } from '@/lib/format'

const AXIS = { fill: 'var(--color-ink-3, #98a2b3)', fontSize: 11 }
const GRID = 'var(--color-divider, #eaecf0)'

export interface TrendDataPoint {
  label: string
  sales: number
  orders: number
  prevSales?: number
  prevOrders?: number
}

function CustomTrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-border bg-popover/95 p-3 text-xs shadow-lg backdrop-blur-sm">
      <div className="mb-2 font-semibold text-foreground">{label}</div>
      <div className="space-y-1.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: p.color ?? '#2563eb' }}
              />
              <span>{p.name}</span>
            </div>
            <span className="font-semibold text-foreground tnum">
              {p.dataKey?.toLowerCase().includes('order')
                ? `${p.value} orders`
                : formatINR(p.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RevenueOrdersTrendChart({
  data,
  showSales = true,
  showOrders = true,
  showCompare = false,
}: {
  data: TrendDataPoint[]
  showSales?: boolean
  showOrders?: boolean
  showCompare?: boolean
}) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: showOrders ? 18 : 8, left: -6, bottom: 0 }}
        >
          <defs>
            <linearGradient id="trendSalesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="trendCompareGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="label"
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            minTickGap={20}
            dy={8}
          />

          <YAxis
            yAxisId="sales"
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            width={58}
            tickFormatter={(v: number) => (v >= 1000 ? `₹${Math.round(v / 1000)}K` : `₹${v}`)}
          />

          {showOrders && (
            <YAxis
              yAxisId="orders"
              orientation="right"
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={34}
              allowDecimals={false}
            />
          )}

          <Tooltip content={<CustomTrendTooltip />} />

          {showCompare && (
            <Area
              yAxisId="sales"
              type="monotone"
              dataKey="prevSales"
              name="Previous Net sales"
              stroke="#94a3b8"
              strokeWidth={1.75}
              strokeDasharray="4 4"
              fill="url(#trendCompareGradient)"
              dot={false}
            />
          )}

          {showSales && (
            <Area
              yAxisId="sales"
              type="monotone"
              dataKey="sales"
              name="Net sales"
              stroke="#2563eb"
              strokeWidth={2.25}
              fill="url(#trendSalesGradient)"
              dot={{ r: 3.5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 5.5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
            />
          )}

          {showOrders && (
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke="#93c5fd"
              strokeWidth={2}
              dot={{ r: 3, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 1.5 }}
              activeDot={{ r: 4.5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
