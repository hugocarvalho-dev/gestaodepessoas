import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { EmployeeLanguageService } from './employee-language.service';
import { CreateEmployeeLanguageDto, UpdateEmployeeLanguageDto } from './dto/employee-language.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Employee Languages')
@Controller('employee-languages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class EmployeeLanguageController {
  constructor(private readonly service: EmployeeLanguageService) {}

  @Get()
  @ApiOperation({ summary: 'List all employee languages' })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Employee languages retrieved' })
  findAll(@Query() pagination: PaginationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findAll(pagination, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new employee language' })
  @ApiResponse({ status: 201, description: 'Employee language created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateEmployeeLanguageDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.create(dto, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee language' })
  @ApiParam({ name: 'id', description: 'Employee language ID' })
  @ApiResponse({ status: 200, description: 'Employee language updated' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeLanguageDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.update(id, dto, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee language' })
  @ApiParam({ name: 'id', description: 'Employee language ID' })
  @ApiResponse({ status: 200, description: 'Employee language deleted' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.remove(id, companyId);
  }
}
