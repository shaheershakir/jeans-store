# ADR 0008: Single Brand Storefront Architecture

We consolidate the storefront experience under a single unified INFIT brand rather than maintaining separated multi-store frontends. Denim serves as the signature core craft, with curated apparel categories integrated into a unified catalog, single shopping cart, and unified concierge checkout.

## Consequences

- The separate `clothing-store/` scaffold is merged into the primary storefront (`frontend/`).
- The backend catalog schema categorizes garments via `category` rather than isolating by tenant store.
- Shoppers can mix denim silhouettes and apparel in a single cart and order.
