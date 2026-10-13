# backend

Serves the TEESGARAGE store API. Built with **Express + TypeScript + Zod**.

## Run

```bash
cd backend
npm install
npm run dev      # tsx watch, port 4000
npm run build    # tsc → dist/
npm start        # node dist/index.js
npm run smoke    # live smoke test against a running server
```

Environment variables: `PORT` (default `4000`), `HOST` (default `0.0.0.0`), `CORS_ORIGIN` (default `http://localhost:3000`).

## API

- `GET /health` — liveness probe.
- `GET /api/products` — list. Query params: `fit` (Straight|Baggy|Wide|Relaxed|Bootcut|all), `minPrice`, `maxPrice`, `q` (searches name/fit/wash/desc), `sort` (featured|price-asc|price-desc). Returns `{ count, products }`.
- `GET /api/products/:id` — single product or 404.
- `POST /api/products` — create (admin). Body = product without `id`; id is assigned. 201.
- `PUT /api/products/:id` — partial update (admin). 200 / 404.
- `DELETE /api/products/:id` — remove (admin). 204 / 404.

Validation failures return 400 with `{ error, details }`.

## Data

`src/data/products.ts` holds the 8 seed products and is the **source of truth**, replacing `frontend/src/lib/constants.ts` over time. `src/schemas/product.ts` mirrors the frontend `Product` interface — keep both in sync until a shared package exists. Persistence is currently in-memory (`src/store/productStore.ts`); the store module is the swap point for a database.

## Contract

- Product shape mirrors `frontend/src/lib/constants.ts` (`Product` interface).
- The `admin/` panel talks to this service, never to the frontend directly.

