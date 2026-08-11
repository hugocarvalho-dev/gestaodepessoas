import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateContractTypeConfigDto {
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

export class UpdateContractTypeConfigDto extends PartialType(CreateContractTypeConfigDto) {}
