# Storefront: CSS → Tailwind Migration

The storefront is moving from a single hand-authored stylesheet to Tailwind CSS v4 utilities in markup.

## Cascade layers (read this first)

`src/app/globals.css` declares the layer order before Tailwind is imported, and wraps the entire
legacy sheet in a `legacy` layer:

```css
@layer properties, theme, base, legacy, legacy-overrides, components, utilities;
@import 'tailwindcss';
@import './teesgarage-home.css' layer(legacy);

@theme { /* tokens */ }

@layer legacy {
  /* the whole legacy stylesheet */
}

@layer legacy-overrides {
  /* late overrides that must outrank the legacy sheet */
}
```

Priority, low to high: `properties`, `theme`, `base` (Preflight), `legacy`, `legacy-overrides`,
`components`, `utilities`.

`legacy-overrides` exists for rules that were previously injected unlayered (the old Header
`<style jsx global>` block) and therefore outranked the legacy sheet regardless of specificity. It sits
above `legacy` to keep that result and below `utilities` so converted markup still wins. It currently
holds only the profile/wishlist overrides; delete the layer once those surfaces are converted.

This is load-bearing. **Unlayered CSS beats every cascade layer**, regardless of specificity. Before the
legacy sheet was layered, its `* { margin: 0; padding: 0 }` reset and generic element rules (`a`, `h1`, …)
silently overrode Tailwind's spacing and typography utilities, so converted components rendered with zero
padding/margin. Anything new must stay inside `@layer legacy` (or a later layer), never unlayered.

- `@theme` stays outside the layer so Tailwind can read the tokens.
- `@keyframes`, `@font-face` and `@property` may stay unlayered.
- Utilities no longer need `!` to beat legacy CSS.
- The legacy sheet still overrides Preflight, so unconverted pages keep their original look.

## Current state

| Area | State |
| --- | --- |
| Tailwind install | v4.3.3 via `tailwindcss` + `@tailwindcss/postcss` |
| PostCSS | `apps/storefront/postcss.config.mjs` |
| Entry point | `@import 'tailwindcss'` in `src/app/globals.css`, inside the layer order above |
| Design tokens | Exported through `@theme` in `globals.css` (see below) |
| Legacy CSS | `src/app/globals.css` (~14.3k lines) + `src/app/teesgarage-home.css`, both in `@layer legacy` |
| Converted in wave 1 | `Footer`, `RelatedProducts`, `homepage/CategoryGroups` |
| Converted in wave 2 | `ProductCard`, `skeletons/ProductCardSkeleton` |
| Converted in wave 3 | `ProductDetail`, `skeletons/ProductDetailSkeleton`, `StickyPdpBar`, checkout breadcrumbs |
| Converted in wave 4 | `Header` (tier-1 bar, desktop nav, mobile drawer, full-screen mobile search, account popover) |
| Converted in wave 5 | `SearchOverlay` (desktop modal + mobile bottom sheet) |
| Converted in wave 6 | `CartDrawer` (overlay, header, shipping meter, delivery lookup, items, cross-sell, totals) |

Wave 1 removed 57 CSS rules (footer, related-products and category-group styling). Wave 2 removed 65 rules
from the product-card cascade and split the shared `.apple-product-card` selectors so the PDP keeps its
shell. Wave 3 removed 166 rules (148 PDP rules + 18 press-feedback/disabled leftovers), split the shared
`.apple-product-card` shell, and pruned the last dead `.pdp-*` entries from shared selector lists. The
`.pdp-container` entry inside the mixed `:is(...)` focus-visible group is intentionally kept.

Wave 4 removed the header's inline `<style jsx global>` block and 161 legacy rules (`.macy-*`,
`.mobile-nav-*`, `.mobile-search-*`, `.mobile-suggestion-*`, `.apple-popover-*`, account-button helpers).
The inline block was unlayered, so it beat both the legacy sheet and utilities; its header rules are now
utilities, and its profile/wishlist rules moved to `legacy-overrides`. Two quirks were preserved: the
`.scrolled` state never had a visual effect (background stayed `rgba(250,249,246,0.96)`, no shadow), so the
state was dropped; and the desktop nav bar remains top-aligned rather than vertically centred.
`max-*` variants are strict `<`, so the legacy `max-width` breakpoints land one pixel earlier (the mobile
header applies at 639 rather than 640).

Wave 5 removed all 24 `SearchOverlay` rules, including the `max-width: 640px` block that held only its
mobile sheet overrides. `.search-modal` was also dropped from the reduced-transparency group. The overlay
keeps its `opacity 0.25s` fade and mobile `90dvh` bottom sheet; the input keeps `line-height: normal`
(not the inherited 1.5) so the header stays 50px tall on mobile. Classes with no CSS in the sheet
(`search-icon`, `search-clear`, `modal-close`, `tag-label`, `search-results-meta`, `search-empty`,
`search-item-info`) were left as inert hooks rather than given utilities that never existed.

Wave 6 converted `CartDrawer` and removed 115 drawer-only rules, two hover media blocks that became empty,
and the `.cart-drawer` entry in the reduced-transparency group. The drawer shares class names with the Bag
page, so those rules (`bag-header`, `bag-title`, `bag-item-img`, `bag-item-title`, `bag-stepper*`,
`bag-clear-btn`, `bag-footer-actions`, `bag-empty-title`/`desc`, `bag-delivery-title`) stay until the Bag
page converts. Because the Bag page's copies come later in the legacy layer, the drawer's utilities were
taken from the final cascade rather than the drawer block alone: 38px brand title, green uppercase 11px
delivery label, 36px stepper with a 3px radius, 16px item title, column footer actions with a 12px gap and
dashed rule, and a 12.5px underlined clear link. The item image keeps the legacy `width/height: 100%` pair
(its loaded 96px width comes from the flex row, not a fixed size); the desktop before-snapshot showed a
0-width image only because the image had not loaded yet, and the legacy classes produce the same 96px
layout once it is loaded.

Wave 2 also fixed the card media link: the `Link` inside the 4:5 stage is `absolute inset-0` so the
`h-full` image chain resolves. Without it the link collapsed to `0` height and every `ProductCard` (shop
grid and related products) showed an empty media area.

## Token mapping

`@theme` exposes the existing palette and type system as utilities:

- Colors: `ink`, `ink-secondary`, `ink-muted`, `paper`, `bone`, `bone-alt`, `navy`, `navy-accent`, `line`, `line-strong`, `accent-green`, `accent-green-bg`
- Storefront surfaces: `store-paper`, `store-surface`, `store-ink`, `store-muted`, `store-line`, `store-accent`, `store-soft`
- Fonts: `font-sans`, `font-serif`, `font-display`, `font-brand`, `font-ui`, `font-mono`
- Radii: `rounded-xs|sm|md|lg` are overridden to the brand scale (3 / 6 / 10 / 14px)
- Elevation: `shadow-card`, `shadow-panel`, `shadow-drawer`
- Easing: `ease-brand-out`, `ease-brand-in-out`, `ease-drawer`

Prefer these names over arbitrary values. The matching `:root` variables (`--ink`, `--font-brand`, …) still
exist because legacy CSS consumes them; do not remove them until the last rule using them is gone.

## Conversion rules

1. Read the **final** rule for a selector, not the first. `globals.css` contains several generations of the
   same component (for example `.site-footer` was defined at three locations and `.product-card` at six).
   Later rules win.
2. Keep arbitrary values for one-off geometry (`grid-cols-[minmax(180px,1fr)_...]`, `gap-[clamp(28px,5vw,76px)]`).
3. Responsive overrides become `max-[820px]:` / `max-[640px]:` utilities that mirror the original media queries.
4. Delete the CSS rules only after the **last** consumer of the class has moved to utilities. Grep the class
   across `apps/storefront/src` first.
5. When a rule is shared by several selectors, split the selector instead of deleting the whole rule.
6. Preserve computed quirks unless the change is deliberate. `getComputedStyle` beats reading the source —
   later rules, resets and media queries routinely change the outcome.
7. Buttons lose the legacy `cursor: pointer`; add `cursor-pointer` (and `disabled:cursor-not-allowed`) back.
8. Tailwind v4 animates with the `translate` / `scale` / `rotate` properties, not `transform`. Don't "fix" a
   `transform: none` diff until you have checked those properties.

## Entangled components (next up)

These reuse class names across files, so they must be converted together or the CSS kept:

- **`Header` + `SearchOverlay` + `CartDrawer`**: the header is duplicated in `teesgarage-home.css` and the
  page-system block; the overlays share `apple-modal-*`, `macy-*` and `search-*` rules.
- **Remaining skeletons**: `AuthSkeleton`, `CheckoutSkeleton`, `HomepageSkeleton`, `OrdersSkeleton`,
  `ProfileSkeleton`, `ShopSkeleton` reuse page-level classes (`shop-grid`, `apple-profile-*`,
  `teesgarage-*`), so they follow their host pages. `Skeleton` itself still uses `.apple-skeleton-pulse` /
  `.skeleton-*` and should be converted with them.

## Suggested batches

1. ~~`ProductDetail` + `ProductDetailSkeleton`~~ (done, wave 3).
2. `Header` + `SearchOverlay` + `CartDrawer`.
3. Shop: `CollectionClient` / `ShopClient` + `ShopSkeleton`.
4. Checkout: `CheckoutClient` + `CheckoutSkeleton`.
5. Account: `Profile`, `Orders`, `Auth`, `Onboarding` pages and skeletons.
6. Bag, favorites, search, order confirmation.
7. Remove `teesgarage-home.css` and the remaining legacy blocks; keep only `@theme`, resets and keyframes.

## Verification

```bash
npm run typecheck -w @jeans-store/storefront
npm run build -w @jeans-store/storefront
npm run lint -w @jeans-store/storefront
```

Check the generated CSS when a utility is suspicious:

```powershell
Get-ChildItem apps/storefront/.next/static/css | Get-Content -Raw | Select-String 'your-value'
```

Visual check per wave: home page, shop grid, PDP, bag drawer, checkout. The footer is on every route, so a
broken footer change shows up immediately.

For a conversion wave, compare computed styles before and after in headless Chrome at 1440px and 390px,
keyed by DOM position rather than class name (class names are removed by the conversion). In practice:
snapshot the old build, convert, snapshot the new build, diff every layout/typography/colour property.
Screenshots alone are not enough — they miss inherited font sizes, borders and hover constants. Note that
headless Chrome defaults to `prefers-reduced-motion: reduce`, so legacy animations are frozen in snapshots
and `backdrop-filter` may serialise as `none`.
