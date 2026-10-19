CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"role_id" integer,
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email"),
	CONSTRAINT "admin_users_status_check" CHECK (status IN ('Active', 'Inactive'))
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" integer,
	"actor_name" varchar(255),
	"action" varchar(120) NOT NULL,
	"entity" varchar(80),
	"entity_id" varchar(120),
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"cta_label" varchar(120),
	"link" varchar(255),
	"image_url" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'Scheduled' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "banners_status_check" CHECK (status IN ('Active', 'Scheduled', 'Ended'))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(60) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"image_url" text,
	"parent_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"image_url" text,
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug"),
	CONSTRAINT "collections_status_check" CHECK (status IN ('Active', 'Inactive'))
);
--> statement-breakpoint
CREATE TABLE "coupon_categories" (
	"coupon_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "coupon_categories_coupon_id_category_id_pk" PRIMARY KEY("coupon_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "coupon_products" (
	"coupon_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	CONSTRAINT "coupon_products_coupon_id_product_id_pk" PRIMARY KEY("coupon_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"coupon_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"customer_id" integer,
	"amount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(60) NOT NULL,
	"description" text,
	"type" varchar(20) NOT NULL,
	"value" integer NOT NULL,
	"min_order_value" integer DEFAULT 0 NOT NULL,
	"max_discount" integer,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"usage_limit" integer,
	"per_customer_limit" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"times_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code"),
	CONSTRAINT "coupons_type_check" CHECK (type IN ('percentage', 'fixed')),
	CONSTRAINT "coupons_value_check" CHECK (value > 0),
	CONSTRAINT "coupons_usage_check" CHECK (times_used >= 0)
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"label" varchar(30) DEFAULT 'Home' NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"pincode" varchar(20) NOT NULL,
	"phone" varchar(50),
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_addresses_label_check" CHECK (label IN ('Home', 'Work', 'Other'))
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "homepage_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(40) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "homepage_sections_type_unique" UNIQUE("type"),
	CONSTRAINT "homepage_sections_type_check" CHECK (type IN ('announcement', 'hero', 'categories', 'new_arrivals', 'featured_collection', 'best_sellers', 'brand_story', 'looks', 'instagram', 'reviews', 'trust_bar', 'catalog'))
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"sku" varchar(100),
	"type" varchar(20) NOT NULL,
	"delta" integer NOT NULL,
	"before" integer NOT NULL,
	"after" integer NOT NULL,
	"reason" text,
	"reference" varchar(120),
	"actor_admin_id" integer,
	"actor_name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_movements_type_check" CHECK (type IN ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'RESERVATION', 'RELEASE'))
);
--> statement-breakpoint
CREATE TABLE "navigation_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"label" varchar(100) NOT NULL,
	"href" varchar(255) NOT NULL,
	"type" varchar(20) DEFAULT 'custom' NOT NULL,
	"target_value" varchar(100),
	"badge" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"open_in_new_tab" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "navigation_items_type_check" CHECK (type IN ('fit', 'category', 'custom'))
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" integer,
	"type" varchar(30) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_type_check" CHECK (type IN ('low-stock', 'order', 'payment', 'review', 'system'))
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"kind" varchar(20) NOT NULL,
	"status" varchar(30),
	"note" text,
	"is_internal" boolean DEFAULT false NOT NULL,
	"actor_admin_id" integer,
	"actor_name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_events_kind_check" CHECK (kind IN ('status', 'note', 'payment', 'shipment', 'return', 'refund'))
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"sku" varchar(100),
	"name" varchar(255) NOT NULL,
	"fit" varchar(50),
	"size" varchar(50) NOT NULL,
	"color" varchar(50),
	"unit_price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total" integer NOT NULL,
	"weight_grams" integer DEFAULT 0 NOT NULL,
	"image_key" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_quantity_check" CHECK (quantity > 0),
	CONSTRAINT "order_items_unit_price_check" CHECK (unit_price >= 0),
	CONSTRAINT "order_items_line_total_check" CHECK (line_total >= 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"customer_id" integer NOT NULL,
	"status" varchar(30) DEFAULT 'Pending' NOT NULL,
	"payment_status" varchar(20) DEFAULT 'Pending' NOT NULL,
	"handoff_type" varchar(20) DEFAULT 'whatsapp' NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_phone" varchar(50) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"apartment" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"pincode" varchar(20) NOT NULL,
	"notes" text,
	"subtotal" integer NOT NULL,
	"discount_total" integer DEFAULT 0 NOT NULL,
	"shipping" integer NOT NULL,
	"tax_total" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"weight_grams" integer DEFAULT 0 NOT NULL,
	"coupon_id" integer,
	"coupon_code" varchar(60),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_status_check" CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded')),
	CONSTRAINT "orders_payment_status_check" CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
	CONSTRAINT "orders_handoff_type_check" CHECK (handoff_type IN ('whatsapp', 'email', 'razorpay', 'cod')),
	CONSTRAINT "orders_totals_check" CHECK (subtotal >= 0 AND discount_total >= 0 AND shipping >= 0 AND tax_total >= 0 AND total >= 0),
	CONSTRAINT "orders_weight_check" CHECK (weight_grams >= 0)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"method" varchar(40) NOT NULL,
	"amount" integer NOT NULL,
	"status" varchar(20) DEFAULT 'Pending' NOT NULL,
	"gateway" varchar(40) DEFAULT 'razorpay' NOT NULL,
	"gateway_order_id" varchar(100),
	"gateway_payment_id" varchar(100),
	"gateway_fee" integer,
	"settled" boolean DEFAULT false NOT NULL,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone,
	CONSTRAINT "payments_gateway_payment_id_unique" UNIQUE("gateway_payment_id"),
	CONSTRAINT "payments_amount_check" CHECK (amount >= 0),
	CONSTRAINT "payments_status_check" CHECK (status IN ('Pending', 'Paid', 'Failed', 'Refunded'))
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"color" varchar(50),
	"storage_key" text,
	"external_url" text,
	"alt" varchar(255),
	"mime_type" varchar(80),
	"width" integer,
	"height" integer,
	"size_bytes" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_images_source_check" CHECK ((storage_key IS NOT NULL AND external_url IS NULL) OR (storage_key IS NULL AND external_url IS NOT NULL)),
	CONSTRAINT "product_images_position_check" CHECK (position >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"customer_id" integer,
	"order_id" integer,
	"order_item_id" integer,
	"reviewer_name" varchar(120) NOT NULL,
	"reviewer_email" varchar(255),
	"reviewer_location" varchar(120),
	"rating" smallint NOT NULL,
	"title" varchar(160),
	"content" text NOT NULL,
	"size_purchased" varchar(50),
	"fit_verdict" varchar(30),
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'Pending' NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"merchant_response" text,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_reviews_order_item_id_unique" UNIQUE("order_item_id"),
	CONSTRAINT "product_reviews_rating_check" CHECK (rating BETWEEN 1 AND 5),
	CONSTRAINT "product_reviews_status_check" CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Hidden')),
	CONSTRAINT "product_reviews_fit_verdict_check" CHECK (fit_verdict IS NULL OR fit_verdict IN ('True to Size', 'Slightly Snug', 'Runs Relaxed')),
	CONSTRAINT "product_reviews_helpful_check" CHECK (helpful_count >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"sku" varchar(100) NOT NULL,
	"size" varchar(50) NOT NULL,
	"color" varchar(50) NOT NULL,
	"color_hex" varchar(7),
	"price" integer,
	"stock" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"reorder_point" integer DEFAULT 5 NOT NULL,
	"weight_grams" integer,
	"barcode" varchar(100),
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku"),
	CONSTRAINT "product_variants_stock_check" CHECK (stock >= 0),
	CONSTRAINT "product_variants_reserved_check" CHECK (reserved >= 0),
	CONSTRAINT "product_variants_reserved_lte_stock_check" CHECK (reserved <= stock),
	CONSTRAINT "product_variants_price_check" CHECK (price IS NULL OR price >= 0),
	CONSTRAINT "product_variants_weight_check" CHECK (weight_grams IS NULL OR weight_grams > 0),
	CONSTRAINT "product_variants_status_check" CHECK (status IN ('Active', 'Inactive'))
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"collection_id" integer,
	"slug" varchar(160) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"fit" varchar(50),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"brand" varchar(100) DEFAULT 'TEESGARAGE' NOT NULL,
	"gender" varchar(20) DEFAULT 'Unisex' NOT NULL,
	"style_code" varchar(60),
	"price" integer NOT NULL,
	"compare_at_price" integer,
	"cost_price" integer,
	"tax_rate" integer DEFAULT 0 NOT NULL,
	"hsn_code" varchar(12),
	"badge" varchar(50),
	"is_featured" boolean DEFAULT false NOT NULL,
	"weight_grams" integer NOT NULL,
	"length_mm" integer,
	"width_mm" integer,
	"height_mm" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"wishlist_count" integer DEFAULT 0 NOT NULL,
	"rating_average" real DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"fabric" varchar(120),
	"material" varchar(120),
	"sleeve_length" varchar(60),
	"neck_type" varchar(60),
	"pattern" varchar(120),
	"print_style" varchar(120),
	"trim_color" varchar(80),
	"garment_length" varchar(60),
	"closure" varchar(80),
	"pockets" varchar(120),
	"leg_style" varchar(80),
	"rise" varchar(40),
	"inseam" real,
	"wash" varchar(120),
	"care_instructions" text,
	"country_of_origin" varchar(100) DEFAULT 'India' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_status_check" CHECK (status IN ('draft', 'active', 'archived')),
	CONSTRAINT "products_gender_check" CHECK (gender IN ('Men', 'Women', 'Unisex')),
	CONSTRAINT "products_price_check" CHECK (price >= 0),
	CONSTRAINT "products_weight_check" CHECK (weight_grams > 0),
	CONSTRAINT "products_rating_check" CHECK (rating_average >= 0 AND rating_average <= 5)
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"target" varchar(30) NOT NULL,
	"target_id" varchar(120),
	"discount_type" varchar(20) NOT NULL,
	"discount_value" integer NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'Scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_target_check" CHECK (target IN ('Product', 'Category', 'Collection', 'Fit', 'Color')),
	CONSTRAINT "promotions_discount_type_check" CHECK (discount_type IN ('percentage', 'fixed')),
	CONSTRAINT "promotions_status_check" CHECK (status IN ('Scheduled', 'Active', 'Ended'))
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" varchar(50) NOT NULL,
	"order_id" integer NOT NULL,
	"return_id" integer,
	"customer_id" integer,
	"amount" integer NOT NULL,
	"reason" text,
	"method" varchar(40) NOT NULL,
	"status" varchar(20) DEFAULT 'Pending' NOT NULL,
	"transaction_id" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "refunds_number_unique" UNIQUE("number"),
	CONSTRAINT "refunds_status_check" CHECK (status IN ('Pending', 'Processed', 'Failed')),
	CONSTRAINT "refunds_amount_check" CHECK (amount >= 0)
);
--> statement-breakpoint
CREATE TABLE "return_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"return_id" integer NOT NULL,
	"order_item_id" integer,
	"product_id" integer,
	"variant_id" integer,
	"sku" varchar(100),
	"product_name" varchar(255) NOT NULL,
	"variant_label" varchar(120),
	"unit_price" integer DEFAULT 0 NOT NULL,
	"quantity" integer NOT NULL,
	"line_total" integer DEFAULT 0 NOT NULL,
	"reason" text,
	"condition" varchar(60),
	CONSTRAINT "return_items_quantity_check" CHECK (quantity > 0)
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" varchar(50) NOT NULL,
	"order_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" varchar(30) DEFAULT 'Requested' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "return_requests_number_unique" UNIQUE("number"),
	CONSTRAINT "return_requests_status_check" CHECK (status IN ('Requested', 'Approved', 'Rejected', 'Pickup Scheduled', 'Received', 'Refunded', 'Completed')),
	CONSTRAINT "return_requests_amount_check" CHECK (amount >= 0)
);
--> statement-breakpoint
CREATE TABLE "review_helpful_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"storage_key" text,
	"external_url" text,
	"alt" varchar(255),
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_images_source_check" CHECK ((storage_key IS NOT NULL AND external_url IS NULL) OR (storage_key IS NULL AND external_url IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"permissions" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"carrier" varchar(100) NOT NULL,
	"tracking_number" varchar(120) NOT NULL,
	"status" varchar(30) DEFAULT 'Pending' NOT NULL,
	"shipped_at" timestamp with time zone,
	"eta" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipments_tracking_number_unique" UNIQUE("tracking_number"),
	CONSTRAINT "shipments_status_check" CHECK (status IN ('Pending', 'Booked', 'In Transit', 'Delivered', 'Failed', 'RTO'))
);
--> statement-breakpoint
CREATE TABLE "shipping_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_id" integer NOT NULL,
	"name" varchar(80) NOT NULL,
	"base_weight_grams" integer NOT NULL,
	"base_charge" integer NOT NULL,
	"additional_weight_grams" integer NOT NULL,
	"additional_charge" integer NOT NULL,
	"estimated_days_min" integer,
	"estimated_days_max" integer,
	"exact_delivery_date" varchar(40),
	"cod_available" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_methods_weights_check" CHECK (base_weight_grams > 0 AND base_charge >= 0 AND additional_weight_grams > 0 AND additional_charge >= 0)
);
--> statement-breakpoint
CREATE TABLE "shipping_zone_regions" (
	"zone_id" integer NOT NULL,
	"region" varchar(100) NOT NULL,
	CONSTRAINT "shipping_zone_regions_zone_id_region_pk" PRIMARY KEY("zone_id","region")
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_zones_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "size_chart_measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"size_chart_id" integer NOT NULL,
	"size" varchar(20) NOT NULL,
	"chest" real,
	"waist" real,
	"hip" real,
	"inseam" real,
	"thigh" real,
	"length" real,
	"shoulder" real
);
--> statement-breakpoint
CREATE TABLE "size_charts" (
	"id" serial PRIMARY KEY NOT NULL,
	"fit" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "size_charts_fit_unique" UNIQUE("fit")
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" varchar(30) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"store_name" varchar(120) DEFAULT 'TEESGARAGE' NOT NULL,
	"support_email" varchar(255),
	"support_phone" varchar(50),
	"address" text,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"tax_rate" integer DEFAULT 0 NOT NULL,
	"order_prefix" varchar(10) DEFAULT 'TG' NOT NULL,
	"return_window_days" integer DEFAULT 7 NOT NULL,
	"cancellation_allowed_after" varchar(40) DEFAULT 'Processing' NOT NULL,
	"default_shipping_method" varchar(80) DEFAULT 'Standard' NOT NULL,
	"notify_email" boolean DEFAULT true NOT NULL,
	"notify_order_updates" boolean DEFAULT true NOT NULL,
	"notify_inventory_alerts" boolean DEFAULT true NOT NULL,
	"notify_review_alerts" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" varchar(128) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"name" varchar(255) NOT NULL,
	"password_hash" text,
	"provider" varchar(50) DEFAULT 'cloud-iam' NOT NULL,
	"google_sub" varchar(255),
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_uid_unique" UNIQUE("uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_categories" ADD CONSTRAINT "coupon_categories_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_categories" ADD CONSTRAINT "coupon_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_products" ADD CONSTRAINT "coupon_products_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_products" ADD CONSTRAINT "coupon_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_actor_admin_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_actor_admin_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_return_id_return_requests_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."return_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_return_requests_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."return_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_review_id_product_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."product_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_review_id_product_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."product_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_zone_id_shipping_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_zone_regions" ADD CONSTRAINT "shipping_zone_regions_zone_id_shipping_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "size_chart_measurements" ADD CONSTRAINT "size_chart_measurements_size_chart_id_size_charts_id_fk" FOREIGN KEY ("size_chart_id") REFERENCES "public"."size_charts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_lower_email_idx" ON "admin_users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "categories_parent_sort_idx" ON "categories" USING btree ("parent_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_redemptions_coupon_order_idx" ON "coupon_redemptions" USING btree ("coupon_id","order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code_lower_idx" ON "coupons" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "customer_addresses_customer_idx" ON "customer_addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_addresses_one_default_idx" ON "customer_addresses" USING btree ("customer_id") WHERE is_default = true;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_lower_email_idx" ON "customers" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "inventory_movements_variant_created_idx" ON "inventory_movements" USING btree ("variant_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_movements_product_created_idx" ON "inventory_movements" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_admin_read_created_idx" ON "notifications" USING btree ("admin_user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_variant_idx" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_customer_created_idx" ON "orders" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_lower_email_idx" ON "orders" USING btree (lower("customer_email"));--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_product_position_idx" ON "product_images" USING btree ("product_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_storage_key_idx" ON "product_images" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "product_reviews_product_status_created_idx" ON "product_reviews" USING btree ("product_id","status","created_at");--> statement-breakpoint
CREATE INDEX "product_reviews_customer_idx" ON "product_reviews" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_product_color_size_idx" ON "product_variants" USING btree ("product_id","color","size");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_barcode_idx" ON "product_variants" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "products_category_status_idx" ON "products" USING btree ("category_id","status");--> statement-breakpoint
CREATE INDEX "products_collection_idx" ON "products" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "products_status_created_idx" ON "products" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "products_style_code_idx" ON "products" USING btree ("style_code");--> statement-breakpoint
CREATE INDEX "refunds_order_idx" ON "refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "return_items_return_idx" ON "return_items" USING btree ("return_id");--> statement-breakpoint
CREATE INDEX "return_requests_order_idx" ON "return_requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "return_requests_customer_idx" ON "return_requests" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "review_helpful_votes_review_customer_idx" ON "review_helpful_votes" USING btree ("review_id","customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "review_images_review_position_idx" ON "review_images" USING btree ("review_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_name_lower_idx" ON "roles" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "shipments_order_idx" ON "shipments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_methods_zone_name_idx" ON "shipping_methods" USING btree ("zone_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "size_chart_measurements_chart_size_idx" ON "size_chart_measurements" USING btree ("size_chart_id","size");--> statement-breakpoint
CREATE UNIQUE INDEX "users_lower_email_idx" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "wishlist_items_customer_product_idx" ON "wishlist_items" USING btree ("customer_id","product_id");--> statement-breakpoint
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON "roles" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_admin_users_updated_at BEFORE UPDATE ON "admin_users" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON "categories" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_collections_updated_at BEFORE UPDATE ON "collections" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON "products" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_product_variants_updated_at BEFORE UPDATE ON "product_variants" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_size_charts_updated_at BEFORE UPDATE ON "size_charts" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON "customers" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_customer_addresses_updated_at BEFORE UPDATE ON "customer_addresses" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON "coupons" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_promotions_updated_at BEFORE UPDATE ON "promotions" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_banners_updated_at BEFORE UPDATE ON "banners" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON "orders" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_return_requests_updated_at BEFORE UPDATE ON "return_requests" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_shipments_updated_at BEFORE UPDATE ON "shipments" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_product_reviews_updated_at BEFORE UPDATE ON "product_reviews" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_homepage_sections_updated_at BEFORE UPDATE ON "homepage_sections" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_navigation_items_updated_at BEFORE UPDATE ON "navigation_items" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_shipping_zones_updated_at BEFORE UPDATE ON "shipping_zones" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_shipping_methods_updated_at BEFORE UPDATE ON "shipping_methods" FOR EACH ROW EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER trg_store_settings_updated_at BEFORE UPDATE ON "store_settings" FOR EACH ROW EXECUTE FUNCTION set_updated_at();