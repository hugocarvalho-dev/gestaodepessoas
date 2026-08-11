-- AlterTable
ALTER TABLE "emergency_contact" ADD COLUMN     "phone_secondary" TEXT;

-- AlterTable
ALTER TABLE "person" ADD COLUMN     "cnh_category" TEXT,
ADD COLUMN     "cnh_expiry_date" DATE,
ADD COLUMN     "cnh_issue_date" DATE,
ADD COLUMN     "cnh_issuer" TEXT,
ADD COLUMN     "cnh_state" TEXT,
ADD COLUMN     "marital_status" TEXT,
ADD COLUMN     "rg_issue_date" DATE,
ADD COLUMN     "rg_issuer" TEXT,
ADD COLUMN     "rg_state" TEXT;

-- AlterTable
ALTER TABLE "personal_contact" ADD COLUMN     "address_number" TEXT,
ADD COLUMN     "corporate_phone" TEXT,
ADD COLUMN     "personal_email" TEXT;
