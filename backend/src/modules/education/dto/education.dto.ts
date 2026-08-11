import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateEducationDto {
  @IsUUID()
  employee_id: string;

  @IsOptional()
  @IsString()
  degree_level?: string;

  @IsOptional()
  @IsString()
  field_of_study?: string;

  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  @IsDateString()
  graduation_date?: string;
}

export class UpdateEducationDto extends PartialType(CreateEducationDto) {}
