'use client'

import * as React from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastItem {
  id: number
  kind: 'success' | 'error' | 'info'
  message: string
}

type Listener = () => void

let toasts: ToastItem[] = []
let seq = 1
const listeners = new Set<Listener>()

function emit(): void {
  listeners.forEach((l) => l())
}

export function toast(kind: ToastItem['kind'], message: string): void {
  const id = seq++
  toasts = [...toasts, { id, kind, message }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 3200)
}

export const toastSuccess = (message: string): void => toast('success', message)
export const toastError = (message: string): void => toast('error', message)

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function snapshot(): ToastItem[] {
  return toasts
}

export function ToastViewport() {
  const items = React.useSyncExternalStore(subscribe, snapshot, snapshot)
  const dismiss = (id: number) => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }
  if (items.length === 0) return null
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto flex items-start gap-2 rounded-lg border bg-surface px-3.5 py-3 text-sm shadow-modal',
            t.kind === 'success' && 'border-success/25',
            t.kind === 'error' && 'border-danger/25',
            t.kind === 'info' && 'border-line'
          )}
        >
          {t.kind === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />}
          {t.kind === 'error' && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />}
          {t.kind === 'info' && <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />}
          <span className="flex-1 text-[13px] text-ink">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-ink-3 hover:text-ink" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}