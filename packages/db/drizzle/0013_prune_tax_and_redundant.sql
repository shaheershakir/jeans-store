ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_tax_rate_check";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_dimensions_check";--> statement-breakpoint
DROP INDEX IF EXISTS "products_collection_idx";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "tax_rate";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "hsn_code";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "collection_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "care_instructions";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "badge";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "length_cm";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "width_cm";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "height_cm";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "seo_title";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "seo_description";--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_taxable_amount_check";--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_tax_rate_check";--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_tax_amount_check";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "tax_rate";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "tax_amount";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "taxable_amount";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "variant_label";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_totals_check";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_total_reconciliation_check";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "tax_total";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "coupon_code";--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_totals_check" CHECK (subtotal >= 0 AND discount_total >= 0 AND shipping >= 0 AND total >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_reconciliation_check" CHECK (total = subtotal - discount_total + shipping);--> statement-breakpoint
ALTER TABLE "store_settings" DROP CONSTRAINT IF EXISTS "store_settings_tax_rate_check";--> statement-breakpoint
ALTER TABLE "store_settings" DROP CONSTRAINT IF EXISTS "store_settings_return_window_check";--> statement-breakpoint
ALTER TABLE "store_settings" DROP COLUMN IF EXISTS "tax_rate";--> statement-breakpoint
ALTER TABLE "store_settings" DROP COLUMN IF EXISTS "return_window_days";--> statement-breakpoint
ALTER TABLE "store_settings" DROP COLUMN IF EXISTS "cancellation_allowed_after";--> statement-breakpoint
ALTER TABLE "store_settings" DROP COLUMN IF EXISTS "default_shipping_method";--> statement-breakpoint
ALTER TABLE "store_settings" DROP COLUMN IF EXISTS "notify_email";--> statement-breakpoint
ALTER TABLE "store_settings" DROP COLUMN IF EXISTS "notify_order_updates";--> statement-breakpoint
ALTER TABLE "store_settings" DROP COLUMN IF EXISTS "notify_inventory_alerts";--> statement-breakpoint
ALTER TABLE "store_settings" DROP COLUMN IF EXISTS "notify_review_alerts";--> statement-breakpoint
DROP TABLE IF EXISTS "review_images" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "return_items" CASCADE;--> statement-breakpoint
ALTER TABLE "refunds" DROP COLUMN IF EXISTS "return_id";--> statement-breakpoint
ALTER TABLE "refunds" DROP COLUMN IF EXISTS "transaction_id";--> statement-breakpoint
DROP TABLE IF EXISTS "return_requests" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "promotions" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "banners" CASCADE;--> statement-breakpoint
ALTER TABLE "audit_log" DROP COLUMN IF EXISTS "admin_user_id";--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_admin_read_created_idx";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "admin_user_id";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_read_created_idx" ON "notifications" USING btree ("is_read","created_at");--> statement-breakpoint
ALTER TABLE "inventory_movements" DROP COLUMN IF EXISTS "actor_admin_id";--> statement-breakpoint
ALTER TABLE "order_events" DROP COLUMN IF EXISTS "actor_admin_id";--> statement-breakpoint
DROP TABLE IF EXISTS "admin_users" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "roles" CASCADE;--> statement-breakpoint
ALTER TABLE "product_images" DROP COLUMN IF EXISTS "color";--> statement-breakpoint
DROP INDEX IF EXISTS "product_variants_barcode_idx";--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "product_variants_reorder_point_check";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "barcode";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "reorder_point";--> statement-breakpoint
ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "product_reviews_fit_verdict_check";--> statement-breakpoint
ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "product_reviews_order_item_id_unique";--> statement-breakpoint
ALTER TABLE "product_reviews" DROP COLUMN IF EXISTS "fit_verdict";--> statement-breakpoint
ALTER TABLE "product_reviews" DROP COLUMN IF EXISTS "order_id";--> statement-breakpoint
ALTER TABLE "product_reviews" DROP COLUMN IF EXISTS "order_item_id";--> statement-breakpoint
DROP INDEX IF EXISTS "categories_parent_sort_idx";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN IF EXISTS "parent_id";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN IF EXISTS "image_url";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_sort_idx" ON "categories" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "collections" DROP COLUMN IF EXISTS "image_url";--> statement-breakpoint
ALTER TABLE "size_chart_measurements" DROP COLUMN IF EXISTS "shoulder";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "onboarding_completed_at";
