import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';

export enum ContractType {
  INDEFINITE = 'INDEFINITE',
  FIXED_TERM = 'FIXED_TERM',
  APPRENTICE = 'APPRENTICE',
  TEMPORARY = 'TEMPORARY',
  EXPERIENCE = 'EXPERIENCE',
}

export enum PaymentCategory {
  MONTHLY = 'MONTHLY',
  HOURLY = 'HOURLY',
  COMMISSION = 'COMMISSION',
}

export class CreateContractDto {
  @IsUUID()
  employee_id: string;

  @IsOptional()
  @IsEnum(ContractType)
  contract_type?: ContractType;

  @IsOptional()
  @IsString()
  work_hours?: string;

  @IsOptional()
  @IsEnum(PaymentCategory)
  payment_category?: PaymentCategory;

  @IsDateString()
  start_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class UpdateContractDto extends PartialType(CreateContractDto) {}
