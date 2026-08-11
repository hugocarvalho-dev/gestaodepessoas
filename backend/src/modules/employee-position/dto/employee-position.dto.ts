import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateEmployeePositionDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  position_id: string;

  @IsDateString()
  start_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class UpdateEmployeePositionDto extends PartialType(CreateEmployeePositionDto) {}
