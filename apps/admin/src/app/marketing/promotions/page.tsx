'use client'

import * as React from 'react'
import { Plus, Megaphone, Trash2, Edit2 } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { savePromotion, deletePromotion } from '@/services/marketing'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, Field, Input, Select, Badge } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'
import type { Promotion, PromotionTarget, DiscountType } from '@/lib/types'

export default function PromotionsPage() {
  const promotions = useAdminStore((s) => s.data.promotions)

  const [editPromo, setEditPromo] = React.useState<Promotion | null | 'new'>(null)
  const [title, setTitle] = React.useState('')
  const [target, setTarget] = React.useState<PromotionTarget>('Category')
  const [discountType, setDiscountType] = React.useState<DiscountType>('percentage')
  const [discountValue, setDiscountValue] = React.useState(20)
  const [status, setStatus] = React.useState<'Scheduled' | 'Active' | 'Ended'>('Active')
  const [loading, setLoading] = React.useState(false)

  const handleOpenNew = () => {
    setTitle('')
    setTarget('Category')
    setDiscountType('percentage')
    setDiscountValue(20)
    setStatus('Active')
    setEditPromo('new')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return toastError('Promotion title is required.')

    try {
      setLoading(true)
      const id = editPromo === 'new' ? Date.now() : editPromo?.id ?? Date.now()
      const promo: Promotion = {
        id,
        title: title.trim(),
        target,
        targetId: 1,
        discountType,
        discountValue: Number(discountValue),
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
        status,
        createdAt: new Date().toISOString(),
      }

      await savePromotion(promo)
      toastSuccess(`Promotion "${title}" saved.`)
      setEditPromo(null)
    } catch (err: any) {
      toastError(err?.message || 'Failed to save promotion.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, pTitle: string) => {
    if (!confirm(`Are you sure you want to delete promotion "${pTitle}"?`)) return
    try {
      setLoading(true)
      await deletePromotion(id)
      toastSuccess(`Deleted promotion "${pTitle}".`)
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete promotion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Promotional Campaigns" description="Run category-wide sales, seasonal discounts, and featured promotions">
        <Button size="sm" onClick={handleOpenNew}>
          <Plus className="h-4 w-4" /> Add Campaign
        </Button>
      </PageHeader>

      <PageContent>
        {/* Modal */}
        {editPromo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
            <Card className="w-full max-w-md p-6 space-y-4 shadow-modal bg-surface">
              <div className="flex items-center justify-between border-b border-divider pb-3">
                <h3 className="text-base font-semibold text-ink">
                  {editPromo === 'new' ? 'Create Promotion' : `Edit Promotion "${title}"`}
                </h3>
                <button onClick={() => setEditPromo(null)} className="text-ink-3 hover:text-ink text-xs">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Campaign Title" required hint="e.g. Summer Apparel Edit">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Target Scope">
                    <Select value={target} onChange={(e) => setTarget(e.target.value as PromotionTarget)}>
                      <option value="Category">Category</option>
                      <option value="Collection">Collection</option>
                      <option value="Fit">Fit Type</option>
                      <option value="Product">Single Product</option>
                    </Select>
                  </Field>

                  <Field label="Status">
                    <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                      <option value="Active">Active</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Ended">Ended</option>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Discount Type">
                    <Select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </Select>
                  </Field>

                  <Field label="Discount Value" required>
                    <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} />
                  </Field>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditPromo(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={loading}>
                    Save Campaign
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
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Target Scope</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-subtle transition-colors">
                    <td className="px-4 py-3 font-semibold text-ink">{p.title}</td>
                    <td className="px-4 py-3 text-ink-2">{p.target}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {p.discountType === 'percentage' ? `${p.discountValue}% OFF` : `₹${p.discountValue} OFF`}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.status === 'Active' ? 'success' : p.status === 'Scheduled' ? 'info' : 'neutral'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="danger-ghost" size="sm" onClick={() => handleDelete(p.id, p.title)}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
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
