-- Remove ISO code from language master table
ALTER TABLE "language"
DROP COLUMN IF EXISTS "iso_code";
