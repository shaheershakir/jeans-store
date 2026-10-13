'use client'

import * as React from 'react'
import Image from 'next/image'
import { Plus, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { saveBanner, deleteBanner } from '@/services/marketing'
import { PageContent, PageHeader } from '@/components/ui/page-header'
import { Button, Card, Field, Input, Select, Badge } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'
import type { Banner } from '@/lib/types'

export default function BannersPage() {
  const banners = useAdminStore((s) => s.data.banners)

  const [editBanner, setEditBanner] = React.useState<Banner | null | 'new'>(null)
  const [title, setTitle] = React.useState('')
  const [subtitle, setSubtitle] = React.useState('')
  const [ctaLabel, setCtaLabel] = React.useState('Shop Collection')
  const [link, setLink] = React.useState('/collection')
  const [image, setImage] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleOpenNew = () => {
    setTitle('')
    setSubtitle('')
    setCtaLabel('Shop Collection')
    setLink('/collection')
    setImage('https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&q=80&w=1200')
    setEditBanner('new')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return toastError('Banner title is required.')

    try {
      setLoading(true)
      const id = editBanner === 'new' ? Date.now() : editBanner?.id ?? Date.now()
      const banner: Banner = {
        id,
        title: title.trim(),
        subtitle: subtitle.trim(),
        ctaLabel: ctaLabel.trim(),
        link: link.trim(),
        image: image.trim(),
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: 'Active',
        order: banners.length + 1,
      }

      await saveBanner(banner)
      toastSuccess(`Banner "${title}" saved.`)
      setEditBanner(null)
    } catch (err: any) {
      toastError(err?.message || 'Failed to save banner.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, bTitle: string) => {
    if (!confirm(`Are you sure you want to delete banner "${bTitle}"?`)) return
    try {
      setLoading(true)
      await deleteBanner(id)
      toastSuccess(`Deleted banner "${bTitle}".`)
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete banner.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Store Banners" description="Manage storefront hero section and promotional banners">
        <Button size="sm" onClick={handleOpenNew}>
          <Plus className="h-4 w-4" /> Add Banner
        </Button>
      </PageHeader>

      <PageContent>
        {/* Modal */}
        {editBanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
            <Card className="w-full max-w-md p-6 space-y-4 shadow-modal bg-surface">
              <div className="flex items-center justify-between border-b border-divider pb-3">
                <h3 className="text-base font-semibold text-ink">
                  {editBanner === 'new' ? 'Create Store Banner' : `Edit Banner "${title}"`}
                </h3>
                <button onClick={() => setEditBanner(null)} className="text-ink-3 hover:text-ink text-xs">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Banner Title" required>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Heavyweight Cotton Tees" />
                </Field>

                <Field label="Subtitle / Tagline">
                  <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Crafted for lifetime durability" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="CTA Button Text">
                    <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
                  </Field>

                  <Field label="Target Link">
                    <Input value={link} onChange={(e) => setLink(e.target.value)} />
                  </Field>
                </div>

                <Field label="Image URL (Unsplash)">
                  <Input value={image} onChange={(e) => setImage(e.target.value)} />
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditBanner(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={loading}>
                    Save Banner
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {banners.map((b) => (
            <Card key={b.id} className="overflow-hidden">
              <div className="h-44 w-full bg-canvas relative overflow-hidden">
                <Image src={b.image} alt={b.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent p-4 flex flex-col justify-end text-white">
                  <h4 className="font-bold text-base">{b.title}</h4>
                  <p className="text-xs text-white/80">{b.subtitle}</p>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-primary">{b.ctaLabel}</span>
                  <span className="block text-[10px] text-ink-3">Links to {b.link}</span>
                </div>
                <Button variant="danger-ghost" size="sm" onClick={() => handleDelete(b.id, b.title)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </PageContent>
    </div>
  )
}
