import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  company_id?: string;

  @IsOptional()
  @IsUUID()
  position_level_id?: string | null;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePositionDto extends PartialType(CreatePositionDto) {}
