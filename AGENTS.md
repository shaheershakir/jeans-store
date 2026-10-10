# AGENTS.md

TEESGARAGE is a premium denim e-commerce platform. This repository contains three independent applications: `frontend/`, `backend/`, and `admin/`.

## Application layout

- `frontend/`: Next.js 15 App Router, React 19, TypeScript strict, and Zustand. Statically generated storefront deployed to Vercel.
- `backend/`: Fastify REST API with Zod validation. Manages the product catalog. Deployed to Render free tier via `render.yaml`.
- `admin/`: Next.js 15 App Router, React 19, and Tailwind CSS v4. Operational dashboard for store administration.
- No root package.json or npm workspaces exist. All commands must be executed within their respective application directories.

## Commands

### Frontend (`frontend/`)

```bash
cd frontend
npm run dev      # Local dev server on :3000 with Turbopack
npm run build    # Production build (fetches backend or falls back to snapshot)
npm run start    # Production server
npm run lint     # Next.js ESLint checks
npm run format   # Prettier code formatting
```

### Backend (`backend/`)

```bash
cd backend
npm run dev      # Local dev server on :4000 using tsx watch
npm run build    # TypeScript compiler check and output to dist/
npm run start    # Node production server
npm run smoke    # Verification smoke test script
```

### Admin (`admin/`)

```bash
cd admin
npm run dev      # Local dev server on :3001
npm run build    # Production Next.js build
npm run start    # Production server on :3001
npm run lint     # ESLint checks
```

## Architecture and data flow

- Storefront homepage `/` is the product catalog. There is no standalone marketing landing page.
- Prerendering at build time: `frontend/src/lib/products.ts` queries the backend during `next build`. If the backend is offline or in CI, it falls back to the bundled snapshot in `frontend/src/lib/constants.ts`. Shoppers never encounter backend cold starts at runtime.
- Client state: Three Zustand stores live in `frontend/src/lib/store.ts` (`useCartStore`, `useUIStore`, `useFilterStore`). Keys in localStorage are `infit-cart`, `infit-filters`, and `infit-ui`.
- Checkout: Customer orders on `/checkout` hand off via WhatsApp (`wa.me`) or mailto fallback. No database orders table or payment gateway is required for this phase.
- Shared product model: `Product` interface in `frontend/src/lib/constants.ts` and `backend/src/schemas/product.ts`.
- Styling: The storefront uses vanilla CSS custom properties in `frontend/src/app/globals.css`. Do not add Tailwind to `frontend/`. The `admin/` application uses Tailwind CSS v4.

## Gotchas

- Windows dev server: Spawning the dev server from shells requires `cmd /c npm run dev` to avoid Win32 process execution failures.
- Path aliases: Inside `frontend/`, `@/*` resolves to `./src/*`. Inside `admin/`, `@/*` resolves to `./src/*`.
- Unsplash images: Only `images.unsplash.com` is configured in `next.config.ts` remote patterns.
- Sentry: `@sentry/nextjs` is initialized as a no-op when `NEXT_PUBLIC_SENTRY_DSN` is absent.
