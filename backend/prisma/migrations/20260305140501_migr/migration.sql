-- AlterTable
ALTER TABLE "employee" ADD COLUMN     "observation" TEXT;

-- AlterTable
ALTER TABLE "person" ADD COLUMN     "food_intolerance" TEXT,
ADD COLUMN     "has_food_intolerance" BOOLEAN DEFAULT false,
ADD COLUMN     "has_medication_allergy" BOOLEAN DEFAULT false,
ADD COLUMN     "medication_allergy" TEXT;

-- CreateTable
CREATE TABLE "employee_type_config" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "company_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_type_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_type_config" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "company_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_type_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_employee_type_config_company" ON "employee_type_config"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_type_config_company_id_value_key" ON "employee_type_config"("company_id", "value");

-- CreateIndex
CREATE INDEX "idx_contract_type_config_company" ON "contract_type_config"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_type_config_company_id_value_key" ON "contract_type_config"("company_id", "value");

-- AddForeignKey
ALTER TABLE "employee_type_config" ADD CONSTRAINT "employee_type_config_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contract_type_config" ADD CONSTRAINT "contract_type_config_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
