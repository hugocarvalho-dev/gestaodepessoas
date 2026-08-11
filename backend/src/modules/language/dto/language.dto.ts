import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';

export class CreateLanguageDto {
  @IsString()
  name: string;
}

export class UpdateLanguageDto extends PartialType(CreateLanguageDto) {}
