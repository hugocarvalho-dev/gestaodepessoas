import { IsString, MinLength, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsValidEmail } from '@/common/validators';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsValidEmail()
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
}


