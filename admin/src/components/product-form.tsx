'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useAdminStore } from '@/store/admin-store'
import { createProduct, updateProduct, deleteProduct } from '@/services/catalog'
import { Button, Card, CardHeader, Field, Input, Select, Textarea, Checkbox } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'
import type { Fit, Gender, Material, Product, ProductStatus, Rise, Wash, Color } from '@/lib/types'

interface VariantRow {
  id?: number
  size: number
  color: Color
  sku: string
  price: number
  stock: number
  reorderPoint: number
  weight: number
  barcode: string
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const categories = useAdminStore((s) => s.data.categories)
  const collections = useAdminStore((s) => s.data.collections)

  const isEdit = !!product

  const [name, setName] = React.useState(product?.name ?? '')
  const [slug, setSlug] = React.useState(product?.slug ?? '')
  const [sku, setSku] = React.useState(product?.sku ?? '')
  const [description, setDescription] = React.useState(product?.description ?? '')
  const [brand, setBrand] = React.useState(product?.brand ?? 'TEESGARAGE')
  const [categoryId, setCategoryId] = React.useState(product?.categoryId ?? categories[0]?.id ?? 1)
  const [collectionId, setCollectionId] = React.useState(product?.collectionId ?? collections[0]?.id ?? 1)
  const [fit, setFit] = React.useState<Fit>(product?.fit ?? 'Straight')
  const [gender, setGender] = React.useState<Gender>(product?.gender ?? 'Men')
  const [rise, setRise] = React.useState<Rise>(product?.rise ?? 'Mid')
  const [material, setMaterial] = React.useState<Material>(product?.material ?? 'Cotton Stretch')
  const [wash, setWash] = React.useState<Wash>(product?.wash ?? 'Stone Wash')
  const [inseam, setInseam] = React.useState(product?.inseam ?? 32)
  const [price, setPrice] = React.useState(product?.price ?? 1999)
  const [compareAtPrice, setCompareAtPrice] = React.useState<number | ''>(product?.compareAtPrice ?? 2499)
  const [costPrice, setCostPrice] = React.useState(product?.costPrice ?? 750)
  const [taxRate, setTaxRate] = React.useState(product?.taxRate ?? 0.12)
  const [status, setStatus] = React.useState<ProductStatus>(product?.status ?? 'Active')
  const [featured, setFeatured] = React.useState(product?.featured ?? false)

  const [image, setImage] = React.useState(
    product?.image ??
      'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&q=80&w=800'
  )
  const [image2, setImage2] = React.useState(
    product?.images[1]?.url ??
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800'
  )

  const [variants, setVariants] = React.useState<VariantRow[]>(
    product?.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      reorderPoint: v.reorderPoint,
      weight: v.weight,
      barcode: v.barcode,
    })) ?? [
      { size: 28, color: 'Blue', sku: 'TGE-STR-28', price: 1999, stock: 15, reorderPoint: 5, weight: 650, barcode: '8901234567890' },
      { size: 30, color: 'Blue', sku: 'TGE-STR-30', price: 1999, stock: 25, reorderPoint: 5, weight: 650, barcode: '8901234567891' },
      { size: 32, color: 'Blue', sku: 'TGE-STR-32', price: 1999, stock: 30, reorderPoint: 5, weight: 650, barcode: '8901234567892' },
      { size: 34, color: 'Blue', sku: 'TGE-STR-34', price: 1999, stock: 20, reorderPoint: 5, weight: 650, barcode: '8901234567893' },
      { size: 36, color: 'Blue', sku: 'TGE-STR-36', price: 1999, stock: 10, reorderPoint: 5, weight: 650, barcode: '8901234567894' },
    ]
  )

  const [submitting, setSubmitting] = React.useState(false)

  // Auto-generate slug and SKU if name changes
  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEdit) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSlug(generatedSlug)

      const initials = val
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
      setSku(`TGE-${initials || 'TEE'}`)
    }
  }

  const addVariantRow = () => {
    const nextSize = (variants[variants.length - 1]?.size ?? 34) + 2
    setVariants([
      ...variants,
      {
        size: nextSize > 38 ? 28 : nextSize,
        color: 'Blue',
        sku: `${sku || 'INF'}-${nextSize}`,
        price: price,
        stock: 10,
        reorderPoint: 5,
        weight: 650,
        barcode: `890${Math.floor(10000000000 + Math.random() * 89999999999)}`,
      },
    ])
  }

  const removeVariantRow = (index: number) => {
    if (variants.length <= 1) {
      toastError('A product must have at least one variant.')
      return
    }
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariantRow = (index: number, key: keyof VariantRow, val: any) => {
    const next = [...variants]
    next[index] = { ...next[index], [key]: val }
    setVariants(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return toastError('Product name is required.')
    if (!sku.trim()) return toastError('SKU is required.')
    if (price <= 0) return toastError('Price must be greater than zero.')

    try {
      setSubmitting(true)
      const input = {
        id: product?.id,
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: sku.trim(),
        description: description.trim(),
        brand,
        categoryId: Number(categoryId),
        collectionId: Number(collectionId),
        fit,
        gender,
        rise,
        material,
        wash,
        inseam: Number(inseam),
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        costPrice: Number(costPrice),
        taxRate: Number(taxRate),
        status,
        featured,
        image: image.trim(),
        images: [
          { url: image.trim(), alt: `${name} primary view` },
          { url: image2.trim(), alt: `${name} detail view` },
        ],
        variants: variants.map((v) => ({
          ...v,
          price: Number(v.price),
          stock: Number(v.stock),
          reorderPoint: Number(v.reorderPoint),
        })),
      }

      if (isEdit) {
        await updateProduct(input)
        toastSuccess(`Updated product "${name}".`)
      } else {
        await createProduct(input)
        toastSuccess(`Created product "${name}".`)
      }

      router.push('/products')
    } catch (err: any) {
      toastError(err?.message || 'Failed to save product.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!product) return
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return
    try {
      setSubmitting(true)
      await deleteProduct(product.id)
      toastSuccess(`Deleted product "${product.name}".`)
      router.push('/products')
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete product.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link href="/products" className="flex items-center gap-1.5 text-xs font-medium text-ink-3 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
        <div className="flex items-center gap-2">
          {isEdit && (
            <Button type="button" variant="danger-outline" size="sm" onClick={handleDelete} disabled={submitting}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Product Info */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5 space-y-4">
            <CardHeader title="General Details" subtitle="Basic product identifiers and presentation" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Product Name" required>
                <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Heavyweight Boxy Tee" />
              </Field>

              <Field label="SKU Base" required hint="Master SKU prefix">
                <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. TGE-TEE-01" />
              </Field>
            </div>

            <Field label="Description">
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product details, fabric feel, styling tips..."
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Fit" required>
                <Select value={fit} onChange={(e) => setFit(e.target.value as Fit)}>
                  <option value="Straight">Straight</option>
                  <option value="Skinny">Skinny</option>
                  <option value="Slim">Slim</option>
                  <option value="Relaxed">Relaxed</option>
                  <option value="Bootcut">Bootcut</option>
                </Select>
              </Field>

              <Field label="Wash" required>
                <Select value={wash} onChange={(e) => setWash(e.target.value as Wash)}>
                  <option value="Raw">Raw</option>
                  <option value="Stone Wash">Stone Wash</option>
                  <option value="Acid Wash">Acid Wash</option>
                  <option value="Vintage Wash">Vintage Wash</option>
                  <option value="Distressed">Distressed</option>
                  <option value="Dark Wash">Dark Wash</option>
                </Select>
              </Field>

              <Field label="Material" required>
                <Select value={material} onChange={(e) => setMaterial(e.target.value as Material)}>
                  <option value="Cotton Stretch">Cotton Stretch</option>
                  <option value="Cotton">100% Cotton</option>
                  <option value="Selvedge Denim">Selvedge Denim</option>
                  <option value="Tencel Denim">Tencel Denim</option>
                </Select>
              </Field>
            </div>
          </Card>

          {/* Pricing & Cost */}
          <Card className="p-5 space-y-4">
            <CardHeader title="Pricing & Financials" subtitle="Prices in INR (₹) and profit metrics" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Selling Price (₹)" required>
                <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </Field>

              <Field label="Compare-At Price (₹)" hint="Original MSRP for discount badge">
                <Input
                  type="number"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : '')}
                />
              </Field>

              <Field label="Cost Price (₹)" hint="COGS for margin tracking">
                <Input type="number" value={costPrice} onChange={(e) => setCostPrice(Number(e.target.value))} />
              </Field>
            </div>
          </Card>

          {/* Variants Table */}
          <Card className="p-5 space-y-4">
            <CardHeader
              title="Variants & Stock"
              subtitle="Size and color inventory matrix"
              action={
                <Button type="button" variant="secondary" size="sm" onClick={addVariantRow}>
                  <Plus className="h-3.5 w-3.5" /> Add Variant
                </Button>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Size (Waist)</th>
                    <th className="px-3 py-2 font-semibold">Color</th>
                    <th className="px-3 py-2 font-semibold">Variant SKU</th>
                    <th className="px-3 py-2 font-semibold">Stock</th>
                    <th className="px-3 py-2 font-semibold">Reorder Point</th>
                    <th className="px-3 py-2 text-right font-semibold">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {variants.map((v, idx) => (
                    <tr key={idx} className="hover:bg-surface-subtle">
                      <td className="px-3 py-2 w-24">
                        <Input
                          type="number"
                          value={v.size}
                          onChange={(e) => updateVariantRow(idx, 'size', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-2 w-32">
                        <Select value={v.color} onChange={(e) => updateVariantRow(idx, 'color', e.target.value)}>
                          <option value="Blue">Blue</option>
                          <option value="Dark Blue">Dark Blue</option>
                          <option value="Light Blue">Light Blue</option>
                          <option value="Black">Black</option>
                          <option value="Grey">Grey</option>
                          <option value="White">White</option>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={v.sku}
                          onChange={(e) => updateVariantRow(idx, 'sku', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 w-24">
                        <Input
                          type="number"
                          value={v.stock}
                          onChange={(e) => updateVariantRow(idx, 'stock', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-2 w-24">
                        <Input
                          type="number"
                          value={v.reorderPoint}
                          onChange={(e) => updateVariantRow(idx, 'reorderPoint', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          className="text-ink-3 hover:text-danger p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <CardHeader title="Status & Visibility" />

            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)}>
                <option value="Active">Active (Visible in Store)</option>
                <option value="Draft">Draft (Hidden)</option>
                <option value="Archived">Archived</option>
              </Select>
            </Field>

            <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer pt-2">
              <Checkbox checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              <span>Feature on homepage & top collections</span>
            </label>
          </Card>

          <Card className="p-5 space-y-4">
            <CardHeader title="Category & Collection" />

            <Field label="Category">
              <Select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Collection">
              <Select value={collectionId} onChange={(e) => setCollectionId(Number(e.target.value))}>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Gender Target">
              <Select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
              </Select>
            </Field>

            <Field label="Rise">
              <Select value={rise} onChange={(e) => setRise(e.target.value as Rise)}>
                <option value="Low">Low Rise</option>
                <option value="Mid">Mid Rise</option>
                <option value="High">High Rise</option>
              </Select>
            </Field>
          </Card>

          <Card className="p-5 space-y-4">
            <CardHeader title="Images (Unsplash URLs)" />

            <Field label="Primary Image URL">
              <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://images.unsplash.com/..." />
            </Field>

            <Field label="Secondary / Hover Image URL">
              <Input value={image2} onChange={(e) => setImage2(e.target.value)} placeholder="https://images.unsplash.com/..." />
            </Field>

            {image && (
              <div className="mt-2 h-36 w-full overflow-hidden rounded-lg border border-line bg-canvas">
                <img src={image} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </Card>
        </div>
      </div>
    </form>
  )
}
