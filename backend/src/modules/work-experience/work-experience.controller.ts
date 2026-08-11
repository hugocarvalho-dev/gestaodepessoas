import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { WorkExperienceService } from './work-experience.service';
import { CreateWorkExperienceDto } from './dto/work-experience.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Work Experience')
@Controller('work-experience')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Company ID' })
export class WorkExperienceController {
  constructor(private readonly service: WorkExperienceService) {}

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get work experience by employee ID' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiQuery({ name: 'skip', type: Number, required: false })
  @ApiQuery({ name: 'take', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Work experience retrieved' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findByEmployee(@Param('employeeId') employeeId: string, @Query() pagination: PaginationDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.findByEmployee(employeeId, pagination, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new work experience' })
  @ApiResponse({ status: 201, description: 'Work experience created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() data: CreateWorkExperienceDto, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.create(data, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update work experience' })
  @ApiParam({ name: 'id', description: 'Work experience ID' })
  @ApiResponse({ status: 200, description: 'Work experience updated' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.update(id, data, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete work experience' })
  @ApiParam({ name: 'id', description: 'Work experience ID' })
  @ApiResponse({ status: 200, description: 'Work experience deleted' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  remove(@Param('id') id: string, @Request() req) {
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      throw new BadRequestException('x-company-id header is required');
    }
    return this.service.remove(id, companyId);
  }
}
