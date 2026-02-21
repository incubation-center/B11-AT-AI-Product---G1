DO $$
BEGIN
	IF to_regclass('public.user') IS NOT NULL AND to_regclass('public.user_auth') IS NULL THEN
		ALTER TABLE "public"."user" RENAME TO "user_auth";
	END IF;
END $$;
