ALTER TABLE "product_drafts"
ADD COLUMN IF NOT EXISTS "index_status" text NOT NULL DEFAULT 'pending';

ALTER TABLE "product_drafts"
ADD COLUMN IF NOT EXISTS "index_error" text;

ALTER TABLE "product_drafts"
ADD COLUMN IF NOT EXISTS "index_attempts" integer NOT NULL DEFAULT 0;

ALTER TABLE "product_drafts"
ADD COLUMN IF NOT EXISTS "indexed_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "product_drafts_index_status_idx" ON "product_drafts" ("index_status");
