CREATE TABLE IF NOT EXISTS "telegram_product_draft_sessions" (
  "telegram_user_id" bigint PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "draft_id" uuid,
  "stage" text NOT NULL,
  "lang" text NOT NULL DEFAULT 'km',
  "seed_input" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_product_draft_sessions" ADD CONSTRAINT "telegram_product_draft_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_product_draft_sessions" ADD CONSTRAINT "telegram_product_draft_sessions_draft_id_product_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."product_drafts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_product_draft_sessions_tenant_id_idx" ON "telegram_product_draft_sessions" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_product_draft_sessions_draft_id_idx" ON "telegram_product_draft_sessions" ("draft_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_product_draft_sessions_stage_idx" ON "telegram_product_draft_sessions" ("stage");
