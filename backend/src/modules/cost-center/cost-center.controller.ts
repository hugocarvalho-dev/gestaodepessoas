import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CostCenterService } from './cost-center.service';
import { CreateCostCenterDto, UpdateCostCenterDto } from './dto/cost-center.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Cost Centers')
@Controller('cost-centers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class CostCenterController {
  constructor(private readonly service: CostCenterService) {}

  @Get()
  @ApiOperation({ summary: 'List all cost centers' })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Cost centers retrieved' })
  findAll(@Query() pagination: PaginationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findAll(pagination, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cost center by ID' })
  @ApiParam({ name: 'id', description: 'Cost Center ID' })
  @ApiResponse({ status: 200, description: 'Cost center found' })
  @ApiResponse({ status: 404, description: 'Cost center not found' })
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new cost center' })
  @ApiResponse({ status: 201, description: 'Cost center created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateCostCenterDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.create(dto, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cost center' })
  @ApiParam({ name: 'id', description: 'Cost Center ID' })
  @ApiResponse({ status: 200, description: 'Cost center updated' })
  @ApiResponse({ status: 404, description: 'Cost center not found' })
  update(@Param('id') id: string, @Body() dto: UpdateCostCenterDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.update(id, dto, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete cost center' })
  @ApiParam({ name: 'id', description: 'Cost Center ID' })
  @ApiResponse({ status: 200, description: 'Cost center deleted' })
  @ApiResponse({ status: 404, description: 'Cost center not found' })
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.remove(id, companyId);
  }
}
