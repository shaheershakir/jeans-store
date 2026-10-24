ALTER TABLE "store_settings" DROP CONSTRAINT IF EXISTS "store_settings_tax_rate_check";--> statement-breakpoint
ALTER TABLE "store_settings" ALTER COLUMN "tax_rate" SET DATA TYPE real USING (CASE WHEN "tax_rate" > 1 THEN "tax_rate" / 100.0 ELSE "tax_rate"::real END);--> statement-breakpoint
ALTER TABLE "store_settings" ALTER COLUMN "tax_rate" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_tax_rate_check" CHECK (tax_rate >= 0 AND tax_rate <= 1);--> statement-breakpoint
ALTER TABLE "admin_users" DROP CONSTRAINT IF EXISTS "admin_users_email_unique";--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "roles_name_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_unique";--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_slug_unique";--> statement-breakpoint
ALTER TABLE "collections" DROP CONSTRAINT IF EXISTS "collections_slug_unique";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_slug_unique";--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "product_variants_sku_unique";--> statement-breakpoint
ALTER TABLE "coupons" DROP CONSTRAINT IF EXISTS "coupons_code_unique";--> statement-breakpoint
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON "payments" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_refunds_updated_at BEFORE UPDATE ON "refunds" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_inventory_reservations_updated_at BEFORE UPDATE ON "inventory_reservations" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD COLUMN "landmark" varchar(255);
