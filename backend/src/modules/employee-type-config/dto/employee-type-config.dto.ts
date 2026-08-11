import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateEmployeeTypeConfigDto {
  @IsString()
  value: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_system?: boolean;
}

export class UpdateEmployeeTypeConfigDto extends PartialType(CreateEmployeeTypeConfigDto) {}
