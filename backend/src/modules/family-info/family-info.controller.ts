import { Controller, Post, Body, Get, Param, Patch, UseGuards, Request, BadRequestException, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { FamilyInfoService } from './family-info.service';
import { CreateFamilyInfoDto, UpdateFamilyInfoDto } from './dto/family-info.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PaginationDto } from '@/common/dto/pagination.dto';

@ApiTags('Family Information')
@Controller('family-info')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class FamilyInfoController {
  constructor(private readonly service: FamilyInfoService) {}

  @Get('person/:personId')
  @ApiOperation({ summary: 'Get family information by person ID' })
  @ApiParam({ name: 'personId', description: 'Person ID' })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Family information retrieved' })
  @ApiResponse({ status: 404, description: 'Person not found' })
  findByPerson(@Param('personId') personId: string, @Query() pagination: PaginationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findByPerson(personId, pagination, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new family information' })
  @ApiResponse({ status: 201, description: 'Family information created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateFamilyInfoDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.create(dto, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update family information' })
  @ApiParam({ name: 'id', description: 'Family information ID' })
  @ApiResponse({ status: 200, description: 'Family information updated' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  update(@Param('id') id: string, @Body() dto: UpdateFamilyInfoDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.update(id, dto, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete family information' })
  @ApiParam({ name: 'id', description: 'Family information ID' })
  @ApiResponse({ status: 200, description: 'Family information deleted' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.remove(id, companyId);
  }
}
