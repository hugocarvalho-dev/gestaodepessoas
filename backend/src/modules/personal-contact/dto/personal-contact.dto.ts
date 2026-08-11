import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsBoolean, IsEmail } from 'class-validator';

export class CreatePersonalContactDto {
  @IsUUID()
  person_id: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEmail()
  personal_email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  corporate_phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  address_number?: string;

  @IsOptional()
  @IsString()
  address_complement?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean = true;
}

export class UpdatePersonalContactDto extends PartialType(CreatePersonalContactDto) {}
