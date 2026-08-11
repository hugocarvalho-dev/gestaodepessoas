import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
}

export enum EmployeeType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACTOR = 'CONTRACTOR',
  INTERN = 'INTERN',
}

export class CreateEmployeeDto {
  @IsUUID()
  person_id: string;

  @IsUUID()
  company_id: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toUpperCase() || undefined)
  employee_number?: string;

  @IsOptional()
  @IsString()
  employee_type?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus = EmployeeStatus.ACTIVE;

  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @IsOptional()
  @IsUUID()
  cost_center_id?: string;

  @IsDateString()
  hire_date: string;

  @IsOptional()
  @IsDateString()
  termination_date?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  termination_reason?: string;

  @IsOptional()
  @IsString()
  observation?: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}


