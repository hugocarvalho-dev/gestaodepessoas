import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';

export class CreatePositionLevelDto {
  @IsString()
  name: string;
}

export class UpdatePositionLevelDto extends PartialType(CreatePositionLevelDto) {}
