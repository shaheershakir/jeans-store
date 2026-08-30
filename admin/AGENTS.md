# AGENTS.md — admin

Admin panel for the INFIT store. **Not built yet.** This directory contains docs only — there is no code, no package.json, no commands to run.

## Status

- No framework chosen. The stack decision is deferred to when this phase starts; do not scaffold unprompted.
- `DESIGN.md` here is stale: it describes "WattVision", a Spanish-language electrical-monitoring dashboard unrelated to INFIT. Do not apply it to admin work; treat it as leftover unless the user says otherwise.

## Contract (when building)

- Admin talks to `backend/`, never to the frontend. Backend is also a placeholder; see `backend/README.md`.
- The shared data shape is `Product` (and the `Fit` union) in `frontend/src/lib/constants.ts`. Until the backend exists, that file is the source of truth — keep the admin's product model identical to it:
  - `id: number`, `name`, `fit: 'Straight' | 'Baggy' | 'Wide' | 'Relaxed' | 'Bootcut'`, `price: string` / `priceNum: number` (both exist — display string plus numeric INR value), `img`/`img2` (both Unsplash URLs required per product), `badge?`, `desc`, `wash`.
- Planned surface: product CRUD, badge and wash edits, price changes. The 8 seed products in `constants.ts` are the first dataset.
- Pricing and shipping logic use INR (₹); business rules live in the frontend (`../AGENTS.md` / `frontend`), not here.

## Repo root

Repo-wide conventions (three-app layout, command locations, why source of truth is `constants.ts`) are in `../AGENTS.md`. All runnable commands today live in `frontend/` — nothing in `admin/` builds yet.
