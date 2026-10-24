'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ImagePlus,
  Info,
  Link as LinkIcon,
  LoaderCircle,
  Palette,
  Pipette,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  Zap
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { createProduct, deleteProduct, updateProduct, uploadProductImage } from '@/services/catalog'
import { Button, Card, CardHeader, Field, Input, Select, Textarea, Checkbox, Badge } from '@/components/ui/primitives'
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
  { name: 'Waffle', slug: 'waffle' },
  { name: 'Trackpants', slug: 'trackpants' },
  { name: 'Sweatpants', slug: 'sweatpants' },
] as const

interface ColorOption {
  name: string
  hex: string
}

const DEFAULT_POPULAR_COLORS: ColorOption[] = [
  { name: 'Black', hex: '#171717' },
  { name: 'White', hex: '#f5f3ed' },
  { name: 'Navy', hex: '#1e3157' },
  { name: 'Grey', hex: '#85878b' },
  { name: 'Charcoal', hex: '#414347' },
  { name: 'Forest Green', hex: '#3e7558' },
  { name: 'Olive', hex: '#747947' },
  { name: 'Beige', hex: '#d8c7a7' },
  { name: 'Brown', hex: '#5c4033' },
  { name: 'Red', hex: '#a63836' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Sage', hex: '#9cb071' },
  { name: 'Sand', hex: '#c2b280' },
  { name: 'Lavender', hex: '#b57bee' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Coral', hex: '#e07a5f' },
  { name: 'Mustard', hex: '#d4a373' },
  { name: 'Mocha', hex: '#8a6240' },
]

const TOP_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const STANDARD_TOP_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const BOTTOM_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42']
const STANDARD_BOTTOM_SIZES = ['30', '32', '34', '36', '38']

const BARCODE = () => `890${Math.floor(10000000000 + Math.random() * 89999999999)}`

function isBottomwear(categorySlug: string) {
  return categorySlug === 'trackpants' || categorySlug === 'sweatpants'
}

function defaultWeight(categorySlug: string) {
  return isBottomwear(categorySlug) ? 650 : 350
}

function makeVariant(size: string, color: string, categorySlug: string, price: number, weight: number, stock = 0): VariantRow {
  return {
    size,
    color,
    sku: generateBaseSku({ category: categorySlug, productType: 'Regular', color, size }),
    price,
    stock,
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

  const initialCategorySlug = categories.find((c) => c.id === product?.categoryId)?.slug ?? 'printed-tees'
  const initialWeight = product?.weightGrams ?? defaultWeight(initialCategorySlug)

  // 1. Basic Fields
  const [name, setName] = React.useState(product?.name ?? '')
  const [slug, setSlug] = React.useState(product?.slug ?? '')
  const [description, setDescription] = React.useState(product?.description ?? '')
  const [categoryId, setCategoryId] = React.useState(
    product?.categoryId ?? categories.find((c) => c.slug === 'printed-tees')?.id ?? categories[0]?.id ?? 1
  )
  const [collectionId, setCollectionId] = React.useState(product?.collectionId ?? collections[0]?.id ?? 1)
  const [weightGrams, setWeightGrams] = React.useState(initialWeight)
  const [status, setStatus] = React.useState<ProductStatus>(product?.status ?? 'Draft')
  const [featured, setFeatured] = React.useState(product?.featured ?? false)
  const [isFreeSize, setIsFreeSize] = React.useState(product?.isFreeSize ?? false)

  // 2. Pricing & Cost Fields
  const [price, setPrice] = React.useState(product?.price ?? 1199)
  const [compareAtPrice, setCompareAtPrice] = React.useState<number | ''>(product?.compareAtPrice ?? 1499)
  const [costPrice, setCostPrice] = React.useState(product?.costPrice ?? 450)
  const [taxRate, setTaxRate] = React.useState(product?.taxRate ?? 0.05)

  // 3. Photo Fields (URL or Upload)
  const [image, setImage] = React.useState(product?.image ?? '')
  const [image2, setImage2] = React.useState(product?.images[1]?.url ?? '')
  const [uploading, setUploading] = React.useState<'primary' | 'secondary' | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  // 4. Variant Generator States
  const currentCategory = categories.find((item) => item.id === Number(categoryId))
  const categorySlug = currentCategory?.slug ?? 'printed-tees'
  const isBottoms = isBottomwear(categorySlug)
  const availablePresetSizes = isBottoms ? BOTTOM_SIZES : TOP_SIZES
  const defaultStandardSizes = isBottoms ? STANDARD_BOTTOM_SIZES : STANDARD_TOP_SIZES

  // Determine initial color & mode
  const initialVariants = product?.variants ?? []
  const initialColors = Array.from(new Set(initialVariants.map((v) => String(v.color)).filter(Boolean)))
  const initialMode = initialColors.length > 1 ? 'multi' : 'single'
  const [colorMode, setColorMode] = React.useState<'single' | 'multi'>(initialMode)
  const [primaryColor, setPrimaryColor] = React.useState<string>(initialColors[0] || 'Black')
  const [multiColors, setMultiColors] = React.useState<string[]>(initialColors.length ? initialColors : ['Black', 'White'])
  const [newColorInput, setNewColorInput] = React.useState('')

  // Dynamic Palette & Interactive Color Picker States
  const [palette, setPalette] = React.useState<ColorOption[]>(() => {
    const list = [...DEFAULT_POPULAR_COLORS]
    if (product?.variants?.length) {
      const existing = Array.from(new Set(product.variants.map((v) => String(v.color)).filter(Boolean)))
      existing.forEach((colName) => {
        if (!list.some((c) => c.name.toLowerCase() === colName.toLowerCase())) {
          list.push({ name: colName, hex: colName.startsWith('#') ? colName : '#414347' })
        }
      })
    }
    return list
  })

  const [customHex, setCustomHex] = React.useState<string>('#3b82f6')
  const [customColorName, setCustomColorName] = React.useState<string>('')
  const [isCreatingColor, setIsCreatingColor] = React.useState<boolean>(false)
  const [showColorGuide, setShowColorGuide] = React.useState<boolean>(false)

  const activeColorHex = React.useMemo(() => {
    const match = palette.find((c) => c.name.toLowerCase() === primaryColor.toLowerCase())
    if (match) return match.hex
    if (primaryColor.startsWith('#')) return primaryColor
    const hexMatch = primaryColor.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/)
    return hexMatch ? hexMatch[0] : '#171717'
  }, [palette, primaryColor])

  // Bulk stock state
  const [bulkStockValue, setBulkStockValue] = React.useState<number>(20)
  const [showDetailedVariantTable, setShowDetailedVariantTable] = React.useState(isEdit)

  // Variant Rows
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
    const defaults = defaultStandardSizes
    return defaults.map((size) => makeVariant(size, 'Black', initialCategorySlug, 1199, initialWeight, 20))
  })

  // Selected sizes in current generator
  const activeSizes = React.useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.size)))
  }, [variants])

  // Update Category Handler
  const handleCategoryChange = (nextId: number) => {
    const nextCat = categories.find((item) => item.id === nextId)?.slug ?? 'printed-tees'
    const nextWeight = defaultWeight(nextCat)
    setCategoryId(nextId)
    setWeightGrams(nextWeight)

    const nextIsBottoms = isBottomwear(nextCat)
    const prevIsBottoms = isBottoms

    if (nextIsBottoms !== prevIsBottoms) {
      // Swapped garment type (e.g. tops to bottoms) -> regenerate standard sizes
      const newSizes = nextIsBottoms ? STANDARD_BOTTOM_SIZES : STANDARD_TOP_SIZES
      const colorsToUse = colorMode === 'single' ? [primaryColor] : multiColors
      const newVariants: VariantRow[] = []
      colorsToUse.forEach((col) => {
        newSizes.forEach((sz) => {
          newVariants.push(makeVariant(sz, col, nextCat, price, nextWeight, bulkStockValue))
        })
      })
      setVariants(newVariants)
    } else {
      // Just update existing variants' category SKU and weights
      setVariants((current) =>
        current.map((v) => ({
          ...v,
          weight: nextWeight,
          sku: generateBaseSku({ category: nextCat, productType: 'Regular', color: v.color, size: v.size }),
        }))
      )
    }
  }

  // Handle Primary Color change in Single-Color mode
  const handleSingleColorChange = (newColor: string) => {
    setPrimaryColor(newColor)
    setVariants((current) =>
      current.map((v) => ({
        ...v,
        color: newColor,
        sku: generateBaseSku({ category: categorySlug, productType: 'Regular', color: newColor, size: v.size }),
      }))
    )
  }

  // Create and apply a new custom color from color picker or input
  const handleAddCustomColor = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmedName = customColorName.trim()
    const nameToUse = trimmedName || `Custom (${customHex.toUpperCase()})`

    setPalette((prev) => {
      const existingIndex = prev.findIndex((c) => c.name.toLowerCase() === nameToUse.toLowerCase())
      if (existingIndex >= 0) {
        const copy = [...prev]
        copy[existingIndex] = { name: nameToUse, hex: customHex }
        return copy
      }
      return [...prev, { name: nameToUse, hex: customHex }]
    })

    if (colorMode === 'single') {
      handleSingleColorChange(nameToUse)
      toastSuccess(`Applied custom color "${nameToUse}" (${customHex.toUpperCase()})`)
    } else {
      handleAddMultiColor(nameToUse)
      toastSuccess(`Added custom color "${nameToUse}" (${customHex.toUpperCase()})`)
    }

    setCustomColorName('')
    setIsCreatingColor(false)
  }

  // Toggle a size in/out of the variant matrix
  const handleToggleSize = (size: string) => {
    const isCurrentlyActive = activeSizes.includes(size)
    if (isCurrentlyActive) {
      if (activeSizes.length <= 1) {
        toastError('Products need at least one size.')
        return
      }
      setVariants((current) => current.filter((v) => v.size !== size))
    } else {
      // Add this size for all active colors
      const colorsToApply = colorMode === 'single' ? [primaryColor] : multiColors
      const newRows: VariantRow[] = colorsToApply.map((col) =>
        makeVariant(size, col, categorySlug, price, weightGrams, isFreeSize ? variants[0]?.stock ?? 0 : bulkStockValue)
      )
      setVariants((current) => [...current, ...newRows])
    }
  }

  // Set Preset Sizes
  const handleApplyPresetSizes = (presetSizes: string[]) => {
    const colorsToApply = colorMode === 'single' ? [primaryColor] : multiColors
    const newRows: VariantRow[] = []
    colorsToApply.forEach((col) => {
      presetSizes.forEach((sz) => {
        const existing = variants.find((v) => v.size === sz && v.color.toLowerCase() === col.toLowerCase())
        if (existing) {
          newRows.push(existing)
        } else {
          newRows.push(makeVariant(sz, col, categorySlug, price, weightGrams, isFreeSize ? variants[0]?.stock ?? 0 : bulkStockValue))
        }
      })
    })
    setVariants(newRows)
  }

  // Add Multi-color
  const handleAddMultiColor = (colorName: string) => {
    const trimmed = colorName.trim()
    if (!trimmed) return
    if (multiColors.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toastError(`Color "${trimmed}" is already added.`)
      return
    }
    const updatedColors = [...multiColors, trimmed]
    setMultiColors(updatedColors)

    // Generate variants for the new color across all current active sizes
    const newRows: VariantRow[] = activeSizes.map((sz) =>
      makeVariant(sz, trimmed, categorySlug, price, weightGrams, isFreeSize ? variants[0]?.stock ?? 0 : bulkStockValue)
    )
    setVariants((current) => [...current, ...newRows])
    setNewColorInput('')
  }

  // Remove Multi-color
  const handleRemoveMultiColor = (colorToRemove: string) => {
    if (multiColors.length <= 1) {
      toastError('Must have at least one color.')
      return
    }
    const updated = multiColors.filter((c) => c !== colorToRemove)
    setMultiColors(updated)
    setVariants((current) => current.filter((v) => v.color !== colorToRemove))
  }

  // Apply Bulk Stock to all variants
  const handleApplyBulkStock = () => {
    const qty = Math.max(0, Number(bulkStockValue))
    setVariants((current) => current.map((v) => ({ ...v, stock: qty })))
    toastSuccess(`Updated stock to ${qty} for all sizes.`)
  }

  // Sync Global Price to all variants
  const handleSyncPriceToVariants = () => {
    const p = Math.max(1, Number(price))
    setVariants((current) => current.map((v) => ({ ...v, price: p })))
    toastSuccess(`Applied price ₹${p} across all variants.`)
  }

  // Update a single variant in the detailed table
  const updateVariant = (index: number, patch: Partial<VariantRow>) => {
    setVariants((current) =>
      current.map((variant, rowIndex) => {
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
      })
    )
  }

  // Free size toggle
  const handleFreeSizeChange = (checked: boolean) => {
    setIsFreeSize(checked)
    if (checked) {
      setVariants((current) => {
        const sharedStock = current[0]?.stock ?? 0
        return current.map((variant) => ({ ...variant, stock: sharedStock }))
      })
    }
  }

  // Image Upload helper
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
      toastSuccess('Product photo uploaded successfully.')
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Could not upload photo.')
    } finally {
      setUploading(null)
    }
  }

  // Form Submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return toastError('Product name is required.')
    if (!image) return toastError('Please provide a primary product photo (URL or upload).')
    if (!variants.length || variants.some((v) => !v.size.trim())) return toastError('Every variant needs a valid size.')
    if (weightGrams < 1) return toastError('Product weight must be greater than zero.')

    const seen = new Set<string>()
    for (const v of variants) {
      const key = `${v.color.toLowerCase()}__${v.size.trim().toUpperCase()}`
      if (seen.has(key)) return toastError(`Duplicate variant: ${v.color} / ${v.size}`)
      seen.add(key)
    }

    try {
      setSubmitting(true)
      const cleanSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const input = {
        id: product?.id,
        name: name.trim(),
        slug: cleanSlug,
        sku: variants[0]?.sku ?? '',
        description: description.trim() || `${name.trim()} crafted with heavyweight premium fabric.`,
        categoryId: Number(categoryId),
        collectionId: Number(collectionId),
        price: Number(price),
        compareAtPrice: compareAtPrice === '' ? null : Number(compareAtPrice),
        costPrice: Number(costPrice),
        taxRate: Number(taxRate),
        status,
        featured,
        isFreeSize,
        weightGrams: Number(weightGrams),
        image,
        images: [
          { url: image, alt: `${name} product photo` },
          ...(image2 ? [{ url: image2, alt: `${name} alternate view` }] : []),
        ],
        variants: variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku || generateBaseSku({ category: categorySlug, productType: 'Regular', color: variant.color.trim(), size: variant.size.trim() }),
          size: variant.size.trim(),
          color: variant.color.trim(),
          price: Number(variant.price || price),
          stock: Math.max(0, Number(isFreeSize ? variants[0]?.stock ?? variant.stock : variant.stock)),
          reorderPoint: Math.max(0, Number(variant.reorderPoint)),
          weight: Number(weightGrams),
          barcode: variant.barcode,
          status: 'Active' as const,
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

  // Profit Margin Calculation
  const profit = Math.max(0, Number(price) - Number(costPrice))
  const profitMarginPercent = Number(price) > 0 ? Math.round((profit / Number(price)) * 100) : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground"
            title="Back to products list"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {isEdit ? `Edit “${product?.name ?? 'Product'}”` : 'Create New Product'}
              </h1>
              <Badge variant={status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                {status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {isEdit ? 'Update product specs, photos, sizing matrix, and stock.' : 'Quickly set up apparel categories, colorways, sizes, and pricing.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isEdit && (
            <Button type="button" variant="danger-outline" size="sm" onClick={handleDelete} disabled={submitting}>
              Delete
            </Button>
          )}
          <Link href="/products">
            <Button type="button" variant="secondary" size="sm" disabled={submitting}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            size="sm"
            className="min-w-[120px] font-semibold shadow-sm"
            disabled={submitting || uploading !== null}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Saving…
              </span>
            ) : isEdit ? (
              'Save Product'
            ) : (
              'Create Product'
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left Column: Core Product Info & Variant Matrix */}
        <div className="space-y-6">
          {/* 1. Basic Details */}
          <Card className="space-y-5 p-5">
            <CardHeader
              title="Garment Details"
              subtitle="Apparel name, category classification, and customer-facing description."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product Name" required>
                <Input
                  required
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    if (!isEdit && !slug) {
                      setSlug(
                        event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '')
                      )
                    }
                  }}
                  placeholder="e.g. Heavyweight Waffle Knit Longsleeve"
                  className="font-medium"
                />
              </Field>

              <Field label="Category" required hint="Determines default weight and size scale">
                <Select
                  value={categoryId}
                  onChange={(event) => handleCategoryChange(Number(event.target.value))}
                  className="font-medium"
                >
                  {APPAREL_CATEGORIES.map((option) => {
                    const match = categories.find((item) => item.slug === option.slug)
                    return match ? (
                      <option key={match.id} value={match.id}>
                        {option.name}
                      </option>
                    ) : null
                  })}
                </Select>
              </Field>

              <Field label="URL Slug" hint="Auto-generated from product name">
                <Input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="e.g. heavyweight-waffle-knit-longsleeve"
                  className="font-mono text-xs"
                />
              </Field>

              <Field label="Collection" hint="Merchandising group">
                <Select
                  value={collectionId}
                  onChange={(event) => setCollectionId(Number(event.target.value))}
                >
                  {collections.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Product Description">
              <Textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="260 GSM textured honeycomb knit. Pre-shrunk 100% combed cotton with tailored collar ribbing and reinforced seams."
              />
            </Field>
          </Card>

          {/* 2. Pricing & Delivery Weight */}
          <Card className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Pricing & Delivery Weight</h2>
                <p className="text-xs text-muted-foreground">
                  Per-item weight drives distance-based checkout delivery rates in India.
                </p>
              </div>
              {profit > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Profit: ₹{profit.toLocaleString('en-IN')} ({profitMarginPercent}% margin)
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Selling Price (₹)" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <Input
                    required
                    min={1}
                    type="number"
                    value={price}
                    onChange={(event) => setPrice(Number(event.target.value))}
                    className="pl-7 font-semibold"
                  />
                </div>
              </Field>

              <Field label="Compare-at Price (₹)" hint="Original price (shows discount badge)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <Input
                    min={0}
                    type="number"
                    value={compareAtPrice}
                    onChange={(event) => setCompareAtPrice(event.target.value ? Number(event.target.value) : '')}
                    className="pl-7"
                    placeholder="e.g. 1599"
                  />
                </div>
              </Field>

              <Field label="Cost Per Item (₹)" hint="Used for margin & internal accounting">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <Input
                    min={0}
                    type="number"
                    value={costPrice}
                    onChange={(event) => setCostPrice(Number(event.target.value))}
                    className="pl-7"
                    placeholder="e.g. 450"
                  />
                </div>
              </Field>

              <Field label="Shipping Weight (Grams)" required hint="Tops: ~350g · Bottoms: ~650g">
                <div className="relative">
                  <Input
                    required
                    min={1}
                    max={100000}
                    type="number"
                    value={weightGrams}
                    onChange={(event) => setWeightGrams(Number(event.target.value))}
                    className="pr-12 font-medium"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">grams</span>
                </div>
              </Field>

              <Field label="GST Tax Rate (%)" hint="Standard apparel GST is 5% or 12%">
                <div className="relative">
                  <Input
                    min={0}
                    max={100}
                    step="0.1"
                    type="number"
                    value={Math.round(taxRate * 1000) / 10}
                    onChange={(event) => setTaxRate(Number(event.target.value) / 100)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </Field>

              <div className="flex flex-col justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSyncPriceToVariants}
                  className="w-full text-xs"
                >
                  <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Sync ₹{price} to All Sizes
                </Button>
              </div>
            </div>
          </Card>

          {/* 3. Streamlined Smart Sizing & Color Matrix */}
          <Card className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Sizing, Colors & Stock</h2>
                <p className="text-xs text-muted-foreground">
                  Pick colors and sizes with 1-click. SKUs and barcodes are automatically generated.
                </p>
              </div>

              {/* Color Mode Switcher */}
              <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setColorMode('single')
                    handleSingleColorChange(primaryColor)
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    colorMode === 'single'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Single Color
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode('multi')}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    colorMode === 'multi'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Multi-Color
                </button>
              </div>
            </div>

            {/* Color Selection Section with Visual Color Picker & Custom Color Creator */}
            <div className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4">
              {/* Header with Selected Color preview & Guide Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {colorMode === 'single' ? 'Product Colorway (Single Color)' : `Active Colorways (${multiColors.length})`}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {colorMode === 'single' && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium shadow-2xs">
                      <span
                        className="h-3 w-3 rounded-full border border-black/20 shadow-xs"
                        style={{ backgroundColor: activeColorHex }}
                      />
                      <span>Selected: <strong className="text-foreground">{primaryColor}</strong></span>
                      <span className="text-[10px] uppercase font-mono text-muted-foreground">{activeColorHex}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowColorGuide((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition"
                    title="How to add and use colors"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-primary" />
                    <span>How to add a new color?</span>
                  </button>
                </div>
              </div>

              {/* Explanatory Guide Banner (collapsible) */}
              {showColorGuide && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground/90 space-y-2">
                  <div className="flex items-center justify-between font-semibold text-primary">
                    <span className="inline-flex items-center gap-1.5">
                      <Info className="h-4 w-4" />
                      How to add any new color to your product:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowColorGuide(false)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      &times; Close
                    </button>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                    <li>
                      <strong>Pick from the Spectrum:</strong> Click the <span className="font-semibold text-foreground">"Pick Any Color"</span> button or the eye-dropper icon to open your system's color wheel and select any visual shade.
                    </li>
                    <li>
                      <strong>Or Enter a Hex Code:</strong> Click <span className="font-semibold text-foreground">"+ Custom Color"</span> and type any 6-digit hex code (e.g. <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">#7B904B</code> for Sage Green or <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">#B38B6D</code> for Mocha).
                    </li>
                    <li>
                      <strong>Name It & Save:</strong> Give it an apparel shade name (e.g., &quot;Olive Khaki&quot; or &quot;Dusty Rose&quot;). Clicking <strong>Save &amp; Apply</strong> immediately updates your variant matrix, generates SKUs, and renders the exact swatch dot on the storefront!
                    </li>
                  </ol>
                </div>
              )}

              {/* Inline Custom Color Creator Drawer */}
              {isCreatingColor && (
                <form
                  onSubmit={handleAddCustomColor}
                  className="rounded-lg border border-primary/30 bg-background p-3.5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pipette className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Create New Apparel Color</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingColor(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Visual Color Picker input */}
                    <div className="sm:col-span-3 flex items-center gap-2">
                      <div className="relative flex items-center">
                        <input
                          type="color"
                          value={customHex}
                          onChange={(e) => setCustomHex(e.target.value)}
                          className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
                          id="color-picker-input"
                          title="Open color wheel"
                        />
                      </div>
                      <Input
                        value={customHex.toUpperCase()}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val.startsWith('#') || val === '') {
                            setCustomHex(val)
                          } else {
                            setCustomHex(`#${val}`)
                          }
                        }}
                        placeholder="#RRGGBB"
                        maxLength={7}
                        className="h-9 font-mono text-xs uppercase"
                        aria-label="Hex color code"
                      />
                    </div>

                    {/* Color Name Input */}
                    <div className="sm:col-span-6">
                      <Input
                        value={customColorName}
                        onChange={(e) => setCustomColorName(e.target.value)}
                        placeholder="Color name (e.g. Sage Green, Dusty Rose, Mocha)"
                        className="h-9 text-xs"
                        autoFocus
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="sm:col-span-3 flex items-center gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        className="h-9 w-full text-xs font-semibold"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" /> Save &amp; Apply
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Single-Color Mode View */}
              {colorMode === 'single' ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Interactive Color Wheel Quick-Picker */}
                    <label
                      htmlFor="quick-single-picker"
                      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/60 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition cursor-pointer"
                      title="Open color wheel picker"
                    >
                      <input
                        id="quick-single-picker"
                        type="color"
                        value={activeColorHex}
                        onChange={(e) => {
                          const hex = e.target.value
                          setCustomHex(hex)
                          handleSingleColorChange(`Color (${hex.toUpperCase()})`)
                        }}
                        className="sr-only"
                      />
                      <Pipette className="h-3 w-3" />
                      <span>Pick Any Color</span>
                    </label>

                    {/* Add Custom Color button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingColor(true)
                        setCustomColorName('')
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>+ Custom Color</span>
                    </button>

                    {/* Separator */}
                    <span className="text-border">|</span>

                    {/* Dynamic Palette Swatches (Standard + Any Created Custom Colors) */}
                    {palette.map((col) => {
                      const isSelected = primaryColor.toLowerCase() === col.name.toLowerCase()
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => handleSingleColorChange(col.name)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20'
                              : 'border-border bg-background text-foreground hover:border-foreground/40'
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{col.name}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Or Manual Custom Color text input */}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={primaryColor}
                      onChange={(e) => handleSingleColorChange(e.target.value)}
                      placeholder="Or type custom color (e.g. Heather Oatmeal, Washed Denim)"
                      className="h-8 max-w-sm text-xs"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Applies to all generated sizes
                    </span>
                  </div>
                </div>
              ) : (
                /* Multi-Color Mode Section */
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Active Multi Colors list */}
                    {multiColors.map((col) => {
                      const foundHex = palette.find((p) => p.name.toLowerCase() === col.toLowerCase())?.hex || '#6B7280'
                      return (
                        <div
                          key={col}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold shadow-2xs"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: foundHex }}
                          />
                          <span>{col}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMultiColor(col)}
                            className="ml-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            title={`Remove ${col}`}
                          >
                            &times;
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Multi-Color Quick Add Palette & Custom Form */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
                    <span className="text-[11px] font-semibold text-muted-foreground">Quick Add from Palette:</span>
                    {palette.slice(0, 10).map((col) => {
                      const alreadyAdded = multiColors.some((c) => c.toLowerCase() === col.name.toLowerCase())
                      return (
                        <button
                          key={col.name}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => handleAddMultiColor(col.name)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition cursor-pointer ${
                            alreadyAdded
                              ? 'opacity-40 border-border bg-muted cursor-not-allowed'
                              : 'border-border bg-background hover:border-primary text-foreground'
                          }`}
                        >
                          <span
                            className="h-2 w-2 rounded-full border border-black/20"
                            style={{ backgroundColor: col.hex }}
                          />
                          {col.name}
                        </button>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => setIsCreatingColor(true)}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/50 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10 transition cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> + Custom Color
                    </button>
                  </div>

                  {/* Add Color by Name Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={newColorInput}
                      onChange={(e) => setNewColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddMultiColor(newColorInput)
                        }
                      }}
                      placeholder="Add color (e.g. Forest Green, Heather Grey, Mocha)"
                      className="h-8 max-w-xs text-xs"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleAddMultiColor(newColorInput)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Color
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Size Matrix Buttons */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sizes ({activeSizes.length} active)
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleApplyPresetSizes(defaultStandardSizes)}
                    className="font-medium text-primary hover:underline cursor-pointer"
                  >
                    Standard {isBottoms ? '30-38' : 'S-XXL'}
                  </button>
                  <span className="text-muted-foreground/60">&bull;</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetSizes(availablePresetSizes)}
                    className="font-medium text-primary hover:underline cursor-pointer"
                  >
                    All Available Sizes
                  </button>
                </div>
              </div>

              {/* Size Buttons Pills */}
              <div className="flex flex-wrap gap-2">
                {availablePresetSizes.map((size) => {
                  const isActive = activeSizes.includes(size)
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleToggleSize(size)}
                      className={`inline-flex h-9 min-w-[44px] items-center justify-center rounded-lg border px-3 text-sm font-bold transition cursor-pointer ${
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground shadow-xs scale-100'
                          : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                      }`}
                    >
                      {isActive && <Check className="mr-1 h-3.5 w-3.5 stroke-[3]" />}
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bulk Stock Setter & Free-size */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">Quick Stock for All Sizes:</span>
                <div className="relative w-20">
                  <Input
                    min={0}
                    type="number"
                    value={bulkStockValue}
                    onChange={(e) => setBulkStockValue(Number(e.target.value))}
                    className="h-8 text-xs font-semibold"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleApplyBulkStock}
                  className="h-8 text-xs font-semibold"
                >
                  Apply to All
                </Button>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                <Checkbox checked={isFreeSize} onChange={(e) => handleFreeSizeChange(e.target.checked)} />
                <span>Free size (shared inventory pool)</span>
              </label>
            </div>

            {/* Detailed Variant Override Table Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDetailedVariantTable((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-lg border border-border/80 px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted/40 cursor-pointer"
              >
                <span>
                  {showDetailedVariantTable ? 'Hide' : 'Show'} Detailed Variant Overrides (
                  {variants.length} total SKUs)
                </span>
                {showDetailedVariantTable ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {showDetailedVariantTable && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2.5">Size</th>
                        <th className="px-3 py-2.5">Color</th>
                        <th className="px-3 py-2.5">SKU</th>
                        <th className="px-3 py-2.5">Stock</th>
                        <th className="px-3 py-2.5">Price (₹)</th>
                        <th className="px-3 py-2.5">Barcode</th>
                        <th className="px-2 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {variants.map((v, idx) => (
                        <tr key={`${v.color}-${v.size}-${idx}`} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-bold text-foreground">{v.size}</td>
                          <td className="px-3 py-2 text-muted-foreground">{v.color}</td>
                          <td className="px-3 py-2 font-mono text-[11px] text-foreground">{v.sku}</td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              value={v.stock}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value))
                                if (isFreeSize) setVariants((c) => c.map((it) => ({ ...it, stock: val })))
                                else updateVariant(idx, { stock: val })
                              }}
                              className="h-7 w-20 text-xs font-semibold"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={1}
                              value={v.price}
                              onChange={(e) => updateVariant(idx, { price: Number(e.target.value) })}
                              className="h-7 w-24 text-xs font-semibold"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
                            {v.barcode}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button
                              type="button"
                              disabled={variants.length <= 1}
                              onClick={() => setVariants((c) => c.filter((_, i) => i !== idx))}
                              className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 cursor-pointer"
                              title="Delete variant"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Imagery & Visibility Settings */}
        <aside className="space-y-6">
          {/* Photos Card */}
          <Card className="space-y-5 p-5">
            <CardHeader
              title="Product Photography"
              subtitle="Direct image URLs or upload to cloud storage."
            />

            {/* Primary Image Slot */}
            <ImageInputSlot
              title="Primary Product Photo"
              value={image}
              onChange={setImage}
              uploading={uploading === 'primary'}
              onUploadFile={(file) => void uploadImage(file, 'primary')}
              required
            />

            {/* Secondary Image Slot */}
            <ImageInputSlot
              title="Secondary / Alternate View"
              value={image2}
              onChange={setImage2}
              uploading={uploading === 'secondary'}
              onUploadFile={(file) => void uploadImage(file, 'secondary')}
            />
          </Card>

          {/* Visibility & Badges */}
          <Card className="space-y-4 p-5">
            <CardHeader title="Storefront Visibility" />

            <Field label="Status">
              <Select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)}>
                <option value="Draft">Draft (Hidden from store)</option>
                <option value="Active">Active (Live in catalog)</option>
                <option value="Archived">Archived</option>
              </Select>
            </Field>

            <label className="flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer pt-1">
              <Checkbox checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
              <span>Feature on homepage & collections</span>
            </label>

            <div className="rounded-lg border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground">💡 Pro-Tip</p>
              New products start as drafts. Once you verify photo quality and inventory counts, switch to <span className="font-semibold text-foreground">Active</span> to publish immediately.
            </div>
          </Card>
        </aside>
      </div>
    </form>
  )
}

/**
 * High-Usability Image Slot Component
 * Supports both Direct URL Paste and File Upload with live visual preview.
 */
function ImageInputSlot({
  title,
  value,
  onChange,
  uploading,
  onUploadFile,
  required = false,
}: {
  title: string
  value: string
  onChange: (url: string) => void
  uploading: boolean
  onUploadFile: (file: File) => void
  required?: boolean
}) {
  const [tab, setTab] = React.useState<'url' | 'upload'>('url')
  const [tempUrl, setTempUrl] = React.useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleApplyUrl = () => {
    if (tempUrl.trim()) {
      onChange(tempUrl.trim())
      setTempUrl('')
    }
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">
          {title} {required && <span className="text-destructive">*</span>}
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs font-medium text-destructive hover:underline cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>

      {value ? (
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-muted">
          <Image
            src={value}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover"
            unoptimized
          />
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-background/80">
              <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Mode Tabs */}
          <div className="flex border-b border-border text-xs">
            <button
              type="button"
              onClick={() => setTab('url')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 font-medium transition cursor-pointer ${
                tab === 'url'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <LinkIcon className="h-3 w-3" /> Paste URL
            </button>
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 font-medium transition cursor-pointer ${
                tab === 'upload'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <UploadCloud className="h-3 w-3" /> Upload File
            </button>
          </div>

          {tab === 'url' ? (
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleApplyUrl()
                  }
                }}
                placeholder="https://... photo link"
                className="h-8 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleApplyUrl}
                className="h-8 text-xs font-semibold shrink-0"
              >
                Set Image
              </Button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files?.[0]
                if (file) onUploadFile(file)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed transition cursor-pointer p-4 ${
                isDragging
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/30 text-muted-foreground hover:border-primary hover:bg-muted/50'
              }`}
            >
              {uploading ? (
                <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <UploadCloud className="h-5 w-5" />
              )}
              <span className="text-xs font-semibold">
                {uploading ? 'Uploading...' : 'Click to upload or drag photo here'}
              </span>
              <span className="text-[10px] text-muted-foreground">PNG, JPG, or WebP up to 10 MB</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUploadFile(file)
              e.currentTarget.value = ''
            }}
          />
        </div>
      )}
    </div>
  )
}
