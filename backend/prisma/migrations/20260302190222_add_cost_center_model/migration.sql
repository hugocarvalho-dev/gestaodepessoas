/*
  Warnings:

  - You are about to drop the column `cost_center` on the `employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employee" DROP COLUMN "cost_center",
ADD COLUMN     "cost_center_id" UUID;

-- CreateTable
CREATE TABLE "cost_center" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_center_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_cost_center_company" ON "cost_center"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "cost_center_company_id_name_key" ON "cost_center"("company_id", "name");

-- CreateIndex
CREATE INDEX "idx_employee_cost_center" ON "employee"("cost_center_id");

-- AddForeignKey
ALTER TABLE "cost_center" ADD CONSTRAINT "cost_center_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_center"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
