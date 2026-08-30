'use client'

import * as React from 'react'
import { Plus, TicketPercent, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { saveCoupon, deleteCoupon, toggleCoupon } from '@/services/marketing'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, Field, Input, Select, Checkbox } from '@/components/ui/primitives'
import { CouponBadge } from '@/components/ui/status'
import { toastSuccess, toastError } from '@/components/ui/toast'
import { formatINR } from '@/lib/format'
import type { Coupon, DiscountType } from '@/lib/types'

export default function CouponsPage() {
  const coupons = useAdminStore((s) => s.data.coupons)

  const [editCoupon, setEditCoupon] = React.useState<Coupon | null | 'new'>(null)
  const [code, setCode] = React.useState('')
  const [type, setType] = React.useState<DiscountType>('percentage')
  const [value, setValue] = React.useState(15)
  const [minOrderValue, setMinOrderValue] = React.useState(1499)
  const [isActive, setIsActive] = React.useState(true)
  const [loading, setLoading] = React.useState(false)

  const handleOpenNew = () => {
    setCode('')
    setType('percentage')
    setValue(15)
    setMinOrderValue(1499)
    setIsActive(true)
    setEditCoupon('new')
  }

  const handleOpenEdit = (c: Coupon) => {
    setCode(c.code)
    setType(c.type)
    setValue(c.value)
    setMinOrderValue(c.minOrderValue)
    setIsActive(c.isActive)
    setEditCoupon(c)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return toastError('Coupon code is required.')
    if (value <= 0) return toastError('Discount value must be positive.')

    try {
      setLoading(true)
      const id = editCoupon === 'new' ? Date.now() : editCoupon?.id ?? Date.now()
      const existing = editCoupon !== 'new' ? editCoupon : null

      const coupon: Coupon = {
        id,
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        minOrderValue: Number(minOrderValue),
        maxDiscount: type === 'percentage' ? 500 : null,
        startsAt: existing?.startsAt ?? new Date().toISOString(),
        endsAt: existing?.endsAt ?? new Date(Date.now() + 30 * 86400000).toISOString(),
        usageLimit: existing?.usageLimit ?? 100,
        perCustomerLimit: 1,
        productIds: [],
        categoryIds: [],
        isActive,
        timesUsed: existing?.timesUsed ?? 0,
      }

      await saveCoupon(coupon)
      toastSuccess(`Coupon "${coupon.code}" saved.`)
      setEditCoupon(null)
    } catch (err: any) {
      toastError(err?.message || 'Failed to save coupon.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: number) => {
    try {
      await toggleCoupon(id)
      toastSuccess('Toggled coupon status.')
    } catch (err: any) {
      toastError(err?.message || 'Failed to toggle coupon.')
    }
  }

  const handleDelete = async (id: number, cCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${cCode}"?`)) return
    try {
      setLoading(true)
      await deleteCoupon(id)
      toastSuccess(`Deleted coupon "${cCode}".`)
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete coupon.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Discount Coupons" description="Create promo codes, percentage discounts, and minimum order requirements">
        <Button size="sm" onClick={handleOpenNew}>
          <Plus className="h-4 w-4" /> Add Coupon
        </Button>
      </PageHeader>

      <PageContent>
        {/* Modal */}
        {editCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
            <Card className="w-full max-w-md p-6 space-y-4 shadow-modal bg-surface">
              <div className="flex items-center justify-between border-b border-divider pb-3">
                <h3 className="text-base font-semibold text-ink">
                  {editCoupon === 'new' ? 'Create Coupon' : `Edit Coupon "${code}"`}
                </h3>
                <button onClick={() => setEditCoupon(null)} className="text-ink-3 hover:text-ink text-xs">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Coupon Code" required hint="e.g. INFIT15">
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Discount Type">
                    <Select value={type} onChange={(e) => setType(e.target.value as DiscountType)}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </Select>
                  </Field>

                  <Field label="Discount Value" required>
                    <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
                  </Field>
                </div>

                <Field label="Minimum Order Value (₹)">
                  <Input type="number" value={minOrderValue} onChange={(e) => setMinOrderValue(Number(e.target.value))} />
                </Field>

                <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer pt-2">
                  <Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  <span>Coupon active for store use</span>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditCoupon(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={loading}>
                    Save Coupon
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Min Order</th>
                  <th className="px-4 py-3 font-semibold text-center">Times Used</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-subtle transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-ink">{c.code}</td>
                    <td className="px-4 py-3 text-ink font-medium">
                      {c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                    </td>
                    <td className="px-4 py-3 text-ink-2 tnum">{formatINR(c.minOrderValue)}</td>
                    <td className="px-4 py-3 text-center font-bold tnum text-ink">{c.timesUsed}</td>
                    <td className="px-4 py-3">
                      <CouponBadge coupon={c} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="secondary" size="sm" onClick={() => handleToggleActive(c.id)}>
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(c)}>
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="danger-ghost" size="sm" onClick={() => handleDelete(c.id, c.code)}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </td>
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
