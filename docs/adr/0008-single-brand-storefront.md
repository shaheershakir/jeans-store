# ADR 0008: Single Brand Storefront Architecture

We consolidate the storefront experience under a single unified TEESGARAGE brand rather than maintaining separated multi-store frontends. The catalog focuses on Stripes, Fullsleeve, Drsleeve, Printed tees, Ringer tees, Henley, Trackpants, and Sweatpants, with a unified catalog, cart, and checkout.

## Consequences

- The separate `clothing-store/` scaffold is merged into the primary storefront (`frontend/`).
- The backend catalog schema categorizes garments via `category` rather than isolating by tenant store.
- Shoppers can mix tops and bottoms in a single cart and order.
