/*
  Warnings:

  - You are about to drop the column `level` on the `position` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[company_id,name,position_level_id]` on the table `position` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "position_company_id_name_key";

-- AlterTable
ALTER TABLE "position" DROP COLUMN "level",
ADD COLUMN     "position_level_id" UUID;

-- CreateTable
CREATE TABLE "position_level" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "position_level_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_position_level_company" ON "position_level"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "position_level_company_id_name_key" ON "position_level"("company_id", "name");

-- CreateIndex
CREATE INDEX "idx_position_level" ON "position"("position_level_id");

-- CreateIndex
CREATE UNIQUE INDEX "position_company_id_name_position_level_id_key" ON "position"("company_id", "name", "position_level_id");

-- AddForeignKey
ALTER TABLE "position" ADD CONSTRAINT "position_position_level_id_fkey" FOREIGN KEY ("position_level_id") REFERENCES "position_level"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "position_level" ADD CONSTRAINT "position_level_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
