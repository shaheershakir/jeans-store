# Coding Conventions

This document outlines the code organization, TypeScript standards, styling patterns, and state rules across the TEESGARAGE codebase.

## Code Organization

The repository is structured as a Turborepo monorepo with npm workspaces. Shared contracts and utilities live in `packages/` (`@jeans-store/shared`, `@jeans-store/validators`, `@jeans-store/db`, `@jeans-store/config`). Applications in `apps/` (`storefront`, `admin`, `api`) import shared packages directly through workspace dependencies.

### Directory Layout Within Applications

- `src/app/`: Next.js App Router route segments, layouts, and page entrypoints.
- `src/components/`: Reusable React components.
- `src/lib/`: Shared utilities, constants, store definitions, and helper functions.
- `src/store/`: State management stores.

## TypeScript Standards

- Strict mode is enabled across all workspaces.
- Do not use `any`. Use `unknown` with runtime type narrowing or Zod schemas.
- Use explicit return types for public library functions and API route handlers.
- Exhaustive checks must cover union types.
- Prefer explicit interfaces over complex inline intersection types.

## Styling Architecture

### Storefront (`apps/storefront`)

- The storefront uses Tailwind CSS v4 configured via `@import "tailwindcss";` in `src/app/globals.css`.
- Follow modern Tailwind v4 patterns:
  - Define custom design tokens inside `@theme` blocks in CSS; do not create `tailwind.config.js`.
  - Use slash modifier syntax for opacity (`bg-black/50`, `text-white/80`).
  - Use `@utility name { ... }` for custom reusable utilities.
  - Interactive buttons and inputs declare explicit tactile feedback and hover/active transitions.
  - Media queries follow standard responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`).

### Admin Dashboard (`apps/admin`)

- The admin app uses Tailwind CSS v4 with Lucide React icons and Recharts.
- Use utility classes consistently and extract repeating layouts into component primitives.

## State Management

- Use Zustand stores for client-side state.
- Split stores by functional area:
  - `useCartStore`: Shopping bag items, quantities, and totals calculation.
  - `useFilterStore`: Selected fit, price range filters, and sorting mode.
  - `useUIStore`: Active drawers, search overlay, and temporary notifications.
- Persist state to `localStorage` using the `persist` middleware only where user expectation warrants it (cart items and filters).
- Components reading persisted stores must trigger store rehydration inside a `useEffect` hook to prevent server and client markup mismatch.

## Error Handling

- Never swallow errors silently. Catch blocks must log an informative message or surface a friendly notification to the customer.
- External network operations must use an `AbortController` timeout to prevent hanging connections.
- Critical user paths must provide an intuitive retry mechanism or safe fallback.
