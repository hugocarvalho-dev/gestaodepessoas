-- AlterTable
ALTER TABLE "employee" ADD COLUMN     "cost_center" TEXT;

-- AlterTable
ALTER TABLE "person" ADD COLUMN     "education_level" TEXT,
ADD COLUMN     "ethnicity" TEXT,
ADD COLUMN     "mother_name" TEXT,
ADD COLUMN     "pis" TEXT;

-- AlterTable
ALTER TABLE "personal_contact" ADD COLUMN     "address_complement" TEXT,
ADD COLUMN     "neighborhood" TEXT;
