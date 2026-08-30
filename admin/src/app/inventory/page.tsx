'use client'

import * as React from 'react'
import {
  ArrowDown,
  ArrowUp,
  History,
  Plus,
  Minus,
  RotateCcw,
  Search,
  Warehouse,
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { adjustStock } from '@/services/commerce'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, CardHeader, Field, Input, Select } from '@/components/ui/primitives'
import { StockBadge } from '@/components/ui/status'
import { toastSuccess, toastError } from '@/components/ui/toast'
import type { MovementType, StockStatus } from '@/lib/types'

export default function InventoryPage() {
  const products = useAdminStore((s) => s.data.products)
  const movements = useAdminStore((s) => s.data.inventoryMovements)

  const [query, setQuery] = React.useState('')
  const [filterStatus, setFilterStatus] = React.useState<string>('all')

  // Stock Adjustment Modal State
  const [adjustTarget, setAdjustTarget] = React.useState<{
    variantId: number
    productName: string
    sku: string
    currentStock: number
  } | null>(null)
  const [delta, setDelta] = React.useState<number>(10)
  const [reason, setReason] = React.useState<string>('Stock Purchase')
  const [reference, setReference] = React.useState<string>('')
  const [submitting, setSubmitting] = React.useState(false)

  // Flatten variants with parent product info
  const allVariants = React.useMemo(() => {
    return products.flatMap((product) =>
      product.variants.map((v) => {
        let stockStatus: StockStatus = 'Healthy'
        if (v.stock === 0) stockStatus = 'Out of Stock'
        else if (v.stock <= v.reorderPoint) stockStatus = 'Low Stock'

        return {
          ...v,
          productName: product.name,
          productFit: product.fit,
          productWash: product.wash,
          productImage: product.image,
          stockStatus,
        }
      })
    )
  }, [products])

  const filteredVariants = React.useMemo(() => {
    return allVariants.filter((v) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        v.productName.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.barcode.toLowerCase().includes(q)

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'low' && v.stock <= v.reorderPoint) ||
        (filterStatus === 'out' && v.stock === 0)

      return matchesQuery && matchesStatus
    })
  }, [allVariants, query, filterStatus])

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustTarget) return
    if (delta === 0) return toastError('Adjustment delta cannot be zero.')

    try {
      setSubmitting(true)
      await adjustStock(adjustTarget.variantId, delta, reason, reference || undefined)
      toastSuccess(`Adjusted stock for ${adjustTarget.sku} by ${delta > 0 ? '+' : ''}${delta}.`)
      setAdjustTarget(null)
      setReference('')
    } catch (err: any) {
      toastError(err?.message || 'Stock adjustment failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory & Stock Control"
        description="Monitor variant stock levels, reorder points, and log inventory movements"
      />

      <PageContent>
        {/* Filters & KPI Summary */}
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <Input
                  type="text"
                  placeholder="Search product, variant SKU, barcode..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="w-44">
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Stock Statuses</option>
                  <option value="low">Low Stock Alerts</option>
                  <option value="out">Out of Stock Only</option>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-ink-2">
              <span className="font-semibold text-ink">{allVariants.length}</span> Total Variants
            </div>
          </div>
        </Card>

        {/* Stock Adjustment Modal */}
        {adjustTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
            <Card className="w-full max-w-md p-6 space-y-4 shadow-modal bg-surface">
              <div className="flex items-center justify-between border-b border-divider pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Adjust Stock Level</h3>
                  <p className="text-xs text-ink-3">{adjustTarget.productName} &bull; {adjustTarget.sku}</p>
                </div>
                <button
                  onClick={() => setAdjustTarget(null)}
                  className="text-ink-3 hover:text-ink text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div className="rounded-lg bg-surface-subtle p-3 text-xs flex justify-between">
                  <span>Current Available Stock:</span>
                  <span className="font-bold text-ink tnum">{adjustTarget.currentStock} units</span>
                </div>

                <Field label="Stock Change Quantity (+ Add / - Deduct)" required>
                  <Input
                    type="number"
                    value={delta}
                    onChange={(e) => setDelta(Number(e.target.value))}
                  />
                </Field>

                <Field label="Adjustment Reason" required>
                  <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                    <option value="Stock Purchase">Stock Purchase / Restock</option>
                    <option value="Manual Adjustment">Manual Audit Adjustment</option>
                    <option value="Damaged / Written Off">Damaged / Written Off</option>
                    <option value="Customer Return">Customer Return Restock</option>
                  </Select>
                </Field>

                <Field label="Reference / PO Number">
                  <Input
                    placeholder="e.g. PO-2026-089"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAdjustTarget(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={submitting}>
                    Save Stock Adjustment
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Variants Inventory Table */}
        <Card>
          <CardHeader title="Inventory Matrix" subtitle="Variant-level stock counts and reorder thresholds" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product & Fit</th>
                  <th className="px-4 py-3 font-semibold">SKU / Barcode</th>
                  <th className="px-4 py-3 font-semibold">Size & Color</th>
                  <th className="px-4 py-3 font-semibold text-center">Available</th>
                  <th className="px-4 py-3 font-semibold text-center">Reserved</th>
                  <th className="px-4 py-3 font-semibold text-center">Reorder Point</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Quick Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filteredVariants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-3">
                      No inventory variants found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVariants.map((v) => (
                    <tr key={v.id} className="hover:bg-surface-subtle transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={v.productImage}
                            alt=""
                            className="h-8 w-8 rounded object-cover border border-line"
                          />
                          <div>
                            <p className="font-semibold text-ink">{v.productName}</p>
                            <p className="text-[10px] text-ink-3">
                              {v.productFit} fit &bull; {v.productWash}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-ink-2">
                        {v.sku}
                        <span className="block text-[10px] text-ink-4 font-sans">{v.barcode}</span>
                      </td>
                      <td className="px-4 py-3 text-ink">
                        W{v.size} &bull; {v.color}
                      </td>
                      <td className="px-4 py-3 text-center font-bold tnum text-ink">
                        {v.stock}
                      </td>
                      <td className="px-4 py-3 text-center tnum text-ink-3">
                        {v.reserved}
                      </td>
                      <td className="px-4 py-3 text-center tnum text-ink-3">
                        {v.reorderPoint}
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge status={v.stockStatus} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setAdjustTarget({
                              variantId: v.id,
                              productName: v.productName,
                              sku: v.sku,
                              currentStock: v.stock,
                            })
                          }
                        >
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Stock Movements Audit Table */}
        <Card className="p-5 space-y-4">
          <CardHeader title="Inventory Audit Log" subtitle="Recent stock additions, sales, and manual adjustments" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Time</th>
                  <th className="px-4 py-2.5 font-semibold">SKU</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold text-center">Change</th>
                  <th className="px-4 py-2.5 font-semibold text-center">Stock Level</th>
                  <th className="px-4 py-2.5 font-semibold">Reason / Reference</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {movements.slice(0, 10).map((mov) => (
                  <tr key={mov.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-2.5 text-ink-3">
                      {new Date(mov.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-ink-2">{mov.sku}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`font-semibold ${
                          mov.type === 'PURCHASE' || mov.type === 'RETURN'
                            ? 'text-success'
                            : mov.type === 'SALE'
                            ? 'text-info'
                            : 'text-warning'
                        }`}
                      >
                        {mov.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold tnum">
                      {mov.delta > 0 ? `+${mov.delta}` : mov.delta}
                    </td>
                    <td className="px-4 py-2.5 text-center tnum text-ink-2">
                      {mov.before} &rarr; <span className="font-bold text-ink">{mov.after}</span>
                    </td>
                    <td className="px-4 py-2.5 text-ink-2">
                      {mov.reason}
                      {mov.reference && <span className="block text-[10px] text-ink-4">{mov.reference}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-ink-2">{mov.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>
    </div>
  )
}
