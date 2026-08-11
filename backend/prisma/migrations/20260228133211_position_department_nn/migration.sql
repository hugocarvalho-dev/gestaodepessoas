/*
  Warnings:

  - You are about to drop the column `department_id` on the `position` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "position_department" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "position_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "position_department_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_position_department_position" ON "position_department"("position_id");

-- CreateIndex
CREATE INDEX "idx_position_department_dept" ON "position_department"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "position_department_position_id_department_id_key" ON "position_department"("position_id", "department_id");

-- AddForeignKey
ALTER TABLE "position_department" ADD CONSTRAINT "position_department_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "position"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "position_department" ADD CONSTRAINT "position_department_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Migrate existing department_id data to junction table
INSERT INTO "position_department" ("id", "position_id", "department_id")
SELECT uuidv7(), "id", "department_id"
FROM "position"
WHERE "department_id" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "position" DROP CONSTRAINT "position_department_id_fkey";

-- DropIndex
DROP INDEX "idx_position_department";

-- AlterTable
ALTER TABLE "position" DROP COLUMN "department_id";
