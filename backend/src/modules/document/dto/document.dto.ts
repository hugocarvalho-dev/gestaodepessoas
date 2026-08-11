import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsUUID, IsInt } from 'class-validator';

export class CreateDocumentDto {
  @IsUUID()
  employee_id: string;

  @IsString()
  document_type: string;

  @IsOptional()
  @IsString()
  file_url?: string;

  @IsOptional()
  @IsString()
  file_name?: string;

  @IsOptional()
  @IsInt()
  file_size_bytes?: number;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  uploaded_by_user_id?: string;
}

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {}
