import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsDateString, IsBoolean } from 'class-validator';

export class CreateWorkExperienceDto {
  @IsUUID()
  employee_id: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  position_name?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_current?: boolean = false;
}

export class UpdateWorkExperienceDto extends PartialType(CreateWorkExperienceDto) {}
