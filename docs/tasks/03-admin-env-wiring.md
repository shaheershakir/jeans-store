# Task brief: Admin environment wiring and backend integration

## Objective

Connect the existing Next.js 15 admin application to the deployed Fastify backend via environment variables, replacing mock client datasets with authenticated API requests.

## Current status and technical debt

The admin dashboard currently runs completely against mock seed data and local Zustand stores with zero environment variable configuration. Any backend integration references are hardcoded to local development assumptions.

Admin code remains untouched during the current testing phase as agreed.

## Scope for future pass

1. Environment variables:
   - Create `admin/.env.example` defining `NEXT_PUBLIC_API_URL` (pointing to Render backend or local port 4000).
   - Wire API clients and SWR or TanStack Query hooks to read `process.env.NEXT_PUBLIC_API_URL`.
2. Product management:
   - Wire the products list view (`admin/src/app/products/page.tsx`) to `GET /api/products`.
   - Wire the product editor form (`admin/src/components/product-form.tsx`) to `POST /api/products` and `PUT /api/products/:id`.
   - Implement deletion handling with `DELETE /api/products/:id`.
3. Deploy hook automation:
   - Add a trigger in the backend to call the Vercel Deploy Hook whenever product updates are published from admin.

## Acceptance criteria

1. Admin product mutations persist to the Fastify store or database rather than browser localStorage.
2. The admin app builds cleanly with `npm run build` in CI and production.
3. No hardcoded localhost URLs remain in `admin/src/`.
