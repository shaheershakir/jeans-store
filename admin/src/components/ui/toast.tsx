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
            'pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-card px-4 py-3 text-sm text-card-foreground shadow-lg backdrop-blur-xs transition-all animate-in slide-in-from-bottom-2',
            t.kind === 'success' && 'border-emerald-500/30 text-emerald-900 dark:text-emerald-100',
            t.kind === 'error' && 'border-destructive/30 text-destructive',
            t.kind === 'info' && 'border-border'
          )}
        >
          {t.kind === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
          {t.kind === 'error' && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
          {t.kind === 'info' && <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
          <span className="flex-1 text-xs font-medium text-foreground">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}