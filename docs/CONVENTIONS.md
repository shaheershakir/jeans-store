# Coding conventions

This document outlines the code organization, TypeScript standards, styling patterns, and state rules across the INFIT codebase.

## Code organization

Each app in the repository is self-contained. Do not cross-import code between apps directly through relative file paths. Shared models must be synchronized explicitly between `frontend/` and `backend/`.

### Directory layout within applications

- `src/app/`: Next.js App Router route segments, layouts, and page entrypoints.
- `src/components/`: Reusable React components.
- `src/lib/`: Shared utilities, constants, store definitions, and helper functions.
- `src/data/`: Static seed arrays and data snapshots.

## TypeScript standards

- Strict mode is enabled across all apps.
- Do not use `any`. Use `unknown` with runtime type narrowing or Zod schemas.
- Use explicit return types for public library functions and API route handlers.
- Exhaustive checks must cover union types. When operating on `Fit` values, ensure all branches are handled.
- Prefer explicit interfaces over complex inline intersection types.

## Styling architecture

### Frontend storefront

- The storefront uses vanilla CSS with CSS variables in `frontend/src/app/globals.css`.
- Do not install or configure Tailwind CSS in `frontend/`.
- Use semantic class names that reflect component structure (`product-card`, `cart-drawer`, `checkout-form`).
- All interactive buttons and inputs must declare explicit hover, focus, and active states.
- Media queries follow standard device breakpoints: 900px for tablets, 640px and 480px for mobile devices.

### Admin dashboard

- The admin app uses Tailwind CSS v4.
- Use utility classes consistently and extract repeating layouts into component primitives.

## State management

- Use Zustand stores for client-side state.
- Split stores by functional area:
  - `useCartStore`: Shopping bag items, quantities, and totals calculation.
  - `useFilterStore`: Selected fit, price range filters, and sorting mode.
  - `useUIStore`: Active drawers, search overlay, and temporary notifications.
- Persist state to `localStorage` using the `persist` middleware only where user expectation warrants it (cart items and filters).
- Components reading persisted stores must trigger store rehydration inside a `useEffect` hook to prevent server and client markup mismatch.

## Error handling

- Never swallow errors silently. Catch blocks must log an informative message or surface a friendly notification to the customer.
- External network operations must use an `AbortController` timeout to prevent hanging connections.
- Critical user paths must provide an intuitive retry mechanism or safe fallback.
