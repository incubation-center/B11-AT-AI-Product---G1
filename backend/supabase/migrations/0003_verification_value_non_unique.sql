DROP INDEX IF EXISTS "auth_verification_value_unique";
CREATE INDEX IF NOT EXISTS "auth_verification_value_idx" ON "verification" USING btree ("value");
