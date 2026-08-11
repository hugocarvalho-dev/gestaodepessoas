import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { EducationService } from './education.service';
import { CreateEducationDto } from './dto/education.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Education')
@Controller('education')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class EducationController {
  constructor(private readonly service: EducationService) {}

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get education records by employee ID' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Education records retrieved' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findByEmployee(@Param('employeeId') employeeId: string, @Query() pagination: PaginationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findByEmployee(employeeId, pagination, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new education record' })
  @ApiResponse({ status: 201, description: 'Education record created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() data: CreateEducationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.create(data, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update education record' })
  @ApiParam({ name: 'id', description: 'Education record ID' })
  @ApiResponse({ status: 200, description: 'Education record updated' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.update(id, data, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete education record' })
  @ApiParam({ name: 'id', description: 'Education record ID' })
  @ApiResponse({ status: 200, description: 'Education record deleted' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.remove(id, companyId);
  }
}
