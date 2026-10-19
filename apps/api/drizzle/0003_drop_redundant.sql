ALTER TABLE "coupons" DROP CONSTRAINT "coupons_usage_check";--> statement-breakpoint
ALTER TABLE "coupons" DROP COLUMN "times_used";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "image_url";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "coupon_code";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "settled";