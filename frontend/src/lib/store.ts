'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Fit } from './constants'
import { PRODUCTS } from './constants'

export interface CartItem {
  id: number
  name: string
  fit?: Fit
  wash?: string
  price: string
  priceNum: number
  img: string
  size: string
  qty: number
}

interface CartState {
  items: CartItem[]
  addItem: (productId: number, size: string) => void
  updateQty: (id: number, size: string, delta: number) => void
  removeItem: (id: number, size: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (productId, size) =>
        set((state) => {
          const product = PRODUCTS.find((p) => p.id === productId)
          if (!product) return state
          const existing = state.items.find((item) => item.id === productId && item.size === size)
          if (existing) {
            return {
              items: state.items.map((item) =>
                item === existing ? { ...item, qty: item.qty + 1 } : item
              )
            }
          }
          return {
            items: [
              ...state.items,
              {
                id: product.id,
                name: product.name,
                fit: product.fit,
                wash: product.wash,
                price: product.price,
                priceNum: product.priceNum,
                img: product.img,
                size,
                qty: 1
              }
            ]
          }
        }),
      updateQty: (id, size, delta) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === id && item.size === size ? { ...item, qty: item.qty + delta } : item
            )
            .filter((item) => item.qty > 0)
        })),
      removeItem: (id, size) =>
        set((state) => ({
          items: state.items.filter((item) => !(item.id === id && item.size === size))
        })),
      clearCart: () => set({ items: [] })
    }),
    {
      name: 'infit-cart',
      skipHydration: true
    }
  )
)

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0)
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceNum * item.qty, 0)
}

export type SortMode = 'featured' | 'price-asc' | 'price-desc'
export type PriceRange = 'under-1500' | '1500-2000' | 'above-2000'

interface FilterState {
  category: string | 'all'
  fit: Fit | 'all'
  prices: PriceRange[]
  sort: SortMode
  setCategory: (category: string | 'all') => void
  setFit: (fit: Fit | 'all') => void
  togglePrice: (range: PriceRange) => void
  setSort: (sort: SortMode) => void
  reset: () => void
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      category: 'all',
      fit: 'all',
      prices: [],
      sort: 'featured',
      setCategory: (category) => set({ category }),
      setFit: (fit) => set({ fit }),
      togglePrice: (range) =>
        set((state) => ({
          prices: state.prices.includes(range)
            ? state.prices.filter((r) => r !== range)
            : [...state.prices, range]
        })),
      setSort: (sort) => set({ sort }),
      reset: () => set({ category: 'all', fit: 'all', prices: [], sort: 'featured' })
    }),
    {
      name: 'infit-filters',
      skipHydration: true
    }
  )
)

export type OverlayKind = 'search' | 'cart' | null

interface UIState {
  overlay: OverlayKind
  selectedSize: string
  activeSwatch: number
  deliveryChecked: boolean
  toast: string | null
  openOverlay: (kind: Exclude<OverlayKind, null>) => void
  closeOverlay: () => void
  setSelectedSize: (size: string) => void
  setActiveSwatch: (index: number) => void
  setDeliveryChecked: (checked: boolean) => void
  showToast: (message: string) => void
  hideToast: () => void
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      overlay: null,
      selectedSize: '32',
      activeSwatch: 0,
      deliveryChecked: false,
      toast: null,
      openOverlay: (kind) => set({ overlay: kind, toast: null }),
      closeOverlay: () => set({ overlay: null }),
      setSelectedSize: (selectedSize) => set({ selectedSize }),
      setActiveSwatch: (activeSwatch) => set({ activeSwatch }),
      setDeliveryChecked: (deliveryChecked) => set({ deliveryChecked }),
      showToast: (message) => {
        if (toastTimer) clearTimeout(toastTimer)
        set({ toast: message })
        toastTimer = setTimeout(() => set({ toast: null }), 3000)
      },
      hideToast: () => {
        if (toastTimer) clearTimeout(toastTimer)
        set({ toast: null })
      }
    }),
    {
      name: 'infit-ui',
      skipHydration: true,
      partialize: (state) => ({ selectedSize: state.selectedSize })
    }
  )
)

export interface AuthUser {
  id: number
  uid: string
  email: string
  name: string
  provider?: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false })
    }),
    {
      name: 'infit-auth',
      skipHydration: true
    }
  )
)
