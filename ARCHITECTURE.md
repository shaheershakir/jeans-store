# Architecture

This document describes the three-app architecture of INFIT, the shared product contract, and the static generation data pipeline.

## System overview

The repository is structured as three independent applications with no shared root package.json or monorepo workspace tool.

```
.
├── frontend/             Next.js 15 App Router storefront (Cloud Run / Vercel)
├── backend/              Fastify REST API & Neon PostgreSQL persistence (Cloud Run / Render)
├── admin/                Next.js 15 operational dashboard (Cloud Run)
├── docker-compose.yml    Local multi-container development environment
├── docs/                 System documentation and deployment runbooks
│   └── GCP_DEPLOYMENT.md Google Cloud Platform production deployment guide
└── render.yaml           Render deployment blueprint (legacy test tier)
```

### 1. Storefront (`frontend/`)

- Built with Next.js 15, React 19, TypeScript, and Zustand.
- Containerized via multi-stage Dockerfile and deployed to **Google Cloud Run** (or Vercel).
- Statically generated at build time with On-Demand Incremental Static Regeneration (ISR) via `/api/revalidate`.
- The storefront never makes slow blocking backend calls during shopper page loads.
- Client state (shopping bag, fit preferences, and UI overlays) is managed via Zustand stores persisted in `localStorage`.
- Checkout manifests are recorded in the backend database before handoff to WhatsApp/email.

### 2. Backend API (`backend/`)

- Built with Fastify, Zod, and TypeScript.
- Containerized via multi-stage Dockerfile and deployed to **Google Cloud Run**.
- Persisted to **Neon PostgreSQL** via **Drizzle ORM** (`products` and `orders` tables).
- Protected with `X-API-Key` authentication for mutations, `@fastify/helmet`, and `@fastify/rate-limit`.
- Auto-seeds the initial 8 denim silhouettes if the database is newly provisioned.

### 3. Admin dashboard (`admin/`)

- Built with Next.js 15, React 19, Tailwind CSS v4, and Lucide React.
- Containerized via multi-stage Dockerfile and deployed to **Google Cloud Run**.
- Connected to the live Fastify backend via `admin/src/services/api.ts` with authenticated endpoints.

## Product contract

The canonical data shape shared across all three applications is the `Product` interface:

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

Both `frontend/src/lib/constants.ts` and `backend/src/schemas/product.ts` adhere to this exact structure.

## Build-time data pipeline

The storefront employs static site generation with a fallback snapshot pattern.

```
Build Trigger (Vercel)
       │
       ▼
frontend/src/lib/products.ts
       │
       ├─► Fetch http://${BACKEND_URL}/api/products (timeout: 3s)
       │         │
       │         ├─► Success: Generate pages using backend catalog
       │         │
       │         └─► Failure / Offline / CI: Log notice and use bundled snapshot
       ▼
Static HTML output for /, /checkout, and /product/[id]
```

### Fallback snapshot behavior

When building locally without a running backend, or inside CI environments where external network access to Render is absent, `getProducts()` catches the network failure and immediately falls back to `SNAPSHOT_PRODUCTS` defined in `frontend/src/lib/constants.ts`.

This ensures builds are deterministic, fast, and completely resilient to backend downtime.

## Catalog publication flow

When catalog edits are made in the backend database, updates publish to shoppers via redeployment:

1. An admin updates a product title, price, or wash in the backend.
2. The backend triggers a Vercel Deploy Hook via an authenticated POST request.
3. Vercel executes `next build`, fetching the latest product catalog from the backend.
4. Static pages are updated on Vercel edge nodes globally.

## Checkout and order handoff

The storefront operates without a traditional checkout database or payment gateway.

1. Shoppers add items to the cart in `frontend`.
2. On `/checkout`, shoppers enter their name, phone, and delivery address.
3. Submitting the form formats a structured text manifest.
4. If `NEXT_PUBLIC_WHATSAPP_NUMBER` is configured, the customer is handed off to WhatsApp Web or mobile app via `wa.me`.
5. If the variable is unset, the form hands off to `mailto:orders@infit.in`.
6. The shopping cart is cleared upon handoff, and an on-screen confirmation card displays the order details.
