# AGENTS.md

TEESGARAGE / INFIT is a premium denim e-commerce platform structured as a Turborepo monorepo with npm workspaces.

## Monorepo Layout

```
jeans-store/
├── apps/
│   ├── storefront/    # Next.js 15 customer storefront (:3000)
│   ├── admin/         # Next.js 15 operational dashboard (:3001)
│   └── api/           # Express REST API, auth & Razorpay (:4000)
├── packages/
│   ├── db/            # PostgreSQL schema, Drizzle ORM client & migrations
│   ├── shared/        # Common TypeScript types, interfaces & constants
│   ├── validators/    # Shared Zod validation schemas
│   └── config/        # Shared TypeScript & ESLint configurations
├── infra/             # Deployment specifications (Cloud Run, Render, Docker)
├── docs/              # System architecture, API & deployment guides
├── .github/workflows/ # CI & GCP Cloud Run CD pipelines
├── package.json       # Monorepo workspaces configuration
└── turbo.json         # Turborepo task pipelines
```

## Workspace Commands

All commands can be run from the repository root using Turborepo or npm workspaces:

### Root Development & Build
```bash
npm run dev               # Start all services concurrently (storefront, admin, api)
npm run build             # Build all apps and packages in topological order
npm run lint              # Run linting across all workspaces
npm run test              # Run unit & integration tests
npm run typecheck         # Typecheck all packages and apps
npm run format            # Run prettier across the codebase
```

### Scoped Commands
```bash
# Storefront (apps/storefront)
npm run dev:storefront    # Local dev server on :3000 with Turbopack
npm run build:storefront  # Production Next.js build

# Admin Dashboard (apps/admin)
npm run dev:admin         # Local dev server on :3001 with Turbopack
npm run build:admin       # Production Next.js build

# API (apps/api)
npm run dev:api           # Local dev server on :4000 using tsx watch
npm run build:api         # Production compile to dist/
npm run db:generate       # Generate Drizzle migration files
npm run db:push           # Push Drizzle schema to Neon DB
npm run db:seed           # Seed database with initial products
```

### Local Multi-Container Development (Docker Compose)
```bash
docker compose up -d      # Spins up postgres:5432, api:4000, storefront:3000, admin:3001
```

## Architecture and Data Flow

- **Storefront**: Customer website statically generated at build time with fallback snapshot resilience. Pages revalidate on catalog changes.
- **Admin**: Operational dashboard for product catalogue, SKUs, inventory movements, order tracking, and coupons. Uses Tailwind CSS v4.
- **API**: Express REST API backed by Neon PostgreSQL via Drizzle ORM. Mutating routes require `X-API-Key`. Includes Razorpay payment service and Cloud IAM auth.
- **Packages**:
  - `@jeans-store/db`: Schema, migrations, Neon connection client.
  - `@jeans-store/shared`: Shared contracts (`Product`, `Fit`, `Order`, `HomepageConfig`, constants).
  - `@jeans-store/validators`: Shared Zod validation schemas (`productSchema`, `createOrderSchema`, etc.).
  - `@jeans-store/config`: Shared base configs.

## Gotchas

- **Windows dev server**: Spawning individual dev servers from Windows shells requires `cmd /c npm run dev` if node subshell spawning fails.
- **Path aliases**: Storefront and Admin resolve `@/*` to `./src/*`, plus direct workspace package paths (`@jeans-store/*`).
- **Styling**: `apps/storefront` uses vanilla CSS custom properties in `src/app/globals.css`. Do not add Tailwind to `apps/storefront`. `apps/admin` uses Tailwind CSS v4.
- **Unsplash Images**: `images.unsplash.com` and `storage.googleapis.com` are allowed in `next.config.ts`.
