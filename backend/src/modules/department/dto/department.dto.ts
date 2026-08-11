import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  name: string;

  @IsString()
  company_id: string;

  @IsOptional()
  @IsUUID()
  parent_department_id?: string;

  @IsOptional()
  @IsUUID()
  manager_employee_id?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
