import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsBoolean, IsEmail } from 'class-validator';

export class CreateEmergencyContactDto {
  @IsUUID()
  person_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  phone_secondary?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean = false;
}

export class UpdateEmergencyContactDto extends PartialType(CreateEmergencyContactDto) {}
