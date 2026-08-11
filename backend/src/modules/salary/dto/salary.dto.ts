import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalaryDto {
  @IsUUID()
  contract_id: string;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'BRL';

  @IsDateString()
  start_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class UpdateSalaryDto extends PartialType(CreateSalaryDto) {}
