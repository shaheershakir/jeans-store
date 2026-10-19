-- ============================================================================
-- PHASE 4 CONTRACT MIGRATION (DESTRUCTIVE CLEANUP PREVIEW)
-- WARNING: DO NOT APPLY UNTIL THE FOLLOWING PRECONDITIONS ARE VERIFIED:
-- 1. A Neon point-in-time recovery backup or branch has been created.
-- 2. `backfill-product-images.ts --apply` has been executed with 0 errors.
-- 3. `backfill-orders.ts --apply` has been executed with 0 errors.
-- 4. Re-running both backfill scripts reports 0 unmigrated rows.
-- 5. No application or service reads legacy columns (products.img, img2, images,
--    price, sizes, category; orders.items, events, admin_notes).
-- ============================================================================

-- 1. Enforce NOT NULL constraints on normalized products columns
ALTER TABLE "products" ALTER COLUMN "category_id" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;

-- 2. Drop deprecated columns from products table
ALTER TABLE "products" DROP COLUMN IF EXISTS "img";
ALTER TABLE "products" DROP COLUMN IF EXISTS "img2";
ALTER TABLE "products" DROP COLUMN IF EXISTS "images";
ALTER TABLE "products" DROP COLUMN IF EXISTS "price";
ALTER TABLE "products" DROP COLUMN IF EXISTS "sizes";
ALTER TABLE "products" DROP COLUMN IF EXISTS "category";

-- 3. Drop deprecated JSONB columns from orders table
ALTER TABLE "orders" DROP COLUMN IF EXISTS "items";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "events";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "admin_notes";

-- ============================================================================
-- ROLLBACK NOTE:
-- Once columns are dropped in PostgreSQL, their contents are discarded from storage.
-- To rollback, restore the database from the Neon backup/branch created prior
-- to running this script, or recreate the columns as nullable and re-populate
-- them from product_images, order_items, and order_events.
-- ============================================================================
