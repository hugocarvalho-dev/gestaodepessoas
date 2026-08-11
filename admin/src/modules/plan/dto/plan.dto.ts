import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  max_employees: number;

  @IsInt()
  @Min(1)
  max_users: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_companies?: number;

  @IsNumber()
  @Min(0)
  price_monthly: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_yearly?: number;

  @IsOptional()
  @IsBoolean()
  is_trial?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  trial_days?: number;

  @IsOptional()
  features?: any;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}

export class UpdatePlanDto extends PartialType(CreatePlanDto) {}
