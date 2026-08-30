'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatINR } from '@/lib/format'

const AXIS = { fill: '#98a2b3', fontSize: 11 }
const GRID = '#eaecf0'

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name?: string; value?: number | string; color?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <div className="mb-1 font-medium text-ink">{String(label ?? '')}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-ink-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? '#4f46e5' }} />
          <span>{p.name}</span>
          <span className="tnum font-medium text-ink">
            {typeof p.value === 'number' ? formatINR(p.value) : String(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueAreaChart({ data }: { data: { label: string; revenue: number; orders: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => shortInr(v)} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#revFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function OrdersLineChart({ data }: { data: { label: string; orders: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="orders" name="Orders" stroke="#2563eb" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function BreakdownBarChart({
  data,
  color = '#4f46e5',
  valueName = 'Revenue',
}: {
  data: { key: string; value: number }[]
  color?: string
  valueName?: string
}) {
  const width = Math.min(130, Math.max(64, ...data.map((d) => d.key.length * 7.5)))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v: number) => shortInr(v)} />
        <YAxis type="category" dataKey="key" tick={{ ...AXIS, width }} tickLine={false} axisLine={false} width={width} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" name={valueName} fill={color} radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DonutChart({
  data,
  colorMap,
  centerLabel,
}: {
  data: { key: string; value: number }[]
  colorMap: Record<string, string>
  centerLabel?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={84}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((d) => (
            <Cell key={d.key} fill={colorMap[d.key] ?? '#c7d2fe'} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => <span className="text-xs text-ink-2">{value}</span>}
        />
        {centerLabel && (
          <text x="50%" y="47%" textAnchor="middle" className="fill-ink text-sm font-semibold">
            {centerLabel}
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  )
}

export function DonutSummary({
  data,
  colorMap,
  fmt = (v: number) => v.toFixed(0),
}: {
  data: { key: string; value: number }[]
  colorMap: Record<string, string>
  fmt?: (v: number) => string
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div key={d.key} className="flex items-center justify-between gap-3 text-[13px]">
          <span className="flex items-center gap-2 text-ink-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colorMap[d.key] ?? '#c7d2fe' }} />
            {d.key}
          </span>
          <span className="tnum font-medium text-ink">
            {fmt(d.value)}
            <span className="ml-1 text-ink-4">· {((d.value / total) * 100).toFixed(0)}%</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function MiniBarChart({
  points,
  color = '#4f46e5',
  height = 200,
}: {
  points: { label: string; value: number }[]
  color?: string
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ ...AXIS, fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={18} />
        <YAxis hide />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" name="Value" fill={color} radius={[4, 4, 0, 0]} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function shortInr(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`
  return `₹${v}`
}

export const CHART_COLORS: Record<string, string> = {
  Blue: '#3f6fb5',
  'Dark Blue': '#27345c',
  'Light Blue': '#7fa8d9',
  Black: '#26282b',
  Grey: '#8a9099',
  White: '#b7b2a6',
  Straight: '#4f46e5',
  Skinny: '#7c3aed',
  Slim: '#2563eb',
  Relaxed: '#0ea5e9',
  Bootcut: '#14b8a6',
  Raw: '#26282b',
  'Stone Wash': '#4f46e5',
  'Acid Wash': '#0ea5e9',
  'Vintage Wash': '#7fa8d9',
  Distressed: '#8a9099',
  'Dark Wash': '#27345c',
}