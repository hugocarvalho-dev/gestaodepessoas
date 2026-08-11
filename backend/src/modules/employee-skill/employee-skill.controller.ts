import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { EmployeeSkillService } from './employee-skill.service';
import { CreateEmployeeSkillDto, UpdateEmployeeSkillDto } from './dto/employee-skill.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Employee Skills')
@Controller('employee-skills')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class EmployeeSkillController {
  constructor(private readonly service: EmployeeSkillService) {}

  @Get()
  @ApiOperation({ summary: 'List all employee skills' })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Employee skills retrieved' })
  findAll(@Query() pagination: PaginationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findAll(pagination, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new employee skill' })
  @ApiResponse({ status: 201, description: 'Employee skill created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateEmployeeSkillDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.create(dto, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee skill' })
  @ApiParam({ name: 'id', description: 'Employee skill ID' })
  @ApiResponse({ status: 200, description: 'Employee skill updated' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeSkillDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.update(id, dto, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee skill' })
  @ApiParam({ name: 'id', description: 'Employee skill ID' })
  @ApiResponse({ status: 200, description: 'Employee skill deleted' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.remove(id, companyId);
  }
}
