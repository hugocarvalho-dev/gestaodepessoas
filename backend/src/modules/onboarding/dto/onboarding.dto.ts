import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOnboardingRequestDto {
  @IsEmail()
  invite_email: string;

  @IsString()
  @IsNotEmpty()
  invite_name: string;

  @IsOptional()
  @IsString()
  employee_type_value?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  expires_in_days?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  required_fields?: string[];

  @IsUUID()
  department_id: string;

  @IsUUID()
  position_id: string;

  @IsUUID()
  manager_employee_id: string;

  @IsUUID()
  onboarding_plan_id: string;

  @IsEmail()
  personal_email: string;

  @IsDateString()
  hire_date: string;
}

export class SubmitOnboardingDto {
  @IsObject()
  data: Record<string, any>;
}

export class RejectOnboardingDto {
  @IsOptional()
  @IsString()
  review_notes?: string;
}

export class OnboardingPlanFieldDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class CreateOnboardingPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnboardingPlanFieldDto)
  fields: OnboardingPlanFieldDto[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateOnboardingPlanDto extends PartialType(CreateOnboardingPlanDto) {}

export class UpdateOnboardingRequestDto extends PartialType(CreateOnboardingRequestDto) {}
