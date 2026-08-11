import { IsString, IsOptional, IsDateString, IsEnum, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeStatus } from './employee.dto';

class ContactDto {
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() personal_email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() corporate_phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() address_number?: string;
  @IsOptional() @IsString() address_complement?: string;
  @IsOptional() @IsString() neighborhood?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() postal_code?: string;
}

class EmergencyContactDto {
  @IsString() name: string;
  @IsString() phone: string;
  @IsOptional() @IsString() phone_secondary?: string;
  @IsOptional() @IsString() relationship?: string;
  @IsOptional() @IsBoolean() is_primary?: boolean;
}

class FamilyInfoDto {
  @IsOptional() @IsString() marital_status?: string;
  @IsOptional() @IsString() spouse_name?: string;
  @IsOptional() @IsDateString() spouse_birthday?: string;
  @IsOptional() @IsNumber() number_of_dependents?: number;
}

class ContractDto {
  @IsOptional() @IsString() contract_type?: string;
  @IsOptional() @IsString() work_hours?: string;
  @IsOptional() @IsDateString() start_date?: string;
  @IsOptional() @IsDateString() end_date?: string;
}

class SalaryDto {
  @IsNumber() amount: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsDateString() start_date?: string;
}

class LanguageDto {
  @IsString() language_id: string;
  @IsString() proficiency_level: string;
}

class SkillDto {
  @IsString() skill_id: string;
  @IsOptional() @IsNumber() proficiency_level?: number;
}

class DepartmentAssignDto {
  @IsString() department_id: string;
  @IsOptional() @IsDateString() start_date?: string;
  @IsOptional() @IsBoolean() is_primary?: boolean;
}

class PositionAssignDto {
  @IsString() position_id: string;
  @IsOptional() @IsDateString() start_date?: string;
}

export class CreateFullEmployeeDto {
  // ── Person data ──
  @IsString() first_name: string;
  @IsString() last_name: string;
  @IsOptional() @IsDateString() date_of_birth?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsString() government_id: string;
  @IsOptional() @IsString() marital_status?: string;
  @IsOptional() @IsString() mother_name?: string;
  @IsOptional() @IsString() ethnicity?: string;
  @IsOptional() @IsString() pis?: string;
  @IsOptional() @IsString() education_level?: string;
  @IsOptional() @IsString() rg?: string;
  @IsOptional() @IsString() rg_issuer?: string;
  @IsOptional() @IsString() rg_state?: string;
  @IsOptional() @IsDateString() rg_issue_date?: string;
  @IsOptional() @IsString() cnh?: string;
  @IsOptional() @IsString() cnh_category?: string;
  @IsOptional() @IsDateString() cnh_issue_date?: string;
  @IsOptional() @IsDateString() cnh_expiry_date?: string;
  @IsOptional() @IsString() cnh_issuer?: string;
  @IsOptional() @IsString() cnh_state?: string;
  @IsOptional() @IsString() photo_url?: string;
  @IsOptional() @IsBoolean() has_food_intolerance?: boolean;
  @IsOptional() @IsString() food_intolerance?: string;
  @IsOptional() @IsBoolean() has_medication_allergy?: boolean;
  @IsOptional() @IsString() medication_allergy?: string;

  // ── Contact ──
  @IsOptional() @ValidateNested() @Type(() => ContactDto)
  contact?: ContactDto;

  // ── Emergency contacts ──
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => EmergencyContactDto)
  emergency_contacts?: EmergencyContactDto[];

  // ── Family info ──
  @IsOptional() @ValidateNested() @Type(() => FamilyInfoDto)
  family?: FamilyInfoDto;

  // ── Employee data ──
  @IsOptional() @IsString() employee_number?: string;
  @IsOptional() @IsString() employee_type?: string;
  @IsOptional() @IsEnum(EmployeeStatus) status?: EmployeeStatus;
  @IsOptional() @IsString() manager_id?: string;
  @IsOptional() @IsString() cost_center_id?: string;
  @IsDateString() hire_date: string;
  @IsOptional() @IsDateString() termination_date?: string;
  @IsOptional() @IsString() termination_reason?: string;
  @IsOptional() @IsString() observation?: string;

  // ── Department & Position ──
  @IsOptional() @ValidateNested() @Type(() => DepartmentAssignDto)
  department?: DepartmentAssignDto;

  @IsOptional() @ValidateNested() @Type(() => PositionAssignDto)
  position?: PositionAssignDto;

  // ── Contract & Salary ──
  @IsOptional() @ValidateNested() @Type(() => ContractDto)
  contract?: ContractDto;

  @IsOptional() @ValidateNested() @Type(() => SalaryDto)
  salary?: SalaryDto;

  // ── Languages & Skills ──
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LanguageDto)
  languages?: LanguageDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SkillDto)
  skills?: SkillDto[];
}
