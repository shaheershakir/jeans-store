CREATE TABLE IF NOT EXISTS "product_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"color" varchar(50),
	"storage_key" text,
	"external_url" text,
	"alt" varchar(255),
	"mime_type" varchar(50),
	"width" integer,
	"height" integer,
	"size_bytes" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_images_source_check" CHECK ((storage_key IS NOT NULL AND external_url IS NULL) OR (storage_key IS NULL AND external_url IS NOT NULL)),
	CONSTRAINT "product_images_position_check" CHECK (position >= 0)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_images_product_pos_idx" ON "product_images" USING btree ("product_id","position");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_images_storage_key_idx" ON "product_images" USING btree ("storage_key");
