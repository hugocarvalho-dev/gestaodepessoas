import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFamilyInfoDto {
  @IsUUID()
  person_id: string;

  @IsOptional()
  @IsString()
  marital_status?: string;

  @IsOptional()
  @IsString()
  spouse_name?: string;

  @IsOptional()
  @IsDateString()
  spouse_birthday?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  number_of_dependents?: number;
}

export class UpdateFamilyInfoDto extends PartialType(CreateFamilyInfoDto) {}
