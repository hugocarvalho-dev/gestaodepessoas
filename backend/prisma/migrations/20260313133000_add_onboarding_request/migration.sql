CREATE TABLE "onboarding_request" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "company_id" UUID NOT NULL,
    "inviter_user_id" UUID,
    "invite_email" TEXT NOT NULL,
    "invite_name" TEXT,
    "employee_type_value" TEXT,
    "token_hash" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "required_fields" JSONB,
    "submitted_data" JSONB,
    "submitted_at" TIMESTAMP(6),
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMP(6),
    "review_notes" TEXT,
    "created_employee_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_request_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "onboarding_request_token_hash_key" ON "onboarding_request"("token_hash");
CREATE INDEX "idx_onboarding_request_company_status" ON "onboarding_request"("company_id", "status");
CREATE INDEX "idx_onboarding_request_token_expires" ON "onboarding_request"("token_expires_at");

ALTER TABLE "onboarding_request"
ADD CONSTRAINT "onboarding_request_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "onboarding_request"
ADD CONSTRAINT "onboarding_request_created_employee_id_fkey"
FOREIGN KEY ("created_employee_id") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
