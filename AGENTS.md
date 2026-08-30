# AGENTS.md

INFIT — premium denim e-commerce. Three-app repo: `frontend/` is the only built app; `backend/` and `admin/` are placeholder contracts (READMEs only).

## Commands

All npm commands run inside `frontend/`. There is no root package.json or workspace.

```bash
cd frontend
npm run dev      # dev server on :3000, Turbopack
npm run build    # production build (typecheck + ESLint run inside it)
npm run start
npm run lint     # next lint, next/core-web-vitals
npm run format   # Prettier
```

No test framework exists. Verification = `npm run build` plus a dev-server smoke check (homepage renders product grid with prices).

## Layout

- `frontend/` — Next.js 15 App Router + React 19 + TypeScript strict + Zustand. Port of the Minimal theme.
- `prototype/` — original vanilla HTML/CSS/JS (`index.html`, `styles.css`, `app.js`). Reference for design and behavior only. Tracked in git; the Next app is not yet committed.
- `backend/`, `admin/` — not built. Their READMEs define the contract: the `Product` interface in `frontend/src/lib/constants.ts` is the shared data shape; admin talks to backend, never to frontend.

## Architecture

- Homepage `/` is the product grid. No landing page, by explicit decision.
- Client/server pattern: `page.tsx` (server) exports metadata and renders a sibling `*Client.tsx` wrapper. Any component using a Zustand hook needs `'use client'` and a wrapper page.
- Three Zustand stores in `src/lib/store.ts`: `useCartStore`, `useUIStore`, `useFilterStore`. All persist to localStorage except the toast. Keys: `infit-cart`, `infit-filters`, `infit-ui`.
- All product data is hardcoded in `src/lib/constants.ts` (8 products). No API routes. `backend/` will replace this file as source of truth when built.
- `Product.fit` is a union (`Straight | Baggy | Wide | Relaxed | Bootcut`) — exhaustiveness checks apply.
- Styling is ported CSS custom properties (`globals.css`: `--ink`, `--paper`, `--denim`, fonts). No Tailwind, no utility classes. `prettier-plugin-tailwindcss` sits in devDependencies but there is no Tailwind config; ignore it.
- Only `images.unsplash.com` is allowed in `next.config.ts` remote patterns.
- Business rules ported from prototype: free shipping at ₹1,499 (₹99 below) with cart progress bar; pincode checker is a mock that always says express delivery 2-4 days; toast auto-dismisses in 3s.

## Gotchas

- Windows: `next build` can fail once with `[Error: spawn UNKNOWN] errno -4094` during static generation, typically after node_modules was moved. Transient. Rerun the build before debugging.
- Windows: spawning the dev server needs `cmd /c npm run dev` — `Start-Process npm` fails (`%1 is not a valid Win32 application`).
- Path alias `@/*` → `./src/*` inside `frontend/`.
- ESLint has `no-html-link-for-pages` and `react/no-unescaped-entities` off; don't re-enable.
- `experimental.optimizePackageImports` covers `lucide-react` only.

CLAUDE.md documents design decisions and ported behaviors in more depth, but was written before the `frontend/` move. Mentally prefix its paths with `frontend/`.
