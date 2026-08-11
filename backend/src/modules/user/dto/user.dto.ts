import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, MaxLength, IsEmail, IsUUID, ValidateNested, IsArray } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'usuario@email.com', required: false })
  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiProperty({ example: 'João', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim().charAt(0).toUpperCase() + value?.trim().slice(1).toLowerCase())
  firstName?: string;

  @ApiProperty({ example: 'Silva', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim().toUpperCase())
  lastName?: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @MaxLength(128, { message: 'Senha não pode exceder 128 caracteres' })
  password?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ 
    description: 'Array de empresas com roles para o usuário',
    example: [
      { companyId: 'uuid-empresa-1', roles: ['ADMIN'] },
      { companyId: 'uuid-empresa-2', roles: ['USER'] }
    ],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserCompanyRoleDto)
  companies?: UserCompanyRoleDto[];
}

export class UserCompanyRoleDto {
  @ApiProperty({ example: 'uuid-empresa' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ example: ['ADMIN', 'USER'] })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

export class ListUserDto {
  skip: number;
  take: number;
}

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @MaxLength(128, { message: 'Senha não pode exceder 128 caracteres' })
  password: string;

  @ApiProperty({ example: 'João' })
  @IsString()
  @Transform(({ value }) => value?.trim().charAt(0).toUpperCase() + value?.trim().slice(1).toLowerCase())
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  @IsString()
  @Transform(({ value }) => value?.trim().toUpperCase())
  lastName: string;

  @ApiProperty({ 
    description: 'Array de empresas com roles para o usuário',
    example: [
      { companyId: 'uuid-empresa', roles: ['ADMIN'] },
      { companyId: 'uuid-empresa-2', roles: ['USER'] }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserCompanyRoleDto)
  companies: UserCompanyRoleDto[];
}