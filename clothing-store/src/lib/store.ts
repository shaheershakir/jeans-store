'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, ClothingProduct } from './types'

interface CartState {
  items: CartItem[]
  addItem: (product: ClothingProduct, size: string, color: string) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, size, color) => {
        const id = `${product.id}-${size}-${color}`
        const existing = get().items.find((item) => item.id === id)
        if (existing) {
          set({
            items: get().items.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity + 1 } : item
            )
          })
        } else {
          const newItem: CartItem = {
            id,
            productId: product.id,
            name: product.name,
            price: product.price,
            priceNum: product.priceNum,
            size,
            color,
            img: product.img,
            quantity: 1,
            fit: product.fit
          }
          set({ items: [newItem, ...get().items] })
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) })
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          )
        })
      },
      clearCart: () => set({ items: [] })
    }),
    {
      name: 'fitcheck-cart',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true
    }
  )
)

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceNum * item.quantity, 0)
}

interface UIState {
  isCartOpen: boolean
  isSizeGuideOpen: boolean
  isMobileNavOpen: boolean
  toast: { message: string; type?: 'info' | 'success' } | null
  openCart: () => void
  closeCart: () => void
  openSizeGuide: () => void
  closeSizeGuide: () => void
  toggleMobileNav: () => void
  closeMobileNav: () => void
  showToast: (message: string, type?: 'info' | 'success') => void
  hideToast: () => void
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useUIStore = create<UIState>()((set) => ({
  isCartOpen: false,
  isSizeGuideOpen: false,
  isMobileNavOpen: false,
  toast: null,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  openSizeGuide: () => set({ isSizeGuideOpen: true }),
  closeSizeGuide: () => set({ isSizeGuideOpen: false }),
  toggleMobileNav: () => set((s) => ({ isMobileNavOpen: !s.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  showToast: (message, type = 'success') => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: { message, type } })
    toastTimer = setTimeout(() => {
      set({ toast: null })
    }, 3200)
  },
  hideToast: () => {
    if (toastTimer) clearTimeout(toastTimer)
    set({ toast: null })
  }
}))

interface RecentlyViewedState {
  viewedIds: number[]
  addViewed: (id: number) => void
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      viewedIds: [],
      addViewed: (id) => {
        const filtered = get().viewedIds.filter((item) => item !== id)
        set({ viewedIds: [id, ...filtered].slice(0, 8) })
      }
    }),
    {
      name: 'fitcheck-recent-views',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true
    }
  )
)
