CREATE TABLE "onboarding_plan" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "fields" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_plan_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "onboarding_request"
ADD COLUMN IF NOT EXISTS "onboarding_plan_id" UUID;

CREATE INDEX IF NOT EXISTS "idx_onboarding_plan_company"
ON "onboarding_plan"("company_id");

CREATE INDEX IF NOT EXISTS "idx_onboarding_plan_company_active"
ON "onboarding_plan"("company_id", "is_active");

CREATE INDEX IF NOT EXISTS "idx_onboarding_request_plan"
ON "onboarding_request"("onboarding_plan_id");

ALTER TABLE "onboarding_plan"
ADD CONSTRAINT "onboarding_plan_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "onboarding_request"
ADD CONSTRAINT "onboarding_request_onboarding_plan_id_fkey"
FOREIGN KEY ("onboarding_plan_id") REFERENCES "onboarding_plan"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

UPDATE "onboarding_request"
SET "status" = 'EXPIRED',
    "reviewed_at" = COALESCE("reviewed_at", CURRENT_TIMESTAMP),
    "review_notes" = COALESCE("review_notes", 'Processo expirado automaticamente pelo sistema.')
WHERE "status" = 'PENDING'
  AND "token_expires_at" < CURRENT_TIMESTAMP;
