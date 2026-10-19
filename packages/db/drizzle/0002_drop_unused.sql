DROP TABLE "review_helpful_votes" CASCADE;--> statement-breakpoint
DROP TABLE "wishlist_items" CASCADE;--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "gateway_fee";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "failure_reason";--> statement-breakpoint
ALTER TABLE "product_reviews" DROP COLUMN "reviewer_location";--> statement-breakpoint
ALTER TABLE "product_reviews" DROP COLUMN "size_purchased";--> statement-breakpoint
ALTER TABLE "product_reviews" DROP COLUMN "helpful_count";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "color_hex";