# INFIT Admin Panel

Operational dashboard for managing INFIT denim inventory, orders, analytics, marketing campaigns, and store settings.

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

The admin application is built and functional for local testing with simulated mock data and local state.

In this testing phase:
- Admin code is maintained as-is without active modifications.
- API endpoints and backend URLs are currently hardcoded to local defaults. Environment variable configuration is scheduled for a dedicated subsequent pass (see `docs/tasks/03-admin-env-wiring.md`).
