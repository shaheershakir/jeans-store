-- Convert product identifiers from serial integers to UUIDs while preserving
-- every existing row. A session-scoped mapping table keeps child foreign keys
-- pointing at the same product after the primary key changes.
CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint
CREATE TEMP TABLE "product_uuid_map" ("old_id" integer PRIMARY KEY, "new_id" uuid NOT NULL);--> statement-breakpoint
INSERT INTO "product_uuid_map" ("old_id", "new_id") SELECT "id", gen_random_uuid() FROM "products";--> statement-breakpoint
ALTER TABLE "coupon_products" DROP CONSTRAINT "coupon_products_product_id_products_id_fk";--> statement-breakpoint
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_product_id_products_id_fk";--> statement-breakpoint
ALTER TABLE "inventory_reservations" DROP CONSTRAINT "inventory_reservations_product_id_products_id_fk";--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_products_id_fk";--> statement-breakpoint
ALTER TABLE "product_images" DROP CONSTRAINT "product_images_product_id_products_id_fk";--> statement-breakpoint
ALTER TABLE "product_reviews" DROP CONSTRAINT "product_reviews_product_id_products_id_fk";--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_product_id_products_id_fk";--> statement-breakpoint
ALTER TABLE "return_items" DROP CONSTRAINT "return_items_product_id_products_id_fk";--> statement-breakpoint
ALTER TABLE "coupon_products" DROP CONSTRAINT "coupon_products_coupon_id_product_id_pk";--> statement-breakpoint
ALTER TABLE "coupon_products" ADD COLUMN "product_id_new" uuid;--> statement-breakpoint
UPDATE "coupon_products" AS "target" SET "product_id_new" = "map"."new_id" FROM "product_uuid_map" AS "map" WHERE "target"."product_id" = "map"."old_id";--> statement-breakpoint
ALTER TABLE "coupon_products" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "coupon_products" RENAME COLUMN "product_id_new" TO "product_id";--> statement-breakpoint
ALTER TABLE "coupon_products" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon_products" ADD CONSTRAINT "coupon_products_coupon_id_product_id_pk" PRIMARY KEY ("coupon_id", "product_id");--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "product_id_new" uuid;--> statement-breakpoint
UPDATE "inventory_movements" AS "target" SET "product_id_new" = "map"."new_id" FROM "product_uuid_map" AS "map" WHERE "target"."product_id" = "map"."old_id";--> statement-breakpoint
ALTER TABLE "inventory_movements" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "inventory_movements" RENAME COLUMN "product_id_new" TO "product_id";--> statement-breakpoint
CREATE INDEX "inventory_movements_product_created_idx" ON "inventory_movements" USING btree ("product_id","created_at");--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD COLUMN "product_id_new" uuid;--> statement-breakpoint
UPDATE "inventory_reservations" AS "target" SET "product_id_new" = "map"."new_id" FROM "product_uuid_map" AS "map" WHERE "target"."product_id" = "map"."old_id";--> statement-breakpoint
ALTER TABLE "inventory_reservations" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "inventory_reservations" RENAME COLUMN "product_id_new" TO "product_id";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_id_new" uuid;--> statement-breakpoint
UPDATE "order_items" AS "target" SET "product_id_new" = "map"."new_id" FROM "product_uuid_map" AS "map" WHERE "target"."product_id" = "map"."old_id";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "order_items" RENAME COLUMN "product_id_new" TO "product_id";--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "product_id_new" uuid;--> statement-breakpoint
UPDATE "product_images" AS "target" SET "product_id_new" = "map"."new_id" FROM "product_uuid_map" AS "map" WHERE "target"."product_id" = "map"."old_id";--> statement-breakpoint
ALTER TABLE "product_images" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "product_images" RENAME COLUMN "product_id_new" TO "product_id";--> statement-breakpoint
ALTER TABLE "product_images" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_product_position_idx" ON "product_images" USING btree ("product_id","position");--> statement-breakpoint
ALTER TABLE "product_reviews" ADD COLUMN "product_id_new" uuid;--> statement-breakpoint
UPDATE "product_reviews" AS "target" SET "product_id_new" = "map"."new_id" FROM "product_uuid_map" AS "map" WHERE "target"."product_id" = "map"."old_id";--> statement-breakpoint
ALTER TABLE "product_reviews" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "product_reviews" RENAME COLUMN "product_id_new" TO "product_id";--> statement-breakpoint
ALTER TABLE "product_reviews" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "product_reviews_product_status_created_idx" ON "product_reviews" USING btree ("product_id","status","created_at");--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "product_id_new" uuid;--> statement-breakpoint
UPDATE "product_variants" AS "target" SET "product_id_new" = "map"."new_id" FROM "product_uuid_map" AS "map" WHERE "target"."product_id" = "map"."old_id";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "product_variants" RENAME COLUMN "product_id_new" TO "product_id";--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_product_color_size_idx" ON "product_variants" USING btree ("product_id","color","size");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
ALTER TABLE "return_items" ADD COLUMN "product_id_new" uuid;--> statement-breakpoint
UPDATE "return_items" AS "target" SET "product_id_new" = "map"."new_id" FROM "product_uuid_map" AS "map" WHERE "target"."product_id" = "map"."old_id";--> statement-breakpoint
ALTER TABLE "return_items" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "return_items" RENAME COLUMN "product_id_new" TO "product_id";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "id_new" uuid;--> statement-breakpoint
UPDATE "products" AS "target" SET "id_new" = "map"."new_id" FROM "product_uuid_map" AS "map" WHERE "target"."id" = "map"."old_id";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_pkey";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "products" RENAME COLUMN "id_new" TO "id";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "coupon_products" ADD CONSTRAINT "coupon_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
DROP TABLE "product_uuid_map";
