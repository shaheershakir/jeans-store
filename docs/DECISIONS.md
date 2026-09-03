# Architectural decisions

This document records the key architectural decisions, rationale, and consequences for the INFIT platform during the testing phase.

## ADR 1: Build-time static generation instead of runtime SSR

### Context

The backend is hosted on Render's free tier, which spins down after 15 minutes of idle time. If the storefront fetched product catalog data on every incoming shopper request, visitors would frequently experience 40 second cold starts.

### Decision

We use Next.js Static Site Generation (`generateStaticParams` and build-time data fetching) for all storefront routes (`/`, `/product/[id]`, and `/checkout`). The deployed site makes zero HTTP requests to the backend during shopper visits.

### Consequences

- Positive: Storefront pages load instantly from Vercel edge nodes. Shoppers never encounter Render cold starts.
- Negative: Catalog edits made in the backend do not appear instantly on the live site. They require triggering a redeployment via a Vercel Deploy Hook.

---

## ADR 2: Direct WhatsApp and email order handoff instead of payment gateway

### Context

The testing phase prioritizes evaluating market demand, cut preferences, and sizing fits before integrating complex payment gateways, merchant KYC accounts, or relational order schemas.

### Decision

We build a structured checkout flow on `/checkout` that compiles customer contact information, shipping address, and bag items into an order manifest. The order transmits directly via WhatsApp using a `wa.me` deep link, with an automatic `mailto:` fallback.

### Consequences

- Positive: Zero payment processing fees, zero regulatory compliance overhead, and immediate high-touch customer communication for size consultation.
- Negative: Inventory deduction is not automated and payments must be collected manually via UPI or Cash on Delivery.

---

## ADR 3: Conditional zero-overhead Sentry initialization

### Context

We require error monitoring in production, but local development and CI pipelines should never fail or report noise when credentials are not configured.

### Decision

`@sentry/nextjs` is initialized conditionally in `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`. If `NEXT_PUBLIC_SENTRY_DSN` is empty or unset, Sentry runs as a complete no-op.

### Consequences

- Positive: Local development, pull requests, and automated builds run cleanly without Sentry tokens.
- Negative: Errors during local development must be inspected via terminal and console logs rather than a remote dashboard.

---

## ADR 4: Bundled snapshot fallback for build resilience

### Context

Static builds in Next.js execute data fetching logic during compilation. If the backend is unreachable during local work or CI execution, builds would crash.

### Decision

`frontend/src/lib/products.ts` wraps the backend fetch in an `AbortController` timeout. If the request fails, the build logs a clear warning and falls back to the bundled `SNAPSHOT_PRODUCTS` in `frontend/src/lib/constants.ts`.

### Consequences

- Positive: Deterministic, reliable builds in all environments without mandatory background services.
- Negative: If the backend URL is misconfigured in production, the build will quietly succeed using snapshot data rather than throwing an error.

---

## ADR 5: Strict HTTP security headers in next.config.ts

### Context

Modern e-commerce sites must defend against clickjacking, MIME-sniffing, and insecure protocol downgrades.

### Decision

We configure explicit HTTP security headers in `frontend/next.config.ts` covering all routes:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

### Consequences

- Positive: Strong baseline security profile for storefront customers.
- Negative: Embedding the storefront in iframes is blocked by default.

---

## ADR 6: Google Fonts link loading with ESLint suppression

### Context

The storefront design system relies on four distinct type families (`Playfair Display`, `DM Sans`, `DM Mono`, `Archivo Black`). Next.js 15 App Router flags standard external font stylesheets with `no-page-custom-font` warnings.

### Decision

We load fonts via preconnected links in `frontend/src/app/layout.tsx` and suppress the false-positive warning using an explicit ESLint comment.

### Consequences

- Positive: Preserves existing visual hierarchy and font rendering without requiring complex multi-font CSS variable rewiring in `next/font`.
- Negative: Fonts depend on Google Fonts CDN availability rather than self-hosting within the build bundle.
