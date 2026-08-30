# CLAUDE.md — Project Context for AI Assistants

## Project Overview

**INFIT** — A premium denim e-commerce store. Rebuilt from a vanilla HTML/CSS/JS prototype into a Next.js 15 application with TypeScript.

### Original Prototype
- 4 design themes: Minimal, Street, Industrial, Indian
- Hash-based SPA navigation
- All logic in `app.js` (products, cart, search, filters, themes)
- Single `index.html` with all pages as hidden sections

### Migration Decisions
- **Selected theme**: Minimal (default, most refined, cohesive across components)
- **First page**: Product collection (`/`) — no landing page
- **Routing**: Next.js App Router with proper URLs (`/`, `/collection`, `/product/[id]`, `/fits`, `/story`)
- **State**: Zustand stores with localStorage persistence
- **Styling**: Ported CSS custom properties, no Tailwind

## Architecture

### Data Layer (`src/lib/constants.ts`)
```typescript
interface Product {
  id: number
  name: string
  fit: 'Straight' | 'Baggy' | 'Wide' | 'Relaxed' | 'Bootcut'
  price: string
  priceNum: number
  img: string
  img2: string
  badge?: string
  desc: string
  wash: string
}
```

8 products hardcoded (same as prototype).

### State Layer (`src/lib/store.ts`)
Three Zustand stores:

1. **`useUIStore`** — Modal states, selected size, active swatch, delivery status, toast
2. **`useCartStore`** — Cart items, add/update/remove, computed totals, free-shipping logic
3. **`useFilterStore`** — Fit filter, price ranges, sort mode

All use `persist` middleware (except UI toast).

### Utility Layer (`src/lib/utils.ts`)
- `filterAndSortProducts()` — Combines fit + price + sort
- `searchProducts()` — Multi-field text search
- `formatPrice()` — Indian rupee formatting
- `getProductById()` — Lookup helper

### Components
- **Server Components by default** — Pages that don't need client state
- **Client Components** — Anything using Zustand hooks (`'use client'`)
- **Wrapper pattern** — `page.tsx` (server) exports metadata, renders `Client.tsx` (client)

### Routing
| Route | Type | Description |
|-------|------|-------------|
| `/` | Server + Client | Homepage = product grid with filters |
| `/collection` | Server + Client | Full collection page |
| `/product/[id]` | Server | PDP with generateMetadata |
| `/fits` | Server | Fit guide |
| `/story` | Server | Brand story |

## Design System (CSS Variables)

```css
:root {
  --ink: #151515;
  --paper: #f5f3ef;
  --denim: #253d5a;
  --line: rgba(21, 21, 21, 0.25);
  --serif: 'Playfair Display', serif;
  --sans: 'DM Sans', sans-serif;
  --mono: 'DM Mono', monospace;
  --display: 'Archivo Black', sans-serif;
}
```

All spacing, typography, colors reference these. No utility classes.

## Key Behaviors Ported from Prototype

1. **Cart**: Free shipping at ₹1,499, ₹99 shipping below, progress bar
2. **Pincode Checker**: Mock — shows "Express Delivery available in 2-4 days (COD verified)"
3. **Search**: Live filter by name/fit/wash/desc/price, quick tags, add-to-cart from results
4. **Filters**: Fit chips + sidebar checkboxes + price checkboxes + sort dropdown
5. **Size Picker**: 28/30/32/34/36, persisted per session
6. **Swatches**: Classic Indigo / Washed Black / Vintage Blue
7. **Toast**: 3s auto-dismiss, HTML-safe messages
8. **Reviews**: 3 static cards with verified badges

## Commands

```bash
npm run dev      # Development (Turbopack)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint (next/core-web-vitals)
npm run format   # Prettier
```

## Gotchas for Future Work

- **Client/Server boundary**: If a new component uses a Zustand hook, it needs `'use client'` and likely a wrapper page
- **Image domains**: Only `images.unsplash.com` configured in `next.config.ts`
- **Persisted keys**: `infit-cart`, `infit-filters`, `infit-ui` in localStorage
- **Font loading**: Google Fonts preconnected in `layout.tsx` head
- **No API routes**: All data is static/client-side. Add `/api` if backend needed.
- **TypeScript strict**: `fit` is a union type — exhaustiveness checks apply