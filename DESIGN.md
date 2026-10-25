# Design System: TEESGARAGE

**Project:** TEESGARAGE Apparel Storefront & Operation Systems  
**Design Lead Directive:** Editorial Catalog, Archival Precision, Tactile Micro-Interactions

---

## 1. Visual Theme & Atmosphere

A restrained, archival-editorial catalog with confident typographic hierarchy, asymmetric spatial layouts, and fluid spring-physics motion. The aesthetic rejects generic e-commerce conventions (no artificial countdown clocks, no fake review counters, no strike-through pricing, no aggressive neon glows).

The atmosphere draws inspiration from high-fashion lookbooks, industrial manifests, and raw fabric ateliers. Surfaces use warm tactile alabaster (`--paper` / `#f5f3ef`) and neutral bone surfaces (`--bone` / `#ede8e1`) with graphite charcoal ink (`--ink` / `#151515`), layered with translucent frosted glass (`backdrop-filter: blur(28px)`) on floating utilities and drawers.

- **Density:** 5 (Daily App Balanced, generous breathing room, 65ch readable line lengths)
- **Variance:** 7 (Offset Asymmetric layouts, split-screen hero framing, dynamic catalog rhythms)
- **Motion:** 6 (Fluid CSS spring-like curves, staggered scroll reveals, tactile scale push feedback)

---

## 2. Color Palette & Roles

All colors are strictly mapped to CSS custom properties in `apps/storefront/src/app/globals.css`. Pure black (`#000000`) and AI purple/neon glows are strictly BANNED.

- **Graphite Ink** (`--ink`, `#151515` / `#172126`) — Primary typography, prominent buttons, active navigation markers, structural lines.
- **Warm Alabaster Canvas** (`--paper`, `#f5f3ef` / `#f8f7f3`) — Primary storefront base surface, canvas backdrop.
- **Natural Bone Surface** (`--bone`, `#ede8e1` / `#eeede7`) — Secondary container surfaces, card backgrounds, image wrapper fills, technical badge chips.
- **Deep Maritime Navy** (`--navy`, `#1c2a38` / `#253f51`) — Single muted accent role for active catalog filters, deep contrast highlights, and concierge touchpoints.
- **Whisper Divider** (`--line`, `rgba(21, 21, 21, 0.12)`) — 1px architectural lines, grid separators, border dividers.
- **High-Contrast Border** (`--line-strong`, `rgba(21, 21, 21, 0.35)`) — Focused inputs, active toggle chips, card hover boundaries.
- **Atelier Forest** (`--accent-green`, `#15803d` / `#dcfce7`) — Functional stock availability markers and verified order statuses.
- **Precision Crimson** (`--danger`, `#dc2626`) — Form validation alerts and account sign-out actions.

---

## 3. Typography Architecture

Strict four-tier type system from Google Fonts. Generic fonts like `Inter`, `Times New Roman`, and `Georgia` are strictly BANNED.

1. **Playfair Display** (`var(--serif)`): Headlines, hero titles, modal section heads, and editorial pull-quotes. Track-tight, controlled scale, conveys archival craftsmanship.
2. **DM Sans** (`var(--sans)`, `var(--font-ui)`): Product titles, navigation links, descriptive editorial prose, and customer account interfaces. Clean, legible, high x-height.
3. **DM Mono** (`var(--mono)`): Prices (Indian Rupee `₹`), technical specifications, fabric weight (GSM), sizing numbers, batch dates, and form labels. Communicates catalog utility.
4. **Archivo Black** (`var(--display)`, `var(--font-brand)`): Brand wordmark and select hero typographic accents.

### Hierarchy & Scale

- **Display Hero:** `clamp(48px, 6.5vw, 84px)`, line-height 0.96, tracking `-0.04em`.
- **Section Title:** `clamp(28px, 3.8vw, 42px)`, line-height 1.05, tracking `-0.03em`.
- **Product Card Title:** `15px` to `17px`, line-height 1.3, font-weight 500.
- **Price Tag:** `14px` to `16px`, DM Mono, font-weight 600, tabular figures.
- **Technical Meta & Badges:** `10px` to `12px`, DM Mono, uppercase, letter-spacing `0.08em` to `0.14em`.

---

## 4. Component Stylings

- **Buttons:**
  - Flat, tactile push feedback (`transform: scale(0.98)` on `:active`).
  - Primary CTA: `--ink` fill with `--paper` text, 2px corner radius.
  - Secondary CTA: `--paper` fill with 1px `--line-strong` border.
  - No neon glows, no gradient borders, no custom mouse cursors.

- **Product Cards (3:4 Editorial Portrait):**
  - Strict 3:4 aspect ratio portrait frame (`aspect-ratio: 3 / 4`).
  - Small rounded corners (`var(--radius-sm, 4px)`).
  - Dual-image crossfade: smooth opacity transition from `product.img` to `product.img2` on `@media (hover: hover)`.
  - Zero lift, zero scale, zero shadow-growth on hover — only clean image crossfade and border highlight.
  - Refined overlay heart wishlist button on top-left.
  - Intentional, compact size selector and "Add to Bag" action bar.

- **Floating Glass Surfaces (Popovers, Drawers, Mobile Panels):**
  - True full-viewport backdrop portaled to `document.body` with `backdrop-filter: blur(12px)` and subtle ambient darkening.
  - Surface layer: semi-transparent (`rgba(255, 255, 255, 0.96)` / `rgba(250, 249, 246, 0.96)`) with `backdrop-filter: blur(32px) saturate(180%)`.
  - Inset specular highlight: `0 0 0 1px rgba(255, 255, 255, 0.8) inset`.
  - Solid fallback via `@supports not (backdrop-filter: blur(1px))`.

- **Search Overlay:**
  - Unified desktop and mobile modal (`SearchOverlay`).
  - Centered presentation with auto-focus, focus trapping (`Tab` cycle), and `Esc` dismissal.
  - Instant catalog search with curated popular tags.

- **Skeletal Loaders:**
  - Shimmer pulse matching exact layout dimensions (3:4 image, title bar, price bar, action button).
  - No generic circular spinners.

---

## 5. Layout & Grid Principles

- **Asymmetric Split Hero:** Content on the left, full-bleed model/garment editorial photography on the right. Clean spatial separation with zero overlapping text over faces.
- **Product Grids:** Responsive 2 columns on mobile (< 640px), 3 columns on tablet (640px–1024px), 4 columns on desktop (1024px+).
- **Max Width Containment:** Standard container max-width `1320px` with responsive horizontal padding (`clamp(20px, 4.4vw, 64px)`).
- **Spacing Scale:** Generous breathing room (`clamp(48px, 7vw, 96px)` vertical section gaps).
- **Mobile Viewport Safety:** Uses dynamic viewport height units (`100dvh` / `90dvh`) to avoid mobile browser navigation bar jumps.

---

## 6. Motion Philosophy

- **Shared Motion Tokens:**
  - `--dur-fast: 150ms` (tactile button press, heart toggle, chip selection)
  - `--dur-base: 250ms` (dropdowns, popovers, image crossfade)
  - `--dur-slow: 400ms` (page transitions, drawers, modal reveals)
  - `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` (entering surfaces)
  - `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` (sheet slides)
- **Hardware Acceleration:** Animations strictly operate on `transform` and `opacity`. Layout-triggering properties (`top`, `left`, `width`, `height`) are never animated.
- **Page Transitions:** Route changes smoothly fade in via `app/template.tsx`.
- **Accessibility:** Comprehensive `@media (prefers-reduced-motion: reduce)` overrides across all transitions.

---

## 7. Anti-Patterns (Banned AI Clichés)

1. **NO Emojis anywhere** in UI copy, buttons, badges, or headers.
2. **NO `Inter` font** — use DM Sans and Playfair Display exclusively.
3. **NO generic serifs** (`Times New Roman`, `Georgia`, `Garamond`).
4. **NO pure black** (`#000000`) — use `--ink` (`#151515`).
5. **NO neon outer glows** or purple/blue AI gradient buttons.
6. **NO overlapping text on images** — enforce clean spatial zones.
7. **NO card hover lift / scale / shadow balloons** — cards remain anchored, only image crossfades.
8. **NO filler UI text:** "Scroll to explore", "Swipe down", scroll arrows, or bouncing chevrons.
9. **NO artificial urgency:** fake countdown timers, false stock counters, or strike-through original prices.
10. **NO AI copywriting clichés:** "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize".
