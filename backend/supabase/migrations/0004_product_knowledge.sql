CREATE TABLE IF NOT EXISTS "product_knowledge" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE cascade,
  "overview_km" text,
  "overview_en" text,
  "usage_km" text,
  "usage_en" text,
  "suitability_km" text,
  "suitability_en" text,
  "key_specs_km" text,
  "key_specs_en" text,
  "faqs_km" jsonb,
  "faqs_en" jsonb,
  "qa_history" jsonb,
  "readiness_status" text NOT NULL DEFAULT 'draft',
  "missing_fields" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_knowledge_product_id_unique" ON "product_knowledge" ("product_id");
CREATE INDEX IF NOT EXISTS "product_knowledge_tenant_id_idx" ON "product_knowledge" ("tenant_id");
CREATE INDEX IF NOT EXISTS "product_knowledge_readiness_idx" ON "product_knowledge" ("readiness_status");
