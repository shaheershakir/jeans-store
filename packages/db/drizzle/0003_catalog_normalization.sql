-- 1. Create categories table
CREATE TABLE IF NOT EXISTS "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(50) NOT NULL UNIQUE,
	"name" varchar(100) NOT NULL,
	"parent_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Seed categories from CATEGORIES const plus jeans
INSERT INTO "categories" ("slug", "name", "sort_order", "is_active") VALUES
  ('stripes', 'Stripes', 1, true),
  ('fullsleeve', 'Fullsleeve', 2, true),
  ('drsleeve', 'Drsleeve', 3, true),
  ('printed-tees', 'Printed Tees', 4, true),
  ('ringer-tees', 'Ringer Tees', 5, true),
  ('henley', 'Henley', 6, true),
  ('trackpants', 'Trackpants', 7, true),
  ('sweatpants', 'Sweatpants', 8, true),
  ('t-shirts', 'T-Shirts', 9, true),
  ('shirts', 'Shirts', 10, true),
  ('hoodies', 'Hoodies', 11, true),
  ('accessories', 'Accessories', 12, true),
  ('jeans', 'Jeans', 13, true)
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
-- 2. Ensure product_variants exists and add check constraints
CREATE TABLE IF NOT EXISTS "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"sku" varchar(100) NOT NULL UNIQUE,
	"size" varchar(50) NOT NULL,
	"color" varchar(50) NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"reorder_point" integer DEFAULT 10 NOT NULL,
	"weight" integer DEFAULT 500 NOT NULL,
	"barcode" varchar(100),
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_product_color_size_idx" ON "product_variants" USING btree ("product_id","color","size");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_stock_check" CHECK (stock >= 0);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_reserved_check" CHECK (reserved >= 0);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_price_check" CHECK (price >= 0);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_status_check" CHECK (status IN ('Active', 'Inactive'));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- 3. Add additive columns to products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" integer;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "slug" varchar(160);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'active' NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "attributes" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_status_check" CHECK (status IN ('draft', 'active', 'archived'));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Convert created_at and updated_at to timestamptz
ALTER TABLE "products" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_store_status_category_idx" ON "products" USING btree ("store","status","category_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_idx" ON "products" USING btree ("slug");
--> statement-breakpoint
-- 4. Backfill category_id, status, and slug for existing rows
UPDATE "products" p
SET "category_id" = c.id
FROM "categories" c
WHERE p."category" = c.slug
  AND p."category_id" IS NULL;
--> statement-breakpoint
UPDATE "products"
SET "status" = CASE
  WHEN lower(admin_data->>'status') = 'archived' THEN 'archived'
  WHEN lower(admin_data->>'status') = 'draft' THEN 'draft'
  WHEN "category_id" IS NULL THEN 'archived'
  ELSE 'active'
END
WHERE "status" = 'active';
--> statement-breakpoint
UPDATE "products"
SET "slug" = trim(both '-' from lower(regexp_replace(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g'))) || '-' || "id"
WHERE "slug" IS NULL;
