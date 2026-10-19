# Monorepo Architecture

This document describes the workspace architecture of TEESGARAGE / TEESGARAGE, its applications, shared packages, and build orchestration.

## System Overview

The repository is organized as a Turborepo + npm workspaces monorepo:

```
jeans-store/
├── apps/
│   ├── storefront/        Next.js 15 customer storefront (cart, checkout, catalog, account)
│   ├── admin/             Next.js 15 operational dashboard (inventory, orders, products, coupons)
│   └── api/               Express REST API (authentication, business logic, Razorpay)
│
├── packages/
│   ├── db/                PostgreSQL schema, Drizzle ORM client, seed scripts, and migrations
│   ├── shared/            Common TypeScript types, interfaces, and store constants
│   ├── validators/        Shared Zod validation schemas
│   └── config/            Shared TypeScript, ESLint, and tooling configurations
│
├── infra/                 Deployment blueprints (Cloud Run, Render, Docker)
├── docs/                  System documentation, architecture, API and deployment guides
├── .github/workflows/     CI/CD automated pipelines
│
├── package.json           Root workspace configuration & npm scripts
├── package-lock.json      Unified dependency lockfile
├── turbo.json             Turborepo task pipeline orchestration
└── docker-compose.yml     Multi-container local development stack
```

---

## Applications (`apps/`)

### 1. Storefront (`apps/storefront`)
- **Framework**: Next.js 15 (App Router), React 19, Vanilla CSS Custom Properties, Zustand.
- **Port**: `:3000`
- **Features**: Product catalog, collection filtering, size guide modal, cart drawer, checkout manifest, user profile & orders, wishlist.
- **Data Fetching**: Statically generated at build time with fallback snapshot resilience. When the backend API is online, pages are dynamically revalidated on catalog changes.
- **Packages Consumed**: `@jeans-store/shared`, `@jeans-store/validators`.

### 2. Admin Dashboard (`apps/admin`)
- **Framework**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide React, Recharts.
- **Port**: `:3001`
- **Features**: Product management, variant/SKU generator, inventory movements, order fulfillment, coupon creation, homepage layout customization, audit logging.
- **Packages Consumed**: `@jeans-store/shared`, `@jeans-store/validators`.

### 3. REST API (`apps/api`)
- **Framework**: Express, TypeScript, Zod, Neon Serverless PostgreSQL.
- **Port**: `:4000`
- **Features**: Catalog management, order manifests, JWT + Cloud IAM auth, Razorpay payments, dynamic navigation & homepage config.
- **Packages Consumed**: `@jeans-store/db`, `@jeans-store/shared`, `@jeans-store/validators`.

---

## Shared Packages (`packages/`)

### 1. Database (`@jeans-store/db`)
- Manages PostgreSQL tables via Drizzle ORM (Schema V2):
  - `categories`: Normalized categories with hierarchical parent-child relationships and display ordering.
  - `products`: Apparel products, categories, slugs, statuses, descriptive spec attributes JSON, and legacy media columns.
  - `product_images`: Key-based image storage (S3/GCS compatible) with position ordering and external URL fallbacks.
  - `product_variants`: Size × color SKU matrix with inventory tracking and non-negative stock constraints.
  - `users`: Customer accounts with Google OAuth subject ID (`google_sub`) and onboarding completion tracking.
  - `orders`: Customer checkout orders linked to `users.id`, with Razorpay transaction IDs and check constraints.
  - `order_items`: Normalized line items with image snapshot keys.
  - `order_events`: Atomic append-only order events and admin notes timeline.
  - `shipping_settings`: Paid delivery rates by Kerala/rest of India and parcel weight.
  - `navigation_items`: Dynamic store navigation items.
  - `admin_state`: Operational state storage for coupons and audit tracking.
- Exports typed client `db`, connection helpers, and migrations in `drizzle/`.

### 2. Shared Types & Constants (`@jeans-store/shared`)
- Canonical TypeScript definitions: `Product`, `Variant`, `Fit`, `Order`, `OrderItem`, `HomepageConfig`, `NavigationItem`.
- Common store constants: `FITS`, `CATEGORIES`, `DEFAULT_NAV_LINKS`, `DEFAULT_HOMEPAGE_CONFIG`, `FREE_SHIPPING_THRESHOLD`.

### 3. Shared Validators (`@jeans-store/validators`)
- Canonical Zod validation schemas:
  - `productSchema`, `createProductSchema`, `updateProductSchema`, `variantSchema`
  - `createOrderSchema`, `orderItemSchema`
  - `registerSchema`, `loginSchema`, `googleAuthSchema`
  - `homepageConfigSchema`, `navigationItemSchema`

### 4. Shared Configurations (`@jeans-store/config`)
- Base TypeScript compiler options (`tsconfig.base.json`) and shared linting presets.

---

## Build Orchestration (Turborepo)

Turborepo handles caching and dependency execution across workspaces:

```bash
# Run all applications in development mode
npm run dev

# Build all applications and packages
npm run build

# Run linting across all workspaces
npm run lint

# Run automated tests
npm run test
```
