# AGENTS.md — Admin Dashboard

The operational dashboard for TEESGARAGE is built with Next.js 15 and Tailwind CSS v4.

## Monorepo Context

- **Workspace**: `@jeans-store/admin`
- **Port**: `:3001`
- **Backend API**: Resolves to `API_URL` (default: `http://localhost:4000`)
- **Shared Packages**: `@jeans-store/shared`, `@jeans-store/validators`

## Commands

```bash
npm run dev       # Start local dev server on :3001
npm run build     # Compile production build
npm run typecheck # Validate TypeScript types
npm run lint      # Run ESLint
```

## Layout and Routes

- `src/app/`:
  - `/` (Overview dashboard with live revenue, order volume, and catalog KPIs)
  - `/products` (Catalog listing, creation, and editing)
  - `/orders` (Live orders, status progression, and tracking updates)
  - `/inventory` (SKU-level stock tracking and adjustments)
  - `/customers` (Live customer records and purchase history)
  - `/payments` (Razorpay and COD transaction ledger)
  - `/coupons` (Discount rules and usage)
  - `/shipping` (Paid delivery zones and weight bands)
  - `/settings` (Store settings and configuration)
- `src/store/admin-store.ts`: Zustand store synchronized with the Express backend (`/api/admin/state`).
- `src/services/`: Authenticated API service clients for products, orders, inventory, and settings.
