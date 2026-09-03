# AGENTS.md — admin

This directory houses the administrative dashboard for INFIT. It is a fully built Next.js 15 application with Tailwind CSS v4.

## Commands

All commands run inside `admin/`:

```bash
npm run dev      # Dev server on port 3001
npm run build    # Production build (typecheck + ESLint)
npm run start    # Start production server on port 3001
npm run lint     # Next.js ESLint checks
npm run format   # Format files with Prettier
```

## Architecture and layout

- Next.js 15 App Router with React 19 and Tailwind CSS v4.
- `src/app/`: Admin routes including `/products`, `/orders`, `/inventory`, `/analytics`, `/customers`, `/marketing`, and `/settings`.
- `src/components/`: Dashboard shell, sidebar navigation, primitives, and forms.
- `src/store/`: Zustand stores for authentication sessions, simulated metrics, and administrative state.
- `src/data/`: Mock customer, order, and product seed datasets.

## Status and contract

- Product catalog shape mirrors the shared `Product` interface in `frontend/src/lib/constants.ts` and `backend/src/schemas/product.ts`.
- The admin dashboard currently runs with simulated client-side datasets and hardcoded local backend URL assumptions. Do not rewrite admin features during the testing storefront pass. Environment variable integration is documented in `docs/tasks/03-admin-env-wiring.md`.
