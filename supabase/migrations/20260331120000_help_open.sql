ALTER TABLE "public"."sessions"
  ADD COLUMN IF NOT EXISTS "help_open" boolean NOT NULL DEFAULT false;
