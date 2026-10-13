'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useAdminStore } from '@/store/admin-store'
import { createProduct, updateProduct, deleteProduct } from '@/services/catalog'
import { Button, Card, CardHeader, Field, Input, Select, Textarea, Checkbox } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'
import type { Fit, Gender, Material, Product, ProductStatus, Rise, Wash, Color } from '@/lib/types'
import { generateBaseSku, fetchBackendSkuPreview } from '@/lib/sku'

interface VariantRow {
  id?: number
  size: number | string
  color: Color | string
  sku: string
  price: number
  stock: number
  reorderPoint: number
  weight: number
  barcode: string
  isCustomSku?: boolean
}

const AVAILABLE_COLORS = [
  'Black',
  'White',
  'Navy',
  'Grey',
  'Blue',
  'Dark Blue',
  'Light Blue',
  'Green',
  'Olive',
  'Red',
  'Beige',
]

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38']

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
  const [fit, setFit] = React.useState<Fit>(product?.fit ?? 'Regular')
  const [gender, setGender] = React.useState<Gender>(product?.gender ?? 'Men')
  const [rise, setRise] = React.useState<Rise>(product?.rise ?? 'Mid')
  const [material, setMaterial] = React.useState<Material>(product?.material ?? 'Cotton')
  const [wash, setWash] = React.useState<Wash>(product?.wash ?? 'Raw')
  const [inseam, setInseam] = React.useState(product?.inseam ?? 32)
  const [price, setPrice] = React.useState(product?.price ?? 1199)
  const [compareAtPrice, setCompareAtPrice] = React.useState<number | ''>(product?.compareAtPrice ?? 1499)
  const [costPrice, setCostPrice] = React.useState(product?.costPrice ?? 450)
  const [taxRate, setTaxRate] = React.useState(product?.taxRate ?? 0.12)
  const [status, setStatus] = React.useState<ProductStatus>(product?.status ?? 'Active')
  const [featured, setFeatured] = React.useState(product?.featured ?? false)

  const [image, setImage] = React.useState(
    product?.image ??
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800'
  )
  const [image2, setImage2] = React.useState(
    product?.images[1]?.url ??
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800'
  )

  const currentCategorySlug = React.useMemo(() => {
    return categories.find((c) => c.id === Number(categoryId))?.slug || 'printed-tees'
  }, [categories, categoryId])

  const [variants, setVariants] = React.useState<VariantRow[]>(() => {
    if (product?.variants && product.variants.length > 0) {
      return product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        reorderPoint: v.reorderPoint,
        weight: v.weight,
        barcode: v.barcode,
        isCustomSku: false,
      }))
    }

    const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL']
    return defaultSizes.map((sz, idx) => ({
      size: sz,
      color: 'Black',
      sku: generateBaseSku({ category: 'printed-tees', productType: 'Regular', color: 'Black', size: sz }),
      price: 1199,
      stock: 20,
      reorderPoint: 5,
      weight: 250,
      barcode: `890${Math.floor(10000000000 + Math.random() * 89999999999)}`,
      isCustomSku: false,
    }))
  })

  const [submitting, setSubmitting] = React.useState(false)

  // Auto-generate slug and SKU if name changes on new product
  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEdit) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSlug(generatedSlug)

      const masterSku = generateBaseSku({
        category: currentCategorySlug,
        productType: fit,
        color: 'BLK',
        size: 'BASE',
      })
      setSku(masterSku.replace('-BLK-BASE', ''))
    }
  }

  // Recalculate SKUs for unsaved variants when Category or Fit changes
  const handleCategoryChange = (newCatId: number) => {
    setCategoryId(newCatId)
    const newCatSlug = categories.find((c) => c.id === newCatId)?.slug || 'printed-tees'

    setVariants((prev) =>
      prev.map((v) => {
        // Preserve existing saved variants!
        if (v.id !== undefined || v.isCustomSku) return v
        const newSku = generateBaseSku({
          category: newCatSlug,
          productType: fit,
          color: String(v.color),
          size: v.size,
          productId: product?.id,
        })
        return { ...v, sku: newSku }
      })
    )
  }

  const handleFitChange = (newFit: Fit) => {
    setFit(newFit)
    setVariants((prev) =>
      prev.map((v) => {
        // Preserve existing saved variants!
        if (v.id !== undefined || v.isCustomSku) return v
        const newSku = generateBaseSku({
          category: currentCategorySlug,
          productType: newFit,
          color: String(v.color),
          size: v.size,
          productId: product?.id,
        })
        return { ...v, sku: newSku }
      })
    )
  }

  const addVariantRow = () => {
    const existingSizes = new Set(variants.map((v) => String(v.size)))
    const nextSize = STANDARD_SIZES.find((s) => !existingSizes.has(s)) || 'M'
    const newSku = generateBaseSku({
      category: currentCategorySlug,
      productType: fit,
      color: 'Black',
      size: nextSize,
      productId: product?.id,
    })

    setVariants([
      ...variants,
      {
        size: nextSize,
        color: 'Black',
        sku: newSku,
        price: price,
        stock: 15,
        reorderPoint: 5,
        weight: 250,
        barcode: `890${Math.floor(10000000000 + Math.random() * 89999999999)}`,
        isCustomSku: false,
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

  const recalculateVariantSku = async (index: number) => {
    const v = variants[index]
    if (!v) return
    const calculatedSku = await fetchBackendSkuPreview({
      category: currentCategorySlug,
      productType: fit,
      color: String(v.color),
      size: v.size,
      productId: product?.id,
    })

    const next = [...variants]
    next[index] = { ...v, sku: calculatedSku, isCustomSku: false }
    setVariants(next)
    toastSuccess(`Recalculated SKU: ${calculatedSku}`)
  }

  const updateVariantRow = (index: number, key: keyof VariantRow, val: any) => {
    const next = [...variants]
    const current = next[index]
    let updated = { ...current, [key]: val }

    // If size or color changed on an unsaved variant, automatically recalculate SKU
    if ((key === 'size' || key === 'color') && current.id === undefined && !current.isCustomSku) {
      const newSku = generateBaseSku({
        category: currentCategorySlug,
        productType: fit,
        color: String(key === 'color' ? val : current.color),
        size: key === 'size' ? val : current.size,
        productId: product?.id,
      })
      updated.sku = newSku
    }

    if (key === 'sku') {
      updated.isCustomSku = true
    }

    next[index] = updated
    setVariants(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return toastError('Product name is required.')
    if (price <= 0) return toastError('Price must be greater than zero.')

    // Check for duplicate variant color/size combination
    const seen = new Set<string>()
    for (const v of variants) {
      const key = `${String(v.color).toLowerCase()}__${String(v.size).toUpperCase()}`
      if (seen.has(key)) {
        return toastError(`Duplicate variant: A variant with color "${v.color}" and size "${v.size}" already exists.`)
      }
      seen.add(key)
    }

    try {
      setSubmitting(true)
      const input = {
        id: product?.id,
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: sku.trim() || generateBaseSku({ category: currentCategorySlug, productType: fit, color: 'BLK', size: 'BASE' }).replace('-BLK-BASE', ''),
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
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku.trim(),
          price: Number(v.price),
          stock: Number(v.stock),
          reorderPoint: Number(v.reorderPoint),
          weight: Number(v.weight),
          barcode: v.barcode,
          status: 'Active' as const,
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
                <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Breton Heavyweight Striped Tee" />
              </Field>

              <Field label="SKU Base Prefix" hint="Master product prefix">
                <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. STR-OVS" />
              </Field>
            </div>

            <Field label="Description">
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product details, fabric feel, styling tips..."
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Category" required>
                <Select value={categoryId} onChange={(e) => handleCategoryChange(Number(e.target.value))}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Fit / Product Type" required>
                <Select value={fit} onChange={(e) => handleFitChange(e.target.value as Fit)}>
                  <option value="Regular">Regular</option>
                  <option value="Oversized">Oversized</option>
                  <option value="Boxy">Boxy</option>
                  <option value="Relaxed">Relaxed</option>
                  <option value="Straight">Straight</option>
                  <option value="Slim">Slim</option>
                  <option value="Skinny">Skinny</option>
                  <option value="Baggy">Baggy</option>
                  <option value="Bootcut">Bootcut</option>
                  <option value="Wide">Wide</option>
                </Select>
              </Field>

              <Field label="Wash / Finish" required>
                <Select value={wash} onChange={(e) => setWash(e.target.value as Wash)}>
                  <option value="Raw">Raw</option>
                  <option value="Stone Wash">Stone Wash</option>
                  <option value="Acid Wash">Acid Wash</option>
                  <option value="Vintage Wash">Vintage Wash</option>
                  <option value="Distressed">Distressed</option>
                  <option value="Dark Wash">Dark Wash</option>
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

          {/* Variants Table with Automatic SKU Generation */}
          <Card className="p-5 space-y-4">
            <CardHeader
              title="Variants & Automatic SKUs"
              subtitle="SKU format: CATEGORY-PRODUCT_TYPE-COLOR-SIZE (e.g. STR-OVS-BLK-M)"
              action={
                <Button type="button" variant="secondary" size="sm" onClick={addVariantRow}>
                  <Plus className="h-3.5 w-3.5" /> Add Variant
                </Button>
              }
            />

            <div className="rounded-lg bg-surface-subtle/50 p-2.5 text-xs text-ink-2 flex items-center justify-between border border-line">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span>Backend SKU format active: <strong className="font-mono text-ink">CATEGORY-PRODUCT_TYPE-COLOR-SIZE</strong></span>
              </div>
              <span className="text-[11px] text-ink-3">New variants auto-generate; existing SKUs preserved</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-divider bg-surface-subtle text-ink-3">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Size</th>
                    <th className="px-3 py-2 font-semibold">Color</th>
                    <th className="px-3 py-2 font-semibold">Generated SKU</th>
                    <th className="px-3 py-2 font-semibold">Stock</th>
                    <th className="px-3 py-2 font-semibold">Reorder Pt</th>
                    <th className="px-3 py-2 text-center font-semibold">Sync</th>
                    <th className="px-3 py-2 text-right font-semibold">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {variants.map((v, idx) => (
                    <tr key={idx} className="hover:bg-surface-subtle/60 transition-colors">
                      <td className="px-3 py-2 w-28">
                        <Select
                          value={String(v.size)}
                          onChange={(e) => updateVariantRow(idx, 'size', e.target.value)}
                        >
                          {STANDARD_SIZES.map((sz) => (
                            <option key={sz} value={sz}>
                              {sz}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-3 py-2 w-36">
                        <Select
                          value={String(v.color)}
                          onChange={(e) => updateVariantRow(idx, 'color', e.target.value)}
                        >
                          {AVAILABLE_COLORS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-3 py-2 min-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          <Input
                            className="font-mono font-medium text-xs tracking-wider uppercase"
                            value={v.sku}
                            onChange={(e) => updateVariantRow(idx, 'sku', e.target.value)}
                          />
                          {v.id !== undefined ? (
                            <span className="shrink-0 text-[10px] bg-canvas text-ink-3 px-1.5 py-0.5 rounded border border-line" title="Preserved existing variant SKU">
                              Saved
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] bg-accent/10 text-accent font-medium px-1.5 py-0.5 rounded border border-accent/20" title="Auto-generated backend SKU">
                              Auto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 w-20">
                        <Input
                          type="number"
                          value={v.stock}
                          onChange={(e) => updateVariantRow(idx, 'stock', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-2 w-20">
                        <Input
                          type="number"
                          value={v.reorderPoint}
                          onChange={(e) => updateVariantRow(idx, 'reorderPoint', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-2 text-center w-12">
                        <button
                          type="button"
                          onClick={() => recalculateVariantSku(idx)}
                          className="text-ink-3 hover:text-accent p-1 transition-colors"
                          title="Recalculate SKU"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right w-12">
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          className="text-ink-3 hover:text-danger p-1 transition-colors"
                          title="Remove variant"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
            <CardHeader title="Collection & Target" />

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

            <Field label="Material">
              <Select value={material} onChange={(e) => setMaterial(e.target.value as Material)}>
                <option value="Cotton">100% Heavy Combed Cotton</option>
                <option value="Cotton Stretch">Cotton Stretch</option>
                <option value="Selvedge Denim">Selvedge Denim</option>
                <option value="Tencel Denim">Tencel Denim</option>
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
