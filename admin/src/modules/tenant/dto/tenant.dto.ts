import { IsString, IsEmail, IsOptional, IsEnum, IsInt, Min, Matches, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateTenantDto {
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens (3-50 chars)',
  })
  slug: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  trade_name?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Endereço
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() address_number?: string;
  @IsOptional() @IsString() complement?: string;
  @IsOptional() @IsString() neighborhood?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() postal_code?: string;
  @IsOptional() @IsString() country?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_employees?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_users?: number;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}

export class UpdateTenantStatusDto {
  @IsEnum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'INACTIVE'])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AddCompanyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsEmail()
  admin_email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() address_number?: string;
  @IsOptional() @IsString() complement?: string;
  @IsOptional() @IsString() neighborhood?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() postal_code?: string;
  @IsOptional() @IsString() country?: string;

  @IsOptional()
  @IsBoolean()
  is_headquarters?: boolean;
}
