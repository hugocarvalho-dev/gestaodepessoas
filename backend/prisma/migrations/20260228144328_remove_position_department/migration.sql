/*
  Warnings:

  - You are about to drop the `position_department` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "position_department" DROP CONSTRAINT "position_department_department_id_fkey";

-- DropForeignKey
ALTER TABLE "position_department" DROP CONSTRAINT "position_department_position_id_fkey";

-- DropTable
DROP TABLE "position_department";
