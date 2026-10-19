# Database Schema V2 & Storage Architecture

This document defines the Schema V2 architecture, storage refactor, migration reconciliation, operational runbook, and baseline discovery for TEESGARAGE.

---

## 1. Phase 0 Discovery & Baseline

### 1.1 Baseline Validation Results
- **TypeScript Typecheck**:
  `npm run typecheck` across all packages passed cleanly (`@jeans-store/shared`, `@jeans-store/validators`, `@jeans-store/db`).
- **Builds**:
  `apps/api`: `npm run build` (`tsc`) compiled cleanly to `dist/`.
- **Unit & Integration Tests**:
  `apps/api`: `npm run test` ran 23 tests across 4 test suites with 0 failures (`catalog-and-orders.test.ts`, `sku-generation.test.ts`, `schema-sync.test.ts`).
- **Smoke Tests**:
  `apps/api`: `npm run smoke` verified 17/17 endpoints and operations including product listing, filtering, order placement, auth, navigation, and stock management.
- **Linter**:
  `npm run lint` across monorepo passed cleanly.

### 1.2 Migration-State Reconciliation Analysis
- **Migration Folders Discrepancy**:
  - `packages/db/drizzle`: Contained `0000_unknown_firebird.sql` and `0001_admin_shipping.sql` with `_journal.json` tracking both indices 0 and 1.
  - `apps/api/drizzle`: Contained only `0000_unknown_firebird.sql` with `_journal.json` index 0. `apps/api/scripts/migrate.ts` was pointing to `apps/api/drizzle`.
  - **Resolution**: `0001_admin_shipping.sql` and its journal entry were mirrored to `apps/api/drizzle`, and an automated regression test `apps/api/tests/schema-sync.test.ts` was introduced to prevent future drift.
- **How Changes Were Applied Historically**:
  - `0000_unknown_firebird.sql` created initial tables: `products`, `orders`, `users`, `navigation_items`.
  - `product_variants` was added later via `apps/api/scripts/migrate-skus.ts` with custom SQL (`CREATE TABLE IF NOT EXISTS product_variants (...)`). It was never recorded in a Drizzle migration file.
  - `0001_admin_shipping.sql` in `packages/db/drizzle` added `shipping_settings`, `admin_state`, and columns `products.admin_data`, `products.images`, and `orders.payment_status`.
  - Depending on whether production was updated via `drizzle-kit push`, manual SQL, or `migrate.ts`, the `drizzle.__drizzle_migrations` table on Neon may only record `0000_unknown_firebird`.
- **Safety of Re-running Migration 0001**:
  - `0001_admin_shipping.sql` uses `ADD COLUMN IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS`.
  - **CAUTION**: Lines 7-9 run an `UPDATE "products"` that marks any product whose category is not in `('stripes', 'fullsleeve', 'drsleeve', 'printed-tees', 'ringer-tees', 'henley', 'trackpants', 'sweatpants')` as `status: 'Archived'` inside `admin_data`.
  - Lines 21-27 run an `UPDATE "orders"` resetting `payment_status` and `status`.

### 1.3 Inventory of Real Values in Use
1. **`admin_data` JSONB Keys & Statuses**:
   - Keys Written: `slug`, `sku`, `brand`, `categoryId`, `collectionId`, `collection`, `gender`, `rise`, `material`, `pattern`, `inseam`, `compareAtPrice`, `costPrice`, `taxRate`, `status`, `featured`, `weightGrams`, `legacyCategory`.
   - Keys Read: All of the above, plus `views`, `wishlists`.
   - `status` values in production: `'Active'`, `'Draft'`, `'Archived'`.
2. **Order `status` and `payment_status` Values**:
   - `status`: `'Pending'`, `'Confirmed'`, `'Processing'`, `'Shipped'`, `'Delivered'`, `'Cancelled'`.
   - `payment_status`: `'Pending'`, `'Paid'`, `'Failed'`, `'Refunded'`.
3. **`handoff_type` Values**:
   - `'whatsapp'`, `'email'`, `'razorpay'`, `'cod'`.
4. **Razorpay ID Persistence**:
   - The TypeScript `Order` interface has fields `razorpayOrderId` and `razorpayPaymentId`.
   - In Database Schema v1, there were **no dedicated columns** for Razorpay IDs in the `orders` table. They were stored by formatting text into the `notes` column (e.g., `Razorpay Payment ID: pay_... | Order ID: order_...`).
5. **Money Unit of `price_num`**:
   - `price_num` in DB and `Product` models is in **Indian Rupees (INR integer)**, e.g. `1199` for ₹1,199.
   - It is only multiplied by 100 to convert to paise when making calls to the Razorpay checkout API.

### 1.4 Codebase Discrepancies Noted
1. **Dual Schema Architecture & Monorepo Imports**:
   - Both `packages/db/src/schema.ts` and `apps/api/src/db/schema.ts` exist.
   - `apps/api/tsconfig.json` has `rootDir: "src"`. If `apps/api/src/db/schema.ts` attempts to re-export from `@jeans-store/db`, `tsc` fails build validation because `@jeans-store/db` exports uncompiled TypeScript source (`src/index.ts`), and the multi-stage Dockerfile executes `node dist/index.js` in production without tsx.
   - Decision: Maintain schema parity test (`apps/api/tests/schema-sync.test.ts`) that runs on every test/build.
2. **`smoke.ts` Authentication & Apparel Sizes**:
   - `smoke.ts` originally sent `x-api-key: local_dev_admin_key`, which was rejected (401) by `verifyAdminAuth` (which requires signed JWT session Bearer tokens).
   - `smoke.ts` ordered size `'32'`, which was rejected for item 1 after the catalog pivot to t-shirts. Updated `smoke.ts` to log in via `/api/admin/auth/login` and order size `'M'`.

---

## 2. Neon Production Read-Only Checks

Run these read-only SQL queries against Neon to inspect live schema state before applying Phase 1/Phase 2 migrations:

```sql
-- 1. Check migrations tracking history
SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at;

-- 2. Check existing public tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. Check products table columns
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('admin_data', 'images', 'category_id', 'slug', 'status', 'attributes')
ORDER BY column_name;

-- 4. Check orders table columns
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('payment_status', 'carrier', 'tracking_number', 'admin_notes', 'events', 'user_id', 'razorpay_order_id', 'razorpay_payment_id')
ORDER BY column_name;

-- 5. Distinct categories and statuses in products
SELECT category, count(*) FROM products GROUP BY category;
SELECT admin_data->>'status' AS admin_status, count(*) FROM products GROUP BY admin_data->>'status';

-- 6. Distinct order status and payment status values
SELECT status, count(*) FROM orders GROUP BY status;
SELECT payment_status, count(*) FROM orders GROUP BY payment_status;
SELECT handoff_type, count(*) FROM orders GROUP BY handoff_type;
```

---

## 3. Architecture & Target Schema (V2)

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    categories ||--o{ categories : "parent"
    categories ||--o{ products : "categorizes"
    products ||--o{ product_images : "has images"
    products ||--o{ product_variants : "has variants"
    users ||--o{ orders : "places"
    orders ||--o{ order_items : "contains"
    orders ||--o{ order_events : "tracks"
    product_variants ||--o{ order_items : "snapshots"
    products ||--o{ order_items : "references"

    categories {
        serial id PK
        varchar slug UK
        varchar name
        integer parent_id FK
        integer sort_order
        boolean is_active
        timestamptz created_at
    }

    product_images {
        serial id PK
        integer product_id FK
        varchar color
        text storage_key UK
        text external_url
        varchar alt
        varchar mime_type
        integer width
        integer height
        integer size_bytes
        integer position
        timestamptz created_at
    }

    products {
        serial id PK
        varchar store
        varchar category
        integer category_id FK
        varchar slug UK
        varchar status
        jsonb attributes
        varchar name
        varchar fit
        varchar price
        integer price_num
        text img
        text img2
        jsonb images
        varchar badge
        text desc
        varchar wash
        jsonb sizes
        jsonb admin_data
        timestamptz created_at
        timestamptz updated_at
    }

    product_variants {
        serial id PK
        integer product_id FK
        varchar sku UK
        varchar size
        varchar color
        integer price
        integer stock
        integer reserved
        integer reorder_point
        integer weight
        varchar barcode
        varchar status
        timestamptz created_at
        timestamptz updated_at
    }

    users {
        serial id PK
        varchar uid UK
        varchar email UK
        varchar google_sub UK
        varchar name
        text password_hash
        varchar provider
        timestamptz onboarding_completed_at
        timestamptz created_at
        timestamptz updated_at
    }

    orders {
        serial id PK
        integer user_id FK
        varchar order_number UK
        varchar store
        varchar customer_name
        varchar customer_phone
        varchar customer_email
        text address
        varchar apartment
        varchar city
        varchar state
        varchar pincode
        text notes
        jsonb items
        integer subtotal
        integer shipping
        integer total
        varchar status
        varchar payment_status
        varchar handoff_type
        varchar razorpay_order_id
        varchar razorpay_payment_id
        varchar carrier
        varchar tracking_number
        timestamptz shipped_at
        timestamptz delivered_at
        jsonb admin_notes
        jsonb events
        timestamptz created_at
        timestamptz updated_at
    }

    order_items {
        serial id PK
        integer order_id FK
        integer product_id FK
        integer variant_id FK
        varchar sku
        varchar name
        varchar fit
        varchar size
        varchar color
        integer unit_price
        integer quantity
        text image_key
        text image_url
    }

    order_events {
        serial id PK
        integer order_id FK
        varchar kind
        varchar status
        text note
        boolean is_internal
        varchar actor
        timestamptz created_at
    }
```

---

## 4. Before / After Table Summary

| Table | V1 (Current) | V2 (Target) | Notes |
| :--- | :--- | :--- | :--- |
| `categories` | None (hardcoded enum) | Normalized table with parent hierarchy and sort order | Seeded from `CATEGORIES` const + `jeans` |
| `product_images` | None (`products.img`, `img2`, `images` URLs) | Normalized rows with `storage_key` / `external_url` | Ordered by `position` (0=main, 1=hover) |
| `products` | Category as varchar; status buried in `admin_data`; attributes dropped | Real `category_id`, unique `slug`, indexed `status`, `attributes` JSONB | Dual-writes to legacy columns until Phase 4 |
| `product_variants`| No check constraints | Added CHECKs: `stock >= 0`, `reserved >= 0`, `price >= 0`, valid statuses | Unchanged columns |
| `users` | Basic IAM | Added `google_sub`, `onboarding_completed_at`, unique lowercase email | Supports Google SSO sub matching |
| `orders` | No `user_id`, JSONB arrays for `items`/`events` | Added `user_id`, `razorpay_order_id`, `razorpay_payment_id`, status CHECKs | Dual-writes items & events |
| `order_items` | None (JSONB in `orders.items`) | Normalized table with variant/product FKs & immutable image snapshot | Resolves SKU, price, size, image |
| `order_events` | None (JSONB in `orders.events` & `admin_notes`) | Append-only event stream with actor, timestamp, note | Single INSERTs replace read-modify-write |

---

## 5. Phase 1: Key-Based Image Storage Architecture

### 5.1 Storage Service & Drivers
Located at `apps/api/src/services/storage.ts`:
- **`ObjectStorage` interface**: Defines `put(key, bytes, contentType)`, `delete(key)`, `list(prefix)`, `getUrl(key)`.
- **`LocalStorageDriver`**: Used in local development and offline environments when no cloud bucket is configured. Writes files to `apps/api/.local-uploads/` (gitignored) and serves them via Express static middleware at `/assets`. Replaces the insecure base64 `data:` URI fallback.
- **`GcsStorageDriver`**: Production Google Cloud Storage driver utilizing `@google-cloud/storage`. Uses bucket `GCS_PRODUCT_IMAGES_BUCKET` with `Cache-Control: public, max-age=31536000, immutable`.
- **`S3StorageDriver`**: S3-compatible driver supporting AWS S3, Cloudflare R2, MinIO, or Google Cloud Storage interoperability endpoint (HMAC keys) via `@aws-sdk/client-s3`.

### 5.2 Bucket Configuration Requirements
1. **Public Read Permissions**:
   - The bucket path prefix `products/*` must be readable publicly via HTTP GET.
   - Alternatively, a CDN (e.g. Cloudflare, Cloud CDN) or custom domain must sit in front of the bucket and map to `ASSET_BASE_URL`.
2. **CORS Configuration**:
   - Because upload requests currently flow through the API server (`POST /api/uploads/products`), browser CORS on the storage bucket is **not** currently required.
   - If direct-to-bucket pre-signed browser uploads are added in the future, set CORS on the bucket:
     ```json
     [
       {
         "origin": ["https://teesgarage.in", "https://admin.teesgarage.in"],
         "method": ["PUT", "POST"],
         "responseHeader": ["Content-Type", "ETag"],
         "maxAgeSeconds": 3600
       }
     ]
     ```

### 5.3 URL Resolution & Helpers
Located in `@jeans-store/shared`:
- **`assetUrl(key)`**: Constructs the full public URL from `ASSET_BASE_URL` (or fallback GCS bucket URL).
- **`keyFromUrl(url)`**: Extracts the relative storage key (e.g., `products/<uuid>.webp`) if the URL starts with `ASSET_BASE_URL` or legacy GCS prefixes (`https://storage.googleapis.com/<bucket>/`), returning `null` for third-party or Unsplash URLs.

### 5.4 Dual-Write and Single-Query Reads
- **Write Path**: In `ProductStore.create()` and `update()`, images are normalized. Storage keys or external URLs are dual-written to `product_images` (sorted by `position`) and legacy columns `img`, `img2`, `images`. Base64 `data:` URIs and insecure non-HTTPS links are rejected.
- **Read Path**: Single SQL query loads all active images for listed products (`SELECT * FROM product_images`). `toProduct()` maps `position 0` -> `img`, `position 1` -> `img2` (with fallback to `img` if single image), and full gallery -> `images`. If no rows exist in `product_images` yet, it safely falls back to legacy columns.

### 5.5 Maintenance & Operations Scripts
- **Backfill**: `npx tsx scripts/backfill-product-images.ts` (Dry-run by default; pass `--apply` to write rows). Skips products already possessing `product_images` rows.
- **Orphan Prune**: `npx tsx scripts/prune-orphan-images.ts` (Dry-run by default; pass `--apply` to delete). Never deletes inline during product edits or deletions (safeguarding order history snapshots). Deletes only storage objects under `products/` that are older than 24 hours and referenced by neither `product_images.storage_key` nor `order_items.image_key`.

---

## 6. Future Normalization Roadmap

1. **`admin_state` Normalization**:
   Extract coupons, inventory movements, and audit log entries out of the `admin_state` JSON blob into dedicated tables (`coupons`, `coupon_redemptions`, `inventory_movements`, `audit_logs`).
2. **Customer Saved Addresses**:
   Add a `user_addresses` table linked to `users.id` with default shipping/billing flags.
3. **Reviews & Ratings**:
   Normalize customer product reviews into a `product_reviews` table with moderation states.
