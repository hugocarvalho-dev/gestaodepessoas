import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

// Valores em portugues, iguais aos enviados pelos formularios de
// colaborador e de onboarding e aos exibidos na tela de detalhe.
export enum ProficiencyLevel {
  BASICO = 'BASICO',
  INTERMEDIARIO = 'INTERMEDIARIO',
  AVANCADO = 'AVANCADO',
  FLUENTE = 'FLUENTE',
  NATIVO = 'NATIVO',
}

export class CreateEmployeeLanguageDto {
  @IsUUID()
  employee_id: string;

  @IsUUID()
  language_id: string;

  @IsOptional()
  @IsEnum(ProficiencyLevel)
  proficiency_level?: ProficiencyLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  proficiency_percentage?: number;
}

export class UpdateEmployeeLanguageDto extends PartialType(CreateEmployeeLanguageDto) {}
