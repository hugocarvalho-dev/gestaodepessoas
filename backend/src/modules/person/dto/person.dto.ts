
import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsDateString, IsEnum, ValidateNested, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsCpf, IsValidEmail, IsValidBirthDate } from '@/common/validators';
import { Type } from 'class-transformer';

export class PersonContactDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEmail()
  personal_email?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  phone?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  corporate_phone?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  address?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  address_number?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  address_complement?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  neighborhood?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  city?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  state?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  country?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  postal_code?: string;
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class CreatePersonDto {
  @IsString()
  @Transform(({ value }) => value?.trim() || '')
  first_name: string;

  @IsString()
  @Transform(({ value }) => value?.trim() || '')
  last_name: string;

  @IsOptional()
  @IsDateString()
  @IsValidBirthDate()
  date_of_birth?: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @Transform(({ value }) => value?.trim() || '')
  nationality: string;

  @IsString()
  @IsCpf()
  @Transform(({ value }) => value?.replace(/\D/g, '') || '')
  government_id: string; // CPF

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  rg?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  rg_issuer?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  rg_state?: string;

  @IsOptional()
  @IsDateString()
  rg_issue_date?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  cnh?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  cnh_category?: string;

  @IsOptional()
  @IsDateString()
  cnh_issue_date?: string;

  @IsOptional()
  @IsDateString()
  cnh_expiry_date?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  cnh_issuer?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  cnh_state?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  marital_status?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  mother_name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  ethnicity?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  pis?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  education_level?: string;

  @IsOptional()
  has_food_intolerance?: boolean;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  food_intolerance?: string;

  @IsOptional()
  has_medication_allergy?: boolean;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  medication_allergy?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  photo_url?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonContactDto)
  contact?: PersonContactDto;
}

export class UpdatePersonDto extends PartialType(CreatePersonDto) {}


