'use client'

import type { DbState } from '@/lib/types'
import {
  highViewsLowSales,
  inventoryAlerts,
  kpis,
  monthlySeries,
  returnRateByFit,
  salesByColor,
  stockOutsBySize,
  topProducts,
} from '@/lib/analytics'
import { formatINR, formatNumber } from '@/lib/format'
import { GUIDE_FOLLOWUPS, type AiAnswer, type AiProvider, type AiTable } from './ai'

const mkTable = (columns: { key: string; label: string }[], rows: Record<string, string | number>[]): AiTable => ({
  columns,
  rows,
})

/** Default provider — deterministic, fully data-backed answers. */
export class DataBackedAiProvider implements AiProvider {
  async ask(query: string, data: () => DbState): Promise<AiAnswer> {
    const q = query.toLowerCase()
    const db = data()
    if (/(best.?sell|top.?sell|fastest).*(jean|product|pair)?/.test(q)) return this.bestSellers(db)
    if (/(run out|running out|low stock|reorder)/.test(q)) return this.reorder(db)
    if (/(why|reason|drop|fell|decrease|increase|decline).*(revenue|sales|income)?/.test(q))
      return this.revenueChange(db)
    if (/(high views|low sales|low conversion)/.test(q)) return this.viewConversion(db)
    if (/(return rate|most returned).*(fit|size|jean)?/.test(q)) return this.returnRates(db)
    if (/color.*(revenue|sell|most)|which color/.test(q)) return this.colors(db)
    if (/out of stock.*(size|waist)/.test(q)) return this.stockOuts(db)
    if (/(margin|profit)/.test(q)) return this.margin(db)
    if (/(hello|hi|hey|help|what can you)/.test(q)) {
      return {
        text: 'I can answer business questions directly from your live dashboard data.',
        bullets: [
          'Which apparel products are selling fastest',
          'Which sizes are likely to run out',
          'Why revenue changed this month',
          'High views, low conversion products',
          'Return rates by fit or size',
          'What to reorder next',
        ],
        followUps: GUIDE_FOLLOWUPS,
      }
    }
    return this.overview(db)
  }

  private bestSellers(db: DbState): AiAnswer {
    const top = topProducts(db, 5)
    const rows = top.map((p) => ({
      product: p.product.name,
      fit: p.product.fit ?? 'Regular',
      units: p.unitsSold,
      revenue: formatINR(p.revenue),
    }))
    const first = top[0]
    const text = first
      ? `**${first.product.name}**${first.product.fit ? ` (${first.product.fit} fit)` : ''} leads with ${formatNumber(first.unitsSold)} units sold and ${formatINR(first.revenue)}.`
      : 'No sales data yet.'
    return {
      text,
      table: mkTable(
        [
          { key: 'product', label: 'Product' },
          { key: 'fit', label: 'Fit' },
          { key: 'units', label: 'Units' },
          { key: 'revenue', label: 'Revenue' },
        ],
        rows
      ),
      chart: {
        title: 'Revenue by product',
        points: top.map((p) => ({ label: p.product.name.slice(0, 16), value: p.revenue })),
      },
      followUps: GUIDE_FOLLOWUPS.filter((s) => s !== 'Which apparel products sold best last month?'),
    }
  }

  private reorder(db: DbState): AiAnswer {
    const alerts = inventoryAlerts(db)
    const predicted = [...alerts.predicted].sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0)).slice(0, 8)
    const rows = predicted.map((a) => ({
      sku: a.variant.sku,
      product: a.product.name.slice(0, 26),
      size: `${a.variant.size}W ${a.variant.color}`,
      stock: a.variant.stock,
      daysLeft: Math.round(a.daysLeft ?? 0),
    }))
    const text = `${alerts.out.length} variants are out of stock and ${alerts.low.length} are below reorder point. ${predicted.length} more are projected to run out within 14 days.`
    return {
      text,
      table: mkTable(
        [
          { key: 'sku', label: 'SKU' },
          { key: 'product', label: 'Product' },
          { key: 'size', label: 'Size / color' },
          { key: 'stock', label: 'Stock' },
          { key: 'daysLeft', label: 'Days left' },
        ],
        rows
      ),
      followUps: GUIDE_FOLLOWUPS.filter(
        (s) => s !== 'Which sizes are likely to run out this week?' && s !== 'What should I reorder?'
      ),
    }
  }

  private revenueChange(db: DbState): AiAnswer {
    const k = kpis(db, 30)
    const monthly = monthlySeries(db, 6)
    const current = monthly[monthly.length - 1]
    const prev = monthly[monthly.length - 2]
    const delta =
      prev && prev.revenue > 0 && current ? ((current.revenue - prev.revenue) / prev.revenue) * 100 : null
    const change = k.revenue.change
    const dir = change === null ? 'stable' : change >= 0 ? 'up' : 'down'
    const sign = (v: number | null) => (v === null ? '—' : (v > 0 ? '+' : '') + v.toFixed(1) + '%')
    return {
      text: `Revenue for the last 30 days is ${formatINR(k.revenue.value)}, ${dir} ${sign(change)} versus the previous 30 days.`,
      bullets: [
        `Orders: ${formatNumber(k.orders.value)} (${sign(k.orders.change)})`,
        `Average order value: ${formatINR(k.aov.value)}`,
        `New customers: ${formatNumber(k.customers.value)}`,
        delta !== null
          ? `${formatINR(prev.revenue)} → ${formatINR(current.revenue)} between ${prev.label} and ${current.label}`
          : 'Not enough monthly history yet.',
      ],
      chart: { title: 'Monthly revenue', points: monthly.map((m) => ({ label: m.label, value: m.revenue })) },
      followUps: GUIDE_FOLLOWUPS.filter((s) => s !== 'Why did revenue change this month?'),
    }
  }

  private viewConversion(db: DbState): AiAnswer {
    const rows = highViewsLowSales(db, 6).map((r) => ({
      product: r.product.name.slice(0, 26),
      views: formatNumber(r.views),
      ordered: r.ordered,
      conversion: `${r.conversions.toFixed(2)}%`,
    }))
    const text = rows.length
      ? `${rows.length} products get strong traffic but convert below 2% — worth reviewing pricing, imagery or the size guide.`
      : 'No products currently match the high-views / low-sales pattern.'
    return {
      text,
      table: mkTable(
        [
          { key: 'product', label: 'Product' },
          { key: 'views', label: 'Views' },
          { key: 'ordered', label: 'Units sold' },
          { key: 'conversion', label: 'Conversion' },
        ],
        rows
      ),
      followUps: GUIDE_FOLLOWUPS.filter((s) => s !== 'Which products have high views but low sales?'),
    }
  }

  private returnRates(db: DbState): AiAnswer {
    const byFit = returnRateByFit(db).sort((a, b) => b.rate - a.rate)
    const worst = byFit[0]
    const rows = byFit.map((r) => ({
      fit: r.key,
      units: r.units,
      returned: r.returned,
      rate: `${r.rate.toFixed(1)}%`,
    }))
    const text = worst
      ? `**${worst.key}** fit has the highest return rate at ${worst.rate.toFixed(1)}% (${worst.returned} of ${worst.units} units).`
      : 'No return data yet.'
    return {
      text,
      table: mkTable(
        [
          { key: 'fit', label: 'Fit' },
          { key: 'units', label: 'Units sold' },
          { key: 'returned', label: 'Returned' },
          { key: 'rate', label: 'Return rate' },
        ],
        rows
      ),
      followUps: GUIDE_FOLLOWUPS.filter((s) => s !== 'Which fit has the highest return rate?'),
    }
  }

  private colors(db: DbState): AiAnswer {
    const colors = salesByColor(db).slice(0, 6)
    const top = colors[0]
    const text = top
      ? `**${top.key}** is your top colour at ${formatINR(top.revenue)}, ahead of ${colors[1]?.key ?? 'the rest'}.`
      : 'No colour data yet.'
    return {
      text,
      chart: { title: 'Revenue by colour', points: colors.map((c) => ({ label: c.key, value: c.revenue })) },
      followUps: GUIDE_FOLLOWUPS,
    }
  }

  private stockOuts(db: DbState): AiAnswer {
    const rows = stockOutsBySize(db).map((s) => ({
      size: typeof s.size === 'number' || /^\d+$/.test(String(s.size)) ? `${s.size}W` : String(s.size),
      outCount: s.count,
    }))
    const text = rows.length
      ? `Currently out of stock across sizes: ${rows.map((r) => r.size).join(', ')}.`
      : 'No size is completely out of stock right now.'
    return {
      text,
      table: mkTable(
        [
          { key: 'size', label: 'Size' },
          { key: 'outCount', label: 'Out-of-stock variants' },
        ],
        rows
      ),
      followUps: GUIDE_FOLLOWUPS,
    }
  }

  private margin(db: DbState): AiAnswer {
    let revenue = 0
    let cost = 0
    const costByProduct = new Map(db.products.map((p) => [p.id, p.costPrice]))
    for (const o of db.orders) {
      for (const item of o.items) {
        revenue += item.price * item.quantity
        cost += (costByProduct.get(item.productId) ?? 0) * item.quantity
      }
    }
    const marginPct = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0
    return {
      text: `Estimated gross margin is **${marginPct.toFixed(1)}%** — ${formatINR(revenue - cost)} gross profit on ${formatINR(revenue)} in sales.`,
      bullets: [`Revenue: ${formatINR(revenue)}`, `Estimated COGS: ${formatINR(cost)}`, `Gross profit: ${formatINR(revenue - cost)}`],
      followUps: GUIDE_FOLLOWUPS,
    }
  }

  private overview(db: DbState): AiAnswer {
    const k = kpis(db, 30)
    const alerts = inventoryAlerts(db)
    return {
      text: `Over the last 30 days: **${formatINR(k.revenue.value)}** revenue from ${formatNumber(k.orders.value)} orders (AOV ${formatINR(k.aov.value)}). ${alerts.out.length} SKUs are out of stock, ${alerts.predicted.length} predicted to run out soon.`,
      bullets: [
        `Orders: ${formatNumber(k.orders.value)} (vs ${formatNumber(k.orders.previous)} previous period)`,
        `New customers: ${formatNumber(k.customers.value)}`,
        `Refunds: ${formatINR(k.refunds.value)}`,
        `Estimated conversion: ${k.conversion.value.toFixed(1)}%`,
      ],
      chart: {
        title: 'Monthly revenue',
        points: monthlySeries(db, 3).map((m) => ({ label: m.label, value: m.revenue })),
      },
      followUps: GUIDE_FOLLOWUPS,
    }
  }
}
