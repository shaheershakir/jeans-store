'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from './constants'
import { PRODUCTS } from './constants'
import { identifyUser, resetUser } from './analytics'


export interface CartItem {
  id: string
  variantId?: number
  color?: string
  name: string
  price: string
  priceNum: number
  img: string
  size: string
  qty: number
  weight?: number
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

/**
 * Carts persisted before product ids became UUIDs still contain numeric ids.
 * Re-point them at the bundled snapshot product with the same name; drop items
 * that cannot be matched so checkout never sends a numeric product id.
 */
function migrateLegacyCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return []
  return items.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return []
    const item = raw as CartItem & { id: string | number }
    const id = String(item.id ?? '')
    if (isUuid(id)) return [{ ...item, id }]
    const match = PRODUCTS.find((product) => product.name === item.name)
    return match ? [{ ...item, id: match.id }] : []
  })
}

interface CartState {
  items: CartItem[]
  addItem: (productId: string, size: string, product?: Product, color?: string) => void
  updateQty: (id: string, size: string, delta: number, variantId?: number) => void
  removeItem: (id: string, size: string, variantId?: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (productId, size, productDetails, color) =>
        set((state) => {
          const product = productDetails ?? PRODUCTS.find((p) => String(p.id) === String(productId))
          if (!product) return state
          const variant = product.variants?.find((item) => String(item.size) === String(size) && item.status === 'Active' && (!color || item.color.toLowerCase() === color.toLowerCase()))
          if (product.variants && (!variant || variant.stock - variant.reserved <= 0)) return state
          const existing = state.items.find((item) => String(item.id) === String(productId) && item.size === size && item.variantId === variant?.id)
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


                price: variant?.price ? `₹${variant.price.toLocaleString('en-IN')}` : product.price,
                priceNum: variant?.price ?? product.priceNum,
                img: product.img,
                size,
                qty: 1,
                weight:
                  variant?.weight ??
                  (product as any).weightGrams ??
                  (product as any).weight ??
                  ((product.category === "trackpants" ||
                    product.category === "sweatpants" ||
                    product.category === "jeans" ||
                    product.name.toLowerCase().includes("pant") ||
                    product.name.toLowerCase().includes("jean"))
                    ? 650
                    : 350)
              }
            ]
          }
        }),
      updateQty: (id, size, delta, variantId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              String(item.id) === String(id) && item.size === size && (variantId === undefined || item.variantId === variantId) ? { ...item, qty: item.qty + delta } : item
            )
            .filter((item) => item.qty > 0)
        })),
      removeItem: (id, size, variantId) =>
        set((state) => ({
          items: state.items.filter((item) => !(String(item.id) === String(id) && item.size === size && (variantId === undefined || item.variantId === variantId)))
        })),
      clearCart: () => set({ items: [] })
    }),
    {
      name: 'teesgarage-cart',
      version: 2,
      skipHydration: true,
      migrate: (persistedState) => {
        const state = (persistedState || {}) as { items?: unknown }
        return { ...state, items: migrateLegacyCartItems(state.items) } as unknown as CartState
      }
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

  prices: PriceRange[]
  sort: SortMode
  searchQuery: string
  setCategory: (category: string | 'all') => void
  setCategories: (categories: string[]) => void
  toggleCategory: (category: string) => void

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

export interface SizePromptData {
  product: Product
  selectedColor?: string
  availableSizes?: string[]
}

interface UIState {
  overlay: OverlayKind
  selectedSize: string
  activeSwatch: number
  deliveryChecked: boolean
  toast: string | null
  sizePrompt: SizePromptData | null
  openOverlay: (kind: Exclude<OverlayKind, null>) => void
  closeOverlay: () => void
  setSelectedSize: (size: string) => void
  setActiveSwatch: (index: number) => void
  setDeliveryChecked: (checked: boolean) => void
  showToast: (message: string) => void
  hideToast: () => void
  openSizePrompt: (data: SizePromptData) => void
  closeSizePrompt: () => void
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
      sizePrompt: null,
      openOverlay: (kind) => set({ overlay: kind, toast: null, sizePrompt: null }),
      closeOverlay: () => set({ overlay: null }),
      setSelectedSize: (selectedSize) => set({ selectedSize }),
      setActiveSwatch: (activeSwatch) => set({ activeSwatch }),
      setDeliveryChecked: (deliveryChecked) => set({ deliveryChecked }),
      showToast: (message) => {
        if (toastTimer) clearTimeout(toastTimer)
        set({ toast: message, sizePrompt: null })
        toastTimer = setTimeout(() => set({ toast: null }), 3000)
      },
      hideToast: () => {
        if (toastTimer) clearTimeout(toastTimer)
        set({ toast: null })
      },
      openSizePrompt: (data) => {
        if (toastTimer) clearTimeout(toastTimer)
        set({ sizePrompt: data, toast: null })
      },
      closeSizePrompt: () => set({ sizePrompt: null })
    }),
    {
      name: 'teesgarage-ui',
      skipHydration: true,
      partialize: (state) => ({ selectedSize: state.selectedSize })
    }
  )
)

/**
 * Shared live catalog. The overlay and the /search page both read from here so
 * the catalog is fetched once per session instead of once per component.
 */
interface CatalogState {
  products: Product[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  lastFetchedAt: number
  hydrateCatalog: (products: Product[]) => void
  loadCatalog: (options?: { force?: boolean }) => Promise<void>
}

const CATALOG_TTL_MS = 5 * 60 * 1000
let catalogInFlight: Promise<void> | null = null

export const useCatalogStore = create<CatalogState>()((set, get) => ({
  products: PRODUCTS,
  status: 'idle',
  lastFetchedAt: 0,
  hydrateCatalog: (products) => {
    if (!Array.isArray(products) || products.length === 0) return
    // A live client fetch already won; don't replace it with a server snapshot.
    if (get().status === 'ready') return
    set({ products, status: 'ready', lastFetchedAt: Date.now() })
  },
  loadCatalog: async (options) => {
    const force = options?.force ?? false
    const { status, lastFetchedAt } = get()

    if (catalogInFlight) return catalogInFlight
    if (status === 'loading') return
    if (!force && lastFetchedAt > 0 && Date.now() - lastFetchedAt < CATALOG_TTL_MS) return

    set({ status: 'loading' })
    catalogInFlight = (async () => {
      try {
        const response = await fetch('/api/products', { cache: 'no-store' })
        if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`)
        const data = (await response.json()) as { products?: Product[] }
        if (Array.isArray(data.products) && data.products.length > 0) {
          set({ products: data.products, status: 'ready', lastFetchedAt: Date.now() })
        } else {
          set({ status: 'ready', lastFetchedAt: Date.now() })
        }
      } catch {
        set({ status: 'error' })
      } finally {
        catalogInFlight = null
      }
    })()

    return catalogInFlight
  }
}))

export interface UserAddress {
  id: string
  fullName: string
  phone: string
  addressLine: string
  place?: string
  district?: string
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
  createdAt?: string
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
      setAuth: (user, token) => {
        identifyUser(user.id || user.uid, {
          email: user.email,
          name: user.name,
          phone: user.phone,
        })
        set({ user, token, isAuthenticated: true })
      },
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
      logout: () => {
        resetUser()
        set({ user: null, token: null, isAuthenticated: false })
      }
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
  favorites: string[]
  toggleFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean
  clearFavorites: () => void
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (productId) =>
        set((state) => ({
          favorites: state.favorites.some((id) => String(id) === String(productId))
            ? state.favorites.filter((id) => String(id) !== String(productId))
            : [...state.favorites, productId]
        })),
      isFavorite: (productId) => get().favorites.some((id) => String(id) === String(productId)),
      clearFavorites: () => set({ favorites: [] })
    }),
    {
      name: 'teesgarage-favorites',
      version: 2,
      skipHydration: true,
      migrate: (persistedState) => {
        const state = (persistedState || {}) as { favorites?: unknown }
        const favorites = Array.isArray(state.favorites)
          ? state.favorites.map((id) => String(id)).filter((id) => isUuid(id))
          : []
        return { ...state, favorites } as unknown as FavoriteState
      }
    }
  )
)

export interface FitPreferences {
  waistSize: string
  topSize: string
  preferredFit: string
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

export type OnboardingUserStatus = 'pending' | 'completed' | 'skipped'

export interface OnboardingState {
  userStatus: Record<string, OnboardingUserStatus>
  hasCompletedOnboarding: boolean
  hasSkippedOnboarding: boolean
  hasPromptedAfterRegister: boolean
  isOpen: boolean
  step: 1 | 2
  isUserOnboarded: (uid?: string | null) => boolean
  openOnboarding: (step?: 1 | 2, uid?: string | null) => void
  triggerAfterRegister: (uid?: string | null) => void
  closeOnboarding: (uid?: string | null) => void
  completeOnboarding: (uid?: string | null) => void
  skipOnboarding: (uid?: string | null) => void
  setStep: (step: 1 | 2) => void
  resetOnboarding: (uid?: string | null) => void
}

function resolveUid(uid?: string | null): string {
  if (uid) return String(uid)
  const currentUser = useAuthStore.getState().user
  if (!currentUser) return ''
  return currentUser.uid || (currentUser.id ? String(currentUser.id) : '') || currentUser.email || ''
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      userStatus: {},
      hasCompletedOnboarding: false,
      hasSkippedOnboarding: false,
      hasPromptedAfterRegister: false,
      isOpen: false,
      step: 1,

      isUserOnboarded: (uid) => {
        const key = resolveUid(uid)
        if (!key) return false
        const status = get().userStatus?.[key]
        return status === 'completed' || status === 'skipped'
      },

      openOnboarding: (step = 1, uid) => {
        const key = resolveUid(uid)
        if (key && (get().userStatus?.[key] === 'completed' || get().userStatus?.[key] === 'skipped')) {
          return
        }
        set({ isOpen: true, step })
      },

      triggerAfterRegister: (uid) => {
        const key = resolveUid(uid)
        set((state) => ({
          userStatus: key ? { ...state.userStatus, [key]: 'pending' } : state.userStatus,
          hasCompletedOnboarding: false,
          hasSkippedOnboarding: false,
          hasPromptedAfterRegister: true,
          isOpen: true,
          step: 1
        }))
      },

      closeOnboarding: (uid) => {
        const key = resolveUid(uid)
        set((state) => ({
          isOpen: false,
          hasPromptedAfterRegister: true,
          userStatus: key && state.userStatus?.[key] === 'pending'
            ? { ...state.userStatus, [key]: 'skipped' }
            : state.userStatus
        }))
      },

      completeOnboarding: (uid) => {
        const key = resolveUid(uid)
        set((state) => ({
          userStatus: key ? { ...state.userStatus, [key]: 'completed' } : state.userStatus,
          hasCompletedOnboarding: true,
          hasPromptedAfterRegister: true,
          isOpen: false
        }))
      },

      skipOnboarding: (uid) => {
        const key = resolveUid(uid)
        set((state) => ({
          userStatus: key ? { ...state.userStatus, [key]: 'skipped' } : state.userStatus,
          hasSkippedOnboarding: true,
          hasPromptedAfterRegister: true,
          isOpen: false
        }))
      },

      setStep: (step) => set({ step }),

      resetOnboarding: (uid) => {
        const key = resolveUid(uid)
        if (key) {
          set((state) => {
            const nextStatus = { ...state.userStatus }
            delete nextStatus[key]
            return {
              userStatus: nextStatus,
              hasCompletedOnboarding: false,
              hasSkippedOnboarding: false,
              hasPromptedAfterRegister: false,
              isOpen: false,
              step: 1
            }
          })
        } else {
          set({
            userStatus: {},
            hasCompletedOnboarding: false,
            hasSkippedOnboarding: false,
            hasPromptedAfterRegister: false,
            isOpen: false,
            step: 1
          })
        }
      }
    }),
    {
      name: 'teesgarage-onboarding',
      skipHydration: true
    }
  )
)

interface SearchHistoryState {
  recentSearches: string[]
  recentlyViewedIds: string[]
  addRecentSearch: (query: string) => void
  removeRecentSearch: (query: string) => void
  clearRecentSearches: () => void
  addRecentlyViewed: (productId: string | number) => void
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      recentSearches: [],
      recentlyViewedIds: [],

      addRecentSearch: (query: string) =>
        set((state) => {
          const trimmed = query.trim()
          if (trimmed.length < 2) return state
          const lower = trimmed.toLowerCase()
          const filtered = state.recentSearches.filter(
            (item) => item.toLowerCase() !== lower
          )
          return {
            recentSearches: [trimmed, ...filtered].slice(0, 6)
          }
        }),

      removeRecentSearch: (query: string) =>
        set((state) => {
          const lower = query.toLowerCase()
          return {
            recentSearches: state.recentSearches.filter(
              (item) => item.toLowerCase() !== lower
            )
          }
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),

      addRecentlyViewed: (productId: string | number) =>
        set((state) => {
          const id = String(productId).trim()
          if (!id) return state
          const filtered = state.recentlyViewedIds.filter((item) => item !== id)
          return {
            recentlyViewedIds: [id, ...filtered].slice(0, 8)
          }
        })
    }),
    {
      name: 'teesgarage-search-history',
      skipHydration: true
    }
  )
)



