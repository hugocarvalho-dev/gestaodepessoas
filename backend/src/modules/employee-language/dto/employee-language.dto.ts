import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export enum ProficiencyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  FLUENT = 'FLUENT',
  NATIVE = 'NATIVE',
}

export class CreateEmployeeLanguageDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  language_id: string;

  @IsOptional()
  @IsEnum(ProficiencyLevel)
  proficiency_level?: ProficiencyLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  proficiency_percentage?: number;
}

export class UpdateEmployeeLanguageDto extends PartialType(CreateEmployeeLanguageDto) {}
