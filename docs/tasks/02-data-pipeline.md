# Task brief: Build-time data pipeline and snapshot synchronization

## Objective

Ensure the storefront fetches live catalog products from the Fastify backend during static page generation on Vercel, while remaining resilient to backend downtime through a bundled snapshot fallback.

## Scope

- Data fetcher: `frontend/src/lib/products.ts`.
- Server integration: `frontend/src/app/page.tsx` and `frontend/src/app/product/[id]/page.tsx`.
- Snapshot mirror: `frontend/src/lib/constants.ts` (`PRODUCTS`).
- Fallback timeout: AbortController with a 3000ms duration to prevent deployment hangs during cold starts.

## Acceptance criteria

1. Running `npm run build` in `frontend/` when `BACKEND_URL` is offline logs a notice and successfully builds using the snapshot.
2. When the backend is running locally on port 4000, `npm run build` queries `http://localhost:4000/api/products` and incorporates any new items into the generated static pages.
3. All static paths for `/product/[id]` are created dynamically based on the returned product array.
