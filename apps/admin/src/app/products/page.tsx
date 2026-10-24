'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Edit2, Plus, Search, Trash2, Filter } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, Checkbox, Input, Select } from '@/components/ui/primitives'
import { ProductStatusBadge } from '@/components/ui/status'
import { bulkDeleteProducts, bulkSetProductStatus, fetchBackendProducts } from '@/services/catalog'
import { toastSuccess, toastError } from '@/components/ui/toast'
import { formatINR } from '@/lib/format'
import type { Fit, ProductStatus } from '@/lib/types'

export default function ProductsPage() {
  const products = useAdminStore((s) => s.data.products)
  const categories = useAdminStore((s) => s.data.categories)

  const [query, setQuery] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all')
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    void fetchBackendProducts()
      .then(() => { if (active) setLoadError(null) })
      .catch((error) => { if (active) setLoadError(error instanceof Error ? error.message : 'Could not load products.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.variants?.some((v) => v.sku.toLowerCase().includes(q))
      const matchesCategory = selectedCategory === 'all' || p.categoryId === Number(selectedCategory)
      const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus
      return matchesQuery && matchesCategory && matchesStatus
    })
  }, [products, query, selectedCategory, selectedStatus])


  const allSelected =
    filteredProducts.length > 0 && selectedIds.length === filteredProducts.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleBulkStatus = async (status: ProductStatus) => {
    if (selectedIds.length === 0) return
    try {
      await bulkSetProductStatus(selectedIds, status)
      toastSuccess(`Updated ${selectedIds.length} products to ${status}.`)
      setSelectedIds([])
    } catch (err: any) {
      toastError(err?.message || 'Failed to update status.')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return
    try {
      await bulkDeleteProducts(selectedIds)
      toastSuccess(`Deleted ${selectedIds.length} products.`)
      setSelectedIds([])
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete products.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description={`Manage the TEESGARAGE apparel catalog (${products.length} products)`}
      >
        <Link href="/products/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </Link>
      </PageHeader>

      <PageContent>
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search & Filters */}
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <Input
                  type="text"
                  placeholder="Search products or SKU..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="w-40">
                <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="w-36">
                <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 border-t border-divider pt-3 sm:border-t-0 sm:pt-0">
                <span className="text-xs font-semibold text-ink-2">
                  {selectedIds.length} selected
                </span>
                <Button variant="secondary" size="sm" onClick={() => handleBulkStatus('Active')}>
                  Make Active
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleBulkStatus('Draft')}>
                  Make Draft
                </Button>
                <Button variant="danger-outline" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox checked={allSelected} onChange={toggleSelectAll} />
                  </th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Price</th>
                  <th className="px-4 py-3 font-semibold text-center">Total Stock</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                  {loadError ? (
                    <tr><td colSpan={8} className="py-8 text-center text-destructive">{loadError}</td></tr>
                  ) : loading ? (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Loading catalog…</td></tr>
                  ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-3">
                      {products.length === 0 ? 'No products yet. Add your first product to publish it to the storefront.' : 'No products match these filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
                    const isChecked = selectedIds.includes(product.id)

                    return (
                      <tr key={product.id} className="hover:bg-surface-subtle transition-colors">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={isChecked}
                            onChange={() => toggleSelect(product.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-line bg-canvas">
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <Link
                                href={`/products/${product.id}`}
                                className="font-semibold text-ink hover:text-primary"
                              >
                                {product.name}
                              </Link>
                              <p className="text-[11px] text-ink-3">
                                {categories.find((c) => c.id === product.categoryId)?.name ?? 'Uncategorized'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-ink-2">
                          <span className="font-semibold">{product.sku}</span>
                          {product.variants.length > 0 && (
                            <span className="block text-[10px] text-ink-4 mt-0.5 tracking-tight">
                              {product.variants[0]?.sku}
                              {product.variants.length > 1 ? ` (+${product.variants.length - 1} variants)` : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-2">
                          {categories.find((c) => c.id === product.categoryId)?.name ?? 'Apparel'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tnum text-ink">
                          {formatINR(product.price)}
                          {product.compareAtPrice && (
                            <span className="block text-[11px] text-ink-4 line-through">
                              {formatINR(product.compareAtPrice)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block font-semibold tnum ${
                              totalStock <= 10 ? 'text-danger' : 'text-ink'
                            }`}
                          >
                            {totalStock} units
                          </span>
                          <span className="block text-[10px] text-ink-3">
                            ({product.variants.length} variants)
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ProductStatusBadge status={product.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/products/${product.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>
    </div>
  )
}
