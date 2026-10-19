# AGENTS.md

TEESGARAGE is an apparel e-commerce platform structured as a Turborepo monorepo with npm workspaces. The product categories are Stripes, Fullsleeve, Drsleeve, Printed tees, Ringer tees, Henley, Trackpants, and Sweatpants.

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
- **Admin**: Operational dashboard for product catalogue, SKUs, inventory movements, order tracking, coupons, and paid delivery rates. It uses one server-configured admin account with signed sessions and has no registration flow.
- **API**: Express REST API backed by PostgreSQL via Drizzle ORM. Admin operations use signed Bearer sessions; customer accounts use signed Bearer tokens. Checkout totals and paid delivery fees are calculated by the API from live product prices and per-item weight.
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

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
