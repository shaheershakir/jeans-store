'use client'

import * as React from 'react'
import { Plus, Trash2, Edit2, FolderTree } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { saveCategory, deleteCategory } from '@/services/catalog'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, CardHeader, Field, Input, Textarea } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'
import type { Category } from '@/lib/types'

export default function CategoriesPage() {
  const categories = useAdminStore((s) => s.data.categories)
  const products = useAdminStore((s) => s.data.products)

  const [editCategory, setEditCategory] = React.useState<Category | null | 'new'>(null)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleOpenNew = () => {
    setName('')
    setDescription('')
    setEditCategory('new')
  }

  const handleOpenEdit = (c: Category) => {
    setName(c.name)
    setDescription(c.description)
    setEditCategory(c)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toastError('Category name is required.')

    try {
      setLoading(true)
      const id = editCategory === 'new' ? undefined : editCategory?.id
      await saveCategory({ id, name: name.trim(), description: description.trim() })
      toastSuccess(`Category "${name}" saved.`)
      setEditCategory(null)
    } catch (err: any) {
      toastError(err?.message || 'Failed to save category.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return
    try {
      setLoading(true)
      await deleteCategory(id)
      toastSuccess(`Category "${catName}" deleted.`)
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete category.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Categories" description="Manage denim product categories and taxonomy">
        <Button size="sm" onClick={handleOpenNew}>
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </PageHeader>

      <PageContent>
        {/* Edit Modal */}
        {editCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
            <Card className="w-full max-w-md p-6 space-y-4 shadow-modal bg-surface">
              <div className="flex items-center justify-between border-b border-divider pb-3">
                <h3 className="text-base font-semibold text-ink">
                  {editCategory === 'new' ? 'Add New Category' : `Edit Category "${name}"`}
                </h3>
                <button onClick={() => setEditCategory(null)} className="text-ink-3 hover:text-ink text-xs">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Category Name" required>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Baggy Jeans" />
                </Field>

                <Field label="Description">
                  <Textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary of this category..."
                  />
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditCategory(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={loading}>
                    Save Category
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
                  <th className="px-4 py-3 font-semibold">Category Name</th>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold text-center">Products Count</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {categories.map((c) => {
                  const productCount = products.filter((p) => p.categoryId === c.id).length

                  return (
                    <tr key={c.id} className="hover:bg-surface-subtle transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-ink-2">{c.slug}</td>
                      <td className="px-4 py-3 text-ink-2 max-w-sm">{c.description || '—'}</td>
                      <td className="px-4 py-3 text-center font-bold tnum text-ink">{productCount}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(c)}>
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button variant="danger-ghost" size="sm" onClick={() => handleDelete(c.id, c.name)}>
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
