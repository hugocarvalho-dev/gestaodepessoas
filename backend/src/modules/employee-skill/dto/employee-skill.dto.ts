import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeeSkillDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  skill_id: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  proficiency_level?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  years_of_experience?: number;
}

export class UpdateEmployeeSkillDto extends PartialType(CreateEmployeeSkillDto) {}
