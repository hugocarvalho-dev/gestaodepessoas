import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class CompanyQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(['all'])
  scope?: 'all';
}
