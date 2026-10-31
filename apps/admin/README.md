# TEESGARAGE Admin Panel

Operational dashboard for managing TEESGARAGE apparel products, inventory, orders, customers, delivery rates, coupons, and store settings.

## Technology Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 (CSS-first tokens via `@theme`, `@utility`)
- **Visualizations**: Recharts for analytics data visualization
- **State Management**: Zustand with live backend synchronization
- **Icons**: Lucide React

## Commands

```bash
npm run dev       # Launch admin server on http://localhost:3001
npm run build     # Build optimized Next.js production bundle
npm run start     # Start production server on port 3001
npm run lint      # Run Next.js ESLint checks
npm run typecheck # Run TypeScript compiler checks
```

## Production Integration

The admin dashboard connects directly to the Express REST API (`apps/api`) backed by Neon PostgreSQL. All metrics, catalog items, variants/SKUs, customer orders, coupons, and delivery rates reflect live production database records. Session authentication uses signed Bearer tokens configured via `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
