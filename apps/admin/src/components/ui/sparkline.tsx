'use client'

import * as React from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
  fillOpacity?: number
  className?: string
}

export function Sparkline({
  data,
  width = 110,
  height = 36,
  color = '#2563eb',
  strokeWidth = 2,
  fillOpacity = 0.15,
  className = '',
}: SparklineProps) {
  const id = React.useId()

  if (!data || data.length < 2) {
    return <div style={{ width, height }} className={className} />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2

  // Transform data points to coordinates
  const pts = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width
    const y = height - padding - ((val - min) / range) * (height - padding * 2)
    return { x, y }
  })

  // Build a smooth cubic bezier curve
  let linePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i]
    const p1 = pts[i + 1]
    const cp1x = (p0.x + (p1.x - p0.x) / 2).toFixed(1)
    const cp1y = p0.y.toFixed(1)
    const cp2x = (p0.x + (p1.x - p0.x) / 2).toFixed(1)
    const cp2y = p1.y.toFixed(1)
    linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`
  }

  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${height} L ${pts[0].x.toFixed(1)} ${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sparkline-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sparkline-grad-${id})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
