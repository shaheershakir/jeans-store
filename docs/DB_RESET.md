# Database schema v2 — baseline & reset runbook

The database is now defined by a single fresh baseline instead of the previous
incremental `0000`–`0005` migrations. The baseline is generated from
`packages/db/src/schema.ts` and mirrored byte-for-byte to
`apps/api/src/db/schema.ts` and `apps/api/drizzle/`.

- `packages/db/drizzle/0000_baseline.sql` — full DDL, indexes, checks and
  `updated_at` triggers.
- `packages/db/drizzle/meta/0000_snapshot.json` — Drizzle snapshot.
- `packages/db/drizzle/meta/_journal.json` — one entry, `0000_baseline`.

## What is in the baseline

39 tables across these domains:

| Domain | Tables |
| --- | --- |
| Identity | `users`, `admin_users`, `roles` |
| Catalog | `categories`, `collections`, `products`, `product_images`, `product_variants`, `size_charts`, `size_chart_measurements` |
| Customers | `customers`, `customer_addresses`, `wishlist_items` |
| Orders | `orders`, `order_items`, `order_events`, `payments`, `shipments` |
| Returns & refunds | `return_requests`, `return_items`, `refunds` |
| Reviews | `product_reviews`, `review_images`, `review_helpful_votes` |
| Marketing | `coupons`, `coupon_products`, `coupon_categories`, `coupon_redemptions`, `promotions`, `banners` |
| Operations | `inventory_movements`, `audit_log`, `notifications`, `store_settings` |
| Storefront config | `homepage_sections`, `navigation_items` |
| Shipping | `shipping_zones`, `shipping_zone_regions`, `shipping_methods` |

Key decisions enforced by the schema:

- Money is stored as integer INR (`price`, `subtotal`, `total`, `amount`, …).
- Product weight is `products.weight_grams`; a variant may override it with
  `product_variants.weight_grams`.
- Product specs such as fabric, material, sleeve length, neck type, pattern,
  rise, inseam and wash are explicit columns, not a JSON blob.
- Orders keep a customer/address snapshot and reference `customers.id`; stock,
  payment, shipment, return and refund records live in their own tables.
- `homepage_sections.config` is the only intentional JSON document column.
- Status columns use the existing Title Case values for orders, payments,
  returns, reviews and shipments. Product status remains lowercase
  `draft` / `active` / `archived`.

## Seed contents

`npm run db:seed` runs the API seeder and inserts only reference/catalog data:

- 8 active categories: Stripes, Fullsleeve, Drsleeve, Printed Tees, Ringer
  Tees, Henley, Trackpants, Sweatpants.
- 24 source products from `apps/api/src/data/products.ts`, with generated
  variants and product images.
- 7 default admin roles.
- Default store settings.
- Two shipping zones (`Kerala`, `Rest of India`) with Standard methods.
- Default homepage sections and navigation items.

It does **not** insert customers, orders, reviews, coupons, returns, refunds or
demo admin users.

## Reset runbook

> This is destructive. Take a Neon branch/snapshot or let the script run
> `pg_dump` before continuing.

1. Confirm the target branch in `apps/api/.env`:
   ```bash
   DATABASE_URL=postgresql://...
   ```

   `packages/db/.env` already holds the Neon connection string used by
   `drizzle-kit`. Copy that value into `apps/api/.env` (or export it in the
   shell) before resetting — the API env currently ships with an empty
   `DATABASE_URL`.
2. Dry run (prints the target and does nothing):
   ```bash
   npm run db:reset
   ```
3. Reset, back up with `pg_dump`, apply the baseline and seed:
   ```bash
   CONFIRM_DB_RESET=yes npm run db:reset
   ```
4. If `pg_dump` is unavailable, take a Neon branch/snapshot first and skip the
   local dump:
   ```bash
   CONFIRM_DB_RESET=yes SKIP_DB_BACKUP=yes npm run db:reset
   ```
5. Apply the schema without seeding:
   ```bash
   CONFIRM_DB_RESET=yes SKIP_SEED=yes npm run db:reset
   ```

The script drops the `public` and `drizzle` schemas, recreates `public`, runs
`apps/api/drizzle` through the Drizzle migrator, then calls the API seeder.

### Alternative: apply only the migration

If the database is already empty:

```bash
npm run db:migrate --workspace=@jeans-store/api
npm run db:seed
```

## Admin compatibility layer

`/api/admin/state` still returns the 14-key operational blob expected by the
admin dashboard. It is now assembled from normalized tables by
`apps/api/src/store/adminStateStore.ts`:

`collections`, `returns`, `refunds`, `coupons`, `promotions`, `banners`,
`reviews`, `sizeCharts`, `shipments`, `inventoryMovements`, `auditLog`,
`notifications`, `settings`, `roles`.

`PUT /api/admin/state` replaces those domains, preserves incoming IDs, skips
records whose order/customer/product foreign keys do not exist, and resets the
serial sequences after each save. It is a temporary compatibility layer, not a
table.

## Verification

```bash
# Schema files and migration folders must stay byte-identical
npm test --workspace=@jeans-store/api -- --test-name-pattern="parity"

# API typecheck
cd apps/api && npm run typecheck

# Scripts typecheck (includes migration/reset/verification scripts)
cd apps/api && npm run typecheck:scripts

# Database typecheck
npm run typecheck --workspace=@jeans-store/db

# Post-reset integrity checks
npm run db:verify-orders --workspace=@jeans-store/api
npm run db:verify-skus --workspace=@jeans-store/api
npm run db:verify-images --workspace=@jeans-store/api
```
