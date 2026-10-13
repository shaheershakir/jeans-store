# Changes — TEESGARAGE Denim Store Migration

## Summary

Migrated from vanilla HTML/CSS/JS prototype to **Next.js 15 (App Router) + TypeScript + Zustand**.

**Design selected**: Minimal theme (default, most cohesive).

**First page**: Product collection (`/`) — no landing/hero page.

---

## File-by-File Changes

### New Files Created

#### Configuration
| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `tsconfig.json` | TypeScript strict config, path aliases `@/*` → `./src/*` |
| `next.config.ts` | Next.js config, image domains, optimizePackageImports |
| `.eslintrc.json` | ESLint (next/core-web-vitals) |
| `.gitignore` | Standard Node/Next ignores |
| `next-env.d.ts` | Next.js TypeScript declarations |

#### Core App
| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout, providers, global components |
| `src/app/globals.css` | Design system CSS variables, globals, animations |
| `src/app/page.tsx` | Homepage (server) — metadata + renders HomeClient |
| `src/app/HomeClient.tsx` | Homepage client component — product grid, filters, reviews |
| `src/app/collection/page.tsx` | Collection page (server) — metadata + renders CollectionClient |
| `src/app/collection/CollectionClient.tsx` | Collection client — full grid with filters |
| `src/app/product/[id]/page.tsx` | PDP with `generateMetadata`, renders ProductDetail + Reviews |
| `src/app/fits/page.tsx` | Fit guide page (server) |
| `src/app/story/page.tsx` | Brand story page (server) |

#### State & Data (`src/lib/`)
| File | Purpose |
|------|---------|
| `src/lib/constants.ts` | Product data (8 items), types, fit/price configs |
| `src/lib/store.ts` | 3 Zustand stores (UI, Cart, Filters) with persist |
| `src/lib/utils.ts` | Filter, sort, search, format helpers |

#### Components (`src/components/`)

**Layout**
| File | Purpose |
|------|---------|
| `src/components/layout/Header.tsx` | Nav, wordmark, search/cart/account buttons |
| `src/components/layout/Footer.tsx` | Quick links, policies, social icons |
| `src/components/layout/AnnouncementBar.tsx` | Shipping/exchanges/COD bar |

**Product**
| File | Purpose |
|------|---------|
| `src/components/product/ProductCard.tsx` | Card with image, badge, quick-add, meta, price |
| `src/components/product/ProductGrid.tsx` | Responsive grid (2/3/4 cols), empty state |
| `src/components/product/ProductFilters.tsx` | Fit chips, filter panel, price checkboxes, sort select |
| `src/components/product/ProductDetail.tsx` | PDP: gallery, info, size picker, swatches, pincode, details |

**Cart**
| File | Purpose |
|------|---------|
| `src/components/cart/CartDrawer.tsx` | Slide-over drawer, items, stepper, free-shipping progress, checkout |

**Search**
| File | Purpose |
|------|---------|
| `src/components/search/SearchOverlay.tsx` | Modal overlay, live search, quick tags, add-to-cart, navigate to PDP |

**Reviews**
| File | Purpose |
|------|---------|
| `src/components/reviews/Reviews.tsx` | 3 verified review cards with rating summary |

**UI Primitives**
| File | Purpose |
|------|---------|
| `src/components/ui/Button.tsx` | Primary/outline/text variants, sizes, fullWidth |
| `src/components/ui/Icon.tsx` | Lucide-react wrapper, typed icon map |
| `src/components/ui/Toast.tsx` | Auto-dismiss toast, HTML messages |

---

## Key Behavioral Changes

| Area | Prototype | Next.js Version |
|------|-----------|-----------------|
| Routing | Hash-based (`#home`, `#collection`, `#product`) | Real URLs (`/`, `/collection`, `/product/:id`) |
| State | Global variables in `app.js` | Zustand stores with `persist` |
| Theme switching | 4 themes via `data-theme` | Minimal only (CSS variables) |
| Navigation | `navigateTo()` hides/shows sections | Next.js router, client-side transitions |
| Cart | In-memory array | Zustand + localStorage persistence |
| Filters | In-memory + DOM queries | Zustand + localStorage persistence |
| Search | DOM manipulation | React state + `searchProducts()` util |
| Images | `<img>` with lazy loading | `next/image` with blur placeholders |
| Metadata | None | `generateMetadata` per page, Open Graph |

---

## Preserved from Prototype

- **All 8 products** (images, prices, descriptions, badges, washes)
- **Design system** (CSS variables, font stacks, spacing scale)
- **Cart logic** (free shipping ₹1,499, ₹99 shipping, progress bar)
- **Pincode checker** (mock success message)
- **Size picker** (28–36, persisted)
- **Color swatches** (Indigo, Black, Blue)
- **Fit filters** (All, Straight, Baggy, Wide, Relaxed, Bootcut)
- **Price filters** (Under ₹1,500 / ₹1,500–₹1,999 / ₹2,000+)
- **Sort modes** (Featured, Price ↑, Price ↓)
- **Reviews** (3 verified cards, 4.9 rating)
- **Toast notifications** (3s, HTML-safe)
- **Footer links** (Quick links, Policies, Social)
- **Announcement bar** (Shipping, Exchanges, COD)

---

## Removed / Simplified

| Feature | Reason |
|---------|--------|
| Theme switcher (4 themes) | Single Minimal theme selected |
| Prototype bar (device toggle, design tabs) | Dev-only UI |
| Hero landing section | Requirement: first page = product page |
| Marquee | Decorative, not core commerce |
| Fit section on home | Moved to `/fits` page |
| Editorial section on home | Moved to `/story` page |
| Hash-based scroll navigation | Real routing |
| `app.js` monolithic logic | Split into stores, utils, components |

---

## TypeScript Strictness

- `Product.fit` is a discriminated union: `'Straight' | 'Baggy' | 'Wide' | 'Relaxed' | 'Bootcut'`
- `FilterState.sortMode` is `'featured' | 'price-asc' | 'price-desc'`
- All Zustand store shapes explicitly typed
- Component props interfaces defined
- `noEmit: true`, `strict: true`, `isolatedModules: true`

---

## Performance Notes

- **Static generation**: All pages prerendered (8/8 static)
- **First Load JS**: ~118 kB homepage, ~111 kB content pages
- **Images**: Unsplash remote patterns, blur placeholders, priority on above-fold
- **Code splitting**: Automatic per route, client components only where needed
- **Font optimization**: `next/font` not used — Google Fonts preconnected in layout

---

## Future Enhancements (Not in Scope)

- [ ] Add remaining 3 themes as CSS variable overrides
- [ ] Real backend/API for products, cart, checkout
- [ ] User authentication
- [ ] Order history
- [ ] Wishlist
- [ ] Size guide modal with measurements table
- [ ] Product recommendations / "Complete the look"
- [ ] Analytics / event tracking
- [ ] Unit/integration tests
- [ ] Storybook for components