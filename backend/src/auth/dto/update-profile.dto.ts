import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @ApiProperty({ example: 'João', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @ApiProperty({ example: 'Silva', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim().toUpperCase())
  lastName?: string;

  @ApiProperty({ example: 'usuario@email.com', required: false })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiProperty({ description: 'Senha atual (obrigatória se alterar email ou senha)', required: false })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiProperty({ description: 'Nova senha', required: false })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Nova senha deve ter no mínimo 6 caracteres' })
  @MaxLength(128, { message: 'Senha não pode exceder 128 caracteres' })
  newPassword?: string;
}
