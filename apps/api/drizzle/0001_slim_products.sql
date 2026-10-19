ALTER TABLE "size_charts" DROP CONSTRAINT "size_charts_fit_unique";--> statement-breakpoint
ALTER TABLE "navigation_items" DROP CONSTRAINT "navigation_items_type_check";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_gender_check";--> statement-breakpoint
ALTER TABLE "promotions" DROP CONSTRAINT "promotions_target_check";--> statement-breakpoint
DROP INDEX "products_style_code_idx";--> statement-breakpoint
ALTER TABLE "size_charts" ADD COLUMN "category_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "size_charts" ADD CONSTRAINT "size_charts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "fit";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "fit";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "brand";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "gender";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "style_code";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "length_mm";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "width_mm";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "height_mm";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "wishlist_count";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "fabric";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "material";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "sleeve_length";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "neck_type";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "pattern";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "print_style";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "trim_color";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "garment_length";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "closure";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "pockets";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "leg_style";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "rise";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "inseam";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "wash";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "country_of_origin";--> statement-breakpoint
ALTER TABLE "size_charts" DROP COLUMN "fit";--> statement-breakpoint
ALTER TABLE "size_charts" ADD CONSTRAINT "size_charts_category_id_unique" UNIQUE("category_id");--> statement-breakpoint
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_type_check" CHECK (type IN ('category', 'collection', 'custom'));--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_target_check" CHECK (target IN ('Product', 'Category', 'Collection', 'Color'));