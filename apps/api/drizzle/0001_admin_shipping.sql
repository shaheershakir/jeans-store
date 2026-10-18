ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "admin_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "images" jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "products" ALTER COLUMN "category" SET DEFAULT 'printed-tees';

UPDATE "products"
SET "admin_data" = jsonb_set(COALESCE("admin_data", '{}'::jsonb), '{status}', to_jsonb('Archived'::text), true)
WHERE "category" NOT IN ('stripes', 'fullsleeve', 'drsleeve', 'printed-tees', 'ringer-tees', 'henley', 'trackpants', 'sweatpants');

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "payment_status" varchar(50) NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS "carrier" varchar(100),
  ADD COLUMN IF NOT EXISTS "tracking_number" varchar(100),
  ADD COLUMN IF NOT EXISTS "shipped_at" timestamp,
  ADD COLUMN IF NOT EXISTS "delivered_at" timestamp,
  ADD COLUMN IF NOT EXISTS "admin_notes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "events" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();

UPDATE "orders"
SET "payment_status" = CASE WHEN lower("status") = 'paid' OR "handoff_type" = 'razorpay' THEN 'Paid' ELSE 'Pending' END,
    "status" = CASE
      WHEN lower("status") = 'paid' THEN 'Confirmed'
      WHEN lower("status") = 'pending' THEN 'Pending'
      ELSE initcap("status")
    END;

ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'Pending';

CREATE TABLE IF NOT EXISTS "shipping_settings" (
  "id" varchar(50) PRIMARY KEY,
  "rates" jsonb NOT NULL,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "admin_state" (
  "id" varchar(50) PRIMARY KEY,
  "data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
