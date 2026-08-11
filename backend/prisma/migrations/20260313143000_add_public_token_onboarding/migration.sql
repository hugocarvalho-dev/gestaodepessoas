ALTER TABLE "onboarding_request"
ADD COLUMN IF NOT EXISTS "public_token" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "onboarding_request_public_token_key"
ON "onboarding_request"("public_token");
