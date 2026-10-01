# ADR 0009: Product Sizing and Unified Line Item Contract

With the catalog expanding beyond denim to outerwear and tops, garments require distinct sizing conventions (numeric waist measurements for denim vs alpha tiers for apparel). We model sizing as a product-level `sizes: string[]` array and record a single selected `size` string on each order line item, avoiding disjoint schema structures while maintaining a flexible, universal cart and checkout payload.
