CREATE TABLE IF NOT EXISTS "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(60) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tags_slug_lower_idx" ON "tags" USING btree (lower("slug"));
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tags_name_lower_idx" ON "tags" USING btree (lower("name"));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_tags" (
	"product_id" uuid NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "product_tags_product_id_tag_id_pk" PRIMARY KEY("product_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_tags_tag_idx" ON "product_tags" USING btree ("tag_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_collections" (
	"product_id" uuid NOT NULL,
	"collection_id" integer NOT NULL,
	CONSTRAINT "product_collections_product_id_collection_id_pk" PRIMARY KEY("product_id","collection_id")
);
--> statement-breakpoint
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_collections_collection_idx" ON "product_collections" USING btree ("collection_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_designs" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"price_override" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_designs_price_override_check" CHECK (price_override IS NULL OR price_override >= 0),
	CONSTRAINT "product_designs_sort_order_check" CHECK (sort_order >= 0),
	CONSTRAINT "product_designs_status_check" CHECK (status IN ('Active', 'Inactive'))
);
--> statement-breakpoint
ALTER TABLE "product_designs" ADD CONSTRAINT "product_designs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_designs_product_slug_lower_idx" ON "product_designs" USING btree ("product_id",lower("slug"));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_designs_product_sort_idx" ON "product_designs" USING btree ("product_id","sort_order");
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "short_description" varchar(200);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "track_inventory" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "continue_selling" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "length_cm" real;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "width_cm" real;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "height_cm" real;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seo_title" varchar(70);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seo_description" varchar(170);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_dimensions_check" CHECK ((length_cm IS NULL OR length_cm > 0) AND (width_cm IS NULL OR width_cm > 0) AND (height_cm IS NULL OR height_cm > 0));
--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "design_id" integer;
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_design_id_product_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."product_designs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DROP INDEX IF EXISTS "product_images_product_position_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_images_product_cover_position_idx" ON "product_images" USING btree ("product_id","position") WHERE design_id IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_images_design_position_idx" ON "product_images" USING btree ("design_id","position") WHERE design_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "design_id" integer;
--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_design_id_product_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."product_designs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DROP INDEX IF EXISTS "product_variants_product_color_size_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_legacy_product_color_size_idx" ON "product_variants" USING btree ("product_id","color","size") WHERE design_id IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_design_size_idx" ON "product_variants" USING btree ("design_id","size") WHERE design_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "design_id" integer;
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_design_id_product_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."product_designs"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "design_name" varchar(120);
--> statement-breakpoint
INSERT INTO "product_collections" ("product_id", "collection_id")
SELECT "id", "collection_id" FROM "products" WHERE "collection_id" IS NOT NULL
ON CONFLICT DO NOTHING;
