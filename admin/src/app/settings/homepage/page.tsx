'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  ArrowDown,
  ArrowUp,
  Award,
  CheckCircle2,
  Compass,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  FolderTree,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Megaphone,
  MessageSquareQuote,
  Monitor,
  Package,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Trash2
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { fetchBackendHomepage, saveHomepageConfig, resetBackendHomepage } from '@/services/homepage'
import { DEFAULT_HOMEPAGE_CONFIG } from '@/data/seed'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, CardHeader, Field, Input, Select, Badge } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'
import type {
  HomepageConfig,
  HomepageSectionType,
  HomepageCategoryItem,
  HomepageLookItem,
  HomepageReviewItem
} from '@/lib/types'

const SECTION_METADATA: Record<
  HomepageSectionType,
  { name: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
  announcement: {
    name: 'Announcement Bar',
    description: 'Rotating banner at the top of the storefront for shipping and promos',
    icon: Megaphone
  },
  hero: {
    name: 'Hero Banner',
    description: 'Main editorial full-bleed banner with seasonal headline and primary CTAs',
    icon: ImageIcon
  },
  categories: {
    name: 'Shop by Category',
    description: 'Visual grid of category cards with product counts and imagery',
    icon: FolderTree
  },
  new_arrivals: {
    name: 'New Arrivals',
    description: 'Fresh drops product showcase with badged items and view-all button',
    icon: Sparkles
  },
  featured_collection: {
    name: 'Featured Collection',
    description: 'Editorial split banner focusing on a signature denim collection',
    icon: Layers
  },
  best_sellers: {
    name: 'Best Sellers',
    description: 'Community favorites and high-demand denim silhouettes',
    icon: Award
  },
  brand_story: {
    name: 'Our Story & Heritage',
    description: 'Brand philosophy, fabric specs (14oz), signature fits and Mumbai dispatch stats',
    icon: Compass
  },
  looks: {
    name: 'Shop the Look',
    description: 'Curated style edits and outfit inspiration linking to the catalog',
    icon: ShoppingBag
  },
  instagram: {
    name: 'Social / Instagram Grid',
    description: 'Community photo grid showing customer and studio style snapshots',
    icon: ImageIcon
  },
  reviews: {
    name: 'Customer Reviews',
    description: 'Verified buyer testimonials, rating stars, and product feedback',
    icon: MessageSquareQuote
  },
  trust_bar: {
    name: 'Trust & Guarantees',
    description: 'Security, shipping, returns, and customer service guarantee badges',
    icon: ShieldCheck
  },
  catalog: {
    name: 'Product Catalog Grid',
    description: 'Full product catalogue with silhouette tabs, price filters, and search toolbar',
    icon: Package
  }
}

export default function StorefrontHomepagePage() {
  const storeHomepage = useAdminStore((s) => s.data.homepage)
  const [config, setConfig] = React.useState<HomepageConfig>(
    storeHomepage || JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_CONFIG))
  )
  const [activeSection, setActiveSection] = React.useState<HomepageSectionType>('hero')
  const [saving, setSaving] = React.useState(false)
  const [previewMode, setPreviewMode] = React.useState<'desktop' | 'mobile'>('desktop')

  // Sync on initial mount from backend
  React.useEffect(() => {
    let isMounted = true
    void fetchBackendHomepage().then((remoteConfig) => {
      if (isMounted && remoteConfig && Array.isArray(remoteConfig.sectionsOrder)) {
        setConfig(remoteConfig)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Sync when store updates from elsewhere
  React.useEffect(() => {
    if (storeHomepage && Array.isArray(storeHomepage.sectionsOrder)) {
      setConfig(storeHomepage)
    }
  }, [storeHomepage])

  // Move a section up or down in order
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= config.sectionsOrder.length) return

    const newOrder = [...config.sectionsOrder]
    const [moved] = newOrder.splice(index, 1)
    newOrder.splice(targetIndex, 0, moved)

    setConfig({ ...config, sectionsOrder: newOrder })
  }

  // Toggle section enabled/disabled
  const handleToggleSection = (sectionId: HomepageSectionType) => {
    const currentStatus = config.sectionsEnabled[sectionId] ?? true
    const updatedEnabled = { ...config.sectionsEnabled, [sectionId]: !currentStatus }
    setConfig({ ...config, sectionsEnabled: updatedEnabled })
  }

  // Save changes to backend
  const handleSaveToBackend = async () => {
    try {
      setSaving(true)
      await saveHomepageConfig(config)
      toastSuccess('Homepage layout and content published to storefront!')
    } catch (err: any) {
      toastError(err?.message || 'Failed to save homepage layout.')
    } finally {
      setSaving(false)
    }
  }

  // Reset to factory defaults
  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        'Reset all homepage layout and section content to factory defaults? Any custom headlines, copy, or section order will be replaced.'
      )
    ) {
      return
    }

    try {
      setSaving(true)
      const res = await resetBackendHomepage()
      setConfig(res)
      toastSuccess('Homepage layout reset to factory defaults.')
    } catch (err: any) {
      toastError(err?.message || 'Failed to reset homepage layout.')
    } finally {
      setSaving(false)
    }
  }

  // Discard local unsaved changes
  const handleDiscardChanges = () => {
    if (storeHomepage && Array.isArray(storeHomepage.sectionsOrder)) {
      setConfig(JSON.parse(JSON.stringify(storeHomepage)))
      toastSuccess('Unsaved changes discarded.')
    }
  }

  const enabledCount = config.sectionsOrder.filter((id) => config.sectionsEnabled[id] ?? true).length

  return (
    <div>
      <PageHeader
        title="Storefront Homepage Layout"
        description="Reorder sections, toggle visibility, and customize live hero banners, headlines, story copy, and imagery on the storefront."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetDefaults} disabled={saving}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Defaults
          </Button>

          <Button variant="ghost" size="sm" onClick={handleDiscardChanges} disabled={saving}>
            Discard
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleSaveToBackend}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1" /> {saving ? 'Publishing...' : 'Save to Storefront'}
          </Button>
        </div>
      </PageHeader>

      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Sections Order & Active Section Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section Ordering & Visibility Card */}
            <Card className="p-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 text-primary" /> Homepage Section Sequence
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Drag or use arrows to adjust the vertical order of sections on your homepage. Click a section to edit its content.
                  </p>
                </div>
                <Badge tone="neutral" className="text-xs">
                  {enabledCount} Visible / {config.sectionsOrder.length} Total
                </Badge>
              </div>

              <div className="divide-y divide-border mt-3">
                {config.sectionsOrder.map((sectionId, index) => {
                  const meta = SECTION_METADATA[sectionId]
                  const Icon = meta.icon
                  const isFirst = index === 0
                  const isLast = index === config.sectionsOrder.length - 1
                  const isEnabled = config.sectionsEnabled[sectionId] ?? true
                  const isSelected = activeSection === sectionId

                  return (
                    <div
                      key={sectionId}
                      className={`py-3 px-2 flex items-center justify-between gap-3 rounded-md transition-all ${
                        isSelected
                          ? 'bg-primary/10 border border-primary/20'
                          : !isEnabled
                            ? 'opacity-40 hover:opacity-70 bg-muted/20'
                            : 'hover:bg-muted/40'
                      }`}
                    >
                      {/* Left: Reorder Controls + Info */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMoveSection(index, 'up')}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                            title="Move section up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                            {index + 1}
                          </span>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMoveSection(index, 'down')}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                            title="Move section down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="h-8 w-8 rounded-md bg-secondary/80 flex items-center justify-center shrink-0 text-foreground">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{meta.name}</span>
                            {isSelected && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.2 rounded">
                                Editing
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{meta.description}</p>
                        </div>
                      </div>

                      {/* Right: Toggle & Edit Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSection(sectionId)}
                          className={`text-xs px-2.5 py-1 rounded font-medium border flex items-center gap-1.5 transition-colors ${
                            isEnabled
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                          }`}
                          title={isEnabled ? 'Click to hide section' : 'Click to show section'}
                        >
                          {isEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {isEnabled ? 'Visible' : 'Hidden'}
                        </button>

                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveSection(sectionId)}
                          className="h-8 text-xs"
                        >
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Active Section Content Editor Card */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-primary/10 text-primary">
                    {React.createElement(SECTION_METADATA[activeSection].icon, { className: 'h-4 w-4' })}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Edit Content: {SECTION_METADATA[activeSection].name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{SECTION_METADATA[activeSection].description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleSection(activeSection)}
                  className={`text-xs px-2.5 py-1 rounded font-medium border transition-colors ${
                    (config.sectionsEnabled[activeSection] ?? true)
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {(config.sectionsEnabled[activeSection] ?? true) ? 'Section Enabled' : 'Section Disabled'}
                </button>
              </div>

              {/* ── SECTION EDITORS ── */}

              {/* 1. Announcement Bar */}
              {activeSection === 'announcement' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Cycle Speed (Seconds)" hint="How often messages slide">
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={config.announcement.intervalSeconds}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            announcement: {
                              ...config.announcement,
                              intervalSeconds: Math.max(1, Number(e.target.value) || 4)
                            }
                          })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Announcement Messages" hint="Enter the messages to cycle in the top banner">
                    <div className="space-y-2">
                      {config.announcement.messages.map((msg, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={msg}
                            onChange={(e) => {
                              const updated = [...config.announcement.messages]
                              updated[i] = e.target.value
                              setConfig({
                                ...config,
                                announcement: { ...config.announcement, messages: updated }
                              })
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = config.announcement.messages.filter((_, idx) => idx !== i)
                              setConfig({
                                ...config,
                                announcement: { ...config.announcement, messages: updated }
                              })
                            }}
                            className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                            title="Remove message"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setConfig({
                            ...config,
                            announcement: {
                              ...config.announcement,
                              messages: [...config.announcement.messages, '⚡ New seasonal offer available now']
                            }
                          })
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Message
                      </Button>
                    </div>
                  </Field>
                </div>
              )}

              {/* 2. Hero Banner */}
              {activeSection === 'hero' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Eyebrow Tag" hint="Top micro-tag (e.g. 'New Season — SS 2026')">
                      <Input
                        value={config.hero.eyebrow}
                        onChange={(e) =>
                          setConfig({ ...config, hero: { ...config.hero, eyebrow: e.target.value } })
                        }
                      />
                    </Field>

                    <Field label="Background Image URL" hint="Relative (/hero-man.jpg) or Unsplash URL">
                      <Input
                        value={config.hero.imageUrl}
                        onChange={(e) =>
                          setConfig({ ...config, hero: { ...config.hero, imageUrl: e.target.value } })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Main Hero Headline" hint="Supports line breaks (use Enter)">
                    <textarea
                      rows={2}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans"
                      value={config.hero.title}
                      onChange={(e) =>
                        setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })
                      }
                    />
                  </Field>

                  <Field label="Hero Subtitle / Description" hint="Supporting editorial copy">
                    <textarea
                      rows={2}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans"
                      value={config.hero.subtitle}
                      onChange={(e) =>
                        setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })
                      }
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Primary CTA Button Label">
                      <Input
                        value={config.hero.primaryCtaText}
                        onChange={(e) =>
                          setConfig({ ...config, hero: { ...config.hero, primaryCtaText: e.target.value } })
                        }
                      />
                    </Field>
                    <Field label="Primary CTA Destination Link">
                      <Input
                        value={config.hero.primaryCtaLink}
                        onChange={(e) =>
                          setConfig({ ...config, hero: { ...config.hero, primaryCtaLink: e.target.value } })
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Secondary CTA Button Label">
                      <Input
                        value={config.hero.secondaryCtaText}
                        onChange={(e) =>
                          setConfig({ ...config, hero: { ...config.hero, secondaryCtaText: e.target.value } })
                        }
                      />
                    </Field>
                    <Field label="Secondary CTA Destination Link">
                      <Input
                        value={config.hero.secondaryCtaLink}
                        onChange={(e) =>
                          setConfig({ ...config, hero: { ...config.hero, secondaryCtaLink: e.target.value } })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Hero Trust Badges" hint="Shown below buttons with separator dots">
                    <div className="flex flex-wrap gap-2">
                      {config.hero.trustBadges.map((badge, i) => (
                        <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                          <Input
                            value={badge}
                            className="h-7 text-xs w-44"
                            onChange={(e) => {
                              const updated = [...config.hero.trustBadges]
                              updated[i] = e.target.value
                              setConfig({ ...config, hero: { ...config.hero, trustBadges: updated } })
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = config.hero.trustBadges.filter((_, idx) => idx !== i)
                              setConfig({ ...config, hero: { ...config.hero, trustBadges: updated } })
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setConfig({
                            ...config,
                            hero: {
                              ...config.hero,
                              trustBadges: [...config.hero.trustBadges, '🔒 Premium Quality']
                            }
                          })
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Badge
                      </Button>
                    </div>
                  </Field>
                </div>
              )}

              {/* 3. Shop by Category */}
              {activeSection === 'categories' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Section Eyebrow">
                      <Input
                        value={config.categories.eyebrow}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            categories: { ...config.categories, eyebrow: e.target.value }
                          })
                        }
                      />
                    </Field>
                    <Field label="Section Title">
                      <Input
                        value={config.categories.title}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            categories: { ...config.categories, title: e.target.value }
                          })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Category Cards" hint="Customize category labels, images and count pills">
                    <div className="space-y-3">
                      {config.categories.items.map((cat, i) => (
                        <div key={cat.id || i} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <Input
                              placeholder="Label"
                              value={cat.label}
                              onChange={(e) => {
                                const items = [...config.categories.items]
                                items[i] = { ...items[i], label: e.target.value }
                                setConfig({ ...config, categories: { ...config.categories, items } })
                              }}
                            />
                            <Input
                              placeholder="Count text"
                              value={cat.count}
                              onChange={(e) => {
                                const items = [...config.categories.items]
                                items[i] = { ...items[i], count: e.target.value }
                                setConfig({ ...config, categories: { ...config.categories, items } })
                              }}
                            />
                            <Input
                              placeholder="Image URL"
                              value={cat.img}
                              className="sm:col-span-2 font-mono text-xs"
                              onChange={(e) => {
                                const items = [...config.categories.items]
                                items[i] = { ...items[i], img: e.target.value }
                                setConfig({ ...config, categories: { ...config.categories, items } })
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {/* 4. New Arrivals */}
              {activeSection === 'new_arrivals' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Section Eyebrow">
                      <Input
                        value={config.new_arrivals.eyebrow}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            new_arrivals: { ...config.new_arrivals, eyebrow: e.target.value }
                          })
                        }
                      />
                    </Field>
                    <Field label="Section Title">
                      <Input
                        value={config.new_arrivals.title}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            new_arrivals: { ...config.new_arrivals, title: e.target.value }
                          })
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Products to Display">
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={config.new_arrivals.limit}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            new_arrivals: { ...config.new_arrivals, limit: Number(e.target.value) || 4 }
                          })
                        }
                      />
                    </Field>
                    <Field label="Button CTA Label">
                      <Input
                        value={config.new_arrivals.ctaText}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            new_arrivals: { ...config.new_arrivals, ctaText: e.target.value }
                          })
                        }
                      />
                    </Field>
                    <Field label="Button Destination Link">
                      <Input
                        value={config.new_arrivals.ctaLink}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            new_arrivals: { ...config.new_arrivals, ctaLink: e.target.value }
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* 5. Featured Collection Banner */}
              {activeSection === 'featured_collection' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Eyebrow Tag">
                      <Input
                        value={config.featured_collection.eyebrow}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            featured_collection: { ...config.featured_collection, eyebrow: e.target.value }
                          })
                        }
                      />
                    </Field>
                    <Field label="Banner Image URL">
                      <Input
                        value={config.featured_collection.imageUrl}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            featured_collection: { ...config.featured_collection, imageUrl: e.target.value }
                          })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Collection Title (Line breaks supported)">
                    <textarea
                      rows={2}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans"
                      value={config.featured_collection.title}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          featured_collection: { ...config.featured_collection, title: e.target.value }
                        })
                      }
                    />
                  </Field>

                  <Field label="Collection Editorial Description">
                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans"
                      value={config.featured_collection.description}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          featured_collection: { ...config.featured_collection, description: e.target.value }
                        })
                      }
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="CTA Button Label">
                      <Input
                        value={config.featured_collection.ctaText}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            featured_collection: { ...config.featured_collection, ctaText: e.target.value }
                          })
                        }
                      />
                    </Field>
                    <Field label="CTA Destination Link">
                      <Input
                        value={config.featured_collection.ctaLink}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            featured_collection: { ...config.featured_collection, ctaLink: e.target.value }
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* 6. Best Sellers */}
              {activeSection === 'best_sellers' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Eyebrow Tag">
                      <Input
                        value={config.best_sellers.eyebrow}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            best_sellers: { ...config.best_sellers, eyebrow: e.target.value }
                          })
                        }
                      />
                    </Field>
                    <Field label="Section Title">
                      <Input
                        value={config.best_sellers.title}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            best_sellers: { ...config.best_sellers, title: e.target.value }
                          })
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Subtitle Tagline">
                      <Input
                        value={config.best_sellers.subtitle}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            best_sellers: { ...config.best_sellers, subtitle: e.target.value }
                          })
                        }
                      />
                    </Field>
                    <Field label="Number of Products to Display">
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={config.best_sellers.limit}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            best_sellers: { ...config.best_sellers, limit: Number(e.target.value) || 4 }
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* 7. Brand Story */}
              {activeSection === 'brand_story' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Section Eyebrow">
                      <Input
                        value={config.brand_story.eyebrow}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            brand_story: { ...config.brand_story, eyebrow: e.target.value }
                          })
                        }
                      />
                    </Field>
                    <Field label="Editorial Image URL">
                      <Input
                        value={config.brand_story.imageUrl}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            brand_story: { ...config.brand_story, imageUrl: e.target.value }
                          })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Story Headline">
                    <textarea
                      rows={2}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans"
                      value={config.brand_story.title}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          brand_story: { ...config.brand_story, title: e.target.value }
                        })
                      }
                    />
                  </Field>

                  <Field label="Paragraph 1 (The Mission)">
                    <textarea
                      rows={2}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans"
                      value={config.brand_story.paragraphs[0] || ''}
                      onChange={(e) => {
                        const pars = [...config.brand_story.paragraphs]
                        pars[0] = e.target.value
                        setConfig({ ...config, brand_story: { ...config.brand_story, paragraphs: pars } })
                      }}
                    />
                  </Field>

                  <Field label="Paragraph 2 (The Craft)">
                    <textarea
                      rows={2}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans"
                      value={config.brand_story.paragraphs[1] || ''}
                      onChange={(e) => {
                        const pars = [...config.brand_story.paragraphs]
                        pars[1] = e.target.value
                        setConfig({ ...config, brand_story: { ...config.brand_story, paragraphs: pars } })
                      }}
                    />
                  </Field>

                  <Field label="Brand Stats (e.g. 14oz Fabric weight, 24h dispatch)">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {config.brand_story.stats.map((stat, i) => (
                        <div key={i} className="p-2 border rounded-md bg-muted/20 space-y-1">
                          <Input
                            placeholder="Value (e.g. 14oz)"
                            value={stat.num}
                            onChange={(e) => {
                              const stats = [...config.brand_story.stats]
                              stats[i] = { ...stats[i], num: e.target.value }
                              setConfig({ ...config, brand_story: { ...config.brand_story, stats } })
                            }}
                          />
                          <Input
                            placeholder="Label (e.g. Fabric weight)"
                            value={stat.label}
                            onChange={(e) => {
                              const stats = [...config.brand_story.stats]
                              stats[i] = { ...stats[i], label: e.target.value }
                              setConfig({ ...config, brand_story: { ...config.brand_story, stats } })
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Button CTA Text">
                      <Input
                        value={config.brand_story.ctaText}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            brand_story: { ...config.brand_story, ctaText: e.target.value }
                          })
                        }
                      />
                    </Field>
                    <Field label="Button Target Link">
                      <Input
                        value={config.brand_story.ctaLink}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            brand_story: { ...config.brand_story, ctaLink: e.target.value }
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* 8. Shop the Look */}
              {activeSection === 'looks' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Eyebrow">
                      <Input
                        value={config.looks.eyebrow}
                        onChange={(e) =>
                          setConfig({ ...config, looks: { ...config.looks, eyebrow: e.target.value } })
                        }
                      />
                    </Field>
                    <Field label="Section Title">
                      <Input
                        value={config.looks.title}
                        onChange={(e) =>
                          setConfig({ ...config, looks: { ...config.looks, title: e.target.value } })
                        }
                      />
                    </Field>
                    <Field label="Subtitle">
                      <Input
                        value={config.looks.subtitle}
                        onChange={(e) =>
                          setConfig({ ...config, looks: { ...config.looks, subtitle: e.target.value } })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Curated Look Outfits">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {config.looks.items.map((look, i) => (
                        <div key={look.id} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                          <Input
                            placeholder="Look Title"
                            value={look.title}
                            onChange={(e) => {
                              const items = [...config.looks.items]
                              items[i] = { ...items[i], title: e.target.value }
                              setConfig({ ...config, looks: { ...config.looks, items } })
                            }}
                          />
                          <Input
                            placeholder="Tag (e.g. Straight + Tee)"
                            value={look.tag}
                            onChange={(e) => {
                              const items = [...config.looks.items]
                              items[i] = { ...items[i], tag: e.target.value }
                              setConfig({ ...config, looks: { ...config.looks, items } })
                            }}
                          />
                          <Input
                            placeholder="Image URL"
                            value={look.img}
                            className="font-mono text-xs"
                            onChange={(e) => {
                              const items = [...config.looks.items]
                              items[i] = { ...items[i], img: e.target.value }
                              setConfig({ ...config, looks: { ...config.looks, items } })
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {/* 9. Instagram Grid */}
              {activeSection === 'instagram' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Handle Eyebrow">
                      <Input
                        value={config.instagram.eyebrow}
                        onChange={(e) =>
                          setConfig({ ...config, instagram: { ...config.instagram, eyebrow: e.target.value } })
                        }
                      />
                    </Field>
                    <Field label="Title">
                      <Input
                        value={config.instagram.title}
                        onChange={(e) =>
                          setConfig({ ...config, instagram: { ...config.instagram, title: e.target.value } })
                        }
                      />
                    </Field>
                    <Field label="Instagram Profile URL">
                      <Input
                        value={config.instagram.instagramUrl}
                        onChange={(e) =>
                          setConfig({ ...config, instagram: { ...config.instagram, instagramUrl: e.target.value } })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Photos (6 URLs)">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {config.instagram.photos.map((src, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground w-6">#{i + 1}</span>
                          <Input
                            value={src}
                            className="font-mono text-xs"
                            onChange={(e) => {
                              const photos = [...config.instagram.photos]
                              photos[i] = e.target.value
                              setConfig({ ...config, instagram: { ...config.instagram, photos } })
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {/* 10. Reviews */}
              {activeSection === 'reviews' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Section Title">
                      <Input
                        value={config.reviews.title}
                        onChange={(e) =>
                          setConfig({ ...config, reviews: { ...config.reviews, title: e.target.value } })
                        }
                      />
                    </Field>
                    <Field label="Rating Summary Pill">
                      <Input
                        value={config.reviews.ratingText}
                        onChange={(e) =>
                          setConfig({ ...config, reviews: { ...config.reviews, ratingText: e.target.value } })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Featured Customer Reviews">
                    <div className="space-y-3">
                      {config.reviews.items.map((rev, i) => (
                        <div key={rev.id || i} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Input
                              placeholder="Customer Name"
                              value={rev.name}
                              onChange={(e) => {
                                const items = [...config.reviews.items]
                                items[i] = { ...items[i], name: e.target.value }
                                setConfig({ ...config, reviews: { ...config.reviews, items } })
                              }}
                            />
                            <Input
                              placeholder="City / Location"
                              value={rev.location}
                              onChange={(e) => {
                                const items = [...config.reviews.items]
                                items[i] = { ...items[i], location: e.target.value }
                                setConfig({ ...config, reviews: { ...config.reviews, items } })
                              }}
                            />
                            <Input
                              placeholder="Product"
                              value={rev.product}
                              onChange={(e) => {
                                const items = [...config.reviews.items]
                                items[i] = { ...items[i], product: e.target.value }
                                setConfig({ ...config, reviews: { ...config.reviews, items } })
                              }}
                            />
                          </div>
                          <textarea
                            rows={2}
                            placeholder="Review text"
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans"
                            value={rev.text}
                            onChange={(e) => {
                              const items = [...config.reviews.items]
                              items[i] = { ...items[i], text: e.target.value }
                              setConfig({ ...config, reviews: { ...config.reviews, items } })
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {/* 11. Trust Bar */}
              {activeSection === 'trust_bar' && (
                <div className="space-y-4">
                  <Field label="Trust Guarantee Badges (4 items)">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {config.trust_bar.items.map((item, i) => (
                        <div key={item.id || i} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                          <Input
                            placeholder="Guarantee Text"
                            value={item.title}
                            onChange={(e) => {
                              const items = [...config.trust_bar.items]
                              items[i] = { ...items[i], title: e.target.value }
                              setConfig({ ...config, trust_bar: { ...config.trust_bar, items } })
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {/* 12. Catalog */}
              {activeSection === 'catalog' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Section Header Label">
                      <Input
                        value={config.catalog.title}
                        onChange={(e) =>
                          setConfig({ ...config, catalog: { ...config.catalog, title: e.target.value } })
                        }
                      />
                    </Field>
                    <div className="pt-6">
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.catalog.showFilters}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              catalog: { ...config.catalog, showFilters: e.target.checked }
                            })
                          }
                          className="rounded border-border"
                        />
                        <span>Enable Silhouette & Price Filter Toolbar</span>
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The catalog grid automatically shows all active products with pagination, search, and sorting.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Live Storefront Mockup Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> Live Storefront Preview
                </h3>

                <div className="flex items-center gap-1 bg-muted p-0.5 rounded">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('desktop')}
                    className={`p-1 rounded text-xs transition-colors ${
                      previewMode === 'desktop' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                    }`}
                    title="Desktop simulation"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-1 rounded text-xs transition-colors ${
                      previewMode === 'mobile' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                    }`}
                    title="Mobile simulation"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2 mb-3">
                Live simulation reflecting current section sequence, enabled states, and updated copy.
              </p>

              {/* Mockup Frame */}
              <div
                className={`rounded-xl border border-border bg-[#0d0d0d] text-white shadow-xl overflow-hidden transition-all duration-300 ${
                  previewMode === 'mobile' ? 'max-w-xs mx-auto text-[11px]' : 'w-full text-xs'
                }`}
                style={{ maxHeight: '720px', overflowY: 'auto' }}
              >
                {/* Storefront Header Mock */}
                <div className="border-b border-white/10 px-4 py-2.5 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-20">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold tracking-tight text-white font-sans text-xs">INFIT</span>
                    <span className="text-[8px] px-1 py-0.2 rounded bg-white/20 text-white font-mono">DENIM</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-white/50 font-mono">
                    <span>MEN</span>
                    <span>WOMEN</span>
                    <span>BAG (0)</span>
                  </div>
                </div>

                {/* Rendered Preview Sections In Configured Sequence */}
                <div className="divide-y divide-white/5">
                  {config.sectionsOrder.map((secId) => {
                    const isVisible = config.sectionsEnabled[secId] ?? true
                    if (!isVisible) return null

                    switch (secId) {
                      case 'announcement': {
                        if (!config.announcement.enabled || config.announcement.messages.length === 0) return null
                        return (
                          <div
                            key="announcement"
                            className="bg-white/5 text-center py-1.5 px-2 text-[10px] text-white/80 font-mono tracking-tight"
                          >
                            {config.announcement.messages[0]}
                          </div>
                        )
                      }

                      case 'hero': {
                        if (!config.hero.enabled) return null
                        return (
                          <div
                            key="hero"
                            className="relative min-h-[160px] p-4 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent"
                            style={{
                              backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.2)), url(${config.hero.imageUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            <span className="text-[9px] uppercase tracking-wider text-white/60 font-mono mb-1">
                              {config.hero.eyebrow}
                            </span>
                            <h4 className="text-base font-bold text-white font-sans leading-tight whitespace-pre-line mb-1">
                              {config.hero.title}
                            </h4>
                            <p className="text-[10px] text-white/70 line-clamp-2 mb-2">{config.hero.subtitle}</p>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded bg-white text-black font-semibold text-[10px]">
                                {config.hero.primaryCtaText}
                              </span>
                              <span className="px-2.5 py-1 rounded border border-white/40 text-white text-[10px]">
                                {config.hero.secondaryCtaText}
                              </span>
                            </div>
                          </div>
                        )
                      }

                      case 'categories': {
                        if (!config.categories.enabled) return null
                        return (
                          <div key="categories" className="p-3 bg-white/[0.02]">
                            <div className="text-[10px] text-white/50 uppercase font-mono mb-1">
                              {config.categories.eyebrow}
                            </div>
                            <div className="font-bold text-xs text-white mb-2">{config.categories.title}</div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {config.categories.items.slice(0, 3).map((cat) => (
                                <div
                                  key={cat.id}
                                  className="rounded bg-white/5 p-1.5 text-center flex flex-col items-center"
                                >
                                  <span className="text-sm mb-0.5">{cat.icon}</span>
                                  <span className="text-[9px] font-semibold text-white/90">{cat.label}</span>
                                  <span className="text-[8px] text-white/40">{cat.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }

                      case 'new_arrivals': {
                        if (!config.new_arrivals.enabled) return null
                        return (
                          <div key="new_arrivals" className="p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <div>
                                <span className="text-[9px] text-white/50 uppercase font-mono">
                                  {config.new_arrivals.eyebrow}
                                </span>
                                <h5 className="font-bold text-xs text-white">{config.new_arrivals.title}</h5>
                              </div>
                              <span className="text-[9px] text-primary underline">{config.new_arrivals.ctaText}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded bg-white/5 p-2 text-center text-[10px] text-white/70">
                                👖 Classic Straight Indigo — ₹2,299
                              </div>
                              <div className="rounded bg-white/5 p-2 text-center text-[10px] text-white/70">
                                👖 Heavy Wash Baggy — ₹2,499
                              </div>
                            </div>
                          </div>
                        )
                      }

                      case 'featured_collection': {
                        if (!config.featured_collection.enabled) return null
                        return (
                          <div
                            key="featured_collection"
                            className="p-4 bg-gradient-to-r from-white/10 to-transparent relative"
                          >
                            <span className="text-[9px] uppercase font-mono text-white/50">
                              {config.featured_collection.eyebrow}
                            </span>
                            <h5 className="font-bold text-sm text-white mb-1">
                              {config.featured_collection.title.replace('\n', ' ')}
                            </h5>
                            <p className="text-[10px] text-white/70 line-clamp-2 mb-2">
                              {config.featured_collection.description}
                            </p>
                            <span className="inline-block px-2 py-0.5 rounded bg-white text-black text-[9px] font-bold">
                              {config.featured_collection.ctaText}
                            </span>
                          </div>
                        )
                      }

                      case 'best_sellers': {
                        if (!config.best_sellers.enabled) return null
                        return (
                          <div key="best_sellers" className="p-3 bg-white/[0.02]">
                            <span className="text-[9px] text-white/50 uppercase font-mono">
                              {config.best_sellers.eyebrow}
                            </span>
                            <h5 className="font-bold text-xs text-white mb-0.5">{config.best_sellers.title}</h5>
                            <p className="text-[9px] text-white/50 mb-2">{config.best_sellers.subtitle}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded bg-white/5 p-2 text-center text-[10px] text-white/70">
                                👖 Vintage Blue Wide Leg
                              </div>
                              <div className="rounded bg-white/5 p-2 text-center text-[10px] text-white/70">
                                👖 Relaxed Charcoal Raw
                              </div>
                            </div>
                          </div>
                        )
                      }

                      case 'brand_story': {
                        if (!config.brand_story.enabled) return null
                        return (
                          <div key="brand_story" className="p-4 bg-white/5">
                            <span className="text-[9px] uppercase font-mono text-white/50">
                              {config.brand_story.eyebrow}
                            </span>
                            <h5 className="font-bold text-xs text-white mb-1">
                              {config.brand_story.title.replace('\n', ' ')}
                            </h5>
                            <p className="text-[10px] text-white/70 line-clamp-2 mb-2">
                              {config.brand_story.paragraphs[0]}
                            </p>
                            <div className="flex items-center gap-3 pt-1 border-t border-white/10 text-[9px]">
                              {config.brand_story.stats.map((s, idx) => (
                                <div key={idx}>
                                  <span className="font-bold text-white block">{s.num}</span>
                                  <span className="text-white/50 text-[8px]">{s.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }

                      case 'looks': {
                        if (!config.looks.enabled) return null
                        return (
                          <div key="looks" className="p-3">
                            <h5 className="font-bold text-xs text-white mb-1.5">{config.looks.title}</h5>
                            <div className="grid grid-cols-2 gap-1.5">
                              {config.looks.items.slice(0, 2).map((lk) => (
                                <div key={lk.id} className="rounded bg-white/5 p-1.5 text-center">
                                  <span className="text-[9px] text-white/60 block">{lk.tag}</span>
                                  <span className="text-[10px] font-semibold text-white">{lk.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }

                      case 'instagram': {
                        if (!config.instagram.enabled) return null
                        return (
                          <div key="instagram" className="p-3 bg-white/[0.02]">
                            <h5 className="font-bold text-xs text-white mb-1.5">{config.instagram.eyebrow}</h5>
                            <div className="grid grid-cols-4 gap-1">
                              {config.instagram.photos.slice(0, 4).map((_, i) => (
                                <div key={i} className="aspect-square bg-white/10 rounded flex items-center justify-center text-[8px] text-white/40">
                                  📸
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }

                      case 'reviews': {
                        if (!config.reviews.enabled) return null
                        return (
                          <div key="reviews" className="p-3 bg-white/5">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-bold text-xs text-white">{config.reviews.title}</h5>
                              <span className="text-[8px] text-amber-400 font-mono">★★★★★ {config.reviews.ratingText}</span>
                            </div>
                            {config.reviews.items[0] && (
                              <p className="text-[10px] text-white/80 italic">&ldquo;{config.reviews.items[0].text}&rdquo;</p>
                            )}
                          </div>
                        )
                      }

                      case 'trust_bar': {
                        if (!config.trust_bar.enabled) return null
                        return (
                          <div key="trust_bar" className="p-2.5 bg-black flex flex-wrap gap-2 text-[9px] text-white/70">
                            {config.trust_bar.items.map((t, idx) => (
                              <span key={idx} className="flex items-center gap-1">
                                ✓ {t.title}
                              </span>
                            ))}
                          </div>
                        )
                      }

                      case 'catalog': {
                        if (!config.catalog.enabled) return null
                        return (
                          <div key="catalog" className="p-3 bg-white/[0.04]">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-xs text-white">{config.catalog.title}</h5>
                              <span className="text-[8px] text-white/40 font-mono">Filters Active</span>
                            </div>
                            <div className="p-2 rounded border border-dashed border-white/20 text-center text-[10px] text-white/50">
                              Catalog Grid & Silhouette Filters Area
                            </div>
                          </div>
                        )
                      }

                      default:
                        return null
                    }
                  })}
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-muted/40 border-dashed text-xs text-muted-foreground space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Storefront Dynamic Integration
              </div>
              <p>
                When you click <strong>Save to Storefront</strong>, your settings are saved to the backend REST API
                and Next.js on-demand cache tag <code>homepage</code> is revalidated. Shoppers immediately see the updated sequence and copy.
              </p>
            </Card>
          </div>
        </div>
      </PageContent>
    </div>
  )
}
