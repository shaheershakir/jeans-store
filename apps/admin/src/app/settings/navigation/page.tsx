'use client'

import * as React from 'react'
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  Compass,
  ExternalLink,
  Eye,
  CheckCircle2,
  Filter,
  Layers,
  Link as LinkIcon,
  Smartphone,
  Monitor
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import {
  fetchBackendNavigation,
  saveNavigationList,
  resetBackendNavigation
} from '@/services/navigation'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, CardHeader, Field, Input, Select, Badge } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'
import type { NavigationItem, NavItemType } from '@/lib/types'

const FIT_OPTIONS = [
  { value: 'all', label: 'All Silhouettes' },
  { value: 'Straight', label: 'Straight' },
  { value: 'Baggy', label: 'Baggy & Wide' },
  { value: 'Wide', label: 'Wide Leg' },
  { value: 'Relaxed', label: 'Relaxed' },
  { value: 'Bootcut', label: 'Bootcut' },
]

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All products' },
  { value: 'stripes', label: 'Stripes' },
  { value: 'fullsleeve', label: 'Fullsleeve' },
  { value: 'drsleeve', label: 'Drsleeve' },
  { value: 'printed-tees', label: 'Printed tees' },
  { value: 'ringer-tees', label: 'Ringer tees' },
  { value: 'henley', label: 'Henley' },
  { value: 'trackpants', label: 'Trackpants' },
  { value: 'sweatpants', label: 'Sweatpants' },
]

export default function StorefrontNavigationPage() {
  const navigation = useAdminStore((s) => s.data.navigation)
  const saveNavigationItem = useAdminStore((s) => s.saveNavigationItem)
  const deleteNavigationItem = useAdminStore((s) => s.deleteNavigationItem)
  const toggleNavigationItem = useAdminStore((s) => s.toggleNavigationItem)

  const [items, setItems] = React.useState<NavigationItem[]>(navigation)
  const [editingItem, setEditingItem] = React.useState<NavigationItem | null | 'new'>(null)
  const [saving, setSaving] = React.useState(false)
  const [previewMode, setPreviewMode] = React.useState<'desktop' | 'mobile'>('desktop')

  // Form state
  const [formLabel, setFormLabel] = React.useState('')
  const [formType, setFormType] = React.useState<NavItemType>('fit')
  const [formTarget, setFormTarget] = React.useState('Straight')
  const [formHref, setFormHref] = React.useState('/')
  const [formBadge, setFormBadge] = React.useState('')
  const [formActive, setFormActive] = React.useState(true)
  const [formNewTab, setFormNewTab] = React.useState(false)

  // Sync from backend / store on initial mount
  React.useEffect(() => {
    let isMounted = true
    void fetchBackendNavigation().then((remoteItems) => {
      if (isMounted && remoteItems.length > 0) {
        setItems(remoteItems)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Sync internal state when store changes
  React.useEffect(() => {
    if (navigation && navigation.length > 0) {
      setItems(navigation)
    }
  }, [navigation])

  const handleOpenAdd = () => {
    setFormLabel('')
    setFormType('fit')
    setFormTarget('Regular')
    setFormHref('/')
    setFormBadge('')
    setFormActive(true)
    setFormNewTab(false)
    setEditingItem('new')
  }

  const handleOpenEdit = (item: NavigationItem) => {
    setFormLabel(item.label)
    setFormType(item.type)
    setFormTarget(item.targetValue || (item.type === 'category' ? 'stripes' : 'Regular'))
    setFormHref(item.href)
    setFormBadge(item.badge || '')
    setFormActive(item.isActive)
    setFormNewTab(item.openInNewTab)
    setEditingItem(item)
  }

  // Auto-generate suggested href when type or target changes
  const handleTypeChange = (newType: NavItemType) => {
    setFormType(newType)
    if (newType === 'fit') {
      const target = formTarget || 'Straight'
      setFormTarget(target)
      setFormHref(target === 'all' ? '/' : `/?fit=${encodeURIComponent(target)}`)
    } else if (newType === 'category') {
      const target = 'stripes'
      setFormTarget(target)
      setFormHref('/?category=stripes')
    } else {
      setFormHref('/')
    }
  }

  const handleTargetChange = (newTarget: string) => {
    setFormTarget(newTarget)
    if (formType === 'fit') {
      setFormHref(newTarget === 'all' ? '/' : `/?fit=${encodeURIComponent(newTarget)}`)
    } else if (formType === 'category') {
      setFormHref(newTarget === 'all' ? '/' : `/?category=${encodeURIComponent(newTarget)}`)
    }
  }

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formLabel.trim()) {
      return toastError('Navigation label is required.')
    }
    if (!formHref.trim()) {
      return toastError('Destination URL or path is required.')
    }

    const id = typeof editingItem === 'object' && editingItem !== null ? editingItem.id : `nav-${Date.now()}`
    const isNew = editingItem === 'new'
    const fullItem: NavigationItem = {
      id,
      label: formLabel.trim(),
      type: formType,
      targetValue: formType === 'custom' ? undefined : formTarget,
      href: formHref.trim(),
      badge: formBadge.trim() || undefined,
      isActive: formActive,
      openInNewTab: formNewTab,
      order: isNew ? items.length : (items.find((x) => x.id === id)?.order ?? 0)
    }

    saveNavigationItem(fullItem)
    const updated = isNew
      ? [...items, fullItem]
      : items.map((x) => (x.id === id ? fullItem : x))
    const indexed = updated.sort((a, b) => a.order - b.order).map((it, idx) => ({ ...it, order: idx }))
    setItems(indexed)
    setEditingItem(null)

    try {
      await saveNavigationList(indexed)
      toastSuccess(`Saved "${fullItem.label}" and updated storefront.`)
    } catch {
      toastSuccess(`Saved "${fullItem.label}" locally. Click "Save to Storefront" to publish.`)
    }
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const reordered = [...items]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    const indexed = reordered.map((it, idx) => ({ ...it, order: idx }))
    setItems(indexed)
    useAdminStore.getState().reorderNavigationItems(indexed)
    void saveNavigationList(indexed).catch(() => {})
  }

  const handleToggle = (id: string) => {
    toggleNavigationItem(id)
    const updated = items.map((x) => (x.id === id ? { ...x, isActive: !x.isActive } : x))
    setItems(updated)
    void saveNavigationList(updated).catch(() => {})
  }

  const handleDelete = (id: string, label: string) => {
    if (!window.confirm(`Are you sure you want to delete navigation link "${label}"?`)) return
    deleteNavigationItem(id)
    const updated = items.filter((x) => x.id !== id).map((it, idx) => ({ ...it, order: idx }))
    setItems(updated)
    void saveNavigationList(updated).catch(() => {})
    toastSuccess(`Deleted "${label}".`)
  }

  const handleSaveToBackend = async () => {
    try {
      setSaving(true)
      await saveNavigationList(items)
      toastSuccess('Navigation changes published to storefront.')
    } catch (err: any) {
      toastError(err?.message || 'Failed to save navigation.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset storefront navigation to the default apparel categories? Custom links will be replaced.')) {
      return
    }

    try {
      setSaving(true)
      const res = await resetBackendNavigation()
      setItems(res)
      toastSuccess('Navigation reset to default silhouettes.')
    } catch (err: any) {
      toastError(err?.message || 'Failed to reset navigation.')
    } finally {
      setSaving(false)
    }
  }

  const activeLinks = items.filter((x) => x.isActive)

  return (
    <div>
      <PageHeader
        title="Storefront Navigation"
        description="Configure storefront category links, fit shortcuts, and promotional banners."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetDefaults} disabled={saving}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Defaults
          </Button>

          <Button variant="default" size="sm" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Menu Item
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleSaveToBackend}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Save className="h-3.5 w-3.5 mr-1" /> {saving ? 'Publishing...' : 'Save to Storefront'}
          </Button>
        </div>
      </PageHeader>

      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Navigation Items Table / List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Compass className="h-4 w-4 text-primary" /> Active Menu Items ({items.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Order items from top to bottom. Top items appear first in the customer header.
                  </p>
                </div>
                <Badge tone="neutral" className="text-xs">
                  {activeLinks.length} Active / {items.length} Total
                </Badge>
              </div>

              <div className="divide-y divide-border mt-3">
                {items.map((item, index) => {
                  const isFirst = index === 0
                  const isLast = index === items.length - 1

                  return (
                    <div
                      key={item.id}
                      className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        !item.isActive ? 'opacity-50 bg-muted/20' : ''
                      }`}
                    >
                      {/* Left: Reorder & Label */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMove(index, 'up')}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                            title="Move up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                            {index + 1}
                          </span>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMove(index, 'down')}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                            title="Move down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{item.label}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-foreground text-background">
                                {item.badge}
                              </span>
                            )}
                            {item.openInNewTab && (
                              <span title="Opens in new tab">
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {item.type === 'fit' && (
                              <span className="inline-flex items-center gap-1 font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                <Filter className="h-3 w-3" /> Fit: {item.targetValue || 'all'}
                              </span>
                            )}
                            {item.type === 'category' && (
                              <span className="inline-flex items-center gap-1 font-mono text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                <Layers className="h-3 w-3" /> Cat: {item.targetValue}
                              </span>
                            )}
                            {item.type === 'custom' && (
                              <span className="inline-flex items-center gap-1 font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                <LinkIcon className="h-3 w-3" /> Custom
                              </span>
                            )}
                            <span className="font-mono truncate max-w-[200px]" title={item.href}>
                              {item.href}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleToggle(item.id)}
                          className={`text-xs px-2.5 py-1 rounded font-medium border transition-colors ${
                            item.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 w-8 p-0"
                          title="Edit link"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.label)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete link"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}

                {items.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No navigation items found. Click &quot;Add Menu Item&quot; or &quot;Reset Defaults&quot; to populate.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Live Storefront Header Preview */}
          <div className="space-y-4">
            <Card className="p-5">
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
                    title="Desktop Preview"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-1 rounded text-xs transition-colors ${
                      previewMode === 'mobile' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                    }`}
                    title="Mobile Drawer Preview"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2 mb-4">
                Real-time simulation of how your active links render on the customer storefront.
              </p>

              {previewMode === 'desktop' ? (
                /* Desktop Header Mockup */
                <div className="rounded-lg border border-border bg-[#0d0d0d] text-white p-4 overflow-x-auto shadow-inner">
                  <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold tracking-tight text-sm text-white font-sans">TEESGARAGE</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 text-white font-mono">ARCHIVE</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-white/40 font-mono text-[11px]">SEARCH</span>
                      <span className="text-white/40 font-mono text-[11px]">ACCOUNT</span>
                      <span className="text-white/40 font-mono text-[11px]">BAG (0)</span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <p className="text-[10px] uppercase font-mono text-white/40 tracking-wider mb-2">Desktop Header Navigation</p>
                    <div className="flex items-center gap-4 flex-wrap">
                      {activeLinks.map((item) => (
                        <div
                          key={item.id}
                          className="group relative cursor-default inline-flex items-center text-xs font-mono uppercase tracking-wider text-white/70 hover:text-white"
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="ml-1.5 text-[8px] font-bold px-1 py-0.2 rounded bg-white text-black">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      ))}
                      {activeLinks.length === 0 && (
                        <span className="text-xs text-white/30 italic">No active links visible</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Mobile Drawer Mockup */
                <div className="rounded-lg border border-border bg-[#0d0d0d] text-white p-4 max-w-xs mx-auto shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                    <span className="font-bold text-xs text-white">MOBILE DRAWER</span>
                    <span className="text-white/40 text-xs">✕</span>
                  </div>

                  <div className="space-y-2">
                    {activeLinks.map((item) => (
                      <div
                        key={item.id}
                        className="py-1.5 px-2 rounded bg-white/5 flex items-center justify-between text-xs font-mono uppercase text-white/80"
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="text-[8px] font-bold px-1 rounded bg-white text-black">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ))}
                    {activeLinks.length === 0 && (
                      <div className="text-xs text-white/30 italic text-center py-2">No active links visible</div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-white/40">
                    Direct Studio Support: concierge@teesgarage.in
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-4 bg-muted/40 border-dashed text-xs text-muted-foreground space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Storefront Sync Note
              </div>
              <p>
                Clicking <strong>Save to Storefront</strong> sends changes to the backend REST API. Next.js storefront
                pages dynamically pick up the new navigation configuration via cache revalidation and fallback snapshots.
              </p>
            </Card>
          </div>
        </div>

        {/* Add / Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <Card className="w-full max-w-lg p-6 space-y-4 shadow-xl bg-background border-border">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-semibold text-foreground">
                  {editingItem === 'new' ? 'Add Navigation Link' : `Edit "${formLabel}"`}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="text-muted-foreground hover:text-foreground text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-4">
                <Field label="Link Label" required hint="Display text in header (e.g. 'Straight', 'Hoodies', 'Sale')">
                  <Input
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="e.g. Wide Leg"
                    autoFocus
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Link Type" required hint="Determines how the link behaves">
                    <Select
                      value={formType}
                      onChange={(e) => handleTypeChange(e.target.value as NavItemType)}
                    >
                      <option value="fit">Fit filter</option>
                      <option value="category">Wardrobe Category</option>
                      <option value="custom">Custom URL / Page</option>
                    </Select>
                  </Field>

                  {formType === 'fit' && (
                    <Field label="Fit target" required hint="Available apparel fits">
                      <Select
                        value={formTarget}
                        onChange={(e) => handleTargetChange(e.target.value)}
                      >
                        {FIT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}

                  {formType === 'category' && (
                    <Field label="Wardrobe Category Target" required hint="Product categories">
                      <Select
                        value={formTarget}
                        onChange={(e) => handleTargetChange(e.target.value)}
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}

                  {formType === 'custom' && (
                    <Field label="Target Path or URL" required hint="Internal path (/sale) or full URL">
                      <Input
                        value={formHref}
                        onChange={(e) => setFormHref(e.target.value)}
                        placeholder="e.g. /lookbook or /sale"
                      />
                    </Field>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Destination Href" required hint="Storefront route">
                    <Input
                      value={formHref}
                      onChange={(e) => setFormHref(e.target.value)}
                      placeholder="/"
                    />
                  </Field>

                  <Field label="Optional Badge Tag" hint="Micro-pill (e.g. 'NEW', 'SALE')">
                    <Input
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      placeholder="e.g. NEW"
                    />
                  </Field>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-4 border-t border-border">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span>Visible on storefront (Active)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formNewTab}
                      onChange={(e) => setFormNewTab(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span>Open in new browser tab</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="default" size="sm">
                    Save Navigation Item
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </PageContent>
    </div>
  )
}
