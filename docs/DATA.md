# Data architecture and catalog schema

This document details the product data contract, catalog seed dataset, and the snapshot fallback synchronization pipeline.

## Product contract

All denim items in the INFIT ecosystem adhere to the `Product` TypeScript definition.

```typescript
export type Fit = 'Straight' | 'Baggy' | 'Wide' | 'Relaxed' | 'Bootcut'

export interface Product {
  id: number
  name: string
  fit: Fit
  price: string
  priceNum: number
  img: string
  img2: string
  badge?: string
  desc: string
  wash: string
}
```

### Field semantics

- `id`: Non-negative unique integer.
- `name`: Human-readable silhouette title.
- `fit`: One of the 5 canonical denim cuts.
- `price`: Formatted Indian Rupee display string (e.g. `₹1,699`).
- `priceNum`: Numeric INR integer for arithmetic calculations and filter comparisons.
- `img`: Primary product photography URL hosted on Unsplash.
- `img2`: Alternate detail or reverse angle image URL.
- `badge`: Optional merchandising tag (`New`, `Bestseller`, `Sale`).
- `desc`: Craft description, fabric weight, and weaving details.
- `wash`: Primary wash name (e.g. `Classic Indigo`, `Washed Black`).

## Seed catalog

The initial catalog comprises 8 denim silhouettes:

1. `id: 0` — Classic Straight Indigo (Straight, ₹1,699, New)
2. `id: 1` — Heavy Wash Baggy (Baggy, ₹1,899, Bestseller)
3. `id: 2` — Vintage Blue Wide Leg (Wide, ₹1,999)
4. `id: 3` — Relaxed Black Denim (Relaxed, ₹1,699)
5. `id: 4` — Dark Indigo Bootcut (Bootcut, ₹2,199, New)
6. `id: 5` — Washed Grey Straight (Straight, ₹1,499, Sale)
7. `id: 6` — Raw Denim Relaxed (Relaxed, ₹1,899, 14.5oz rigid raw selvedge)
8. `id: 7` — Faded Blue Baggy (Baggy, ₹1,799)

## Data sources and synchronization

### Source of truth

The Fastify backend (`backend/src/data/products.ts`) serves as the authoritative source of truth. When running in production on Render, the backend exposes:
- `GET /api/products`: Lists products with optional filtering by fit, price range, and search query.
- `GET /api/products/:id`: Returns a single product by numeric id.
- `POST /api/products`: Adds a product to the catalog.
- `PUT /api/products/:id`: Updates an existing product.
- `DELETE /api/products/:id`: Removes a product.

### Bundled snapshot fallback

`frontend/src/lib/constants.ts` maintains a static mirror of the 8 seed products.

During `next build`, `frontend/src/lib/products.ts` sends a request to `${BACKEND_URL}/api/products` with a 3 second timeout.
- When the backend responds with HTTP 200, the build uses the returned catalog array.
- When the backend is unreachable or returns an error, the build catches the exception, logs a clear warning to stdout, and uses the bundled snapshot.

This guarantee allows local developers and CI runners to test and build the storefront without booting a backend instance.
