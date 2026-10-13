# Design system

This document defines the brand, typographic hierarchy, and visual design standards for the TEESGARAGE storefront.

## Brand identity

TEESGARAGE is a denim label focused on permanence and structural weight. We build heavyweight jeans cut from 13.5oz to 14.5oz selvedge and ring-spun cotton denim.

The aesthetic draws inspiration from industrial manifests, raw materials, and archival catalogs. We avoid generic e-commerce conventions like artificial sale countdowns, fake review counters, and strike-through pricing. Every element on screen must feel functional, durable, and honest.

## Color system

All colors are declared as CSS custom properties in `frontend/src/app/globals.css`. We do not use Tailwind CSS or arbitrary inline hex values in the storefront.

### Core palette

- `--ink` (`#151515`): Deep graphite black for primary typography, borders, and dominant buttons.
- `--paper` (`#f5f3ef`): Warm alabaster cream for the storefront base background and primary surfaces.
- `--bone` (`#ede8e1`): Neutral warm grey for secondary card surfaces, input backgrounds, and badges.
- `--denim` (`#253d5a`): Deep indigo accent for links, icons, and subtle brand accents.
- `--line` (`rgba(21, 21, 21, 0.15)`): Subtle border divider for grids and cards.
- `--line-strong` (`rgba(21, 21, 21, 0.4)`): High-contrast border for active states and inputs.

### Semantic states

- `--accent-green` (`#15803d`): Stock availability, free shipping unlocks, and order confirmations.
- `--accent-green-bg` (`#dcfce7`): Light green badge background.
- Danger red (`#dc2626`): Form validation errors.

## Typography

The storefront uses four distinct type families from Google Fonts.

1. **Playfair Display** (`var(--serif)`): Headlines, hero text, and modal section titles. Conveys editorial weight.
2. **DM Sans** (`var(--sans)`): Product titles, body copy, and narrative descriptions. Clean and readable at small sizes.
3. **DM Mono** (`var(--mono)`): Prices, fit tags, technical specifications, and form labels. Communicates catalog utility.
4. **Archivo Black** (`var(--display)`): Wordmark and select editorial hero accents.

### Type scale

- Display hero: 42px to 54px, line height 1.1, serif.
- Page title: 32px to 36px, line height 1.2, serif.
- Card title: 16px to 18px, line height 1.3, sans.
- Body narrative: 14px, line height 1.65, sans.
- Technical meta and badges: 11px to 13px, monospace, uppercase, letter spacing 0.04em to 0.08em.

## Layout and spacing

- Page container: Max width 1440px with responsive 4% horizontal padding.
- Grid rhythms: 2 columns on mobile, 3 columns on tablet, 4 columns on desktop displays.
- Card radius: 4px (`--radius-sm`) or 2px (`--radius-xs`). We avoid heavy pill shapes except for interactive toggle chips.
- Sticky navigation: 64px height with a solid paper background and 1px border.

## Component guidelines

### Product cards

- Cards display a 3:4 aspect ratio image container.
- Hovering the card swaps to the secondary alternate wash view with a smooth opacity transition.
- Price is formatted with the Indian Rupee symbol using the `en-IN` locale (`₹1,699`).
- Size picker pills allow direct size selection prior to adding items to the bag.

### Bag drawer

- Slides out from the right on overlay trigger.
- Free shipping progress bar updates dynamically against the ₹1,499 threshold.
- Step controls let customers increment or decrement quantity without full page reloads.

### Checkout form

- Simple two-column layout with delivery details on the left and sticky order manifest on the right.
- Clean inputs with high-contrast active focus rings.
- Explicit confirmation cards that render the exact message handed off to WhatsApp or email.
