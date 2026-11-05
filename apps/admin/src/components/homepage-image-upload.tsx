'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  UploadCloud,
  CheckCircle2,
  Trash2,
  Loader2,
  ExternalLink,
  Edit2,
  Cloud,
  Image as ImageIcon
} from 'lucide-react'
import { uploadHomepageImage } from '@/services/homepage'
import { Button, Input, Badge } from '@/components/ui/primitives'
import { toastSuccess, toastError } from '@/components/ui/toast'

interface HomepageImageUploadProps {
  label?: string
  hint?: string
  value: string
  onChange: (url: string) => void
  aspectRatio?: 'hero' | 'banner' | 'square' | 'video'
}

export function HomepageImageUpload({
  label = 'Banner Picture',
  hint = 'Upload a high-resolution image (JPEG, PNG, WebP). Max 15MB. Stored in Google Cloud Storage.',
  value,
  onChange,
  aspectRatio = 'hero'
}: HomepageImageUploadProps) {
  const [uploading, setUploading] = React.useState(false)
  const [showManualUrl, setShowManualUrl] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const isGcs = value.includes('storage.googleapis.com') || value.includes('clothing-store-bucket')

  const handleFile = async (file: File) => {
    if (!file) return

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toastError('Please select a valid JPEG, PNG, or WebP image.')
      return
    }

    // Validate size (15MB)
    if (file.size > 15 * 1024 * 1024) {
      toastError('Image file is too large. Maximum size is 15MB.')
      return
    }

    try {
      setUploading(true)
      const url = await uploadHomepageImage(file)
      onChange(url)
      toastSuccess('Image uploaded to Google Cloud Storage!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed'
      toastError(msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      void handleFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      void handleFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const aspectClass =
    aspectRatio === 'hero'
      ? 'aspect-[21/9]'
      : aspectRatio === 'banner'
        ? 'aspect-[16/7]'
        : aspectRatio === 'square'
          ? 'aspect-square'
          : 'aspect-video'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer"
        >
          {showManualUrl ? 'Hide URL input' : 'Enter URL manually'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {value ? (
        <div className="relative group rounded-xl border border-border overflow-hidden bg-muted/30">
          <div className={`relative w-full ${aspectClass} overflow-hidden bg-neutral-900`}>
            {/* Image Preview */}
            <Image
              src={value}
              alt="Homepage banner preview"
              fill
              sizes="(max-width: 1024px) 100vw, 700px"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-102"
              unoptimized={value.startsWith('http')}
            />

            {/* Gradient Overlay for Actions */}
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-white/90 text-black hover:bg-white shadow-xs"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Change Picture
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => onChange('')}
                disabled={uploading}
                className="bg-red-600/90 hover:bg-red-600 text-white shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remove
              </Button>
            </div>

            {/* Top Badges */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
              {isGcs ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                  <Cloud className="h-3 w-3" /> Stored in Google Cloud Storage
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-medium text-white/90 shadow-xs">
                  Custom Picture
                </span>
              )}
            </div>

            {/* External link button */}
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="absolute top-2.5 right-2.5 z-10 inline-flex items-center justify-center h-7 w-7 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition-colors backdrop-blur-xs"
              title="Open full image in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="px-3 py-2 bg-background border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate max-w-[340px] font-mono text-[11px]" title={value}>
              {value}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-primary hover:underline ml-2 shrink-0 cursor-pointer text-xs"
            >
              Upload New
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition text-center min-h-[140px] ${
            isDragOver
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50 text-muted-foreground'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-xs font-medium text-foreground">
                Uploading to Google Cloud Storage...
              </span>
              <span className="text-[11px] text-muted-foreground">
                Please wait while the image is securely stored.
              </span>
            </div>
          ) : (
            <>
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <UploadCloud className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                Click to upload or drag and drop
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                PNG, JPG or WebP (max 15MB) — Automatically stored in Google Cloud Storage
              </span>
            </>
          )}
        </div>
      )}

      {showManualUrl && (
        <div className="pt-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://storage.googleapis.com/... or /path/to/image.webp"
            className="text-xs font-mono"
          />
        </div>
      )}

      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}
