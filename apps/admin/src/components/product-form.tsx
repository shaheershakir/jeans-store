'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bold,
  Box,
  Check,
  ChevronDown,
  Code,
  FolderKanban,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  IndianRupee,
  Italic,
  Layers,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Quote,
  Search,
  Table,
  Tag,
  Trash2,
  Truck,
  Underline,
  UploadCloud,
  X
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { createProduct, updateProduct, uploadProductImage } from '@/services/catalog'
import { Button, Card, Field, Input, Select, Textarea } from '@/components/ui/primitives'
import { toastError, toastSuccess } from '@/components/ui/toast'
import type { Product, ProductDesign, ProductStatus, Variant } from '@/lib/types'
import { cn } from '@/lib/utils'

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

const STANDARD_SIZES = ['S', 'M', 'L', 'XL']

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getDesignCategoryCode(categorySlug: string): string {
  const clean = categorySlug.toLowerCase().trim()
  if (clean === 'drsleeve' || clean === 'three-quarter-sleeve') return 'DRS'
  if (clean === 'stripes') return 'STR'
  if (clean === 'fullsleeve' || clean === 'full-sleeve') return 'FSL'
  if (clean === 'printed-tees') return 'PRT'
  if (clean === 'ringer-tees') return 'RNG'
  if (clean === 'henley') return 'HEN'
  if (clean === 'waffle') return 'WAF'
  if (clean === 'trackpants') return 'TRK'
  if (clean === 'sweatpants') return 'SWT'
  return clean.slice(0, 3).toUpperCase() || 'TEE'
}

function extractDesignCode(nameOrSlug: string): string {
  if (!nameOrSlug) return 'DSG'
  const firstWord = nameOrSlug.trim().split(/[-_\s]+/)[0]
  return firstWord.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'DSG'
}

function computeDesignSku(categorySlug: string, designNameOrSlug: string, size: string): string {
  const cat = getDesignCategoryCode(categorySlug)
  const dsg = extractDesignCode(designNameOrSlug)
  return `${cat}-${dsg}-${size.toUpperCase()}`
}

interface DesignSizeState {
  size: string
  stock: number
  sku?: string
}

interface DesignCardState {
  id?: number
  name: string
  slug: string
  priceOverride?: number | ''
  images: string[]
  sizes: DesignSizeState[]
}

function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (val: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const categories = useAdminStore((state) => state.data.categories)
  const collections = useAdminStore((state) => state.data.collections)
  const isEdit = Boolean(product)

  // 1. Basic Information
  const [name, setName] = React.useState(product?.name ?? '')
  const [categorySlug, setCategorySlug] = React.useState(
    categories.find((c) => c.id === product?.categoryId)?.slug ?? 'drsleeve'
  )
  const [status, setStatus] = React.useState<ProductStatus>(product?.status ?? 'Active')
  const [shortDescription, setShortDescription] = React.useState(
    product?.shortDescription ?? ''
  )
  const [description, setDescription] = React.useState(product?.description ?? '')
  const [coverImages, setCoverImages] = React.useState<string[]>(() => {
    if (product?.images?.length) return product.images.map((im) => im.url).filter(Boolean)
    if (product?.image) return [product.image]
    return []
  })

  // 2. Designs
  const [designs, setDesigns] = React.useState<DesignCardState[]>(() => {
    if (product?.designs && product.designs.length > 0) {
      return product.designs.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        priceOverride: d.priceOverride ?? '',
        images: d.images ?? [],
        sizes: STANDARD_SIZES.map((sz) => {
          const matchingV = d.variants?.find((v) => String(v.size) === sz)
          return {
            size: sz,
            stock: matchingV?.stock ?? 10,
            sku: matchingV?.sku ?? computeDesignSku(categorySlug, d.slug || d.name, sz),
          }
        }),
      }))
    }
    // Default initial design for new product
    return [
      {
        name: 'Dark Legends',
        slug: 'dark-legends',
        priceOverride: 599,
        images: [],
        sizes: [
          { size: 'S', stock: 10, sku: 'DRS-DARK-S' },
          { size: 'M', stock: 15, sku: 'DRS-DARK-M' },
          { size: 'L', stock: 12, sku: 'DRS-DARK-L' },
          { size: 'XL', stock: 8, sku: 'DRS-DARK-XL' },
        ],
      },
    ]
  })

  // 3. Organization
  const [selectedCollectionIds, setSelectedCollectionIds] = React.useState<number[]>(() => {
    if (product?.collectionIds?.length) return product.collectionIds
    if (product?.collectionId) return [product.collectionId]
    return collections[0]?.id ? [collections[0].id] : []
  })
  const [tags, setTags] = React.useState<string[]>(
    product?.tags?.length ? product.tags : ['tshirt', 'drsleeve', 'graphic']
  )
  const [tagInput, setTagInput] = React.useState('')

  // 4. Pricing (Default)
  const [price, setPrice] = React.useState<number>(product?.price ?? 599)
  const [compareAtPrice, setCompareAtPrice] = React.useState<number | ''>(
    product?.compareAtPrice ?? 799
  )

  // 5. Inventory Settings
  const [trackInventory, setTrackInventory] = React.useState<boolean>(
    product?.trackInventory ?? true
  )
  const [continueSelling, setContinueSelling] = React.useState<boolean>(
    product?.continueSelling ?? false
  )

  // 6. Shipping
  const [weightGrams, setWeightGrams] = React.useState<number>(
    product?.weightGrams ?? 250
  )
  const [lengthCm, setLengthCm] = React.useState<number | ''>(
    product?.lengthCm ?? 30
  )
  const [widthCm, setWidthCm] = React.useState<number | ''>(
    product?.widthCm ?? 25
  )
  const [heightCm, setHeightCm] = React.useState<number | ''>(
    product?.heightCm ?? 2
  )

  // 7. Search Engine / SEO
  const [seoTitle, setSeoTitle] = React.useState(
    product?.seoTitle ?? 'Dr Sleeve Tee | Teesgarage'
  )
  const [seoDescription, setSeoDescription] = React.useState(
    product?.seoDescription ??
      'Layered sleeve t-shirts with unique graphic designs. Premium cotton blend. Shop exclusive Dr Sleeve Tee designs at Teesgarage.'
  )
  const [urlSlug, setUrlSlug] = React.useState(
    product?.slug ?? (product?.name ? slugify(product.name) : 'dr-sleeve-tee')
  )

  const [uploadingCover, setUploadingCover] = React.useState(false)
  const [uploadingDesignIdx, setUploadingDesignIdx] = React.useState<number | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  // Auto-sync slug if not manually altered
  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEdit && !product) {
      const generated = slugify(val)
      setUrlSlug(generated)
      setSeoTitle(`${val} | Teesgarage`)
    }
  }

  // Cover image uploads
  const coverFileInputRef = React.useRef<HTMLInputElement | null>(null)
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingCover(true)
    try {
      for (let i = 0; i < files.length; i++) {
        try {
          const url = await uploadProductImage(files[i])
          setCoverImages((prev) => [...prev, url])
        } catch {
          const localUrl = URL.createObjectURL(files[i])
          setCoverImages((prev) => [...prev, localUrl])
        }
      }
    } finally {
      setUploadingCover(false)
      if (coverFileInputRef.current) coverFileInputRef.current.value = ''
    }
  }

  // Design helpers
  const handleAddDesign = () => {
    const newIdx = designs.length + 1
    const newName = `Design ${newIdx}`
    const newSlug = slugify(newName)
    setDesigns((prev) => [
      ...prev,
      {
        name: newName,
        slug: newSlug,
        priceOverride: price,
        images: [],
        sizes: STANDARD_SIZES.map((sz) => ({
          size: sz,
          stock: 10,
          sku: computeDesignSku(categorySlug, newSlug, sz),
        })),
      },
    ])
  }

  const handleRemoveDesign = (index: number) => {
    if (designs.length <= 1) {
      toastError('A product must have at least one design.')
      return
    }
    setDesigns((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDesignNameChange = (index: number, val: string) => {
    setDesigns((prev) =>
      prev.map((d, i) => {
        if (i !== index) return d
        const autoSlug = slugify(val)
        return {
          ...d,
          name: val,
          slug: autoSlug,
          sizes: d.sizes.map((s) => ({
            ...s,
            sku: computeDesignSku(categorySlug, autoSlug || val, s.size),
          })),
        }
      })
    )
  }

  const handleDesignSlugChange = (index: number, val: string) => {
    setDesigns((prev) =>
      prev.map((d, i) => {
        if (i !== index) return d
        const cleanSlug = slugify(val)
        return {
          ...d,
          slug: cleanSlug,
          sizes: d.sizes.map((s) => ({
            ...s,
            sku: computeDesignSku(categorySlug, cleanSlug || d.name, s.size),
          })),
        }
      })
    )
  }

  const handleDesignStockChange = (designIndex: number, size: string, newStock: number) => {
    setDesigns((prev) =>
      prev.map((d, i) => {
        if (i !== designIndex) return d
        return {
          ...d,
          sizes: d.sizes.map((s) => (s.size === size ? { ...s, stock: Math.max(0, newStock) } : s)),
        }
      })
    )
  }

  const handleDesignImageUpload = async (
    designIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingDesignIdx(designIndex)
    try {
      for (let i = 0; i < files.length; i++) {
        let url = ''
        try {
          url = await uploadProductImage(files[i])
        } catch {
          url = URL.createObjectURL(files[i])
        }
        if (url) {
          setDesigns((prev) =>
            prev.map((d, idx) => (idx === designIndex ? { ...d, images: [...d.images, url] } : d))
          )
        }
      }
    } finally {
      setUploadingDesignIdx(null)
      e.target.value = ''
    }
  }

  // Tags handler
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean])
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t))
  }

  // Submit handler
  const handleSubmit = async (targetStatus?: ProductStatus) => {
    const resolvedStatus = targetStatus ?? status
    if (!name.trim()) {
      toastError('Please enter a product name.')
      return
    }
    if (price <= 0) {
      toastError('Please set a valid base price.')
      return
    }

    setSubmitting(true)
    try {
      const activeCategoryId =
        categories.find((c) => c.slug === categorySlug)?.id ??
        categories[0]?.id ??
        1

      // Flatten design variants
      const variants: Variant[] = []
      designs.forEach((d) => {
        d.sizes.forEach((s) => {
          variants.push({
            id: 0,
            productId: product?.id ?? '',
            designId: d.id ?? null,
            size: s.size,
            color: d.name,
            sku: s.sku || computeDesignSku(categorySlug, d.slug || d.name, s.size),
            price:
              d.priceOverride !== undefined && d.priceOverride !== '' && Number(d.priceOverride) > 0
                ? Number(d.priceOverride)
                : price,
            stock: Number(s.stock || 0),
            reserved: 0,
            reorderPoint: 5,
            weight: Number(weightGrams || 250),
            barcode: `890${Math.floor(10000000000 + Math.random() * 89999999999)}`,
            status: 'Active',
          })
        })
      })

      const payloadDesigns: ProductDesign[] = designs.map((d, idx) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        priceOverride:
          d.priceOverride !== undefined && d.priceOverride !== ''
            ? Number(d.priceOverride)
            : null,
        sortOrder: idx,
        status: 'Active',
        images: d.images,
        variants: variants.filter((v) => v.color === d.name),
      }))

      const primaryCover =
        coverImages[0] || designs[0]?.images[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'
      const allImages =
        coverImages.length > 0
          ? coverImages
          : designs.flatMap((d) => d.images)

      const productPayload = {
        name,
        slug: urlSlug || slugify(name),
        sku: variants[0]?.sku || computeDesignSku(categorySlug, designs[0]?.slug || 'tee', 'S'),
        description: description || name,
        shortDescription: shortDescription || undefined,
        categoryId: activeCategoryId,
        collectionId: selectedCollectionIds[0] ?? 1,
        collectionIds: selectedCollectionIds,
        tags,
        price,
        compareAtPrice: compareAtPrice === '' ? null : Number(compareAtPrice),
        costPrice: 0,
        taxRate: 0.05,
        status: resolvedStatus,
        featured: false,
        isFreeSize: false,
        trackInventory,
        continueSelling,
        weightGrams: Number(weightGrams || 250),
        lengthCm: lengthCm === '' ? null : Number(lengthCm),
        widthCm: widthCm === '' ? null : Number(widthCm),
        heightCm: heightCm === '' ? null : Number(heightCm),
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        image: primaryCover,
        images: allImages.map((u, i) => ({ url: u, alt: `${name} ${i + 1}` })),
        variants,
        designs: payloadDesigns,
      }

      if (isEdit && product?.id) {
        await updateProduct({ ...productPayload, id: product.id } as any)
        toastSuccess('Product updated successfully!')
      } else {
        await createProduct(productPayload as any)
        toastSuccess('Product created successfully!')
      }
      router.push('/products')
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Failed to save product.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header bar matching the mockup */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-xs hover:bg-accent transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isEdit ? 'Edit Product' : 'Add Product'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Create a new product with multiple designs and manage inventory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit('Draft')}
            className="rounded-lg px-4 font-medium"
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit('Active')}
            className="rounded-lg bg-foreground text-background hover:bg-foreground/90 px-4 font-medium shadow-xs"
          >
            {submitting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Publish Product'
            )}
          </Button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Basic Information + Designs */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Card 1: Basic Information */}
          <Card className="p-6 space-y-5 rounded-xl border border-border shadow-xs bg-card">
            <div className="flex items-start gap-3 border-b pb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Box className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Basic Information</h2>
                <p className="text-xs text-muted-foreground">Set the main details for this product</p>
              </div>
            </div>

            {/* Row 1: Product Name, Category, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <Field label="Product Name" required hint="This will be visible to customers">
                  <Input
                    placeholder="e.g. Dr Sleeve Tee"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="h-10 text-sm"
                  />
                </Field>
              </div>

              <div className="sm:col-span-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Category <span className="text-destructive">*</span>
                  </span>
                  <Link href="/categories" className="text-[11px] text-primary hover:underline">
                    Manage categories
                  </Link>
                </div>
                <Select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="mt-1 h-10 text-sm"
                >
                  {APPAREL_CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="sm:col-span-3">
                <Field label="Status">
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className="h-10 text-sm"
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </Select>
                </Field>
              </div>
            </div>

            {/* Row 2: Short Description */}
            <div>
              <Field
                label="Short Description"
                hint={`${shortDescription.length}/200`}
                className="relative"
              >
                <Input
                  maxLength={200}
                  placeholder="Layered sleeve t-shirts with unique graphic designs. Premium cotton blend, relaxed fit."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="h-10 text-sm"
                />
              </Field>
            </div>

            {/* Row 3: Full Description (Rich Editor) + Product Images */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
              {/* Full Description & Toolbar */}
              <div className="sm:col-span-7 space-y-2">
                <span className="text-xs font-semibold text-foreground">Full Description</span>
                <div className="rounded-lg border border-input overflow-hidden">
                  <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5 text-muted-foreground">
                    <span className="px-2 py-1 text-xs font-medium rounded hover:bg-accent cursor-pointer flex items-center gap-1">
                      Paragraph <ChevronDown className="h-3 w-3" />
                    </span>
                    <span className="h-4 w-[1px] bg-border mx-1" />
                    <button type="button" className="p-1 rounded hover:bg-accent" title="Bold">
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-accent" title="Italic">
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-accent" title="Underline">
                      <Underline className="h-3.5 w-3.5" />
                    </button>
                    <span className="h-4 w-[1px] bg-border mx-1" />
                    <button type="button" className="p-1 rounded hover:bg-accent" title="Bullet List">
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-accent" title="Numbered List">
                      <ListOrdered className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-accent" title="Link">
                      <Link2 className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-accent" title="Image">
                      <ImageIcon className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-accent" title="Code">
                      <Code className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-accent" title="Table">
                      <Table className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-accent" title="Quote">
                      <Quote className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Textarea
                    rows={6}
                    placeholder="Our Dr Sleeve Tee features a unique layered sleeve design with eye-catching graphics..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 text-xs sm:text-sm p-3 resize-y"
                  />
                </div>
              </div>

              {/* Product Images (Optional cover images) */}
              <div className="sm:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Product Images <span className="text-muted-foreground font-normal">(Optional)</span>
                  </span>
                </div>

                <input
                  ref={coverFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />

                <div
                  onClick={() => coverFileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border rounded-xl bg-muted/20 hover:bg-muted/40 cursor-pointer transition text-center min-h-[120px]"
                >
                  <UploadCloud className="h-6 w-6 text-muted-foreground mb-1.5" />
                  <span className="text-xs font-medium text-foreground">Upload cover images</span>
                  <span className="text-[11px] text-muted-foreground">Drag and drop or click to upload</span>
                </div>

                {coverImages.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {coverImages.slice(0, 4).map((url, i) => (
                      <div key={i} className="relative h-12 w-12 rounded-lg overflow-hidden border border-border group">
                        <Image src={url} alt={`Cover ${i}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCoverImages(coverImages.filter((_, idx) => idx !== i))
                          }}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {coverImages.length > 4 && (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted text-xs font-semibold text-muted-foreground">
                        +{coverImages.length - 4}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  These images represent the product (optional)
                </p>
              </div>
            </div>
          </Card>

          {/* Card 2: Designs (Repeatable cards matching screenshot) */}
          <Card className="p-6 space-y-5 rounded-xl border border-border shadow-xs bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Designs</h2>
                  <p className="text-xs text-muted-foreground">
                    Add different designs/prints for this product. Each design will have its own images, price (optional) and inventory.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleAddDesign}
                className="bg-foreground text-background hover:bg-foreground/90 shrink-0 font-medium"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Design
              </Button>
            </div>

            {/* Repeatable Design Cards */}
            <div className="space-y-4">
              {designs.map((design, dIdx) => {
                const primaryThumb = design.images[0] || null

                return (
                  <div
                    key={dIdx}
                    className="p-4 sm:p-5 rounded-xl border border-border bg-background shadow-xs space-y-4 transition"
                  >
                    {/* Top Row: Thumbnail + Design Name + Design Slug + Price Override + Delete */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <GripVertical className="h-4 w-4 text-muted-foreground/60 cursor-grab" />
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0">
                          {primaryThumb ? (
                            <Image src={primaryThumb} alt={design.name} fill className="object-cover" />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 flex-1 w-full">
                        <div className="sm:col-span-5">
                          <Field label="Design Name" required>
                            <Input
                              value={design.name}
                              placeholder="e.g. Dark Legends"
                              onChange={(e) => handleDesignNameChange(dIdx, e.target.value)}
                              className="h-9 text-xs sm:text-sm"
                            />
                          </Field>
                        </div>

                        <div className="sm:col-span-4">
                          <Field label="Design Slug" required>
                            <Input
                              value={design.slug}
                              placeholder="e.g. dark-legends"
                              onChange={(e) => handleDesignSlugChange(dIdx, e.target.value)}
                              className="h-9 text-xs sm:text-sm font-mono text-xs"
                            />
                          </Field>
                        </div>

                        <div className="sm:col-span-3">
                          <Field label="Price Override (Optional)">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                placeholder={String(price)}
                                value={design.priceOverride}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Number(e.target.value)
                                  setDesigns((prev) =>
                                    prev.map((d, i) => (i === dIdx ? { ...d, priceOverride: val } : d))
                                  )
                                }}
                                className="pl-6 h-9 text-xs sm:text-sm"
                              />
                            </div>
                          </Field>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 self-start sm:self-center shrink-0">
                        <button
                          type="button"
                          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDesign(dIdx)}
                          className="h-8 w-8 flex items-center justify-center rounded-md border border-destructive/20 text-destructive hover:bg-destructive/10 transition"
                          title="Delete design"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Multi-Image Uploader Strip */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {design.images.map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="relative h-14 w-14 rounded-lg overflow-hidden border border-border group shrink-0"
                        >
                          <Image src={imgUrl} alt={`${design.name} ${imgIdx}`} fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setDesigns((prev) =>
                                prev.map((d, i) =>
                                  i === dIdx
                                    ? { ...d, images: d.images.filter((_, idx) => idx !== imgIdx) }
                                    : d
                                )
                              )
                            }
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      <label className="flex flex-col items-center justify-center h-14 w-14 rounded-lg border-2 border-dashed border-border hover:bg-muted/30 cursor-pointer text-muted-foreground transition shrink-0">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleDesignImageUpload(dIdx, e)}
                          className="hidden"
                        />
                        <Plus className="h-4 w-4 mb-0.5" />
                        <span className="text-[10px] font-medium leading-none">Add Images</span>
                      </label>
                    </div>

                    {/* Bottom Row: Sizes & Stock Grid */}
                    <div className="space-y-2 pt-1 border-t">
                      <span className="text-xs font-semibold text-foreground">Sizes & Stock</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {design.sizes.map((s) => (
                          <div
                            key={s.size}
                            className="p-2.5 rounded-lg border border-border bg-card/60 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-foreground">{s.size}</span>
                              <p className="text-[10px] font-mono text-muted-foreground leading-none">
                                SKU: {s.sku || computeDesignSku(categorySlug, design.slug || design.name, s.size)}
                              </p>
                            </div>
                            <input
                              type="number"
                              min={0}
                              value={s.stock}
                              onChange={(e) =>
                                handleDesignStockChange(dIdx, s.size, Number(e.target.value || 0))
                              }
                              className="h-8 w-14 rounded-md border border-input bg-background px-2 text-center text-xs font-semibold focus-visible:ring-1 focus-visible:ring-ring outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Organization, Pricing, Inventory, Shipping, SEO */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Card 1: Product Organization */}
          <Card className="p-5 space-y-4 rounded-xl border border-border shadow-xs bg-card">
            <div className="flex items-center gap-2.5 border-b pb-3">
              <FolderKanban className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-foreground">Product Organization</h2>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-foreground mb-1.5 block">Collections</span>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-input bg-background min-h-[42px] items-center">
                  {selectedCollectionIds.map((colId) => {
                    const col = collections.find((c) => c.id === colId)
                    return (
                      <span
                        key={colId}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground"
                      >
                        {col?.name ?? `Collection #${colId}`}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCollectionIds(selectedCollectionIds.filter((id) => id !== colId))
                          }
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                  <select
                    value=""
                    onChange={(e) => {
                      const id = Number(e.target.value)
                      if (id && !selectedCollectionIds.includes(id)) {
                        setSelectedCollectionIds([...selectedCollectionIds, id])
                      }
                    }}
                    className="h-7 text-xs bg-transparent border-none outline-none cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    <option value="" disabled>
                      + Add collection...
                    </option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-foreground mb-1.5 block">Tags</span>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-input bg-background min-h-[42px] items-center">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Add tag and hit Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="h-7 text-xs bg-transparent border-none outline-none flex-1 min-w-[120px] placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Pricing (Default) */}
          <Card className="p-5 space-y-4 rounded-xl border border-border shadow-xs bg-card">
            <div className="flex items-center gap-2.5 border-b pb-3">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-foreground">Pricing (Default)</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Field label="Base Price" required>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value || 0))}
                      className="pl-6 h-9 text-xs sm:text-sm font-semibold"
                    />
                  </div>
                </Field>
              </div>

              <div>
                <Field label="Compare at Price">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="799"
                      value={compareAtPrice}
                      onChange={(e) =>
                        setCompareAtPrice(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="pl-6 h-9 text-xs sm:text-sm"
                    />
                  </div>
                </Field>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Individual designs can override this price
            </p>
          </Card>

          {/* Card 3: Inventory Settings */}
          <Card className="p-5 space-y-4 rounded-xl border border-border shadow-xs bg-card">
            <div className="flex items-center gap-2.5 border-b pb-3">
              <Box className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-foreground">Inventory Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-foreground block">Track Inventory</span>
                  <p className="text-[11px] text-muted-foreground">
                    Manage stock for each design and size
                  </p>
                </div>
                <Switch checked={trackInventory} onCheckedChange={setTrackInventory} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-foreground block">Continue Selling</span>
                  <p className="text-[11px] text-muted-foreground">
                    Allow orders even when out of stock
                  </p>
                </div>
                <Switch checked={continueSelling} onCheckedChange={setContinueSelling} />
              </div>
            </div>
          </Card>

          {/* Card 4: Shipping */}
          <Card className="p-5 space-y-4 rounded-xl border border-border shadow-xs bg-card">
            <div className="flex items-center gap-2.5 border-b pb-3">
              <Truck className="h-4 w-4 text-teal-500" />
              <h2 className="text-sm font-semibold text-foreground">Shipping</h2>
            </div>

            <div className="space-y-3">
              <Field label="Weight (grams)">
                <Input
                  type="number"
                  min={0}
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(Number(e.target.value || 0))}
                  className="h-9 text-xs sm:text-sm"
                />
              </Field>

              <div>
                <span className="text-xs font-semibold text-foreground block mb-1.5">
                  Dimensions (cm) <span className="font-normal text-muted-foreground">(Optional)</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center rounded-md border border-input bg-background px-2">
                    <span className="text-[11px] text-muted-foreground font-semibold mr-1.5">L</span>
                    <input
                      type="number"
                      min={0}
                      value={lengthCm}
                      onChange={(e) => setLengthCm(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-transparent text-xs h-8 outline-none"
                    />
                  </div>
                  <div className="flex items-center rounded-md border border-input bg-background px-2">
                    <span className="text-[11px] text-muted-foreground font-semibold mr-1.5">W</span>
                    <input
                      type="number"
                      min={0}
                      value={widthCm}
                      onChange={(e) => setWidthCm(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-transparent text-xs h-8 outline-none"
                    />
                  </div>
                  <div className="flex items-center rounded-md border border-input bg-background px-2">
                    <span className="text-[11px] text-muted-foreground font-semibold mr-1.5">H</span>
                    <input
                      type="number"
                      min={0}
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-transparent text-xs h-8 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 5: Search Engine / SEO */}
          <Card className="p-5 space-y-4 rounded-xl border border-border shadow-xs bg-card">
            <div className="flex items-center gap-2.5 border-b pb-3">
              <Search className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-foreground">Search Engine / SEO</h2>
            </div>

            <div className="space-y-3">
              <Field label="SEO Title" hint={`${seoTitle.length}/60`}>
                <Input
                  maxLength={60}
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="h-9 text-xs sm:text-sm"
                />
              </Field>

              <Field label="SEO Description" hint={`${seoDescription.length}/160`}>
                <Textarea
                  rows={3}
                  maxLength={160}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="text-xs sm:text-sm p-2.5 resize-none"
                />
              </Field>

              <Field label="URL Slug">
                <Input
                  value={urlSlug}
                  onChange={(e) => setUrlSlug(slugify(e.target.value))}
                  className="h-9 text-xs sm:text-sm font-mono"
                />
              </Field>

              <div className="pt-1">
                <span className="text-[11px] text-muted-foreground block mb-0.5">Live Preview:</span>
                <p className="text-xs text-primary font-mono truncate">
                  https://teesgarage.in/products/{urlSlug || 'product-slug'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
