-- AlterTable
ALTER TABLE "position" ADD COLUMN     "deleted_at" TIMESTAMP(6),
ADD COLUMN     "department_id" UUID;

-- CreateIndex
CREATE INDEX "idx_position_department" ON "position"("department_id");

-- AddForeignKey
ALTER TABLE "position" ADD CONSTRAINT "position_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
