CREATE TABLE "navigation_items" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"label" varchar(100) NOT NULL,
	"href" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'custom' NOT NULL,
	"target_value" varchar(100),
	"badge" varchar(50),
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"open_in_new_tab" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"store" varchar(50) DEFAULT 'jean-store' NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_phone" varchar(50) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"apartment" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"pincode" varchar(20) NOT NULL,
	"notes" text,
	"items" jsonb NOT NULL,
	"subtotal" integer NOT NULL,
	"shipping" integer NOT NULL,
	"total" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"handoff_type" varchar(50) DEFAULT 'whatsapp' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"store" varchar(50) DEFAULT 'jean-store' NOT NULL,
	"category" varchar(50) DEFAULT 'jeans' NOT NULL,
	"name" varchar(255) NOT NULL,
	"fit" varchar(50),
	"price" varchar(50) NOT NULL,
	"price_num" integer NOT NULL,
	"img" text NOT NULL,
	"img2" text NOT NULL,
	"badge" varchar(50),
	"desc" text NOT NULL,
	"wash" varchar(100),
	"sizes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" varchar(128) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" text,
	"provider" varchar(50) DEFAULT 'cloud-iam' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_uid_unique" UNIQUE("uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
