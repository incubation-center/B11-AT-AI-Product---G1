DO $$ BEGIN
 CREATE TYPE "public"."subscription_plan" AS ENUM('free_trial', 'starter', 'growth');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'payment_pending', 'past_due', 'expired', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"status" "subscription_status" NOT NULL,
	"amount_usd" numeric(12, 2) NOT NULL,
	"payway_client_id" text,
	"payway_device_id" text,
	"payway_request_time" text,
	"payway_token" text,
	"started_at" timestamp with time zone NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram_product_draft_sessions" (
	"telegram_user_id" bigint PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"draft_id" uuid,
	"stage" text NOT NULL,
	"lang" text DEFAULT 'km' NOT NULL,
	"seed_input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS "auth_verification_value_unique";--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "storefront_template" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "payway_link_url" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_product_draft_sessions" ADD CONSTRAINT "telegram_product_draft_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_product_draft_sessions" ADD CONSTRAINT "telegram_product_draft_sessions_draft_id_product_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."product_drafts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_tenant_id_idx" ON "subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_tenant_created_at_idx" ON "subscriptions" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_product_draft_sessions_tenant_id_idx" ON "telegram_product_draft_sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_product_draft_sessions_draft_id_idx" ON "telegram_product_draft_sessions" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_product_draft_sessions_stage_idx" ON "telegram_product_draft_sessions" USING btree ("stage");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_verification_value_idx" ON "verification" USING btree ("value");