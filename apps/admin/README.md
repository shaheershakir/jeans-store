# TEESGARAGE Admin Panel

Operational dashboard for managing TEESGARAGE apparel products, inventory, orders, delivery charges, analytics, marketing campaigns, and store settings.

## Technology stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS v4
- Recharts for analytics data visualization
- Zustand for client state management
- Lucide React icons

## Commands

```bash
npm run dev      # Launch admin server on http://localhost:3001
npm run build    # Build optimized production bundle
npm run start    # Start production server on port 3001
npm run lint     # Run Next.js ESLint checks
npm run format   # Format source code with Prettier
```

## Current status

The admin uses the API for production catalog, order, login, image upload, and delivery-rate operations. Configure its API origin with `API_URL`; see [the production setup guide](../docs/ADMIN_PRODUCTION.md) for required credentials, storage, and database setup.

Local development can still use simulated data for operational screens that are not yet backed by API endpoints.
