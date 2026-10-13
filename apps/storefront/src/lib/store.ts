'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Fit, Product } from './constants'
import { PRODUCTS } from './constants'


export interface CartItem {
  id: number
  variantId?: number
  color?: string
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
  addItem: (productId: number, size: string, product?: Product, color?: string) => void
  updateQty: (id: number, size: string, delta: number, variantId?: number) => void
  removeItem: (id: number, size: string, variantId?: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (productId, size, productDetails, color) =>
        set((state) => {
          const product = productDetails ?? PRODUCTS.find((p) => p.id === productId)
          if (!product) return state
          const variant = product.variants?.find((item) => String(item.size) === String(size) && item.status === 'Active' && (!color || item.color.toLowerCase() === color.toLowerCase()))
          if (product.variants && (!variant || variant.stock - variant.reserved <= 0)) return state
          const existing = state.items.find((item) => item.id === productId && item.size === size && item.variantId === variant?.id)
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
                variantId: variant?.id,
                color: variant?.color ?? color ?? product.color,
                name: product.name,
                fit: product.fit,
                wash: product.wash,
                price: variant?.price ? `₹${variant.price.toLocaleString('en-IN')}` : product.price,
                priceNum: variant?.price ?? product.priceNum,
                img: product.img,
                size,
                qty: 1
              }
            ]
          }
        }),
      updateQty: (id, size, delta, variantId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === id && item.size === size && (variantId === undefined || item.variantId === variantId) ? { ...item, qty: item.qty + delta } : item
            )
            .filter((item) => item.qty > 0)
        })),
      removeItem: (id, size, variantId) =>
        set((state) => ({
          items: state.items.filter((item) => !(item.id === id && item.size === size && (variantId === undefined || item.variantId === variantId)))
        })),
      clearCart: () => set({ items: [] })
    }),
    {
      name: 'teesgarage-cart',
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
  categories: string[]
  fit: Fit | 'all'
  prices: PriceRange[]
  sort: SortMode
  searchQuery: string
  setCategory: (category: string | 'all') => void
  setCategories: (categories: string[]) => void
  toggleCategory: (category: string) => void
  setFit: (fit: Fit | 'all') => void
  togglePrice: (range: PriceRange) => void
  setSort: (sort: SortMode) => void
  setSearchQuery: (query: string) => void
  reset: () => void
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      category: 'all',
      categories: [],
      fit: 'all',
      prices: [],
      sort: 'featured',
      searchQuery: '',
      setCategory: (category) =>
        set(() => {
          if (!category || category === 'all') {
            return { category: 'all', categories: [] }
          }
          const list = category.includes(',')
            ? category
                .split(',')
                .map((c) => c.trim().toLowerCase())
                .filter(Boolean)
            : [category.toLowerCase()]
          return { category, categories: list }
        }),
      setCategories: (categories) =>
        set(() => {
          const clean = categories
            .filter((c) => c && c !== 'all')
            .map((c) => c.toLowerCase())
          return {
            categories: clean,
            category: clean.length === 0 ? 'all' : (clean.length === 1 ? clean[0] : clean.join(','))
          }
        }),
      toggleCategory: (cat) =>
        set((state) => {
          const lower = cat.toLowerCase()
          if (lower === 'all') {
            return { category: 'all', categories: [] }
          }
          const exists = state.categories.includes(lower)
          const next = exists
            ? state.categories.filter((c) => c !== lower)
            : [...state.categories, lower]
          return {
            categories: next,
            category: next.length === 0 ? 'all' : (next.length === 1 ? next[0] : next.join(','))
          }
        }),
      setFit: (fit) => set({ fit }),
      togglePrice: (range) =>
        set((state) => ({
          prices: state.prices.includes(range)
            ? state.prices.filter((r) => r !== range)
            : [...state.prices, range]
        })),
      setSort: (sort) => set({ sort }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      reset: () =>
        set({
          category: 'all',
          categories: [],
          fit: 'all',
          prices: [],
          sort: 'featured',
          searchQuery: ''
        })
    }),
    {
      name: 'teesgarage-filters',
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
      name: 'teesgarage-ui',
      skipHydration: true,
      partialize: (state) => ({ selectedSize: state.selectedSize })
    }
  )
)

export interface UserAddress {
  id: string
  fullName: string
  phone: string
  addressLine: string
  city: string
  state: string
  pincode: string
  isDefault?: boolean
}

export interface AuthUser {
  id: number
  uid: string
  email: string
  name: string
  phone?: string
  provider?: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  addresses: UserAddress[]
  setAuth: (user: AuthUser, token: string) => void
  updateProfile: (updated: { name?: string; email?: string; phone?: string }) => void
  addAddress: (addr: Omit<UserAddress, 'id'>) => void
  updateAddress: (id: string, addr: Partial<UserAddress>) => void
  deleteAddress: (id: string) => void
  setDefaultAddress: (id: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      addresses: [],
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      updateProfile: (updated) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updated } : null
        })),
      addAddress: (newAddr) =>
        set((state) => {
          const id = `addr_${Date.now()}`
          const isFirst = state.addresses.length === 0
          const created: UserAddress = {
            ...newAddr,
            id,
            isDefault: isFirst || Boolean(newAddr.isDefault)
          }
          const existing = newAddr.isDefault
            ? state.addresses.map((a) => ({ ...a, isDefault: false }))
            : state.addresses
          return { addresses: [created, ...existing] }
        }),
      updateAddress: (id, partial) =>
        set((state) => ({
          addresses: state.addresses.map((addr) => {
            if (addr.id !== id) {
              return partial.isDefault ? { ...addr, isDefault: false } : addr
            }
            return { ...addr, ...partial }
          })
        })),
      deleteAddress: (id) =>
        set((state) => {
          const filtered = state.addresses.filter((a) => a.id !== id)
          if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
            filtered[0].isDefault = true
          }
          return { addresses: filtered }
        }),
      setDefaultAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === id
          }))
        })),
      logout: () => set({ user: null, token: null, isAuthenticated: false })
    }),
    {
      name: 'teesgarage-auth',
      version: 2,
      skipHydration: true,
      migrate: (persistedState) => {
        const state = (persistedState || {}) as Partial<AuthState>
        const isMockSession = state.token?.startsWith('mock_') || state.user?.uid === 'usr_demo_8829'
        const addresses = Array.isArray(state.addresses)
          ? state.addresses.filter((address) => address.id !== 'addr_default_1' && !address.addressLine.includes('Sea Green Apts'))
          : []
        return {
          ...state,
          user: isMockSession ? null : state.user,
          token: isMockSession ? null : state.token,
          isAuthenticated: isMockSession ? false : Boolean(state.isAuthenticated && state.token),
          addresses
        }
      }
    }
  )
)

interface FavoriteState {
  favorites: number[]
  toggleFavorite: (productId: number) => void
  isFavorite: (productId: number) => boolean
  clearFavorites: () => void
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (productId) =>
        set((state) => ({
          favorites: state.favorites.includes(productId)
            ? state.favorites.filter((id) => id !== productId)
            : [...state.favorites, productId]
        })),
      isFavorite: (productId) => get().favorites.includes(productId),
      clearFavorites: () => set({ favorites: [] })
    }),
    {
      name: 'teesgarage-favorites',
      skipHydration: true
    }
  )
)

export interface FitPreferences {
  waistSize: string
  topSize: string
  preferredFit: Fit
  inseam: string
  comfortFit: 'true-to-size' | 'relaxed' | 'snug'
}

export const DEFAULT_PREFERENCES: FitPreferences = {
  waistSize: '32',
  topSize: 'M',
  preferredFit: 'Baggy',
  inseam: '32',
  comfortFit: 'relaxed'
}

interface PreferencesState {
  preferences: FitPreferences
  updatePreferences: (patch: Partial<FitPreferences>) => void
  resetPreferences: () => void
  getRecommendedSize: (availableSizes: string[], category?: string) => string
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_PREFERENCES,
      updatePreferences: (patch) =>
        set((state) => ({
          preferences: { ...state.preferences, ...patch }
        })),
      resetPreferences: () => set({ preferences: DEFAULT_PREFERENCES }),
      getRecommendedSize: (availableSizes, category) => {
        if (!availableSizes || availableSizes.length === 0) return '32'
        const prefs = get().preferences
        const isNumeric = availableSizes.every((s) => /^\d+$/.test(s))

        // Numeric sizes are used by Trackpants and Sweatpants.
        if (isNumeric) {
          if (availableSizes.includes(prefs.waistSize)) {
            return prefs.waistSize
          }
          const targetNum = parseInt(prefs.waistSize, 10)
          if (!isNaN(targetNum)) {
            const sorted = [...availableSizes].sort((a, b) => {
              return Math.abs(parseInt(a, 10) - targetNum) - Math.abs(parseInt(b, 10) - targetNum)
            })
            return sorted[0] || availableSizes[0]
          }
        } else {
          // Alpha Sizes (e.g. XS, S, M, L, XL, XXL)
          if (availableSizes.includes(prefs.topSize)) {
            return prefs.topSize
          }
        }
        return availableSizes[0]
      }
    }),
    {
      name: 'teesgarage-preferences',
      skipHydration: true
    }
  )
)

export interface OnboardingState {
  hasCompletedOnboarding: boolean
  hasSkippedOnboarding: boolean
  hasPromptedAfterRegister: boolean
  isOpen: boolean
  step: 1 | 2
  openOnboarding: (step?: 1 | 2) => void
  triggerAfterRegister: () => void
  closeOnboarding: () => void
  completeOnboarding: () => void
  skipOnboarding: () => void
  setStep: (step: 1 | 2) => void
  resetOnboarding: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      hasSkippedOnboarding: false,
      hasPromptedAfterRegister: false,
      isOpen: false,
      step: 1,
      openOnboarding: (step = 1) => set({ isOpen: true, step }),
      triggerAfterRegister: () =>
        set((state) => {
          if (state.hasCompletedOnboarding || state.hasSkippedOnboarding || state.hasPromptedAfterRegister) {
            return state
          }
          return { hasPromptedAfterRegister: true, isOpen: true, step: 1 }
        }),
      closeOnboarding: () => set({ isOpen: false }),
      completeOnboarding: () =>
        set({ hasCompletedOnboarding: true, hasPromptedAfterRegister: true, isOpen: false }),
      skipOnboarding: () =>
        set({ hasSkippedOnboarding: true, hasPromptedAfterRegister: true, isOpen: false }),
      setStep: (step) => set({ step }),
      resetOnboarding: () =>
        set({
          hasCompletedOnboarding: false,
          hasSkippedOnboarding: false,
          hasPromptedAfterRegister: false,
          step: 1
        })
    }),
    {
      name: 'teesgarage-onboarding',
      skipHydration: true
    }
  )
)


