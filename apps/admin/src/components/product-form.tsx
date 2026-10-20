'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ImagePlus, LoaderCircle, Plus, Trash2, UploadCloud } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { createProduct, deleteProduct, updateProduct, uploadProductImage } from '@/services/catalog'
import { Button, Card, CardHeader, Field, Input, Select, Textarea, Checkbox } from '@/components/ui/primitives'
import { toastError, toastSuccess } from '@/components/ui/toast'
import type { Product, ProductStatus } from '@/lib/types'
import { generateBaseSku } from '@/lib/sku'

interface VariantRow {
  id?: number
  size: string
  color: string
  sku: string
  price: number
  stock: number
  reorderPoint: number
  weight: number
  barcode: string
}

const APPAREL_CATEGORIES = [
  { name: 'Stripes', slug: 'stripes' },
  { name: 'Fullsleeve', slug: 'fullsleeve' },
  { name: 'Drsleeve', slug: 'drsleeve' },
  { name: 'Printed tees', slug: 'printed-tees' },
  { name: 'Ringer tees', slug: 'ringer-tees' },
  { name: 'Henley', slug: 'henley' },
  { name: 'Trackpants', slug: 'trackpants' },
  { name: 'Sweatpants', slug: 'sweatpants' },
] as const

const COLORS = ['Black', 'White', 'Navy', 'Grey', 'Blue', 'Green', 'Olive', 'Red', 'Beige']
const TOP_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const BOTTOM_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42']
const BARCODE = () => `890${Math.floor(10000000000 + Math.random() * 89999999999)}`

function isBottomwear(categorySlug: string) {
  return categorySlug === 'trackpants' || categorySlug === 'sweatpants'
}

function defaultWeight(categorySlug: string) {
  return isBottomwear(categorySlug) ? 650 : 350
}

function makeVariant(size: string, categorySlug: string, price: number, weight: number): VariantRow {
  return {
    size,
    color: 'Black',
    sku: generateBaseSku({ category: categorySlug, productType: 'Regular', color: 'Black', size }),
    price,
    stock: 0,
    reorderPoint: 5,
    weight,
    barcode: BARCODE(),
  }
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const categories = useAdminStore((state) => state.data.categories)
  const collections = useAdminStore((state) => state.data.collections)
  const isEdit = Boolean(product)

  const initialCategorySlug = categories.find((category) => category.id === product?.categoryId)?.slug ?? 'printed-tees'
  const initialWeight = product?.weightGrams ?? defaultWeight(initialCategorySlug)
  const [name, setName] = React.useState(product?.name ?? '')
  const [slug, setSlug] = React.useState(product?.slug ?? '')
  const [description, setDescription] = React.useState(product?.description ?? '')
  const [categoryId, setCategoryId] = React.useState(product?.categoryId ?? categories.find((category) => category.slug === 'printed-tees')?.id ?? categories[0]?.id ?? 1)
  const [collectionId, setCollectionId] = React.useState(product?.collectionId ?? collections[0]?.id ?? 1)
  const [weightGrams, setWeightGrams] = React.useState(initialWeight)
  const [price, setPrice] = React.useState(product?.price ?? 1199)
  const [compareAtPrice, setCompareAtPrice] = React.useState<number | ''>(product?.compareAtPrice ?? 1499)
  const [costPrice, setCostPrice] = React.useState(product?.costPrice ?? 0)
  const [taxRate, setTaxRate] = React.useState(product?.taxRate ?? 0.05)
  const [status, setStatus] = React.useState<ProductStatus>(product?.status ?? 'Draft')
  const [featured, setFeatured] = React.useState(product?.featured ?? false)
  const [isFreeSize, setIsFreeSize] = React.useState(product?.isFreeSize ?? false)
  const [image, setImage] = React.useState(product?.image ?? '')
  const [image2, setImage2] = React.useState(product?.images[1]?.url ?? '')
  const [uploading, setUploading] = React.useState<'primary' | 'secondary' | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const category = categories.find((item) => item.id === Number(categoryId))
  const categorySlug = category?.slug ?? 'printed-tees'
  const sizeOptions = isBottomwear(categorySlug) ? BOTTOM_SIZES : TOP_SIZES
  const [variants, setVariants] = React.useState<VariantRow[]>(() => {
    if (product?.variants.length) {
      return product.variants.map((variant) => ({
        id: variant.id,
        size: String(variant.size),
        color: String(variant.color),
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock,
        reorderPoint: variant.reorderPoint,
        weight: variant.weight || initialWeight,
        barcode: variant.barcode,
      }))
    }
    const defaults = isBottomwear(initialCategorySlug) ? ['30', '32', '34', '36', '38'] : ['S', 'M', 'L', 'XL', 'XXL']
    return defaults.map((size) => makeVariant(size, initialCategorySlug, 1199, initialWeight))
  })

  const updateVariant = (index: number, patch: Partial<VariantRow>) => {
    setVariants((current) => current.map((variant, rowIndex) => {
      if (rowIndex !== index) return variant
      const next = { ...variant, ...patch }
      if (patch.size !== undefined || patch.color !== undefined) {
        next.sku = generateBaseSku({
          category: categorySlug,
          productType: 'Regular',
          color: next.color,
          size: next.size,
        })
      }
      return next
    }))
  }

  const handleFreeSizeChange = (checked: boolean) => {
    setIsFreeSize(checked)
    if (checked) {
      setVariants((current) => {
        const sharedStock = current[0]?.stock ?? 0
        return current.map((variant) => ({ ...variant, stock: sharedStock }))
      })
    }
  }

  const handleCategoryChange = (nextId: number) => {
    const nextCategory = categories.find((item) => item.id === nextId)?.slug ?? 'printed-tees'
    const nextWeight = defaultWeight(nextCategory)
    setCategoryId(nextId)
    setWeightGrams(nextWeight)
    const nextSizes = isBottomwear(nextCategory) ? BOTTOM_SIZES : TOP_SIZES
    setVariants((current) => current.map((variant, index) => {
      const size = nextSizes[index] ?? nextSizes[nextSizes.length - 1]
      return {
        ...variant,
        size,
        weight: nextWeight,
        sku: generateBaseSku({ category: nextCategory, productType: 'Regular', color: variant.color, size }),
      }
    }))
  }

  const uploadImage = async (file: File, slot: 'primary' | 'secondary') => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toastError('Choose a JPEG, PNG, or WebP product photo.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError('Product photos must be 10 MB or smaller.')
      return
    }
    try {
      setUploading(slot)
      const url = await uploadProductImage(file)
      if (slot === 'primary') setImage(url)
      else setImage2(url)
      toastSuccess('Product photo uploaded to Google Cloud Storage.')
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Could not upload this photo.')
    } finally {
      setUploading(null)
    }
  }

  const addVariant = () => {
    const existing = new Set(variants.map((variant) => variant.size))
    const nextSize = sizeOptions.find((size) => !existing.has(size)) ?? ''
    setVariants((current) => [
      ...current,
      { ...makeVariant(nextSize, categorySlug, price, weightGrams), stock: isFreeSize ? current[0]?.stock ?? 0 : 0 }
    ])
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return toastError('Product name is required.')
    if (!image) return toastError('Upload a primary product photo before saving.')
    if (!variants.length || variants.some((variant) => !variant.size.trim())) return toastError('Every variant needs a size.')
    if (weightGrams < 1) return toastError('Product weight must be greater than zero.')

    const seen = new Set<string>()
    for (const variant of variants) {
      const key = `${variant.color.toLowerCase()}__${variant.size.trim().toUpperCase()}`
      if (seen.has(key)) return toastError(`Duplicate variant: ${variant.color} / ${variant.size}`)
      seen.add(key)
    }

    try {
      setSubmitting(true)
      const cleanSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const input = {
        id: product?.id,
        name: name.trim(), slug: cleanSlug, sku: variants[0]?.sku ?? '', description: description.trim(),
        categoryId: Number(categoryId), collectionId: Number(collectionId),
        price: Number(price), compareAtPrice: compareAtPrice === '' ? null : Number(compareAtPrice),
        costPrice: Number(costPrice), taxRate: Number(taxRate), status, featured, isFreeSize, weightGrams: Number(weightGrams),
        image, images: [{ url: image, alt: `${name} product photo` }, ...(image2 ? [{ url: image2, alt: `${name} alternate view` }] : [])],
        variants: variants.map((variant) => ({
          id: variant.id, size: variant.size.trim(), color: variant.color.trim(),
          price: Number(variant.price || price), stock: Math.max(0, Number(isFreeSize ? variants[0]?.stock ?? variant.stock : variant.stock)),
          reorderPoint: Math.max(0, Number(variant.reorderPoint)), weight: Number(weightGrams), barcode: variant.barcode, status: 'Active' as const,
        })),
      }
      if (isEdit) {
        await updateProduct(input)
        toastSuccess(`Updated “${name}”.`)
      } else {
        await createProduct(input)
        toastSuccess(`Created “${name}”.`)
      }
      router.push('/products')
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Failed to save product.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!product || !window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return
    try {
      setSubmitting(true)
      await deleteProduct(product.id)
      toastSuccess(`Deleted “${product.name}”.`)
      router.push('/products')
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Failed to delete product.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/products" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Products</Link>
        <div className="flex items-center gap-2">
          {isEdit && <Button type="button" variant="danger-outline" size="sm" onClick={handleDelete} disabled={submitting}>Delete</Button>}
          <Button type="submit" size="sm" disabled={submitting || uploading !== null}>{submitting ? 'Saving…' : isEdit ? 'Save product' : 'Create product'}</Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="space-y-5 p-5">
            <CardHeader title="Product details" subtitle="Set the apparel category and customer-facing description." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name" required><Input required value={name} onChange={(event) => { setName(event.target.value); if (!isEdit && !slug) setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) }} placeholder="e.g. Contrast Ringer Tee" /></Field>
              <Field label="Category" required><Select value={categoryId} onChange={(event) => handleCategoryChange(Number(event.target.value))}>{APPAREL_CATEGORIES.map((option) => { const match = categories.find((item) => item.slug === option.slug); return match ? <option key={match.id} value={match.id}>{option.name}</option> : null })}</Select></Field>
              <Field label="Product slug"><Input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="auto-generated-from-name" /></Field>
            </div>
            <Field label="Description"><Textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the garment construction, fabric, and care." /></Field>
          </Card>

          <Card className="space-y-5 p-5">
            <CardHeader title="Pricing and inventory" subtitle="Set the selling price, stock by size, and the weight used for delivery charges." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Selling price (₹)" required><Input required min={1} type="number" value={price} onChange={(event) => setPrice(Number(event.target.value))} /></Field>
              <Field label="Compare-at price (₹)"><Input min={0} type="number" value={compareAtPrice} onChange={(event) => setCompareAtPrice(event.target.value ? Number(event.target.value) : '')} /></Field>
              <Field label="Unit cost (₹)" hint="Internal margin reporting"><Input min={0} type="number" value={costPrice} onChange={(event) => setCostPrice(Number(event.target.value))} /></Field>
              <Field label="Tax rate (%)"><Input min={0} max={100} step="0.1" type="number" value={Math.round(taxRate * 1000) / 10} onChange={(event) => setTaxRate(Number(event.target.value) / 100)} /></Field>
              <Field label="Shipping weight (grams)" required hint="Applied to each unit in the cart."><Input required min={1} max={100000} type="number" value={weightGrams} onChange={(event) => setWeightGrams(Number(event.target.value))} /></Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div><h3 className="text-sm font-semibold">Size and color variants</h3><p className="text-xs text-muted-foreground">Apparel sizes are suggested by category; you can enter a custom size.</p></div>
              <Button type="button" variant="secondary" size="sm" onClick={addVariant}><Plus className="h-4 w-4" /> Add size</Button>
            </div>
            <label className="flex items-start gap-2 rounded-md border border-border p-3 text-sm">
              <Checkbox checked={isFreeSize} onChange={(event) => handleFreeSizeChange(event.target.checked)} />
              <span><span className="font-medium">Free size with shared stock</span><span className="mt-1 block text-xs text-muted-foreground">Keep these size variants. Every size uses the same stock count, and each order reduces stock for all sizes.</span></span>
            </label>
            <div className="space-y-3">
              {variants.map((variant, index) => <div key={`${variant.id ?? 'new'}-${index}`} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_1.4fr_100px_100px_40px] sm:items-end">
                <Field label="Size"><Input list={`sizes-${index}`} value={variant.size} onChange={(event) => updateVariant(index, { size: event.target.value })} placeholder={isBottomwear(categorySlug) ? '32' : 'M'} /><datalist id={`sizes-${index}`}>{sizeOptions.map((option) => <option key={option} value={option} />)}</datalist></Field>
                <Field label="Color"><Select value={variant.color} onChange={(event) => updateVariant(index, { color: event.target.value })}>{COLORS.map((color) => <option key={color}>{color}</option>)}</Select></Field>
                <Field label="Variant SKU"><Input className="font-mono text-xs" value={variant.sku} readOnly aria-label={`Automatically generated SKU for ${variant.color} size ${variant.size}`} /></Field>
                <Field label={isFreeSize ? 'Shared stock' : 'Stock'}><Input min={0} type="number" value={variant.stock} onChange={(event) => {
                  const stock = Math.max(0, Number(event.target.value))
                  if (isFreeSize) setVariants((current) => current.map((item) => ({ ...item, stock })))
                  else updateVariant(index, { stock })
                }} /></Field>
                <Field label="Reorder at"><Input min={0} type="number" value={variant.reorderPoint} onChange={(event) => updateVariant(index, { reorderPoint: Number(event.target.value) })} /></Field>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove size ${variant.size || index + 1}`} disabled={variants.length <= 1} onClick={() => setVariants((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>)}
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="space-y-4 p-5">
            <CardHeader title="Product photos" subtitle="JPEG, PNG, or WebP up to 10 MB. Photos upload directly to Google Cloud Storage." />
            <ImageUpload title="Main product photo" value={image} uploading={uploading === 'primary'} onUpload={(file) => void uploadImage(file, 'primary')} onRemove={() => setImage('')} required />
            <ImageUpload title="Alternate photo" value={image2} uploading={uploading === 'secondary'} onUpload={(file) => void uploadImage(file, 'secondary')} onRemove={() => setImage2('')} />
          </Card>

          <Card className="space-y-4 p-5">
            <CardHeader title="Store visibility" />
            <Field label="Status"><Select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)}><option value="Draft">Draft</option><option value="Active">Active in storefront</option><option value="Archived">Archived</option></Select></Field>
            <Field label="Collection"><Select value={collectionId} onChange={(event) => setCollectionId(Number(event.target.value))}>{collections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={featured} onChange={(event) => setFeatured(event.target.checked)} /> Feature this product</label>
            <p className="text-xs text-muted-foreground">New products start as drafts so you can review photos, sizing, stock, and pricing before publishing.</p>
          </Card>
        </aside>
      </div>
    </form>
  )
}

function ImageUpload({
  title,
  value,
  uploading,
  onUpload,
  onRemove,
  required = false,
}: {
  title: string
  value: string
  uploading: boolean
  onUpload: (file: File) => void
  onRemove: () => void
  required?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onUpload(file)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">
          {title}
          {required && <span className="text-destructive"> *</span>}
        </span>
        {value && (
          <button
            type="button"
            className="text-xs text-destructive hover:underline"
            onClick={onRemove}
          >
            Remove
          </button>
        )}
      </div>
      {value ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
          <Image
            src={value}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover"
            unoptimized
          />
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-background/70">
              <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-muted/40 text-muted-foreground hover:border-primary hover:bg-muted'
          }`}
        >
          {uploading ? (
            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
          <span className="text-xs font-medium">
            {uploading ? 'Uploading photo…' : isDragging ? 'Drop photo to upload' : 'Upload photo or drag and drop'}
          </span>
          <span className="text-[10px] text-muted-foreground/75">PNG, JPG, or WEBP up to 10 MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onUpload(file)
          event.currentTarget.value = ''
        }}
      />
      {!value && (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <ImagePlus className="h-3 w-3" /> Stored in Google Cloud Storage
        </p>
      )}
    </div>
  )
}
