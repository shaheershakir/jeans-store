CREATE TABLE "inventory_reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"gateway_order_id" varchar(100),
	"reservation_key" varchar(200) NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"quantity" integer NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"release_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_reservations_reservation_key_unique" UNIQUE("reservation_key"),
	CONSTRAINT "inventory_reservations_quantity_check" CHECK (quantity > 0),
	CONSTRAINT "inventory_reservations_status_check" CHECK (status IN ('active', 'confirmed', 'released', 'expired')),
	CONSTRAINT "inventory_reservations_reference_check" CHECK (order_id IS NOT NULL OR gateway_order_id IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(40) DEFAULT 'razorpay' NOT NULL,
	"event_id" varchar(160) NOT NULL,
	"event_type" varchar(80) NOT NULL,
	"gateway_order_id" varchar(100),
	"gateway_payment_id" varchar(100),
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'Received' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "payment_events_status_check" CHECK (status IN ('Received', 'Processed', 'Failed', 'Ignored', 'Unmatched')),
	CONSTRAINT "payment_events_attempts_check" CHECK (attempts >= 0)
);
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_gateway_payment_id_unique";--> statement-breakpoint
ALTER TABLE "coupons" DROP CONSTRAINT "coupons_value_check";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_status_check";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD COLUMN "status" varchar(20) DEFAULT 'Redeemed' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "order_id" integer;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "reservation_id" integer;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "dedupe_key" varchar(200);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "discount_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "taxable_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "tax_rate" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "tax_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_label" varchar(120);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_code" varchar(60);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "order_number" varchar(50);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "amount_refunded" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "currency" varchar(3) DEFAULT 'INR' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "idempotency_key" varchar(160);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "failure_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "payment_id" integer;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "gateway_refund_id" varchar(120);--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "idempotency_key" varchar(160);--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "failure_reason" text;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "order_items" SET "taxable_amount" = "line_total" - "discount_amount" WHERE "taxable_amount" <> "line_total" - "discount_amount";--> statement-breakpoint
UPDATE "coupons" SET "code" = lower(btrim("code"))
WHERE "code" <> lower(btrim("code"))
  AND NOT EXISTS (
    SELECT 1 FROM "coupons" AS "other"
    WHERE "other"."id" <> "coupons"."id"
      AND lower(btrim("other"."code")) = lower(btrim("coupons"."code"))
  );--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_reservations_order_idx" ON "inventory_reservations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "inventory_reservations_gateway_status_idx" ON "inventory_reservations" USING btree ("gateway_order_id","status");--> statement-breakpoint
CREATE INDEX "inventory_reservations_status_expiry_idx" ON "inventory_reservations" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "inventory_reservations_variant_idx" ON "inventory_reservations" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_provider_event_idx" ON "payment_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX "payment_events_status_received_idx" ON "payment_events" USING btree ("status","received_at");--> statement-breakpoint
CREATE INDEX "payment_events_gateway_order_idx" ON "payment_events" USING btree ("gateway_order_id");--> statement-breakpoint
CREATE INDEX "payment_events_gateway_payment_idx" ON "payment_events" USING btree ("gateway_payment_id");--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_reservation_id_inventory_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."inventory_reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_lower_idx" ON "categories" USING btree (lower("slug"));--> statement-breakpoint
CREATE UNIQUE INDEX "collections_slug_lower_idx" ON "collections" USING btree (lower("slug"));--> statement-breakpoint
CREATE INDEX "coupon_redemptions_coupon_status_idx" ON "coupon_redemptions" USING btree ("coupon_id","status");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_coupon_customer_idx" ON "coupon_redemptions" USING btree ("coupon_id","customer_id");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_order_idx" ON "coupon_redemptions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "coupons_active_window_idx" ON "coupons" USING btree ("is_active","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "inventory_movements_order_idx" ON "inventory_movements" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "inventory_movements_reference_idx" ON "inventory_movements" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_movements_dedupe_key_idx" ON "inventory_movements" USING btree ("dedupe_key") WHERE dedupe_key IS NOT NULL;--> statement-breakpoint
CREATE INDEX "orders_payment_status_created_idx" ON "orders" USING btree ("payment_status","created_at");--> statement-breakpoint
CREATE INDEX "payments_status_created_idx" ON "payments" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "payments_order_number_idx" ON "payments" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_gateway_order_idx" ON "payments" USING btree ("gateway","gateway_order_id") WHERE gateway_order_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_gateway_payment_idx" ON "payments" USING btree ("gateway","gateway_payment_id") WHERE gateway_payment_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_idx" ON "payments" USING btree ("idempotency_key") WHERE idempotency_key IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_lower_idx" ON "product_variants" USING btree (lower("sku"));--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_lower_idx" ON "products" USING btree (lower("slug"));--> statement-breakpoint
CREATE INDEX "refunds_order_status_idx" ON "refunds" USING btree ("order_id","status");--> statement-breakpoint
CREATE INDEX "refunds_status_created_idx" ON "refunds" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "refunds_payment_idx" ON "refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "refunds_gateway_refund_idx" ON "refunds" USING btree ("method","gateway_refund_id") WHERE gateway_refund_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "refunds_idempotency_key_idx" ON "refunds" USING btree ("idempotency_key") WHERE idempotency_key IS NOT NULL;--> statement-breakpoint
CREATE INDEX "return_items_order_item_idx" ON "return_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "shipments_status_created_idx" ON "shipments" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_zones_one_default_idx" ON "shipping_zones" USING btree ("is_default") WHERE is_default = true;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_window_check" CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at) NOT VALID;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "banners" WHERE starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at <= starts_at) THEN
    ALTER TABLE "banners" VALIDATE CONSTRAINT "banners_window_check";
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_sort_order_check" CHECK (sort_order >= 0);--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_sort_order_check" CHECK (sort_order >= 0);--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_sort_order_check" CHECK (sort_order >= 0);--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_amount_check" CHECK (amount >= 0);--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_status_check" CHECK (status IN ('Pending', 'Redeemed', 'Released'));--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_code_normalized_check" CHECK (code = lower(code)) NOT VALID;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_min_order_value_check" CHECK (min_order_value >= 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_max_discount_check" CHECK (max_discount IS NULL OR max_discount > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_usage_limit_check" CHECK (usage_limit IS NULL OR usage_limit > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_per_customer_limit_check" CHECK (per_customer_limit > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_window_check" CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at) NOT VALID;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_value_check" CHECK ((type = 'percentage' AND value > 0 AND value <= 100) OR (type = 'fixed' AND value > 0)) NOT VALID;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "coupons" WHERE "code" <> lower("code")) THEN
    ALTER TABLE "coupons" VALIDATE CONSTRAINT "coupons_code_normalized_check";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "coupons" WHERE min_order_value < 0) THEN
    ALTER TABLE "coupons" VALIDATE CONSTRAINT "coupons_min_order_value_check";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "coupons" WHERE max_discount IS NOT NULL AND max_discount <= 0) THEN
    ALTER TABLE "coupons" VALIDATE CONSTRAINT "coupons_max_discount_check";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "coupons" WHERE usage_limit IS NOT NULL AND usage_limit <= 0) THEN
    ALTER TABLE "coupons" VALIDATE CONSTRAINT "coupons_usage_limit_check";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "coupons" WHERE per_customer_limit <= 0) THEN
    ALTER TABLE "coupons" VALIDATE CONSTRAINT "coupons_per_customer_limit_check";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "coupons" WHERE starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at <= starts_at) THEN
    ALTER TABLE "coupons" VALIDATE CONSTRAINT "coupons_window_check";
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "coupons"
    WHERE NOT ((type = 'percentage' AND value > 0 AND value <= 100) OR (type = 'fixed' AND value > 0))
  ) THEN
    ALTER TABLE "coupons" VALIDATE CONSTRAINT "coupons_value_check";
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "homepage_sections" ADD CONSTRAINT "homepage_sections_sort_order_check" CHECK (sort_order >= 0);--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_balance_check" CHECK (before >= 0 AND after >= 0 AND after = before + delta) NOT VALID;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "inventory_movements" WHERE before < 0 OR after < 0 OR after <> before + delta) THEN
    ALTER TABLE "inventory_movements" VALIDATE CONSTRAINT "inventory_movements_balance_check";
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_sort_order_check" CHECK (sort_order >= 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_line_total_reconciliation_check" CHECK (line_total = unit_price * quantity) NOT VALID;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "order_items" WHERE line_total <> unit_price * quantity) THEN
    ALTER TABLE "order_items" VALIDATE CONSTRAINT "order_items_line_total_reconciliation_check";
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_discount_amount_check" CHECK (discount_amount >= 0 AND discount_amount <= line_total);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_taxable_amount_check" CHECK (taxable_amount >= 0 AND taxable_amount = line_total - discount_amount);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tax_rate_check" CHECK (tax_rate >= 0 AND tax_rate <= 1);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tax_amount_check" CHECK (tax_amount >= 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_weight_check" CHECK (weight_grams >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_lte_subtotal_check" CHECK (discount_total <= subtotal) NOT VALID;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "orders" WHERE discount_total > subtotal) THEN
    ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_discount_lte_subtotal_check";
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_reconciliation_check" CHECK (total = subtotal - discount_total + shipping + tax_total) NOT VALID;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "orders" WHERE total <> subtotal - discount_total + shipping + tax_total) THEN
    ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_total_reconciliation_check";
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_refunded_check" CHECK (amount_refunded >= 0 AND amount_refunded <= amount);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_status_check" CHECK (status IN ('Pending', 'Authorized', 'Paid', 'Failed', 'Cancelled', 'Refunded'));--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_reorder_point_check" CHECK (reorder_point >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_compare_at_price_check" CHECK (compare_at_price IS NULL OR compare_at_price >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_cost_price_check" CHECK (cost_price IS NULL OR cost_price >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tax_rate_check" CHECK (tax_rate >= 0 AND tax_rate <= 1);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_review_count_check" CHECK (review_count >= 0);--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_discount_value_check" CHECK (discount_value > 0 AND (discount_type <> 'percentage' OR discount_value <= 100)) NOT VALID;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_window_check" CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at) NOT VALID;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "promotions"
    WHERE NOT (discount_value > 0 AND (discount_type <> 'percentage' OR discount_value <= 100))
  ) THEN
    ALTER TABLE "promotions" VALIDATE CONSTRAINT "promotions_discount_value_check";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "promotions" WHERE starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at <= starts_at) THEN
    ALTER TABLE "promotions" VALIDATE CONSTRAINT "promotions_window_check";
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_unit_price_check" CHECK (unit_price >= 0);--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_line_total_check" CHECK (line_total >= 0);--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_details_check" CHECK (length(btrim(reason)) > 0);--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_delivery_window_check" CHECK (delivered_at IS NULL OR shipped_at IS NULL OR delivered_at >= shipped_at);--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_estimate_check" CHECK (estimated_days_min IS NULL OR estimated_days_min >= 0);--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_estimate_range_check" CHECK (estimated_days_max IS NULL OR (estimated_days_max >= 0 AND (estimated_days_min IS NULL OR estimated_days_max >= estimated_days_min)));--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_tax_rate_check" CHECK (tax_rate >= 0 AND tax_rate <= 100);--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_return_window_check" CHECK (return_window_days >= 0);