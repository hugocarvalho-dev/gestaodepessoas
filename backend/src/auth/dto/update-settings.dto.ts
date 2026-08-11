import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsIn, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CustomColorsDto {
  @ApiProperty({ example: '#0A1E3D', required: false })
  @IsString()
  @IsOptional()
  primary?: string;

  @ApiProperty({ example: '#D4A84B', required: false })
  @IsString()
  @IsOptional()
  accent?: string;

  @ApiProperty({ example: '#F7F8FA', required: false })
  @IsString()
  @IsOptional()
  background?: string;

  @ApiProperty({ example: '#FFFFFF', required: false })
  @IsString()
  @IsOptional()
  surface?: string;

  @ApiProperty({ example: '#F0F2F5', required: false })
  @IsString()
  @IsOptional()
  surfaceAlt?: string;

  @ApiProperty({ example: '#E8EBF0', required: false })
  @IsString()
  @IsOptional()
  muted?: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ example: 'dark', required: false, description: 'Tema: light ou dark' })
  @IsString()
  @IsOptional()
  @IsIn(['light', 'dark'], { message: 'Tema deve ser "light" ou "dark"' })
  theme?: string;

  @ApiProperty({ example: true, required: false, description: 'Receber notificações por e-mail' })
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @ApiProperty({ example: true, required: false, description: 'Lembrete de aniversários' })
  @IsBoolean()
  @IsOptional()
  birthdayReminders?: boolean;

  @ApiProperty({ example: true, required: false, description: 'Lembrete de aniversários de empresa' })
  @IsBoolean()
  @IsOptional()
  anniversaryReminders?: boolean;

  @ApiProperty({ required: false, description: 'Cores personalizadas do tema' })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomColorsDto)
  customColors?: CustomColorsDto | null;
}
