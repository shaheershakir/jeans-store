'use client'

import * as React from 'react'
import { Plus, Trash2, Edit2, Layers } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { saveCollection, deleteCollection } from '@/services/catalog'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, Field, Input, Select, Textarea, Badge } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'
import type { Collection } from '@/lib/types'

export default function CollectionsPage() {
  const collections = useAdminStore((s) => s.data.collections)
  const products = useAdminStore((s) => s.data.products)

  const [editCollection, setEditCollection] = React.useState<Collection | null | 'new'>(null)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [status, setStatus] = React.useState<'Active' | 'Inactive'>('Active')
  const [loading, setLoading] = React.useState(false)

  const handleOpenNew = () => {
    setName('')
    setDescription('')
    setStatus('Active')
    setEditCollection('new')
  }

  const handleOpenEdit = (col: Collection) => {
    setName(col.name)
    setDescription(col.description)
    setStatus(col.status)
    setEditCollection(col)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toastError('Collection name is required.')

    try {
      setLoading(true)
      const id = editCollection === 'new' ? undefined : editCollection?.id
      await saveCollection({ id, name: name.trim(), description: description.trim(), status })
      toastSuccess(`Collection "${name}" saved.`)
      setEditCollection(null)
    } catch (err: any) {
      toastError(err?.message || 'Failed to save collection.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, colName: string) => {
    if (!confirm(`Are you sure you want to delete collection "${colName}"?`)) return
    try {
      setLoading(true)
      await deleteCollection(id)
      toastSuccess(`Collection "${colName}" deleted.`)
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete collection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Collections" description="Curate seasonal and thematic apparel collections">
        <Button size="sm" onClick={handleOpenNew}>
          <Plus className="h-4 w-4" /> Add Collection
        </Button>
      </PageHeader>

      <PageContent>
        {/* Edit Modal */}
        {editCollection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
            <Card className="w-full max-w-md p-6 space-y-4 shadow-modal bg-surface">
              <div className="flex items-center justify-between border-b border-divider pb-3">
                <h3 className="text-base font-semibold text-ink">
                  {editCollection === 'new' ? 'Add New Collection' : `Edit Collection "${name}"`}
                </h3>
                <button onClick={() => setEditCollection(null)} className="text-ink-3 hover:text-ink text-xs">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Collection Name" required>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Heavyweight Selvedge 2026" />
                </Field>

                <Field label="Description">
                  <Textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Collection summary..."
                  />
                </Field>

                <Field label="Status">
                  <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Select>
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditCollection(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={loading}>
                    Save Collection
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
                  <th className="px-4 py-3 font-semibold">Collection Name</th>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold text-center">Products Count</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {collections.map((col) => {
                  const productCount = products.filter((p) => p.collectionId === col.id).length

                  return (
                    <tr key={col.id} className="hover:bg-surface-subtle transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink">{col.name}</td>
                      <td className="px-4 py-3 font-mono text-ink-2">{col.slug}</td>
                      <td className="px-4 py-3 text-ink-2 max-w-sm">{col.description || '—'}</td>
                      <td className="px-4 py-3 text-center font-bold tnum text-ink">{productCount}</td>
                      <td className="px-4 py-3">
                        <Badge tone={col.status === 'Active' ? 'success' : 'neutral'}>
                          {col.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(col)}>
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button variant="danger-ghost" size="sm" onClick={() => handleDelete(col.id, col.name)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>
    </div>
  )
}
