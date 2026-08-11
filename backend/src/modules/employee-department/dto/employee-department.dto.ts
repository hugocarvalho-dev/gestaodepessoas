import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsDateString, IsBoolean } from 'class-validator';

export class CreateEmployeeDepartmentDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  department_id: string;

  @IsDateString()
  start_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean = true;
}

export class UpdateEmployeeDepartmentDto extends PartialType(CreateEmployeeDepartmentDto) {}
