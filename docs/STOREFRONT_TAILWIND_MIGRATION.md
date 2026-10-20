# Storefront: CSS → Tailwind Migration

The storefront is moving from a single hand-authored stylesheet to Tailwind CSS v4 utilities in markup.

## Current state

| Area | State |
| --- | --- |
| Tailwind install | v4.3.3 via `tailwindcss` + `@tailwindcss/postcss` |
| PostCSS | `apps/storefront/postcss.config.mjs` |
| Entry point | `@import 'tailwindcss'` at the top of `src/app/globals.css` |
| Design tokens | Exported through `@theme` in `globals.css` (see below) |
| Legacy CSS | `src/app/globals.css` (~17.8k lines) + `src/app/teesgarage-home.css` |
| Converted in wave 1 | `Footer`, `RelatedProducts`, `homepage/CategoryGroups` |
| Converted in wave 2 | `ProductCard`, `skeletons/ProductCardSkeleton` |

Wave 1 removed 57 CSS rules (footer, related-products and category-group styling). Wave 2 removed 65 rules from the product-card cascade and split the shared `.apple-product-card` selectors so the PDP keeps its shell.

Card and footer visual checks were done against a production build at 1440px on `/shop`, `/` and a PDP route.

## Token mapping

`@theme` exposes the existing palette and type system as utilities:

- Colors: `ink`, `ink-secondary`, `ink-muted`, `paper`, `bone`, `bone-alt`, `navy`, `navy-accent`, `line`, `line-strong`, `accent-green`, `accent-green-bg`
- Storefront surfaces: `store-paper`, `store-surface`, `store-ink`, `store-muted`, `store-line`, `store-accent`, `store-soft`
- Fonts: `font-sans`, `font-serif`, `font-display`, `font-brand`, `font-ui`, `font-mono`
- Radii: `rounded-xs|sm|md|lg` are overridden to the brand scale (3 / 6 / 10 / 14px)
- Elevation: `shadow-card`, `shadow-panel`, `shadow-drawer`
- Easing: `ease-brand-out`, `ease-brand-in-out`, `ease-drawer`

Prefer these names over arbitrary values. The matching `:root` variables (`--ink`, `--font-brand`, …) still exist because legacy CSS consumes them; do not remove them until the last rule using them is gone.

## Conversion rules

1. Read the **final** rule for a selector, not the first. `globals.css` contains several generations of the same component (for example `.site-footer` was defined at three locations and `.product-card` at six). Later rules win.
2. Keep arbitrary values for one-off geometry (`grid-cols-[minmax(180px,1fr)_...]`, `gap-[clamp(28px,5vw,76px)]`).
3. Responsive overrides become `max-[820px]:` / `max-[640px]:` utilities that mirror the original media queries.
4. Delete the CSS rules only after the **last** consumer of the class has moved to utilities. Grep the class across `apps/storefront/src` first.
5. When a rule is shared by several selectors, split the selector instead of deleting the whole rule.

## Entangled components (next up)

These reuse class names across files, so they must be converted together or the CSS kept:

- **`ProductDetail` + `ProductDetailSkeleton`**: the PDP still consumes the unprefixed `.product-fav-btn`, `.fav-heart-icon`, `.product-image-container`, `.product-title`, `.product-price`, `.product-wash-label` and `.pdp-*` rules. Convert both together, then delete the generic card leftovers. The `.apple-product-card` shell was deliberately kept for the PDP.
- **Remaining skeletons**: `AuthSkeleton`, `CheckoutSkeleton`, `HomepageSkeleton`, `OrdersSkeleton`, `ProfileSkeleton`, `ShopSkeleton` reuse page-level classes (`shop-grid`, `apple-profile-*`, `teesgarage-*`), so they follow their host pages. `Skeleton` itself still uses `.apple-skeleton-pulse` / `.skeleton-*` and should be converted with them.

## Suggested batches

1. `ProductDetail` + `ProductDetailSkeleton` (delete `.pdp-*` and the remaining generic card rules).
2. `Header` + `SearchOverlay` + `CartDrawer` (header is duplicated in `teesgarage-home.css` and the 15k-line page-system block).
3. Shop: `ShopClient` + `ShopSkeleton`.
4. Checkout: `CheckoutClient` + `CheckoutSkeleton`.
5. Account: `Profile`, `Orders`, `Auth`, `Onboarding` pages and skeletons.
6. Bag, favorites, search, order confirmation.
7. Remove `teesgarage-home.css` and the remaining legacy blocks; keep only `@theme`, resets and keyframes.

## Verification

```bash
npm run typecheck -w @jeans-store/storefront
npm run build -w @jeans-store/storefront
```

Check the generated CSS when a utility is suspicious:

```powershell
Get-ChildItem apps/storefront/.next/static/css | Get-Content -Raw | Select-String 'your-value'
```

Visual check per wave: home page, shop grid, PDP, bag drawer, checkout. The footer is on every route, so a broken footer change shows up immediately.
